import { useState, useRef, useLayoutEffect, type CSSProperties, type PointerEvent } from 'react';
import { elementText, pageHeight, clampRect, columnRects, type DesignElement, type NewspaperPage, type Project } from '../model';
import { intersects, layoutText, measureTextFor, snapElement, type Guide } from '../layout';
interface PaperProps {
    project: Project;
    page: NewspaperPage;
    urls: Record<string, string>;
    scale?: number;
    selectedId?: string;
    guides?: boolean;
    snap?: boolean;
    editable?: boolean;
    onSelect?: (id?: string) => void;
    onStart?: () => void;
    onChange?: (id: string, patch: Partial<DesignElement>) => DesignElement | undefined;
    onFinish?: () => void;
    onOpenArticle?: (id: string) => void;
}
function TextContent({ element: e, project, page }: { element: DesignElement; project: Project; page?: NewspaperPage }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [overflow, setOverflow] = useState(false);
    const text = elementText(e, project.articles);
    const images = e.allowOverlap ? [] : page?.elements.filter(b => b.kind === 'image' && !b.hidden && (!b.allowOverlap || b.wrapText) && intersects(e, b)) ?? [];
    const flow = images.length ? layoutText(e, text, images, measureTextFor(e)) : undefined;
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => setOverflow(flow ? flow.overflow || flow.narrow : el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2);
        check();
        const observer = new ResizeObserver(check); observer.observe(el);
        return () => observer.disconnect();
    }, [text, e.width, e.height, e.fontSize, e.fontFamily, e.fontWeight, e.lineHeight, flow?.neededHeight, flow?.narrow, flow?.overflow]);
    return <span ref={ref} className={'element-text' + (flow ? ' flow-text' : '')} data-overflow={overflow ? 'true' : undefined}>
        {flow ? flow.lines.map((line, i) => <span className="flow-line" key={i} style={{ left: line.x, top: line.y, width: line.width, height: e.fontSize * e.lineHeight, textAlign: e.align === 'justify' ? 'left' : e.align, wordSpacing: e.align === 'justify' && !line.last && line.text.includes(' ') ? Math.max(0, (line.width - measureTextFor(e)(line.text)) / (line.text.split(' ').length - 1)) : undefined }}>{line.text}</span>) : text}
    </span>;
}
export function ElementContent({ element: e, project, urls }: {
    element: DesignElement;
    project: Project;
    urls: Record<string, string>;
    page?: NewspaperPage;
}) {
    if (e.kind === 'image')
        return <>{e.assetId && urls[e.assetId] ? <img draggable={false} src={urls[e.assetId]} alt={e.alt} style={{ objectFit: e.fit, objectPosition: e.focalX + '% ' + e.focalY + '%' }}/> : <div className="image-placeholder"><span>▧</span><b>Hikâyenin bir de görseli var.</b><small>Görsel yüklemek için alanı seçin</small></div>}</>;
    return <TextContent element={e} project={project}/>;
}
export function elementStyle(e: DesignElement): CSSProperties { return { left: e.x, top: e.y, width: e.width, height: e.height, fontSize: e.fontSize, fontFamily: e.fontFamily === 'serif' ? 'Georgia, "Times New Roman", serif' : 'Arial, sans-serif', fontWeight: e.fontWeight, lineHeight: e.lineHeight, color: e.color, background: e.background, textAlign: e.align, border: e.borderWidth + 'px solid ' + e.borderColor }; }
export default function Paper({ project, page, urls, scale = 1, selectedId, guides, snap, editable, onSelect, onStart, onChange, onFinish, onOpenArticle }: PaperProps) {
    const height = pageHeight(project);
    const gesture = useRef<{
        id: string;
        startX: number;
        startY: number;
        element: DesignElement;
        handle: string;
        started: boolean;
        target: HTMLElement;
    } | null>(null);
    const [dragging, setDragging] = useState(false);
    const [smartGuides, setSmartGuides] = useState<Guide[]>([]);
    function down(event: PointerEvent<HTMLElement>, e: DesignElement, handle = 'move') { if (!editable || event.button !== 0)
        return; event.stopPropagation(); onSelect?.(e.id); if (e.locked)
        return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); gesture.current = { id: e.id, startX: event.clientX, startY: event.clientY, element: { ...e }, handle, started: false, target: event.currentTarget }; }
    function move(event: PointerEvent<HTMLElement>) {
        const g = gesture.current;
        if (!g)
            return;
        let dx = (event.clientX - g.startX) / scale;
        let dy = (event.clientY - g.startY) / scale;
        if (!g.started && Math.abs(dx) + Math.abs(dy) < 2)
            return;
        if (!g.started) {
            onStart?.();
            g.started = true;
            setDragging(true);
        }
        const e = g.element;
        let rect = { ...e };
        if (g.handle === 'move') {
            rect.x = e.x + dx;
            rect.y = e.y + dy;
            if (snap) {
                const result = snapElement(rect, page, height, scale);
                rect = result.element;
                setSmartGuides(result.guides);
            }
        }
        else {
            if (g.handle.includes('e'))
                rect.width = e.width + dx;
            if (g.handle.includes('s'))
                rect.height = e.height + dy;
            if (g.handle.includes('w')) {
                rect.x = e.x + dx;
                rect.width = e.width - dx;
            }
            if (g.handle.includes('n')) {
                rect.y = e.y + dy;
                rect.height = e.height - dy;
            }
        }
        rect = clampRect(rect, height);
        const actual = onChange?.(g.id, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
        if (!actual || Math.abs(actual.x - rect.x) > 0.01 || Math.abs(actual.y - rect.y) > 0.01) setSmartGuides([]);
    }
    function finish(event: PointerEvent<HTMLElement>) { const g = gesture.current; if (!g)
        return; gesture.current = null; setDragging(false); setSmartGuides([]); if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId); if (g.started)
        onFinish?.(); }
    return <div className="paper-size" style={{ width: 1000 * scale, height: height * scale }}><div className={'paper ' + (editable ? 'editable ' : '') + (dragging ? 'dragging' : '')} data-testid="paper" style={{ width: 1000, height, transform: 'scale(' + scale + ')' }} onClick={() => onSelect?.(undefined)}>
    {guides && <div className="column-guides" aria-hidden="true">{columnRects(page).map((c, i) => <div key={i} style={{ left: c.x, width: c.width, top: page.margin, bottom: page.margin }}><span>{i + 1}</span></div>)}</div>}
    {page.elements.filter(e => !e.hidden).map(e => <div key={e.id} className={'design-element ' + e.kind + (selectedId === e.id && editable ? ' selected' : '') + (e.locked ? ' locked' : '')} style={elementStyle(e)} data-element-id={e.id} tabIndex={editable ? 0 : undefined} role={editable ? 'button' : undefined} aria-label={editable ? e.name + (e.locked ? ' · kilitli' : '') : undefined} aria-pressed={editable ? selectedId === e.id : undefined} onClick={event => { event.stopPropagation(); onSelect?.(e.id); }} onFocus={() => editable && onSelect?.(e.id)} onPointerDown={event => down(event, e)} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
      {e.kind === 'image' || e.kind === 'shape' ? <ElementContent element={e} project={project} urls={urls}/> : <TextContent element={e} project={project} page={page}/>}
      {!editable && e.articleId && <a className="article-hotspot" href={'#haber/' + encodeURIComponent(e.articleId)} onClick={event => { if (onOpenArticle && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); onOpenArticle(e.articleId!); } }} aria-label={elementText(e, project.articles) + ' · Haberi oku'}><span>Haberi oku ↗</span></a>}
      {editable && selectedId === e.id && !e.locked && ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => <span key={handle} className={'resize-handle ' + handle} role="presentation" onPointerDown={event => down(event, e, handle)} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}/>)}
    </div>)}
    {editable && dragging && smartGuides.map((g, i) => <div key={i} aria-hidden="true" className={'smart-guide ' + g.axis} style={g.axis === 'x' ? { left: g.value } : { top: g.value }}/>) }
  </div></div>;
}
