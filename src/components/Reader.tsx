import { useEffect, useRef, useState, type RefObject } from 'react';
import { ArrowLeft, X, ExternalLink, Link2 } from 'lucide-react';
import { safeUrl, type Project } from '../model';
import Paper from './Paper';
import { routeHash } from '../routes';
export default function Reader({ project, urls, articleId, pageId, onOpenPage, onCloseArticle, onBack, onPrint, onMessage, onOpenArticle, scrollPosition }: {
    project: Project;
    urls: Record<string, string>;
    articleId?: string;
    pageId?: string;
    onOpenPage: (id: string) => void;
    onCloseArticle: () => void;
    onBack: () => void;
    onPrint: () => void;
    onMessage: (text: string) => void;
    onOpenArticle: (id: string) => void;
    scrollPosition: RefObject<number>;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const article = project.articles.find(a => a.id === articleId);
    useEffect(() => { if (articleId) {
        if (!dialog.current?.open)
            dialog.current?.showModal();
    }
    else
        dialog.current?.close(); }, [articleId]);
    const [width, setWidth] = useState(Math.min(900, window.innerWidth - 48));
    const returnScroll = useRef(scrollPosition.current);
    useEffect(() => {
        window.scrollTo(0, scrollPosition.current);
        const resize = () => setWidth(Math.min(900, window.innerWidth - 48));
        const scroll = () => { scrollPosition.current = window.scrollY; };
        window.addEventListener('resize', resize); window.addEventListener('scroll', scroll);
        return () => { window.removeEventListener('resize', resize); window.removeEventListener('scroll', scroll); };
    }, [scrollPosition]);
    useEffect(() => { if (!articleId) requestAnimationFrame(() => window.scrollTo(0, returnScroll.current)); }, [articleId]);
    useEffect(() => { if (!pageId) return; const frame = requestAnimationFrame(() => document.getElementById('okuma-sayfa-' + pageId)?.scrollIntoView()); return () => cancelAnimationFrame(frame); }, [pageId]);
    const articleHref = (id: string) => routeHash({ kind: 'read', projectId: project.id, articleId: id });
    function open(id: string) { returnScroll.current = window.scrollY; onOpenArticle(id); }
    const articleClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); open(id); } };
    const scale = width / 1000;
    return <div className="reader"><header className="reader-header"><button onClick={onBack}><ArrowLeft size={17}/> Editöre dön</button><div><span className="eyebrow">OKUMA ÖNİZLEMESİ</span><strong>{project.name}</strong></div><button className="primary" onClick={onPrint}>PDF / Yazdır</button></header><main>
    <div className="reader-intro"><p className="eyebrow">BİR SAYI, BİRÇOK HİKÂYE</p><h1>Yayına başka bir gözle bakın.</h1><p>Sayfalardaki bağlantılı başlıklara dokunarak haberin tamamını okuyabilirsiniz.</p><nav aria-label="Okuma sayfaları">{project.pages.map((p, i) => <a key={p.id} href={routeHash({ kind: 'read', projectId: project.id, pageId: p.id })} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); onOpenPage(p.id); } }}>{String(i + 1).padStart(2, '0')} · {p.name}</a>)}</nav></div>
    {project.pages.map((page, i) => <section className="reader-page" key={page.id} id={'okuma-sayfa-' + page.id} aria-label={page.name}><div className="reader-page-label"><span>{String(i + 1).padStart(2, '0')} / {project.pages.length}</span><span>{page.name}</span></div><Paper project={project} page={page} urls={urls} scale={scale} onOpenArticle={open} articleHref={articleHref}/></section>)}
    {project.articles.length > 0 && <section className="article-index"><span className="eyebrow">YAZILAR</span><h2>Bütün hikâyeler</h2>{project.articles.map(a => <a href={articleHref(a.id)} onClick={event => articleClick(event, a.id)} key={a.id}><small>{a.section}</small><h3>{a.title}</h3><p>{a.summary}</p><span>Haberi oku ↗</span></a>)}</section>}
    {project.pages.flatMap(p => p.elements.filter(e => e.kind === 'image' && !e.hidden && e.caption).map(e => <p className="reader-caption" key={e.id}>{e.caption}</p>))}
    </main><dialog ref={dialog} className="article-dialog" aria-labelledby="article-title" onCancel={event => { event.preventDefault(); onCloseArticle(); }} onClick={event => { if (event.target === event.currentTarget) {
        const r = event.currentTarget.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)
            onCloseArticle();
    } }}><div className="dialog-top"><span className="eyebrow">{article?.section ?? 'HABER'}</span><button autoFocus onClick={onCloseArticle} aria-label="Haberi kapat"><X size={20}/></button></div>
    {article ? <article><h1 id="article-title">{article.title}</h1><p className="article-summary">{article.summary}</p><div className="article-body">{article.body.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div><div className="article-actions">{safeUrl(article.url) && <a href={safeUrl(article.url)} target="_blank" rel="noopener noreferrer">Kaynağa git <ExternalLink size={15}/></a>}<button onClick={async () => { try {
        await navigator.clipboard.writeText(location.href);
        onMessage('Haber bağlantısı kopyalandı. Bu bağlantı aynı yerel projeyi kullanan tarayıcıda açılır.');
    }
    catch {
        onMessage('Bağlantı kopyalanamadı. Adres çubuğundaki bağlantıyı kullanabilirsiniz.');
    } }}><Link2 size={15}/> Bağlantıyı kopyala</button></div></article> : <><h1 id="article-title">Haber bulunamadı</h1><p>Bu haber açık projede yer almıyor.</p></>}
    </dialog></div>;
}
