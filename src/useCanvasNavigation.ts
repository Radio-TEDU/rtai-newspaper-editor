import { useEffect, useLayoutEffect, useRef, type RefObject, type PointerEvent } from 'react';

const MIN_ZOOM = 0.15, MAX_ZOOM = 2;
const clampZoom = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
/** Sürekli zoom hareketi bittikten bu kadar sonra yeni zoom React state'ine işlenir. */
const COMMIT_DELAY = 140;
/** Fare tekerleğinde bir tık (deltaY 100) yaklaşık %10 zoom yapar. */
const MOUSE_ZOOM_SPEED = 0.001;
/** Touchpad sıkıştırması: tarayıcı deltaY = -100·ln(ölçek) gönderir; 0.01 parmakla birebir olurdu, büyük sayfada yavaş kaldığı için hızlandırılır. */
const TRACKPAD_ZOOM_SPEED = 0.025;
/** Kullanıcının hassasiyet ayarı: temel hızların çarpanı (1 = varsayılan). */
export type ZoomSensitivity = { mouse: number; trackpad: number };
export const DEFAULT_ZOOM_SENSITIVITY: ZoomSensitivity = { mouse: 1, trackpad: 1 };
const zoomFactor = (deltaY: number, trackpad: boolean, sensitivity: ZoomSensitivity) => Math.exp(-Math.max(-100, Math.min(100, deltaY)) * (trackpad ? TRACKPAD_ZOOM_SPEED * sensitivity.trackpad : MOUSE_ZOOM_SPEED * sensitivity.mouse));

type PendingZoom = { zoom: number; x?: number; y?: number; panX: number; panY: number };
type Touch = { x: number; y: number; target: EventTarget | null };

/** Ctrl + tekerlek: touchpad sıkıştırması küçük (çoğu zaman kesirli) adımlar gönderir, fare tıkı ±100 civarındadır.
 *  Burada eski wheelDeltaY'ye bakılmaz; Chrome sıkıştırmada da 120'nin katı bildirebiliyor. */
const looksLikePinch = (event: WheelEvent) => event.deltaMode === 0 && (!Number.isInteger(event.deltaY) || Math.abs(event.deltaY) < 50);

