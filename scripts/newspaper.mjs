import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encode, packageFile, jsonFile, readAsset, referencedAssets, compose, writeNew, layoutIssues } from './lib/issue-package.mjs';
import { validateProject } from './lib/project-model.mjs';
import { demoImage } from './lib/media.mjs';

const [command, ...args] = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
    if (!/^--(input|output|assets)$/.test(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options[args[i].slice(2)]) { console.error('Geçersiz veya tekrarlı seçenek. --input, --output, --assets kullanın.'); process.exit(1); }
    options[args[i].slice(2)] = args[i + 1];
}
const required = name => { if (!options[name]) throw new Error('--' + name + ' gerekli.'); return path.resolve(options[name]); };
try {
    if (command === 'new') {
        const input = required('input'), result = await compose(await jsonFile(input), path.dirname(input));
        const issues = layoutIssues(result.project); if (issues.length) throw new Error(issues.join('\n'));
        await writeNew(required('output'), encode(result.project, result.media));
        console.log(`Gazete oluşturuldu: ${result.project.pages.length} sayfa, ${result.project.articles.length} yazı. Görsel/metin kontrolü için editörde açın.`);
    } else if (command === 'pack') {
        const project = validateProject(await jsonFile(required('input'))), media = new Map();
        const mappingFile = options.assets ? path.resolve(options.assets) : undefined;
        const mapping = mappingFile ? await jsonFile(mappingFile) : {};
        for (const id of referencedAssets(project)) {
            if (!mappingFile || typeof mapping[id] !== 'string') throw new Error('Görsel yolu eksik: ' + id + '. --assets ile eşleme JSON dosyası verin.');
            media.set(id, (await readAsset(path.dirname(mappingFile), mapping[id])).bytes);
        }
        const issues = layoutIssues(project); if (issues.length) throw new Error(issues.join('\n'));
        await writeNew(required('output'), encode(project, media)); console.log('Düzenlenebilir proje paketi oluşturuldu.');
    } else if (command === 'unpack') {
        const { project, media } = await packageFile(required('input')), directory = required('output');
        await fs.mkdir(directory); // Refuse existing directories: never overwrite hand edits.
        const mapping = {};
        for (const [id, bytes] of media) { mapping[id] = 'media/' + id + '.bin'; await writeNew(path.join(directory, mapping[id]), bytes); }
        await writeNew(path.join(directory, 'project.json'), JSON.stringify(project, null, 2));
        await writeNew(path.join(directory, 'assets.json'), JSON.stringify(mapping, null, 2));
        console.log('Paket açıldı. project.json kimliklerini ve değiştirmeyeceğiniz sayfaları koruyun.');
    } else if (command === 'check') {
        const { project, media } = await packageFile(required('input')), issues = layoutIssues(project);
        if (issues.length) throw new Error(issues.join('\n'));
        console.log(`Yapı ve medya başlıkları geçerli: ${project.pages.length} sayfa, ${project.articles.length} yazı, ${media.size} görsel. Metin taşması ve görselin tam çözümlenmesi tarayıcıda kontrol edilmelidir.`);
    } else if (command === 'demo') {
        const brief = await jsonFile(fileURLToPath(new URL('../examples/issue.json', import.meta.url)));
        const result = await compose(brief, process.cwd());
        const asset = 'demo-campus-image'; result.media.set(asset, demoImage());
        const first = result.project.pages[0];
        const image = first.elements.find(e => e.kind === 'image');
        if (image) image.assetId = asset;
        else {
            const body = first.elements.find(e => e.kind === 'body');
            if (body) { body.y = 1010; body.height = 312; body.fontSize = 18; body.text = result.project.articles[0].body; }
            const { model } = await import('./lib/project-model.mjs');
            first.elements.push(model.makeElement('image', { assetId: asset, alt: 'Yeşil yapılar ve kırmızı daireden oluşan örnek görsel', name: 'Örnek görsel', x: first.margin, y: 710, width: 580, height: 280 }));
        }
        const issues = layoutIssues(result.project); if (issues.length) throw new Error(issues.join('\n'));
        await writeNew(required('output'), encode(result.project, result.media)); console.log('İki sayfalık örnek gazete ve PNG görseli paketlendi.');
    } else if (!command || command === 'help') {
        console.log('RTAI gazete aracı\nnew --input issue.json --output gazete.rtai.zip\npack --input project.json --assets assets.json --output gazete.rtai.zip\nunpack --input gazete.rtai.zip --output yeni-klasor\ncheck --input gazete.rtai.zip\ndemo --output ornek.rtai.zip\nÇıktı dosyaları/klasörleri mevcutsa işlem durur; üzerine yazılmaz.');
    } else throw new Error('Bilinmeyen komut. help kullanın.');
} catch (error) { console.error('Gazete aracı: ' + (error.code === 'EEXIST' ? 'Çıktı zaten var. Yeni bir dosya/klasör adı seçin; çalışma korunmuştur.' : error.message)); process.exitCode = 1; }
