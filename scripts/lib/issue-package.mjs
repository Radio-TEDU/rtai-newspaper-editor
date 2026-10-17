import fs from 'node:fs/promises';
import path from 'node:path';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { model, validateProject, layout, html } from './project-model.mjs';
import { imageInfo } from './media.mjs';

export const MAX = 100 * 1024 * 1024;
export async function jsonFile(file) {
    const stat = await fs.stat(file); if (stat.size > 10 * 1024 * 1024) throw new Error('JSON en fazla 10 MB olabilir.');
    return JSON.parse(await fs.readFile(file, 'utf8'));
}
export async function readAsset(base, name) {
    if (typeof name !== 'string' || !name || path.isAbsolute(name)) throw new Error('Görsel yolu içerik klasörüne göre göreli olmalı.');
    const root = await fs.realpath(base), resolved = await fs.realpath(path.resolve(root, name)), relative = path.relative(root, resolved);
    if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) throw new Error('Görsel içerik klasörünün dışında olamaz.');
    const stat = await fs.stat(resolved); if (stat.size > 20 * 1024 * 1024) throw new Error('Tek görsel en fazla 20 MB olabilir.');
    const bytes = new Uint8Array(await fs.readFile(resolved)); return { bytes, ...imageInfo(bytes) };
}
export function referencedAssets(project) { return [...new Set(project.pages.flatMap(p => p.elements.map(e => e.assetId).filter(Boolean)))]; }
export function encode(project, media) {
    const clean = validateProject(project), files = {}, assets = [];
    let total = 0;
    const ids = referencedAssets(clean); if (ids.length > 1000) throw new Error('En fazla 1000 ayrı görsel kullanılabilir.');
    for (const id of ids) {
        const bytes = media.get(id); if (!bytes) throw new Error('Eksik görsel: ' + id);
        const { type } = imageInfo(bytes); total += bytes.length;
        if (total > MAX) throw new Error('Görsellerin toplam boyutu 100 MB sınırını aşıyor.');
        files['media/' + id + '.bin'] = bytes; assets.push({ id, type });
    }
    files['manifest.json'] = strToU8(JSON.stringify({ format: 'rtai-newspaper', version: 1, project: clean, assets }));
    if (files['manifest.json'].length > 10 * 1024 * 1024 || total + files['manifest.json'].length > MAX) throw new Error('Paket sınırı aşıldı: toplam 100 MB, JSON 10 MB.');
    const bytes = zipSync(files, { level: 6 }); if (bytes.length > MAX) throw new Error('Paket 100 MB sınırını aşıyor.');
    return bytes;
}
export function decode(bytes) {
    if (bytes.length > MAX) throw new Error('Paket en fazla 100 MB olabilir.');
    let total = 0, count = 0;
    const files = unzipSync(bytes, { filter(entry) {
        total += entry.originalSize; count++;
        if (total > MAX || count > 2000 || !(entry.name === 'manifest.json' || /^media\/[a-zA-Z0-9_-]{1,80}\.bin$/.test(entry.name))) throw new Error('Paket boyutu veya dosya yolları geçersiz.');
        if (entry.name === 'manifest.json' && entry.originalSize > 10 * 1024 * 1024) throw new Error('Manifest en fazla 10 MB olabilir.');
        return true;
    } });
    if (!files['manifest.json']) throw new Error('Pakette manifest.json yok.');
    const manifest = JSON.parse(strFromU8(files['manifest.json']));
    if (manifest.format !== 'rtai-newspaper' || manifest.version !== 1 || !Array.isArray(manifest.assets) || manifest.assets.length > 1000) throw new Error('Paket biçimi desteklenmiyor.');
    const project = validateProject(manifest.project), media = new Map();
    for (const asset of manifest.assets) {
        if (!asset || typeof asset.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(asset.id) || media.has(asset.id)) throw new Error('Görsel kimliği geçersiz veya tekrarlı.');
        const value = files['media/' + asset.id + '.bin']; if (!value || imageInfo(value).type !== asset.type) throw new Error('Görsel eksik veya MIME bilgisi geçersiz.');
        media.set(asset.id, value);
    }
    for (const id of referencedAssets(project)) if (!media.has(id)) throw new Error('Eksik görsel: ' + id);
    return { project, media };
}
export async function packageFile(file) { const stat = await fs.stat(file); if (stat.size > MAX) throw new Error('Paket en fazla 100 MB olabilir.'); return decode(new Uint8Array(await fs.readFile(file))); }
export async function projectFile(file) {
    if (!/\.html?$/i.test(file)) return packageFile(file);
    if ((await fs.stat(file)).size > MAX) throw new Error('HTML en fazla 100 MB olabilir.');
    const doc = html.extractEditableHtml(await fs.readFile(file, 'utf8')), media = new Map();
    for (const a of doc.assets) { const bytes = new Uint8Array(Buffer.from(a.data, 'base64')); if (imageInfo(bytes).type !== a.type) throw new Error('HTML görsel MIME bilgisi geçersiz.'); media.set(a.id, bytes); }
    return { project: doc.project, media };
}
export async function writeProject(file, project, media) {
    const value = /\.html?$/i.test(file) ? html.buildEditableHtml(project, [...media].filter(([id]) => referencedAssets(project).includes(id)).map(([id, bytes]) => ({ id, type: imageInfo(bytes).type, data: Buffer.from(bytes).toString('base64') }))) : encode(project, media);
    return writeNew(file, value);
}
export function layoutIssues(project) {
    const issues = [];
    for (const page of project.pages) {
        if (page.layoutMode !== 'safe') continue;
        for (let i = 0; i < page.elements.length; i++) for (const other of page.elements.slice(i + 1)) if (layout.conflicts(page.elements[i], other)) issues.push(`${page.name}: ${page.elements[i].name} / ${other.name} örtüşüyor.`);
    }
    return issues;
}
export async function writeNew(file, bytes) { await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true }); await fs.writeFile(file, bytes, { flag: 'wx' }); }

