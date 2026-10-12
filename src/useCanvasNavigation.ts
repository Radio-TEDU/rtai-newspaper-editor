import { useEffect, useRef, type RefObject, type PointerEvent } from 'react';

export function useCanvasNavigation(workspace: RefObject<HTMLDivElement | null>, zoom: number, setZoom: (value: number) => void, preview: boolean, panMode: boolean, wheelZoom = true) {
    const current = useRef({ zoom, setZoom, wheelZoom }); current.current = { zoom, setZoom, wheelZoom };
    const position = useRef({ x: 0, y: 0 });
    const space = useRef(false);
    const gesture = useRef<{ x: number; y: number; left: number; top: number } | undefined>(undefined);
    function zoomAt(value: number, x?: number, y?: number) {
        const el = workspace.current, paper = el?.querySelector<HTMLElement>('.paper-size');
        const next = Math.max(0.15, Math.min(2, value));
        if (!el || !paper) { current.current.setZoom(next); return; }
        const bounds = el.getBoundingClientRect(), before = paper.getBoundingClientRect();
        const anchorX = x ?? bounds.left + el.clientWidth / 2, anchorY = y ?? bounds.top + el.clientHeight / 2;
        const px = (anchorX - before.left) / current.current.zoom, py = (anchorY - before.top) / current.current.zoom;
        current.current.setZoom(next);
        requestAnimationFrame(() => { const after = paper.getBoundingClientRect(); el.scrollLeft += after.left + px * next - anchorX; el.scrollTop += after.top + py * next - anchorY; });
    }
    useEffect(() => {
        const el = workspace.current;
        if (!el || preview) return;
        const frame = requestAnimationFrame(() => { el.scrollLeft = position.current.x; el.scrollTop = position.current.y; });
        const wheel = (event: WheelEvent) => {
            if (event.ctrlKey || event.metaKey || event.deltaY === 0) return;
            const bounds = el.querySelector('.paper')?.getBoundingClientRect();
            if (!event.altKey && (!current.current.wheelZoom || !bounds || event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) return;
            event.preventDefault();
            zoomAt(current.current.zoom * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.003), event.clientX, event.clientY);
        };
        el.addEventListener('wheel', wheel, { passive: false });
        const down = (event: KeyboardEvent) => {
            if (event.code !== 'Space' || event.ctrlKey || event.metaKey || event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button,a,[contenteditable="true"]')) return;
            space.current = true;
            if (el.contains(event.target as Node)) event.preventDefault();
            el.classList.add('space-pan');
        };
        const up = () => { space.current = false; el.classList.remove('space-pan'); };
        window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', up);
        return () => { cancelAnimationFrame(frame); el.removeEventListener('wheel', wheel); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', up); space.current = false; gesture.current = undefined; };
    }, [preview]);
    function onPointerDownCapture(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 1 && !(event.button === 0 && (panMode || space.current))) return;
        event.preventDefault(); event.stopPropagation();
        const el = event.currentTarget;
        gesture.current = { x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop };
        el.setPointerCapture(event.pointerId); el.classList.add('panning');
    }
    function onPointerMoveCapture(event: PointerEvent<HTMLDivElement>) {
        const g = gesture.current;
        if (!g) return;
        event.preventDefault(); event.stopPropagation();
        event.currentTarget.scrollLeft = g.left - event.clientX + g.x;
        event.currentTarget.scrollTop = g.top - event.clientY + g.y;
    }
    function finish(event: PointerEvent<HTMLDivElement>) {
        if (!gesture.current) return;
        event.preventDefault(); event.stopPropagation(); gesture.current = undefined;
        const el = event.currentTarget; el.classList.remove('panning');
        if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    }
    return { zoomAt, handlers: { onPointerDownCapture, onPointerMoveCapture, onPointerUpCapture: finish, onPointerCancelCapture: finish, onScroll: () => { const el = workspace.current; if (el) position.current = { x: el.scrollLeft, y: el.scrollTop }; } } };
}
