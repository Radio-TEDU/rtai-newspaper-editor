import type { Project } from './model';
import { assetIds, download, validateImage } from './project-package';
import { buildEditableHtml, extractEditableHtml, HTML_MAX, type HtmlAsset } from './html-document';

export async function exportHtml(project: Project, media: Map<string, Blob>) {
    const assets: HtmlAsset[] = [];
    for (const id of assetIds(project)) {
        const blob = media.get(id); if (!blob) throw new Error('Eksik görsel var. HTML indirilmedi.');
        const bytes = new Uint8Array(await blob.arrayBuffer()); let binary = '';
        for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
        assets.push({ id, type: blob.type, data: btoa(binary) });
    }
    download(new Blob([buildEditableHtml(project, assets)], { type: 'text/html;charset=utf-8' }), project.name + '.rtai.html');
}
export async function importHtml(file: File) {
    if (file.size > HTML_MAX) throw new Error('HTML dosyası en fazla 100 MB olabilir.');
    const doc = extractEditableHtml(await file.text()), media = new Map<string, Blob>();
    for (const a of doc.assets) { const bytes = Uint8Array.from(atob(a.data), c => c.charCodeAt(0)); const blob = new Blob([bytes], { type: a.type }); await validateImage(blob); media.set(a.id, blob); }
    return { project: doc.project, media };
}
