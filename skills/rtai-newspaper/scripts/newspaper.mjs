import fs from 'node:fs/promises';
import path from 'node:path';
import * as model from './runtime/model.mjs';
import { validateProject } from './runtime/validation.mjs';
import { conflicts } from './runtime/layout.mjs';
import { buildEditableHtml, extractEditableHtml, HTML_MAX } from './runtime/html-document.mjs';
import { compose, readAsset } from './runtime/compose.mjs';
import { demoImage, imageInfo } from './runtime/media.mjs';

const [command, ...args] = process.argv.slice(2), options = {};
for (let i = 0; i < args.length; i += 2) {
    if (!['--input', '--output', '--assets'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options[args[i].slice(2)]) { console.error('--input, --output ve --assets seçeneklerini kullanın.'); process.exit(1); }
    options[args[i].slice(2)] = args[i + 1];
}
const required = name => { if (!options[name]) throw new Error('--' + name + ' gerekli.'); return path.resolve(options[name]); };
const json = async file => { if ((await fs.stat(file)).size > 10 * 1024 * 1024) throw new Error('JSON en fazla 10 MB olabilir.'); return JSON.parse(await fs.readFile(file, 'utf8')); };
const ids = project => [...new Set(project.pages.flatMap(p => p.elements.map(e => e.assetId).filter(Boolean)))];
async function write(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, value, { flag: 'wx' }); }
function checkLayout(project) { for (const page of project.pages) if (page.layoutMode === 'safe') for (let i = 0; i < page.elements.length; i++) for (const b of page.elements.slice(i + 1)) if (conflicts(page.elements[i], b)) throw new Error(page.name + ': ' + page.elements[i].name + ' / ' + b.name + ' örtüşüyor.'); }
async function load(file) {
    if ((await fs.stat(file)).size > HTML_MAX) throw new Error('HTML en fazla 100 MB olabilir.');
    const doc = extractEditableHtml(await fs.readFile(file, 'utf8'));
    const media = new Map();
    for (const a of doc.assets) { const bytes = new Uint8Array(Buffer.from(a.data, 'base64')); if (imageInfo(bytes).type !== a.type) throw new Error('Görsel MIME bilgisi geçersiz.'); media.set(a.id, bytes); }
    return { project: doc.project, media };
}
async function output(project, media) {
    checkLayout(project);
    const assets = ids(project).map(id => { const bytes = media.get(id); if (!bytes) throw new Error('Eksik görsel: ' + id); return { id, type: imageInfo(bytes).type, data: Buffer.from(bytes).toString('base64') }; });
    await write(required('output'), buildEditableHtml(project, assets));
    console.log(`${project.pages.length} sayfalık düzenlenebilir HTML oluşturuldu. Dosyayı tarayıcıda inceleyin veya Gazete Atölyesi’ne yükleyin.`);
}
try {
    if (command === 'new') { const input = required('input'); const result = await compose(await json(input), path.dirname(input)); await output(result.project, result.media); }
    else if (command === 'pack') {
        const project = validateProject(await json(required('input'))), media = new Map();
        const mappingFile = options.assets ? path.resolve(options.assets) : undefined, mapping = mappingFile ? await json(mappingFile) : {};
        for (const id of ids(project)) { if (!mappingFile || typeof mapping[id] !== 'string') throw new Error('Görsel eşlemesi eksik: ' + id); media.set(id, (await readAsset(path.dirname(mappingFile), mapping[id])).bytes); }
        await output(project, media);
    } else if (command === 'unpack') {
        const result = await load(required('input')), directory = required('output');
        await fs.mkdir(path.dirname(directory), { recursive: true }); await fs.mkdir(directory);
        const mapping = {};
        for (const [id, bytes] of result.media) { mapping[id] = 'media/' + id + '.bin'; await write(path.join(directory, mapping[id]), bytes); }
        await write(path.join(directory, 'project.json'), JSON.stringify(result.project, null, 2));
        await write(path.join(directory, 'assets.json'), JSON.stringify(mapping, null, 2));
        console.log('HTML açıldı. Değişmeyen sayfaları ve kimlikleri koruyarak revize edin.');
    } else if (command === 'check') { const { project, media } = await load(required('input')); checkLayout(project); console.log(`Geçerli: ${project.pages.length} sayfa, ${project.articles.length} yazı, ${media.size} görsel. Metin taşmasını tarayıcıda kontrol edin.`); }
    else if (command === 'demo') {
        const p = model.makeProject(); p.name = 'Bağımsız skill · Örnek gazete';
        p.pages[0].elements.find(e => e.kind === 'image').assetId = 'demo-photo';
        await output(p, new Map([['demo-photo', demoImage()]]));
    } else if (!command || command === 'help') console.log('Bağımsız RTAI gazete skill’i / Node.js 22.12+ / npm kurulumu gerekmez\nnew --input issue.json --output gazete.html\npack --input project.json --assets assets.json --output gazete.html\nunpack --input gazete.html --output yeni-klasor\ncheck --input gazete.html\ndemo --output ornek.html\nMevcut dosyalar üzerine yazılmaz.');
    else throw new Error('Bilinmeyen komut. help kullanın.');
} catch (error) { console.error('Gazete skill’i: ' + (error.code === 'EEXIST' ? 'Çıktı zaten var. Yeni bir dosya/klasör adı seçin.' : error.message)); process.exitCode = 1; }