/** Touchpad'in iki parmak kaydırması ile fare tekerleğini ayırır. Kesin bir yolu olmadığından sezgiseldir. */
function looksLikeTrackpad(event: WheelEvent) {
    if (event.deltaMode !== 0) return false; // satır/sayfa birimi: fare tekerleği (Firefox)
    if (event.deltaX !== 0) return true; // fare tekerleği yatay hareket üretmez
    const legacy = (event as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
    if (legacy && Math.abs(legacy) >= 120) return Math.abs(legacy) % 120 !== 0; // tekerlek tıkları 120'nin katıdır
    return !Number.isInteger(event.deltaY) || Math.abs(event.deltaY) < 50;
}

export function useCanvasNavigation(workspace: RefObject<HTMLDivElement | null>, zoom: number, setZoom: (value: number) => void, preview: boolean, panMode: boolean, wheelZoom = true, sensitivity: ZoomSensitivity = DEFAULT_ZOOM_SENSITIVITY) {
    const current = useRef({ setZoom, wheelZoom, panMode, sensitivity }); current.current = { setZoom, wheelZoom, panMode, sensitivity };
    // Hareket sırasında zoom önce doğrudan DOM'a yazılır (her karede React çizimi yok), hareket durunca state'e işlenir.
    const live = useRef(zoom);
    const committed = useRef(zoom);
    const pending = useRef<PendingZoom | undefined>(undefined);
    const frame = useRef(0);
    const commitTimer = useRef<number | undefined>(undefined);
    const position = useRef({ x: 0, y: 0 });
    const space = useRef(false);
    const gesture = useRef<{ x: number; y: number; left: number; top: number } | undefined>(undefined);
    const touches = useRef(new Map<number, Touch>());
    const pinch = useRef<{ distance: number; zoom: number; x: number; y: number } | undefined>(undefined);
    const touchPan = useRef<{ id: number; x: number; y: number; moved: boolean; vx: number; vy: number; time: number } | undefined>(undefined);
    const inertia = useRef(0);
    const suppressClickUntil = useRef(0);
    const cancelling = useRef(false);

    // Sığdır gibi dışarıdan gelen zoom değişikliği bekleyen hareketin önüne geçer.
    useLayoutEffect(() => {
        if (zoom === committed.current) return;
        committed.current = live.current = zoom;
        cancelAnimationFrame(frame.current); frame.current = 0; pending.current = undefined;
        clearTimeout(commitTimer.current); commitTimer.current = undefined;
    }, [zoom]);

    function apply(next: number, x?: number, y?: number) {
        const el = workspace.current, size = el?.querySelector<HTMLElement>('.paper-size'), paper = size?.querySelector<HTMLElement>('.paper');
        const previous = live.current;
        live.current = next;
        if (!el || !size || !paper || next === previous) return;
        const bounds = el.getBoundingClientRect(), before = size.getBoundingClientRect();
        const anchorX = x ?? bounds.left + el.clientWidth / 2, anchorY = y ?? bounds.top + el.clientHeight / 2;
        const px = (anchorX - before.left) / previous, py = (anchorY - before.top) / previous;
        size.style.width = paper.offsetWidth * next + 'px';
        size.style.height = paper.offsetHeight * next + 'px';
        paper.style.transform = 'scale(' + next + ')';
        paper.style.setProperty('--canvas-scale', String(next));
        // Kaydırma aynı karede düzeltilir; işaretçinin altındaki nokta yerinde kalır.
        const after = size.getBoundingClientRect();
        el.scrollLeft += after.left + px * next - anchorX;
        el.scrollTop += after.top + py * next - anchorY;
    }
    function commit() {
        commitTimer.current = undefined;
        if (live.current === committed.current) return;
        committed.current = live.current;
        current.current.setZoom(live.current);
    }
    function flush() {
        frame.current = 0;
        const p = pending.current; pending.current = undefined;
        if (!p) return;
        apply(p.zoom, p.x, p.y);
        const el = workspace.current;
        if (el && (p.panX || p.panY)) { el.scrollLeft -= p.panX; el.scrollTop -= p.panY; }
        clearTimeout(commitTimer.current);
        commitTimer.current = window.setTimeout(commit, COMMIT_DELAY);
    }
    /** Hareket sırasında kullanılan zoom: değişiklikler bir sonraki kareye toplanır. */
    function schedule(next: number, x?: number, y?: number, panX = 0, panY = 0) {
        const p = pending.current;
        pending.current = { zoom: clampZoom(next), x, y, panX: (p?.panX ?? 0) + panX, panY: (p?.panY ?? 0) + panY };
        if (!frame.current) frame.current = requestAnimationFrame(flush);
    }
    const targetZoom = () => pending.current?.zoom ?? live.current;
    /** Düğmeler için anında zoom. */
    function zoomAt(value: number, x?: number, y?: number) {
        cancelAnimationFrame(frame.current); frame.current = 0; pending.current = undefined;
        clearTimeout(commitTimer.current);
        apply(clampZoom(value), x, y);
        commit();
    }
    function stopInertia() { cancelAnimationFrame(inertia.current); inertia.current = 0; }
    /** Tuvali kaydırır; tuval kenara dayandıysa kalan hareket sayfaya aktarılır (mobilde sayfa kaydırması). */
    function panBy(dx: number, dy: number) {
        const el = workspace.current;
        if (!el) return;
        const left = el.scrollLeft, top = el.scrollTop;
        el.scrollLeft = left - dx; el.scrollTop = top - dy;
        const restX = dx + (el.scrollLeft - left), restY = dy + (el.scrollTop - top);
        if (Math.abs(restX) > 0.5 || Math.abs(restY) > 0.5) window.scrollBy(-restX, -restY);
    }

    useEffect(() => {
        const el = workspace.current;
        if (!el || preview) return;
        const restore = requestAnimationFrame(() => { el.scrollLeft = position.current.x; el.scrollTop = position.current.y; });
        let trackpadUntil = 0, pinchUntil = 0;
        const wheel = (event: WheelEvent) => {
            if (event.deltaY === 0 && event.deltaX === 0) return;
            const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1;
            const dy = event.deltaY * scale;
            // Touchpad'de iki parmakla sıkıştırma tarayıcıda Ctrl + tekerlek olarak gelir; Ctrl/⌘ + fare tekerleği de aynı işi yapar.
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault(); stopInertia();
                // Aynı sıkıştırma hareketinin içinde tek tük büyük adım gelse de touchpad hızı kullanılır.
                const pinch = event.timeStamp < pinchUntil || looksLikePinch(event);
                if (pinch) pinchUntil = event.timeStamp + 250;
                schedule(targetZoom() * zoomFactor(dy, pinch, current.current.sensitivity), event.clientX, event.clientY);
                return;
            }
            if (event.shiftKey) return; // Shift + tekerlek: tarayıcının yatay kaydırması
            // Touchpad'de iki parmakla kaydırma tuvali tarayıcının kendi (akıcı) kaydırmasıyla gezdirir.
            const trackpad = event.timeStamp < trackpadUntil || looksLikeTrackpad(event);
            if (trackpad) { trackpadUntil = event.timeStamp + 250; if (!event.altKey) return; }
            const bounds = el.querySelector('.paper')?.getBoundingClientRect();
            if (!event.altKey && (!current.current.wheelZoom || !bounds || event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) return;
            event.preventDefault(); stopInertia();
            schedule(targetZoom() * zoomFactor(dy, trackpad, current.current.sensitivity), event.clientX, event.clientY);
        };
        el.addEventListener('wheel', wheel, { passive: false });
        // Safari (macOS) touchpad sıkıştırması Ctrl + tekerlek yerine gesture olayları gönderir.
        let gestureStart = 0;
        type GestureEvent = Event & { scale: number; clientX: number; clientY: number };
        const gestureBegin = (event: Event) => { event.preventDefault(); gestureStart = targetZoom(); };
        const gestureChange = (event: Event) => { const e = event as GestureEvent; e.preventDefault(); schedule(gestureStart * e.scale, e.clientX, e.clientY); };
        const gestureEnd = (event: Event) => event.preventDefault();
        const gestures = navigator.maxTouchPoints === 0; // dokunmatik cihazlarda sıkıştırma pointer olaylarıyla işlenir
        if (gestures) { el.addEventListener('gesturestart', gestureBegin); el.addEventListener('gesturechange', gestureChange); el.addEventListener('gestureend', gestureEnd); }
        // Parmakla kaydırmanın sonunda gelen tıklama seçimi kaldırmasın.
        const click = (event: MouseEvent) => { if (performance.now() < suppressClickUntil.current) { event.stopPropagation(); event.preventDefault(); } };
        el.addEventListener('click', click, true);
        const down = (event: KeyboardEvent) => {
            if (event.code !== 'Space' || event.ctrlKey || event.metaKey || event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button,a,[contenteditable="true"]')) return;
            space.current = true;
            if (el.contains(event.target as Node)) event.preventDefault();
            el.classList.add('space-pan');
        };
        const up = () => { space.current = false; el.classList.remove('space-pan'); };
        window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', up);
        return () => {
            cancelAnimationFrame(restore); stopInertia();
            if (frame.current) { cancelAnimationFrame(frame.current); flush(); }
            if (commitTimer.current !== undefined) { clearTimeout(commitTimer.current); commit(); }
            el.removeEventListener('wheel', wheel); el.removeEventListener('click', click, true);
            if (gestures) { el.removeEventListener('gesturestart', gestureBegin); el.removeEventListener('gesturechange', gestureChange); el.removeEventListener('gestureend', gestureEnd); }
            window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', up);
            space.current = false; gesture.current = undefined; touches.current.clear(); pinch.current = undefined; touchPan.current = undefined;
        };
    }, [preview]);

    function capture(el: HTMLElement, id: number) { try { el.setPointerCapture(id); } catch { /* bitmiş işaretçi */ } }
    /** Öğeyi sürüklemeye başlamış parmağın hareketini iptal eder (ikinci parmak gelince sıkıştırmaya geçilir). */
    function cancelElementDrag(id: number, touch: Touch) {
        const target = touch.target instanceof Element ? touch.target.closest<HTMLElement>('.design-element, .resize-handle') : null;
        if (!target) return;
        try { if (target.hasPointerCapture(id)) target.releasePointerCapture(id); } catch { /* yok */ }
        cancelling.current = true;
        try { target.dispatchEvent(new window.PointerEvent('pointercancel', { pointerId: id, pointerType: 'touch', bubbles: true })); }
        finally { cancelling.current = false; }
    }
    function startPinch(el: HTMLElement) {
        const [a, b] = [...touches.current.values()];
        pinch.current = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), zoom: targetZoom(), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        touchPan.current = undefined;
        for (const [id, touch] of touches.current) { cancelElementDrag(id, touch); capture(el, id); }
    }
    function touchDown(event: PointerEvent<HTMLDivElement>) {
        const el = event.currentTarget;
        stopInertia();
        touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY, target: event.target });
        if (touches.current.size >= 2) {
            event.preventDefault(); event.stopPropagation();
            if (touches.current.size === 2) startPinch(el);
            return;
        }
        // Tek parmak: seçili öğe ve tutamaçları sürüklenir; başka her yerde (el aracı açıkken her yerde) tuval kaydırılır.
        // Seçili olmayan öğeye dokunup bırakmak onu seçer, böylece yakınlaştırılmış sayfada parmak öğeleri yanlışlıkla taşımaz.
        const target = event.target instanceof Element ? event.target : null;
        if (!current.current.panMode && target?.closest('.editable .design-element.selected:not(.locked), .editable .resize-handle')) return;
        if (current.current.panMode || target?.closest('.design-element')) event.stopPropagation();
        if (current.current.panMode) event.preventDefault();
        touchPan.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, vx: 0, vy: 0, time: event.timeStamp };
    }
    function touchMove(event: PointerEvent<HTMLDivElement>) {
        const touch = touches.current.get(event.pointerId);
        if (!touch) return;
        touch.x = event.clientX; touch.y = event.clientY;
        const p = pinch.current;
        if (p && touches.current.size >= 2) {
            event.preventDefault(); event.stopPropagation();
            const [a, b] = [...touches.current.values()];
            const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
            // İki parmak: aradaki mesafe zoom'u, orta noktanın hareketi kaydırmayı belirler.
            schedule(p.zoom * Math.hypot(a.x - b.x, a.y - b.y) / p.distance, x, y, x - p.x, y - p.y);
            p.x = x; p.y = y;
            return;
        }
        const pan = touchPan.current;
        if (!pan || pan.id !== event.pointerId) return;
        const dx = event.clientX - pan.x, dy = event.clientY - pan.y;
        if (!pan.moved && Math.hypot(dx, dy) < 6) return;
        event.preventDefault(); event.stopPropagation();
        // Dokunup bırakma tıklama olarak öğeye ulaşsın diye işaretçi ancak kaydırma başlayınca tuvale bağlanır.
        if (!pan.moved) capture(event.currentTarget, event.pointerId);
        pan.moved = true;
        const dt = Math.max(1, event.timeStamp - pan.time);
        pan.vx = pan.vx * 0.2 + dx / dt * 0.8; pan.vy = pan.vy * 0.2 + dy / dt * 0.8;
        pan.x = event.clientX; pan.y = event.clientY; pan.time = event.timeStamp;
        panBy(dx, dy);
    }
    function touchEnd(event: PointerEvent<HTMLDivElement>) {
        if (cancelling.current || !touches.current.delete(event.pointerId)) return;
        const el = event.currentTarget;
        if (pinch.current) {
            event.preventDefault(); event.stopPropagation();
            suppressClickUntil.current = performance.now() + 350;
            if (touches.current.size < 2) pinch.current = undefined;
            // Bir parmak kalırsa onunla kaydırmaya devam edilir.
            const [rest] = [...touches.current.entries()];
            if (rest && !pinch.current) touchPan.current = { id: rest[0], x: rest[1].x, y: rest[1].y, moved: true, vx: 0, vy: 0, time: event.timeStamp };
            else if (touches.current.size >= 2) startPinch(el);
            return;
        }
        const pan = touchPan.current;
        if (!pan || pan.id !== event.pointerId) return;
        touchPan.current = undefined;
        if (!pan.moved) return;
        event.preventDefault(); event.stopPropagation();
        suppressClickUntil.current = performance.now() + 350;
        // Parmak kalkınca kısa bir süre kaymaya devam eder.
        if (event.type === 'pointerup' && event.timeStamp - pan.time < 80) {
            let vx = pan.vx * 16, vy = pan.vy * 16;
            const step = () => {
                vx *= 0.93; vy *= 0.93;
                if (Math.abs(vx) < 0.4 && Math.abs(vy) < 0.4) { inertia.current = 0; return; }
                panBy(vx, vy);
                inertia.current = requestAnimationFrame(step);
            };
            inertia.current = requestAnimationFrame(step);
        }
        try { if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId); } catch { /* yok */ }
    }

    function onPointerDownCapture(event: PointerEvent<HTMLDivElement>) {
        if (event.pointerType === 'touch') { touchDown(event); return; }
        if (event.button !== 1 && !(event.button === 0 && (panMode || space.current))) return;
        event.preventDefault(); event.stopPropagation();
        const el = event.currentTarget;
        gesture.current = { x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop };
        el.setPointerCapture(event.pointerId); el.classList.add('panning');
    }
    function onPointerMoveCapture(event: PointerEvent<HTMLDivElement>) {
        if (event.pointerType === 'touch') { touchMove(event); return; }
        const g = gesture.current;
        if (!g) return;
        event.preventDefault(); event.stopPropagation();
        event.currentTarget.scrollLeft = g.left - event.clientX + g.x;
        event.currentTarget.scrollTop = g.top - event.clientY + g.y;
    }
    function finish(event: PointerEvent<HTMLDivElement>) {
        if (event.pointerType === 'touch') { touchEnd(event); return; }
        if (!gesture.current) return;
        event.preventDefault(); event.stopPropagation(); gesture.current = undefined;
        const el = event.currentTarget; el.classList.remove('panning');
        if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    }
    return { zoomAt, handlers: { onPointerDownCapture, onPointerMoveCapture, onPointerUpCapture: finish, onPointerCancelCapture: finish, onScroll: () => { const el = workspace.current; if (el) position.current = { x: el.scrollLeft, y: el.scrollTop }; } } };
}