export async function compose(brief, base) {
    if (!brief || typeof brief !== 'object' || !Array.isArray(brief.articles) || !Array.isArray(brief.pages)) throw new Error('İçerikte articles ve pages listeleri bulunmalı.');
    if (brief.articles.length > 2000 || brief.pages.length < 1 || brief.pages.length > 100) throw new Error('İçerik sayısı sınır dışında.');
    const project = model.makeProject(false); project.name = brief.name ?? 'Yeni sayı'; project.widthMm = brief.widthMm ?? 297; project.heightMm = brief.heightMm ?? 420;
    const ids = new Set(), media = new Map(), imageIds = new Map();
    project.articles = brief.articles.map(a => {
        if (!a || !/^[a-zA-Z0-9_-]{1,80}$/.test(a.id) || ids.has(a.id)) throw new Error('Yazı kimlikleri benzersiz olmalı.'); ids.add(a.id);
        return { id: a.id, title: a.title, summary: a.summary ?? '', body: a.body ?? '', section: a.section ?? 'Gündem', url: a.url ?? '' };
    });
    for (const a of brief.articles) if (a.image) {
        const loaded = await readAsset(base, a.image); const id = model.uid(); imageIds.set(a.id, id); media.set(id, loaded.bytes);
    }
    const h = model.pageHeight(project), sy = h / 1414;
    project.pages = brief.pages.map((description, pageIndex) => {
        const type = description.type ?? 'news';
        if (!['cover', 'news', 'agenda', 'voices'].includes(type) || !Array.isArray(description.articleIds)) throw new Error('Sayfa türü veya articleIds geçersiz.');
        const limit = type === 'agenda' ? 4 : 2;
        if (!description.articleIds.length || description.articleIds.length > limit || new Set(description.articleIds).size !== description.articleIds.length) throw new Error(`${type} sayfasında 1–${limit} farklı yazı seçin.`);
        const page = model.makePage(); page.name = description.name ?? (type === 'cover' ? 'Ön sayfa' : 'Gündem'); page.columns = type === 'cover' ? [2, 1] : [1, 1];
        const add = (kind, props) => { const e = model.makeElement(kind, props); e.y *= sy; e.height *= sy; page.elements.push(e); return e; };
        add('section', { text: brief.tagline ?? 'BAĞIMSIZ HABERLER · YENİ FİKİRLER', name: 'Üst bilgi', x: 42, y: 32, width: 916, height: 24, fontSize: 13 });
        add('headline', { text: type === 'cover' ? brief.masthead ?? 'Haftalık' : page.name, name: 'Gazete başlığı', x: 42, y: 75, width: 916, height: 108, fontSize: type === 'cover' ? 86 : 60, fontWeight: 400 });
        add('shape', { x: 42, y: 208, width: 916, height: 2 });
        add('caption', { text: brief.edition ?? 'Yeni sayı', name: 'Sayı bilgisi', x: 42, y: 229, width: 916, height: 24, fontSize: 14 });
        description.articleIds.forEach((id, index) => {
            const a = project.articles.find(a => a.id === id), source = brief.articles.find(a => a.id === id);
            if (!a) throw new Error('Sayfada bulunamayan yazı: ' + id);
            const col = model.columnRects(page)[index], x = type === 'agenda' ? 42 : col.x, width = type === 'agenda' ? 916 : col.width;
            if (type === 'agenda') {
                const y = 295 + index * 240;
                add('section', { text: a.section, x, y, width, height: 26, fontSize: 14 });
                add('headline', { text: a.title, articleId: a.id, articleField: 'title', name: 'Başlık · ' + a.title.slice(0, 70), x, y: y + 37, width, height: 82, fontSize: 31, fontWeight: 400 });
                add('deck', { text: a.summary, articleId: a.id, articleField: 'summary', x, y: y + 134, width, height: 88, fontSize: 22 });
                return;
            }
            add('section', { text: a.section, x, y: 283, width, height: 28, fontSize: 15 });
            add('headline', { text: a.title, articleId: a.id, articleField: 'title', name: 'Başlık · ' + a.title.slice(0, 70), x, y: 332, width, height: 148, fontSize: 38, fontWeight: 400 });
            add(type === 'voices' ? 'quote' : 'deck', { text: a.summary, articleId: a.id, articleField: 'summary', x, y: 504, width, height: 150, fontSize: type === 'voices' ? 27 : 23 });
            const assetId = imageIds.get(id);
            let bodyY = 700;
            if (assetId) {
                add('image', { assetId, alt: source.alt ?? a.title, caption: source.caption ?? '', name: 'Görsel · ' + a.title.slice(0, 70), x, y: 684, width, height: 250 });
                add('caption', { text: source.caption ?? '', x, y: 948, width, height: 48, fontSize: 14 });
                bodyY = 1020;
            }
            const excerpt = source.excerpt ?? (a.body.length > (assetId ? 450 : 1100) ? a.body.slice(0, assetId ? 450 : 1100).replace(/\s+\S*$/, '') + '…' : a.body);
            add('body', { text: excerpt, articleId: a.id, name: 'Özet metni · ' + a.title.slice(0, 70), x, y: bodyY, width, height: 1300 - bodyY, fontSize: 20 });
        });
        add('shape', { x: 42, y: 1334, width: 916, height: 1 });
        add('caption', { text: (brief.masthead ?? 'Haftalık') + ' · ' + String(pageIndex + 1).padStart(2, '0'), x: 42, y: 1350, width: 916, height: 28, fontSize: 12 });
        return page;
    });
    return { project: validateProject(project), media };
}
