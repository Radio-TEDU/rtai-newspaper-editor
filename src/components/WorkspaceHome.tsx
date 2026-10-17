import { useEffect, useState } from 'react';
import { Newspaper, Plus, Upload, FileText, Pencil, Trash2, Download, Search } from 'lucide-react';
import type { Project } from '../model';
import { assetIds } from '../project-package';
import { readMedia } from '../storage';
import Paper from './Paper';

function Cover({ project }: { project: Project }) {
    const [urls, setUrls] = useState<Record<string, string>>({});
    useEffect(() => { let active = true; const created: string[] = []; (async () => {
        const media = Object.create(null) as Record<string, string>;
        for (const id of assetIds({ ...project, pages: [project.pages[0]] })) { const blob = await readMedia(id, project.id); if (blob && active) { const url = URL.createObjectURL(blob); created.push(url); media[id] = url; } }
        if (active) setUrls(media);
    })().catch(() => {}); return () => { active = false; for (const url of created) URL.revokeObjectURL(url); }; }, [project.id, project.updatedAt]);
    return <div className="work-preview" aria-hidden="true" inert><Paper project={project} page={project.pages[0]} urls={urls} scale={0.18}/></div>;
}
interface Props {
    projects: Project[]; busy: boolean; error: string;
    storageUnavailable: boolean; onDismissError: () => void;
    onCreate: (template: boolean) => void; onImport: (file: File) => void;
    onOpen: (project: Project) => void; onRename: (project: Project) => void;
    onDelete: (project: Project) => void; onExport: (project: Project) => void;
    onRetry: () => void; onTemporary: () => void;
}
export default function WorkspaceHome({ projects, busy, error, storageUnavailable, onDismissError, onCreate, onImport, onOpen, onRename, onDelete, onExport, onRetry, onTemporary }: Props) {
    const [query, setQuery] = useState('');
    const shown = projects.filter(p => p.name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
    return <main className="workspace-home"><header className="home-header"><div className="home-brand"><Newspaper size={26}/><div><strong>RTAI / Atölye</strong><small>GAZETE ÇALIŞMA ALANI</small></div></div><span className="local-badge">Yerel çalışma alanı</span></header>
      <section className="home-intro"><span className="eyebrow">YAYIN MASASI</span><h1>Çalışmalar</h1><p>Gazetelerini oluştur, dosyadan ekle ve kaldığın yerden düzenlemeye devam et.</p>
        <div className="home-actions"><button className="primary" disabled={busy || storageUnavailable} onClick={() => onCreate(false)}><Plus size={17}/>Yeni gazete oluştur</button><button disabled={busy || storageUnavailable} onClick={() => onCreate(true)}><FileText size={17}/>Şablondan gazete oluştur</button><label className={'file-button' + (busy || storageUnavailable ? ' disabled' : '')}><Upload size={17}/>Dosyadan gazete ekle<input aria-label="Gazete dosyası" type="file" accept=".html,.htm,.rtai.zip,application/zip,text/html" disabled={busy || storageUnavailable} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onImport(file); }}/></label></div>
        <p className="local-help">HTML ve .rtai.zip kabul edilir. Çalışmalar bu tarayıcıda saklanır; başka bilgisayara taşımak için dosya indir.</p>
      </section>
      {error && <div className="home-error" role="alert"><p>{error}</p>{storageUnavailable ? <><button disabled={busy} onClick={onRetry}>Yerel kaydı yeniden dene</button><button disabled={busy} onClick={onTemporary}>Kaydetmeden gazete oluştur</button></> : <button onClick={onDismissError}>Hata bildirimini kapat</button>}</div>}
      <section className="works-section" aria-label="Gazeteler"><div className="works-heading"><h2>Gazetelerin <span>{projects.length}</span></h2><label className="works-search"><Search size={16}/><input aria-label="Çalışmalarda ara" placeholder="Çalışmalarda ara" value={query} onChange={e => setQuery(e.target.value)}/></label></div>
      {!shown.length ? <div className="empty-workspace"><Newspaper size={40}/><h2>{projects.length ? 'Aramana uygun gazete yok.' : 'İlk sayfanı aç.'}</h2><p>{projects.length ? 'Başka bir adla aramayı dene.' : 'Yeni gazete oluştur veya bağımsız skill ile ürettiğin HTML dosyasını ekle.'}</p></div> : <div className="works-grid">{shown.map(p => <article className="work-card" key={p.id} data-project-id={p.id}><Cover project={p}/><div className="work-card-info"><h2>{p.name}</h2><p>{p.pages.length} sayfa · {p.widthMm} × {p.heightMm} mm</p><small>Son düzenleme: {Number.isNaN(Date.parse(p.updatedAt)) ? '—' : new Date(p.updatedAt).toLocaleString('tr-TR')}</small><div className="work-card-actions"><button className="primary" disabled={busy} onClick={() => onOpen(p)} aria-label={'Düzenle · ' + p.name}><Pencil size={15}/>Düzenle</button><button disabled={busy} onClick={() => onExport(p)} aria-label={'HTML indir · ' + p.name} title="HTML indir"><Download size={16}/></button><button disabled={busy} onClick={() => onRename(p)} aria-label={'Adını değiştir · ' + p.name} title="Adını değiştir"><FileText size={16}/></button><button disabled={busy} className="danger" onClick={() => onDelete(p)} aria-label={'Sil · ' + p.name} title="Gazeteyi sil"><Trash2 size={16}/></button></div></div></article>)}</div>}
      </section><footer className="home-footer">Bağımsız üretim → HTML ekle → düzenle → dosya indir</footer>
    </main>;
}
