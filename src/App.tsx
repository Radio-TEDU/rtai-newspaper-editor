import { useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react';
import { Newspaper, Plus, Eye, Printer, Download, Upload, Undo2, Redo2, ChevronUp, ChevronDown, Copy, Trash2, ZoomIn, ZoomOut, Maximize2, Type, Heading1, AlignLeft, Quote, ImagePlus, Minus, Layers, Settings2, FileText, Check, Grid2X2, LockKeyhole, EyeOff, Link2, X, Hand, PanelLeft, Home } from 'lucide-react';
import { makeProject, makePage, makeElement, uid, pageHeight, clampRect, kindLabels, elementText, type Project, type ElementKind, type Article } from './model';
import { useEditor } from './useEditor';
import { saveProject, storageError } from './storage';
import { importHtml, exportHtml } from './html-package';
import { assetIds, exportPackage, importPackage, validateImage } from './project-package';
import Paper from './components/Paper';
import Properties, { NumberField } from './components/Properties';
import Reader from './components/Reader';
import PrintView from './components/PrintView';
import { placeSafely, layoutText, measureTextFor, isText } from './layout';
import { useCanvasNavigation, DEFAULT_ZOOM_SENSITIVITY, type ZoomSensitivity } from './useCanvasNavigation';
import ZoomSettings from './components/ZoomSettings';
import type { ProjectRoute } from './routes';
export interface Boot {
    project: Project;
    media: Map<string, Blob>;
    error?: string;
    saveEnabled: boolean;
}
export interface EditorHandle { save: () => Promise<void> }
export default function Editor({ initial, onHome, onOpen, route, onNavigate, leaveRef, navigationError, externalBusy }: {
    initial: Boot; onHome: () => void; onOpen: (next: Boot) => void; route: ProjectRoute;
    onNavigate: (next: ProjectRoute, replace?: boolean) => void;
    leaveRef: RefObject<EditorHandle | null>; navigationError: string; externalBusy: boolean;
}) {
    const editor = useEditor(initial.project);
    const { project, page, selected, selectedId, setSelectedId, mutate, updatePage, updateElement } = editor;
    const [media] = useState(initial.media);
    const [urls, setUrls] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState(initial.error ?? '');
    const [saving, setSaving] = useState(initial.saveEnabled ? 'pending' : 'disabled');
    const saveEnabled = initial.saveEnabled;
    const preview = route.kind === 'read';
    const articleId = route.articleId;
    const [zoom, setZoom] = useState(0.55);
    const [guides, setGuides] = useState(false);
    const [snap, setSnap] = useState(true);
    const [panMode, setPanMode] = useState(false);
    const [panelsHidden, setPanelsHidden] = useState(false);
    const [rightTab, setRightTab] = useState<'properties' | 'layers' | 'articles'>('properties');
    const [activeArticle, setActiveArticle] = useState<string>(project.articles[0]?.id ?? '');
    const [working, setBusy] = useState(false);
    const busy = working || externalBusy;
    const [recoveryOpen, setRecoveryOpen] = useState(false);
    const [backupProject, setBackupProject] = useState<Project>();
    const [backupConfirmed, setBackupConfirmed] = useState(false);
    const recoveryDialog = useRef<HTMLDialogElement>(null);
    const hasCurrentBackup = backupProject === project;
    const [storageUsage, setStorageUsage] = useState('');
    const imageInput = useRef<HTMLInputElement>(null);
    const importInput = useRef<HTMLInputElement>(null);
    const workspace = useRef<HTMLDivElement>(null);
    const readerScroll = useRef(0);
    const [wheelZoom, setWheelZoom] = useState(() => { try { return localStorage.getItem('rtai-wheel-zoom') !== 'false'; } catch { return true; } });
    useEffect(() => { try { localStorage.setItem('rtai-wheel-zoom', String(wheelZoom)); } catch {} }, [wheelZoom]);
    const [zoomSensitivity, setZoomSensitivity] = useState<ZoomSensitivity>(() => { try { const saved = JSON.parse(localStorage.getItem('rtai-zoom-sensitivity') ?? 'null'); const pick = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? Math.min(3, Math.max(0.25, v)) : 1; return saved && typeof saved === 'object' ? { mouse: pick(saved.mouse), trackpad: pick(saved.trackpad) } : DEFAULT_ZOOM_SENSITIVITY; } catch { return DEFAULT_ZOOM_SENSITIVITY; } });
    useEffect(() => { try { localStorage.setItem('rtai-zoom-sensitivity', JSON.stringify(zoomSensitivity)); } catch {} }, [zoomSensitivity]);
    const navigation = useCanvasNavigation(workspace, zoom, setZoom, preview, panMode, wheelZoom, zoomSensitivity);
    const imageTarget = useRef<string | undefined>(undefined);
    const pendingMedia = useRef(new Map<string, Blob>());
    const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
    const revision = useRef(0);
    const savePermission = useRef(saveEnabled);
    savePermission.current = saveEnabled;
    const urlRegistry = useRef(urls);
    useImperativeHandle(leaveRef, () => ({ save: persistCurrent }));
    useEffect(() => { if (navigationError) setNotice(navigationError); }, [navigationError]);
    useEffect(() => { if (recoveryOpen) recoveryDialog.current?.showModal(); else recoveryDialog.current?.close(); }, [recoveryOpen]);
    useEffect(() => { if (editor.layoutError) setNotice(editor.layoutError); }, [editor.layoutError]);
    urlRegistry.current = urls;
    useEffect(() => { const next = Object.fromEntries([...media].map(([id, blob]) => [id, URL.createObjectURL(blob)])); urlRegistry.current = next; setUrls(next); return () => { for (const url of Object.values(urlRegistry.current))
        URL.revokeObjectURL(url); }; }, [media]);
    useEffect(() => { if (!saveEnabled)
        return; const r = ++revision.current; setSaving('pending'); const timer = setTimeout(() => { saveQueue.current = saveQueue.current.catch(() => { }).then(() => { const activeIds = new Set(assetIds(project)); const pending = new Map([...pendingMedia.current].filter(([id]) => activeIds.has(id))); return saveProject(project, pending).then(() => { for (const [id, blob] of pending)
        if (pendingMedia.current.get(id) === blob)
            pendingMedia.current.delete(id); }); }).then(() => { if (revision.current === r)
        setSaving('saved'); }).catch(err => { if (revision.current === r) {
        setSaving('error');
        setNotice(storageError(err));
    } }); }, 650); return () => clearTimeout(timer); }, [project, saveEnabled]);
    useEffect(() => { const handler = (event: BeforeUnloadEvent) => { if (saving === 'pending' || saving === 'error' || saving === 'disabled') {
        event.preventDefault();
    } }; window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler); }, [saving]);
    useEffect(() => { navigator.storage?.estimate().then(v => setStorageUsage('Yerel alan: ' + Math.round((v.usage ?? 0) / 1024 / 1024) + ' MB / ' + Math.round((v.quota ?? 0) / 1024 / 1024) + ' MB')).catch(() => setStorageUsage('Yerel alan bilgisi alınamadı.')); }, [project.updatedAt]);
    function showReader(replace = false) { onNavigate({ kind: 'read', projectId: project.id, pageId: route.pageId }, replace); }
    function clearArticle() { showReader(true); }
    function openArticle(id: string) { onNavigate({ kind: 'read', projectId: project.id, articleId: id }); }
    function editArticle(id: string, patch: Partial<Article>) { mutate(p => { const a = p.articles.find(a => a.id === id); if (a)
        Object.assign(a, patch); }); }
    function add(kind: ElementKind) { if (page.elements.length >= 500) { setNotice('Bir sayfaya en fazla 500 öğe ekleyebilirsiniz.'); return; } const element = placeSafely(makeElement(kind, { x: page.margin, y: Math.min(300, pageHeight(project) - 300) }), page, pageHeight(project)); if (!element) { setNotice('Bu öğe için boş alan yok. Yeni sayfa ekleyin veya serbest düzeni seçin.'); return; } updatePage(p => p.elements.push(element)); setSelectedId(element.id); setRightTab('properties'); }
    function duplicateElement() { if (!selected)
        return; if (page.elements.length >= 500) {
        setNotice('Bir sayfaya en fazla 500 öğe ekleyebilirsiniz.');
        return;
    } const copy = placeSafely({ ...selected, id: uid(), name: selected.name.slice(0, 191) + ' kopyası', x: selected.x + 16, y: selected.y + 16, locked: false }, page, pageHeight(project)); if (!copy) { setNotice('Kopya için çakışmasız alan yok. Yeni sayfa ekleyin.'); return; } updatePage(p => p.elements.push(copy)); setSelectedId(copy.id); }
    function deleteElement() { if (!selected || selected.locked)
        return; updatePage(p => { p.elements = p.elements.filter(e => e.id !== selected.id); }); setSelectedId(undefined); }
    function orderElement(direction: number) { if (!selected || selected.locked)
        return; updatePage(p => { const i = p.elements.findIndex(e => e.id === selected.id); const j = i + direction; if (j >= 0 && j < p.elements.length)
        [p.elements[i], p.elements[j]] = [p.elements[j], p.elements[i]]; }); }
    function createArticle() { if (project.articles.length >= 2000) {
        setNotice('Bir sayıya en fazla 2000 haber ekleyebilirsiniz.');
        return;
    } const a: Article = { id: uid(), title: selected ? elementText(selected, project.articles).slice(0, 10000) : 'Yeni haber', summary: 'Haberin kısa özeti.', body: 'Haberin ayrıntılarını buraya yazın.', section: 'Gündem', url: '' }; mutate(p => { p.articles.push(a); const e = p.pages.find(pg => pg.id === page.id)?.elements.find(e => e.id === selectedId); if (e && !e.locked)
        e.articleId = a.id; }); setActiveArticle(a.id); setRightTab('articles'); }
    function addPage(template = false) { if (project.pages.length >= 100) {
        setNotice('Bir sayıya en fazla 100 sayfa ekleyebilirsiniz.');
        return;
    } const next = makePage(template); next.elements = next.elements.map(e => clampRect(e, pageHeight(project))); mutate(p => p.pages.push(next)); editor.setPageId(next.id); setSelectedId(undefined); }
    function duplicatePage() { if (project.pages.length >= 100) {
        setNotice('Bir sayıya en fazla 100 sayfa ekleyebilirsiniz.');
        return;
    } const next = structuredClone(page); next.id = uid(); next.name = next.name.slice(0, 191) + ' kopyası'; next.elements = next.elements.map(e => ({ ...e, id: uid() })); mutate(p => p.pages.splice(p.pages.findIndex(pg => pg.id === page.id) + 1, 0, next)); editor.setPageId(next.id); setSelectedId(undefined); }
    function deletePage() { if (project.pages.length === 1) {
        setNotice('Sayıda en az bir sayfa bulunmalı.');
        return;
    } const index = project.pages.findIndex(p => p.id === page.id); mutate(p => { p.pages = p.pages.filter(p => p.id !== page.id); }); editor.setPageId(project.pages[index === 0 ? 1 : index - 1].id); setSelectedId(undefined); }
    function movePage(direction: number) { mutate(p => { const i = p.pages.findIndex(pg => pg.id === page.id); const j = i + direction; if (j >= 0 && j < p.pages.length)
        [p.pages[i], p.pages[j]] = [p.pages[j], p.pages[i]]; }); }
    function fit() { const el = workspace.current; if (el)
        setZoom(Math.min(1.5, Math.max(0.15, Math.min((el.clientWidth - 100) / 1000, (el.clientHeight - 100) / pageHeight(project))))); }
    useEffect(() => { const frame = requestAnimationFrame(fit); return () => cancelAnimationFrame(frame); }, []);
    function resizeIssue(widthMm: number, heightMm: number) { mutate(p => { p.widthMm = widthMm; p.heightMm = heightMm; for (const pg of p.pages)
        pg.elements = pg.elements.map(e => clampRect(e, pageHeight(p))); }); }
    async function uploadImage(file: File) {
        setBusy(true);
        try {
            await validateImage(file);
            if (assetIds(project).length >= 1000)
                throw new Error('Bir sayıda en fazla 1000 ayrı görsel olabilir.');
            const activeSize = assetIds(project).reduce((n, id) => n + (media.get(id)?.size ?? 0), 0);
            if (activeSize + file.size > 100 * 1024 * 1024)
                throw new Error('Sayıdaki görseller 100 MB paket sınırını aşıyor. Görselleri küçültün.');
            const id = uid();
            media.set(id, file);
            setUrls(v => ({ ...v, [id]: URL.createObjectURL(file) }));
            pendingMedia.current.set(id, file);
            const target = imageTarget.current;
            mutate(p => { const pg = p.pages.find(pg => pg.id === page.id)!; const e = pg.elements.find(e => e.id === target); if (e) {
                if (!e.locked) {
                    e.assetId = id;
                    e.alt = e.alt || file.name.replace(/\.[^.]+$/, '');
                }
            }
            else {
                if (pg.elements.length >= 500) throw new Error('Bir sayfaya en fazla 500 öğe ekleyebilirsiniz.');
                const element = placeSafely(makeElement('image', { assetId: id, alt: file.name.replace(/\.[^.]+$/, ''), name: 'Görsel · ' + file.name.slice(0, 100), x: pg.margin }), pg, pageHeight(p));
                if (!element) throw new Error('Görsel için boş alan yok. Yeni sayfa ekleyin veya serbest düzeni seçin.');
                pg.elements.push(element);
                setSelectedId(element.id);
            } });
            setRightTab('properties');
        }
        catch (err) {
            setNotice(err instanceof Error ? err.message : 'Görsel yüklenemedi.');
        }
        finally {
            setBusy(false);
            imageTarget.current = undefined;
        }
    }
    async function exportProject(html = false) { setBusy(true); try {
        if (html) await exportHtml(project, media); else await exportPackage(project, media);
        setBackupProject(project); setBackupConfirmed(false);
        setNotice(html ? 'Düzenlenebilir HTML indirildi.' : 'Metinler ve görseller proje paketi olarak indirildi.');
    }
    catch (err) {
        setNotice(err instanceof Error ? err.message : 'Paket indirilemedi.');
    }
    finally {
        setBusy(false);
    } }
    async function persistCurrent() {
        if (!savePermission.current) throw new Error('Kaydetmeden çalışıyorsunuz. HTML veya paket indirin; ardından “Yedekle ve çık” ile dosyanızı kaydettiğinizi onaylayın.');
        revision.current++; await saveQueue.current.catch(() => {});
        const active = new Set(assetIds(project));
        await saveProject(project, new Map([...media].filter(([id]) => active.has(id))));
        setSaving('saved');
    }
    async function goHome() { setBusy(true); try { await persistCurrent(); onHome(); } catch (err) { setNotice(storageError(err)); setRecoveryOpen(true); } finally { setBusy(false); } }
    async function importProject(file: File) {
        setBusy(true);
        try {
            const imported = /\.html?$/i.test(file.name) ? await importHtml(file) : await importPackage(file);
            await persistCurrent();
            imported.project.id = uid(); imported.project.updatedAt = new Date().toISOString();
            await saveProject(imported.project, imported.media);
            onOpen({ ...imported, saveEnabled: true, error: 'Proje ve bütün görseller açıldı.' });
        } catch (err) { setNotice(err instanceof Error ? err.message : 'Gazete açılamadı.'); }
        finally { setBusy(false); }
    }
    async function newIssue(template: boolean) {
        setBusy(true);
        try { await persistCurrent(); const next = makeProject(template); await saveProject(next); onOpen({ project: next, media: new Map(), saveEnabled: true, error: 'Yeni sayı açıldı. Önceki gazeteniz Çalışmalar’da korunuyor.' }); }
        catch (err) { setNotice(storageError(err)); } finally { setBusy(false); }
    }
    async function printIssue() { setBusy(true); try {
        for (const id of assetIds(project))
            if (!urls[id])
                throw new Error('Eksik görselleri yükledikten sonra PDF alın.');
        await document.fonts.ready;
        const modelOverflow = project.pages.flatMap(pg => pg.elements.filter(e => !e.hidden && isText(e) && layoutText(e, elementText(e, project.articles), e.allowOverlap ? [] : pg.elements.filter(b => b.kind === 'image' && (!b.allowOverlap || b.wrapText)), measureTextFor(e)).overflow));
        if (modelOverflow.length) throw new Error(`${modelOverflow.length} metin kutusunda taşma var. Kutuyu büyütün veya metne göre yüksekliğini ayarlayın; ardından PDF alın.`);
        await Promise.all([...document.querySelectorAll<HTMLImageElement>('.print-root img')].map(img => img.decode()));
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        const overflow = [...document.querySelectorAll<HTMLElement>('.print-root .element-text')].filter(el => el.dataset.overflow === 'true' || el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2);
        if (overflow.length) throw new Error(`${overflow.length} metin kutusunda taşma var. Kutuyu büyütün veya metne göre yüksekliğini ayarlayın; ardından PDF alın.`);
        setNotice('Yazdırma penceresinde PDF olarak kaydet seçin; ölçek %100, kenar boşluğu yok, üst/alt bilgi kapalı.');
        window.print();
    }
    catch (err) {
        setNotice(err instanceof Error ? err.message : 'Baskı hazırlanamadı.');
    }
    finally {
        setBusy(false);
    } }
    useEffect(() => {
        const key = (e: KeyboardEvent) => {
            if (preview || busy)
                return;
            const target = e.target as HTMLElement;
            if (target.closest('input,textarea,select,[contenteditable="true"]'))
                return;
            const command = e.ctrlKey || e.metaKey;
            if (command && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey)
                    editor.redo();
                else
                    editor.undo();
                return;
            }
            if (command && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                editor.redo();
                return;
            }
            if (command && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                duplicateElement();
                return;
            }
            if (e.key === 'Escape') {
                setSelectedId(undefined);
                return;
            }
            if (selected && !selected.locked) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    deleteElement();
                }
                const directions: Record<string, [
                    number,
                    number
                ]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
                const d = directions[e.key];
                if (d) {
                    e.preventDefault();
                    const step = e.shiftKey ? 10 : 1;
                    updateElement(selected.id, e.altKey ? { width: selected.width + d[0] * step, height: selected.height + d[1] * step } : { x: selected.x + d[0] * step, y: selected.y + d[1] * step });
                }
            }
        };
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    });
    const active = project.articles.find(a => a.id === activeArticle) ?? project.articles[0];
    const index = project.pages.findIndex(p => p.id === page.id);
    return <><div className="application" aria-busy={busy}>
    {(saving === 'error' || saving === 'disabled') && <div className="save-recovery-banner" role="status"><span>Çalışmanız bu oturumda açık; yerel kayıt tamamlanmadı.</span><button disabled={busy} onClick={() => setRecoveryOpen(true)}>Yedekle ve çık</button></div>}
    {preview ? <Reader project={project} urls={urls} articleId={articleId} pageId={route.pageId} onOpenPage={id => onNavigate({ kind: 'read', projectId: project.id, pageId: id })} onCloseArticle={clearArticle} onOpenArticle={openArticle} scrollPosition={readerScroll} onBack={() => onNavigate({ kind: 'edit', projectId: project.id })} onPrint={printIssue} onMessage={setNotice}/> : <>
    <header className="app-header"><a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-symbol"><Newspaper size={22}/></span><div><strong>RTAI<span> / </span>Atölye</strong><small>GAZETE TASARIM EDİTÖRÜ</small></div></a><div className="project-title"><input disabled={busy} aria-label="Gazete adı" maxLength={200} value={project.name} onChange={e => mutate(p => { p.name = e.target.value; })}/><span className={'save-state ' + saving} role="status">{saving === 'saved' ? <Check size={12}/> : null}{saving === 'saved' ? 'Yerel olarak kaydedildi' : saving === 'pending' ? 'Kaydediliyor…' : saving === 'disabled' ? 'Yerel kayıt kapalı' : 'Kayıt yapılamadı'}</span></div><div className="header-actions"><button disabled={busy} onClick={() => { void goHome(); }}><Home size={16}/>Çalışmalar</button><button aria-label={panelsHidden ? "Panelleri göster" : "Panelleri gizle"} aria-expanded={!panelsHidden} aria-controls="left-panel right-panel" onClick={() => setPanelsHidden(v => !v)}><PanelLeft size={16}/><span>Paneller</span></button><button onClick={() => showReader()} disabled={busy}><Eye size={16}/> Okuma önizlemesi</button><button className="primary" onClick={printIssue} disabled={busy}><Printer size={16}/> PDF / Yazdır</button></div></header>
    <div className={"editor-layout" + (panelsHidden ? " panels-hidden" : "")} inert={busy}><aside id="left-panel" className="left-panel" hidden={panelsHidden}><section className="page-section"><div className="section-title"><h2>Sayfalar <span>{project.pages.length}</span></h2><button title="Boş sayfa ekle" aria-label="Boş sayfa ekle" onClick={() => addPage()} disabled={busy || project.pages.length >= 100}><Plus size={17}/></button></div><div className="page-list">{project.pages.map((p, i) => <button className={'page-item ' + (p.id === page.id ? 'active' : '')} key={p.id} onClick={() => { editor.setPageId(p.id); setSelectedId(undefined); }}><span className="mini-paper"><span className="mini-masthead"/>{p.elements.filter(e => !e.hidden).slice(0, 22).map(e => <i key={e.id} style={{ left: e.x / 10 + '%', top: e.y / pageHeight(project) * 100 + '%', width: e.width / 10 + '%', height: e.height / pageHeight(project) * 100 + '%', background: e.kind === 'image' ? '#b5c5b9' : e.kind === 'shape' ? e.background : '#d4d2c8' }}/>)}</span><span className="page-item-text"><b>{String(i + 1).padStart(2, '0')}</b><span>{p.name}</span><small>{p.elements.length} öğe</small></span></button>)}</div><div className="page-actions"><button aria-label="Sayfayı yukarı taşı" title="Sayfayı yukarı taşı" disabled={index === 0} onClick={() => movePage(-1)}><ChevronUp size={16}/></button><button aria-label="Sayfayı aşağı taşı" title="Sayfayı aşağı taşı" disabled={index === project.pages.length - 1} onClick={() => movePage(1)}><ChevronDown size={16}/></button><button aria-label="Sayfayı çoğalt" title="Sayfayı çoğalt" onClick={duplicatePage}><Copy size={15}/></button><button aria-label="Sayfayı sil" title="Sayfayı sil" disabled={project.pages.length === 1} onClick={deletePage}><Trash2 size={15}/></button></div><button className="text-button" onClick={() => addPage(true)}><Plus size={13}/> Şablondan sayfa ekle</button></section>
    <section className="add-section"><span className="eyebrow">SAYFANIZI OLUŞTURUN</span><h2>Öğe ekle</h2><div className="element-tools">{(['headline', 'deck', 'body', 'text', 'quote', 'section', 'caption', 'shape'] as ElementKind[]).map(kind => { const Icon = kind === 'headline' ? Heading1 : kind === 'quote' ? Quote : kind === 'shape' ? Minus : kind === 'body' ? AlignLeft : Type; return <button key={kind} onClick={() => add(kind)} disabled={busy || page.elements.length >= 500}><Icon size={18}/><span>{kindLabels[kind]}</span></button>; })}<button className="image-add" onClick={() => { imageTarget.current = undefined; imageInput.current?.click(); }} disabled={busy}><ImagePlus size={19}/><span>Görsel yükle</span><Plus size={14}/></button></div></section>
    <section className="project-section"><h2>Proje dosyası</h2><button onClick={() => { void exportProject(); }} disabled={busy}><Download size={15}/> Paketi indir</button><button onClick={() => { void exportProject(true); }}><Download size={15}/>HTML indir</button><button onClick={() => importInput.current?.click()} disabled={busy}><Upload size={15}/> Paket aç</button><div className="new-project-actions"><button className="text-button" onClick={() => newIssue(false)} disabled={busy}>Boş sayı</button><button className="text-button" onClick={() => newIssue(true)} disabled={busy}>Şablonlu sayı</button></div><p>Çalışmanız bu tarayıcıda saklanır.<br />Paket indirerek yedeğinizi alın.</p></section><div className="left-footer"><span className="status-dot"/> Bağımsız & yerel<span>v0.1</span></div></aside>
    <main className="canvas-region"><div className="canvas-toolbar"><div className="button-row"><button aria-label="Geri al" title="Geri al (Ctrl+Z)" disabled={!editor.canUndo || busy} onClick={editor.undo}><Undo2 size={17}/></button><button aria-label="Yinele" title="Yinele (Ctrl+Shift+Z)" disabled={!editor.canRedo || busy} onClick={editor.redo}><Redo2 size={17}/></button><span className="toolbar-divider"/><span className="canvas-page-name">{page.name}</span></div><div className="button-row"><button className={guides ? 'toggled' : ''} aria-pressed={guides} onClick={() => setGuides(v => !v)} title="Kolon kılavuzları"><Grid2X2 size={15}/><span>Kılavuzlar</span></button><label className="snap-option"><input type="checkbox" checked={snap} onChange={e => setSnap(e.target.checked)}/> Hizala</label><label className="wheel-setting" title="Gazetenin üzerinde tekerlek zoom yapar. Kapalıyken kaydırır; Alt + tekerlek yine zoom yapar."><input type="checkbox" checked={wheelZoom} onChange={e => setWheelZoom(e.target.checked)}/>Tekerlekle zoom</label></div></div>
    <div className={"workspace" + (panMode ? " pan-mode" : "")} ref={workspace} tabIndex={0} aria-label="Gazete tuvali" {...navigation.handlers}><div className="canvas-stage"><div className="canvas-label"><span>{String(index + 1).padStart(2, '0')} — {page.name}</span><span>{project.widthMm} × {project.heightMm} mm</span></div><Paper project={project} page={page} urls={urls} scale={zoom} editable={!busy} selectedId={selectedId} guides={guides} snap={snap} onSelect={setSelectedId} onStart={editor.checkpoint} onChange={(id, patch) => updateElement(id, patch, false)} onFinish={() => { }}/></div></div>
    <footer className="canvas-footer"><span>{selected ? selected.name : 'Bir öğe seçin; sürükleyin veya sağ panelden düzenleyin.'}</span><div className="zoom-controls"><button aria-label="Tuvali sürükleyerek gez" aria-pressed={panMode} title="Tuvali sürükleyerek gez · Boşluk tuşu veya orta fare düğmesi de kullanılabilir" onClick={() => setPanMode(v => !v)}><Hand size={16}/></button><button aria-label="Uzaklaştır" disabled={zoom <= 0.15} onClick={() => navigation.zoomAt(zoom - 0.1)}><ZoomOut size={16}/></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Yakınlaştır" disabled={zoom >= 2} onClick={() => navigation.zoomAt(zoom + 0.1)}><ZoomIn size={16}/></button><ZoomSettings value={zoomSensitivity} onChange={setZoomSensitivity}/><button onClick={fit} title="Ekrana sığdır"><Maximize2 size={15}/><span>Sığdır</span></button></div></footer></main>
    <aside id="right-panel" className="right-panel" hidden={panelsHidden}><div className="panel-tabs" role="tablist" aria-label="Düzenleme panelleri"><button role="tab" aria-selected={rightTab === 'properties'} onClick={() => setRightTab('properties')}><Settings2 size={15}/> Özellikler</button><button role="tab" aria-selected={rightTab === 'layers'} onClick={() => setRightTab('layers')}><Layers size={15}/> Katmanlar</button><button role="tab" aria-selected={rightTab === 'articles'} onClick={() => setRightTab('articles')}><FileText size={15}/> Haber</button></div>
    <div className="right-scroll" role="tabpanel">{rightTab === 'properties' ? (selected ? <Properties element={selected} project={project} page={page} update={patch => updateElement(selected.id, patch)} onDelete={deleteElement} onDuplicate={duplicateElement} onOrder={orderElement} onImage={() => { imageTarget.current = selected.id; imageInput.current?.click(); }} updateArticle={editArticle} onCreateArticle={createArticle}/> : <><div className="panel-heading"><div><span className="eyebrow">SAYFA DÜZENİ</span><h2>İyi bir sayfa,<br />iyi bir yapıyla başlar.</h2></div></div><div className="properties-content"><label className="field"><span>Sayfa adı</span><input value={page.name} maxLength={200} onChange={e => updatePage(p => { p.name = e.target.value; })}/></label><div className="field-grid"><NumberField label="Genişlik (mm)" value={project.widthMm} min={100} max={600} onChange={v => resizeIssue(v, project.heightMm)}/><NumberField label="Yükseklik (mm)" value={project.heightMm} min={100} max={900} onChange={v => resizeIssue(project.widthMm, v)}/></div><label className="field"><span>Sayfa ölçüsü</span><select value={project.widthMm === 297 && project.heightMm === 420 ? 'a3' : project.widthMm === 210 && project.heightMm === 297 ? 'a4' : 'custom'} onChange={e => { if (e.target.value === 'a3')
            resizeIssue(297, 420); if (e.target.value === 'a4')
            resizeIssue(210, 297); }}><option value="a3">A3 · 297 × 420 mm</option><option value="a4">A4 · 210 × 297 mm</option><option value="custom">Özel ölçü</option></select></label><p className="helper">Ölçü bütün sayılara değil, bu sayının bütün sayfalarına uygulanır. İçerik tasarımı ölçeklenir; en-boy oranı değişirse sınırdaki öğeler sayfa içine alınır.</p><label className="field"><span>Yerleşim davranışı</span><select value={page.layoutMode ?? "free"} onChange={e => updatePage(p => { p.layoutMode = e.target.value as "safe" | "free"; })}><option value="safe">Güvenli · çakışmayı önle</option><option value="free">Serbest · katmanlarla tasarla</option></select></label><p className="helper">Güvenli düzende yeni ve taşınan öğeler boş alana yerleşir. Önceden var olan tasarım yeniden kurulmaz. Görselde sarma açarak metinle birlikte kullanabilirsiniz. Alt + tekerlek: tuvali yakınlaştır; Ctrl: tarayıcı yakınlaştırması.</p><h3>Kolon yapısı</h3><label className="field"><span>Kolon sayısı</span><select value={page.columns.length} onChange={e => updatePage(p => { p.columns = Array.from({ length: Number(e.target.value) }, () => 1); })}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} kolon</option>)}</select></label><div className="field-grid"><NumberField label="Kolon aralığı" value={page.gap} max={80} onChange={v => updatePage(p => { p.gap = v; })}/><NumberField label="İç boşluk" value={page.margin} max={150} onChange={v => updatePage(p => { p.margin = v; })}/></div>{page.columns.map((weight, i) => <NumberField key={i} label={i + 1 + '. kolon oranı'} value={weight} min={0.1} max={10} step={0.1} onChange={v => updatePage(p => { p.columns[i] = v; })}/>)}<p className="helper">Konum ve kolon değerleri 1000 birim genişliğindeki tuvale göredir. Kolon ayarları kılavuzları değiştirir; öğeler otomatik taşınmaz. Bir öğeyi seçip “Kolona yerleştir” ile hizalayın.</p><div className="empty-selection"><span>↖</span><h3>Bir öğe seçin.</h3><p>Metin, görsel ve konum ayarları burada açılır.</p></div></div></>) : rightTab === 'layers' ? <><div className="panel-heading"><div><span className="eyebrow">ÖNDEN ARKAYA</span><h2>Sayfanın katmanları</h2></div></div><div className="layer-list">{[...page.elements].reverse().map(e => <div className={'layer-row ' + (e.id === selectedId ? 'active' : '')} key={e.id}><button className="layer-select" onClick={() => setSelectedId(e.id)}><span>{e.kind === 'image' ? <ImagePlus size={15}/> : e.kind === 'shape' ? <Minus size={15}/> : <Type size={15}/>}</span><span>{e.name}</span></button><button aria-label={e.name + (e.hidden ? ' göster' : ' gizle')} onClick={() => updateElement(e.id, { hidden: !e.hidden })}>{e.hidden ? <EyeOff size={13}/> : <Eye size={13}/>}</button><button aria-label={e.name + (e.locked ? ' kilidini aç' : ' kilitle')} onClick={() => updateElement(e.id, { locked: !e.locked })}><LockKeyhole size={13} opacity={e.locked ? 1 : 0.35}/></button></div>)}</div>{selected && <div className="layer-actions"><button disabled={selected.locked} onClick={() => orderElement(1)}><ChevronUp size={15}/> Öne al</button><button disabled={selected.locked} onClick={() => orderElement(-1)}><ChevronDown size={15}/> Arkaya gönder</button></div>}<p className="helper padded">Üstteki öğe tuvalde de öndedir. Gizli öğeler okuma ve baskı görünümünde yer almaz.</p></> : <><div className="panel-heading"><div><span className="eyebrow">İÇERİK MASASI</span><h2>Hikâyeyi tamamlayın.</h2></div></div><div className="properties-content"><button className="wide" onClick={createArticle}><Plus size={15}/> Haber ekle</button>{active ? <><label className="field"><span>Haber seç</span><select value={active.id} onChange={e => setActiveArticle(e.target.value)}>{project.articles.map(a => <option value={a.id} key={a.id}>{a.title.slice(0, 50)}</option>)}</select></label>{(['section', 'title', 'summary', 'body', 'url'] as const).map(field => <label className="field" key={field}><span>{{ section: 'Bölüm', title: 'Haber başlığı', summary: 'Spot', body: 'Haberin tamamı', url: 'Kaynak bağlantısı (http/https)' }[field]}</span>{field === 'body' || field === 'summary' ? <textarea maxLength={field === 'body' ? 1000000 : 10000} rows={field === 'body' ? 10 : 3} value={active[field]} onChange={e => editArticle(active.id, { [field]: e.target.value })}/> : <input maxLength={10000} value={active[field]} onChange={e => editArticle(active.id, { [field]: e.target.value })}/>}</label>)}<button onClick={() => openArticle(active.id)}><Eye size={15}/> Haberi oku</button><p className="helper">Bu haberin içeriği yerleşimden bağımsızdır. Bağlı başlık/spot güncellenir; kutuların konumu ve boyutu korunur.</p></> : <p className="helper">İlk haberinizi ekleyin, sonra bir tuval öğesinden haber bağlantısını seçin.</p>}</div></>}
    </div><div className="right-footer"><Link2 size={13}/><span>{storageUsage || 'Bu tarayıcıda otomatik kayıt'}</span></div></aside></div></>}
    <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file)
        void uploadImage(file); }}/><input ref={importInput} type="file" accept=".zip,.rtai.zip,.html,.htm" hidden onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file)
        void importProject(file); }}/>
    <dialog ref={recoveryDialog} className="article-dialog recovery-dialog" aria-labelledby="recovery-title" onCancel={event => { event.preventDefault(); setRecoveryOpen(false); }}>
      <h2 id="recovery-title">Çalışmanı yedekle ve çık</h2>
      <p>Yerel kayıt tamamlanamadı. Önce güncel HTML veya ZIP yedeğini indir. İndirme başlatmak dosyanın diske kaydedildiğini doğrulamaz; dosyanı kaydettiğini onayladıktan sonra Çalışmalar’a dönebilirsin. Önceki yerel kayıt değiştirilmez.</p>
      <div className="button-row"><button disabled={busy} onClick={() => { void exportProject(true); }}>HTML yedeği indir</button><button disabled={busy} onClick={() => { void exportProject(false); }}>ZIP yedeği indir</button></div>
      <label className="check-field"><input type="checkbox" disabled={!hasCurrentBackup || busy} checked={hasCurrentBackup && backupConfirmed} onChange={event => setBackupConfirmed(event.target.checked)}/>Yedek dosyasını kaydettim</label>
      <div className="button-row"><button disabled={busy} onClick={() => setRecoveryOpen(false)}>Düzenlemeye dön</button><button disabled={busy || !hasCurrentBackup || !backupConfirmed} onClick={() => { setRecoveryOpen(false); onHome(); }}>Yedeğimle Çalışmalar’a dön</button></div>
    </dialog>
    {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Bildirimi kapat"><X size={16}/></button></div>}{busy && <div className="busy-label" role="status">İşlem sürüyor…</div>}
    </div><PrintView project={project} urls={urls}/></>;
}
