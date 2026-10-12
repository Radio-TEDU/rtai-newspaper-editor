import { useEffect, useState } from 'react';
import Editor, { type Boot } from './App';
import WorkspaceHome from './components/WorkspaceHome';
import { listProjects, loadProject, readMedia, saveProject, deleteProject, storageError } from './storage';
import { makeProject, uid, type Project } from './model';
import { assetIds, importPackage } from './project-package';
import { importHtml, exportHtml } from './html-package';

export default function Workspace() {
    const [projects, setProjects] = useState<Project[]>([]), [editor, setEditor] = useState<Boot>();
    const [error, setError] = useState(''), [busy, setBusy] = useState(true);
    async function mediaFor(p: Project) { const media = new Map<string, Blob>(); for (const id of assetIds(p)) { const blob = await readMedia(id, p.id); if (blob) media.set(id, blob); } return media; }
    async function open(p: Project) { const media = await mediaFor(p); setEditor({ project: p, media, saveEnabled: true, error: media.size !== assetIds(p).length ? 'Bazı görseller bulunamadı. Eksik görselleri yeniden yükleyin.' : undefined }); if (!location.hash.startsWith('#haber/')) history.replaceState(null, '', '#duzenle/' + p.id); }
    async function refresh() { setProjects(await listProjects()); }
    async function boot() {
        setBusy(true); setError('');
        try {
            await refresh();
            if (location.hash.startsWith('#duzenle/') || location.hash.startsWith('#haber/') || location.hash === '#okuma') {
                const id = location.hash.startsWith('#duzenle/') ? decodeURIComponent(location.hash.slice(9)) : undefined;
                const p = await loadProject(id); if (p) await open(p); else { history.replaceState(null, '', '#calismalar'); setError('Bu gazete yerel çalışma alanında bulunamadı.'); }
            }
        } catch (e) { setError(storageError(e)); } finally { setBusy(false); }
    }
    useEffect(() => { void boot(); }, []);
    async function run(action: () => Promise<void>) { setBusy(true); setError(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'İşlem tamamlanamadı.'); } finally { setBusy(false); } }
    if (editor) return <Editor initial={editor} onHome={() => { setEditor(undefined); history.replaceState(null, '', '#calismalar'); void run(refresh); }}/>;
    return <WorkspaceHome projects={projects} busy={busy} error={error}
      onOpen={p => { void run(() => open(p)); }}
      onCreate={template => { void run(async () => { const p = makeProject(template); await saveProject(p); await open(p); }); }}
      onImport={file => { void run(async () => { const imported = /\.html?$/i.test(file.name) ? await importHtml(file) : await importPackage(file); imported.project.id = uid(); imported.project.updatedAt = new Date().toISOString(); await saveProject(imported.project, imported.media); setEditor({ ...imported, saveEnabled: true, error: 'Proje ve bütün görseller açıldı.' }); history.replaceState(null, '', '#duzenle/' + imported.project.id); }); }}
      onRename={p => { const name = window.prompt('Gazetenin yeni adı', p.name); if (name?.trim()) { void run(async () => { await saveProject({ ...p, name: name.trim().slice(0, 200), updatedAt: new Date().toISOString() }, undefined, false); await refresh(); }); } }}
      onDelete={p => { if (window.confirm('“' + p.name + '” yerel çalışma alanından silinsin mi? Gerekliyse önce HTML indir ile yedek alın.')) { void run(async () => { await deleteProject(p.id); await refresh(); }); } }}
      onExport={p => { void run(async () => { await exportHtml(p, await mediaFor(p)); }); }}
      onRetry={() => { void boot(); }} onTemporary={() => { const p = makeProject(); history.replaceState(null, '', '#duzenle/' + p.id); setEditor({ project: p, media: new Map(), saveEnabled: false, error: 'Kaydetmeden çalışıyorsunuz. Çalışmanızı HTML veya paket olarak indirin.' }); }}/>
}
