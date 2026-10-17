import { zip, unzip, strToU8, strFromU8 } from 'fflate';
import type { Project } from './model';
import { validateProject } from './validation';
const MAX = 100 * 1024 * 1024;
export const assetIds = (project: Project) => [...new Set(project.pages.flatMap(p => p.elements.map(e => e.assetId).filter((v): v is string => !!v)))];
export function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 150); a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
export async function exportPackage(project: Project, media: Map<string, Blob>) {
    const files: Record<string, Uint8Array> = {};
    const assets = [];
    let total = 0;
    for (const id of assetIds(project)) {
        const blob = media.get(id);
        if (!blob)
            throw new Error('Eksik görsel var. Paket indirilmedi.');
        total += blob.size;
        if (total > MAX)
            throw new Error('Paket 100 MB sınırını aşıyor. Görselleri küçültün.');
        files['media/' + id + '.bin'] = new Uint8Array(await blob.arrayBuffer());
        assets.push({ id, type: blob.type });
    }
    files['manifest.json'] = strToU8(JSON.stringify({ format: 'rtai-newspaper', version: 1, project, assets }));
    if (files['manifest.json'].length > 10 * 1024 * 1024 || total + files['manifest.json'].length > MAX)
        throw new Error('Proje metinleri veya toplam paket boyutu sınırı aşıyor (metin/model: 10 MB, toplam: 100 MB).');
    const bytes = await new Promise<Uint8Array>((resolve, reject) => zip(files, { level: 1 }, (err, data) => err ? reject(err) : resolve(data)));
    download(new Blob([new Uint8Array(bytes)], { type: 'application/zip' }), project.name + '.rtai.zip');
}
export const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export async function validateImage(blob: Blob) {
    if (!imageTypes.includes(blob.type))
        throw new Error('PNG, JPEG, WebP veya GIF görseli seçin.');
    if (blob.size > 20 * 1024 * 1024)
        throw new Error('Tek görsel en fazla 20 MB olabilir.');
    const bitmap = await createImageBitmap(blob).catch(() => { throw new Error('Görsel okunamadı veya dosya bozuk.'); });
    const pixels = bitmap.width * bitmap.height;
    bitmap.close();
    if (pixels > 32000000)
        throw new Error('Görsel en fazla 32 megapiksel olabilir. Önce küçültün.');
}
export async function importPackage(file: File): Promise<{
    project: Project;
    media: Map<string, Blob>;
}> {
    if (file.size > MAX)
        throw new Error('Proje paketi en fazla 100 MB olabilir.');
    let total = 0;
    let rejected = false;
    let count = 0;
    const source = new Uint8Array(await file.arrayBuffer());
    const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => unzip(source, { filter(entry) {
            total += entry.originalSize;
            count++;
            const valid = (entry.name === 'manifest.json' || /^media\/[a-zA-Z0-9_-]{1,80}\.bin$/.test(entry.name)) && entry.originalSize <= MAX && total <= MAX && count <= 2000;
            if (!valid)
                rejected = true;
            return valid;
        } }, (error, result) => error ? reject(new Error('Paket açılamadı. Geçerli bir .rtai.zip dosyası seçin.')) : resolve(result)));
    if (rejected)
        throw new Error('Paket beklenmeyen dosyalar içeriyor veya 100 MB açılmış boyut sınırını aşıyor.');
    if (!files['manifest.json'] || files['manifest.json'].length > 10 * 1024 * 1024)
        throw new Error('Paket proje bilgisi eksik veya çok büyük.');
    const manifest = JSON.parse(strFromU8(files['manifest.json']));
    if (manifest.format !== 'rtai-newspaper' || manifest.version !== 1 || !Array.isArray(manifest.assets) || manifest.assets.length > 1000)
        throw new Error('Desteklenmeyen proje paketi.');
    const project = validateProject(manifest.project);
    const media = new Map<string, Blob>();
    for (const item of manifest.assets) {
        if (!item || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || media.has(item.id) || !imageTypes.includes(item.type))
            throw new Error('Paket görsel bilgileri geçersiz.');
        const bytes = files['media/' + item.id + '.bin'];
        if (!bytes)
            throw new Error('Pakette eksik görsel var.');
        const blob = new Blob([new Uint8Array(bytes)], { type: item.type });
        await validateImage(blob);
        media.set(item.id, blob);
    }
    for (const id of assetIds(project))
        if (!media.has(id))
            throw new Error('Sayfadaki görsel pakette bulunamadı.');
    return { project, media };
}
