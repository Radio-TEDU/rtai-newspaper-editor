import { useEffect, useRef, useState } from 'react';
import Editor, { type Boot, type EditorHandle } from './App';
import WorkspaceHome from './components/WorkspaceHome';
import { listProjects, loadProject, readMedia, saveProject, deleteProject, storageError } from './storage';
import { makeProject, uid, type Project } from './model';
import { assetIds, importPackage } from './project-package';
import { importHtml, exportHtml } from './html-package';
import { parseRoute, routeHash, type Route, type ProjectRoute } from './routes';

export default function Workspace() {
    const [projects, setProjects] = useState<Project[]>([]), [editor, setEditor] = useState<Boot>();
    const [route, setRoute] = useState<ProjectRoute>();
    const [error, setError] = useState(''), [busy, setBusy] = useState(true);
    const [storageUnavailable, setStorageUnavailable] = useState(false);
    const editorRef = useRef(editor); editorRef.current = editor;
    const routeRef = useRef(route); routeRef.current = route;
    const editorHandle = useRef<EditorHandle>(null);
    const navigationVersion = useRef(0);
    async function stored<T>(action: () => Promise<T>): Promise<T> {
        try { return await action(); }
        catch (e) { setStorageUnavailable(true); throw new Error(storageError(e)); }
    }
    async function mediaFor(p: Project) {
        const media = new Map<string, Blob>();
        for (const id of assetIds(p)) { const blob = await stored(() => readMedia(id, p.id)); if (blob) media.set(id, blob); }
        return media;
    }
    function navigate(next: ProjectRoute | { kind: 'home' }, replace = false) {
        history[replace ? 'replaceState' : 'pushState'](null, '', routeHash(next));
        if (next.kind !== 'home') { routeRef.current = next; setRoute(next); }
    }
    async function refresh() {
        const list = await stored(listProjects); setProjects(list); setStorageUnavailable(false); return list;
    }
    function acceptEditor(next: Boot, target: ProjectRoute = { kind: 'edit', projectId: next.project.id }) {
        editorRef.current = next; setEditor(next); navigate(target, true);
    }
    async function open(p: Project, target: ProjectRoute = { kind: 'edit', projectId: p.id }) {
        const media = await mediaFor(p);
        await stored(() => saveProject(p));
        acceptEditor({ project: p, media, saveEnabled: true, error: media.size !== assetIds(p).length ? 'Bazı görseller bulunamadı. Eksik görselleri yeniden yükleyin.' : undefined }, target);
    }
    async function showHome() {
        editorRef.current = undefined; setEditor(undefined); setRoute(undefined); routeRef.current = undefined;
        navigate({ kind: 'home' }, true); await refresh();
    }
    async function resolveLegacy(target: Extract<Route, { kind: 'legacy' }>): Promise<ProjectRoute> {
        if (target.articleId) {
            const matches = (await stored(listProjects)).filter(p => p.articles.some(a => a.id === target.articleId));
            if (matches.length > 1) throw new Error('Bu eski haber bağlantısı birden fazla gazeteye ait. Çalışmalar’dan doğru gazeteyi açıp yeni haber bağlantısını kullanın.');
            if (!matches.length) throw new Error('Bu haber yerel çalışma alanında bulunamadı.');
            return { kind: 'read', projectId: matches[0].id, articleId: target.articleId };
        }
        const p = editorRef.current?.project ?? await stored(() => loadProject());
        if (!p) throw new Error('Bu gazete yerel çalışma alanında bulunamadı.');
        return { kind: 'read', projectId: p.id, pageId: target.pageId };
    }
    async function visit(target: Route, version: number) {
        setBusy(true); setError('');
        const previousRoute = routeRef.current;
        try {
            if (target.kind === 'invalid') throw new Error('Gazete bağlantısı geçersiz. Çalışmalar’dan gazeteyi açın.');
            const next = target.kind === 'legacy' ? await resolveLegacy(target) : target;
            if (version !== navigationVersion.current) return;
            if (next.kind !== 'home' && editorRef.current?.project.id === next.projectId) { navigate(next, true); return; }
            await editorHandle.current?.save();
            if (version !== navigationVersion.current) return;
            if (next.kind === 'home') { await showHome(); return; }
            const p = await stored(() => loadProject(next.projectId));
            if (!p) throw new Error('Bu gazete yerel çalışma alanında bulunamadı. Başka bir gazete açılmadı.');
            const media = await mediaFor(p);
            if (version !== navigationVersion.current) return;
            await stored(() => saveProject(p));
            if (version !== navigationVersion.current) return;
            acceptEditor({ project: p, media, saveEnabled: true, error: media.size !== assetIds(p).length ? 'Bazı görseller bulunamadı. Eksik görselleri yeniden yükleyin.' : undefined }, next);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Gazete açılamadı.');
            if (editorRef.current && previousRoute) navigate(previousRoute, true);
            else { editorRef.current = undefined; setEditor(undefined); navigate({ kind: 'home' }, true); await refresh().catch(() => {}); }
        } finally { if (version === navigationVersion.current) setBusy(false); }
    }
    useEffect(() => {
        const change = () => { const version = ++navigationVersion.current; void visit(parseRoute(location.hash), version); };
        change(); window.addEventListener('hashchange', change); window.addEventListener('popstate', change);
        return () => { navigationVersion.current++; window.removeEventListener('hashchange', change); window.removeEventListener('popstate', change); };
    }, []);
    async function run(action: () => Promise<void>) { setBusy(true); setError(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'İşlem tamamlanamadı.'); } finally { setBusy(false); } }
    if (editor && route) return <Editor key={editor.project.id} initial={editor} route={route} onNavigate={navigate} leaveRef={editorHandle} navigationError={error} externalBusy={busy}
        onOpen={acceptEditor} onHome={() => { navigationVersion.current++; void run(showHome); }}/>;
    return <WorkspaceHome projects={projects} busy={busy} error={error} storageUnavailable={storageUnavailable} onDismissError={() => setError('')}
        onOpen={p => { void run(() => open(p)); }}
        onCreate={template => { void run(async () => { const p = makeProject(template); await stored(() => saveProject(p)); await open(p); }); }}
        onImport={file => { void run(async () => { const imported = /\.html?$/i.test(file.name) ? await importHtml(file) : await importPackage(file); imported.project.id = uid(); imported.project.updatedAt = new Date().toISOString(); await stored(() => saveProject(imported.project, imported.media)); acceptEditor({ ...imported, saveEnabled: true, error: 'Proje ve bütün görseller açıldı.' }); }); }}
        onRename={p => { const name = window.prompt('Gazetenin yeni adı', p.name); if (name?.trim()) { void run(async () => { await stored(() => saveProject({ ...p, name: name.trim().slice(0, 200), updatedAt: new Date().toISOString() }, undefined, false)); await refresh(); }); } }}
        onDelete={p => { if (window.confirm('“' + p.name + '” yerel çalışma alanından silinsin mi? Gerekliyse önce HTML indir ile yedek alın.')) { void run(async () => { await stored(() => deleteProject(p.id)); await refresh(); }); } }}
        onExport={p => { void run(async () => { await exportHtml(p, await mediaFor(p)); }); }}
        onRetry={() => { void run(async () => { await refresh(); }); }}
        onTemporary={() => { const p = makeProject(); acceptEditor({ project: p, media: new Map(), saveEnabled: false, error: 'Kaydetmeden çalışıyorsunuz. Çalışmanızı HTML veya paket olarak indirin.' }); }}/>;
}
