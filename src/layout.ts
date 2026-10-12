import { clampRect, columnRects, type DesignElement, type NewspaperPage } from './model';

export const isText = (e: DesignElement) => e.kind !== 'image' && e.kind !== 'shape';
export function intersects(a: Pick<DesignElement, 'x' | 'y' | 'width' | 'height'>, b: Pick<DesignElement, 'x' | 'y' | 'width' | 'height'>, gap = 0) {
    return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}
export function conflicts(a: DesignElement, b: DesignElement) {
    if (a.id === b.id || a.hidden || b.hidden || a.kind === 'shape' || b.kind === 'shape' || a.allowOverlap || b.allowOverlap) return false;
    if ((a.kind === 'image' && a.wrapText && isText(b)) || (b.kind === 'image' && b.wrapText && isText(a))) return false;
    return intersects(a, b, 4);
}
export function placeSafely(element: DesignElement, page: NewspaperPage, height: number): DesignElement | undefined {
    const candidate = clampRect(element, height);
    if (page.layoutMode !== 'safe') return candidate;
    const other = page.elements.filter(e => e.id !== element.id);
    const clear = (e: DesignElement) => !other.some(b => conflicts(e, b));
    if (clear(candidate)) return candidate;
    // Preserve the column where possible; compare all relevant obstacle boundaries.
    const xs = [...new Set([candidate.x, page.margin, ...columnRects(page).map(c => c.x), ...other.flatMap(e => [e.x + e.width + 8, e.x - candidate.width - 8])])];
    const ys = [...new Set([candidate.y, page.margin, ...other.flatMap(e => [e.y + e.height + 8, e.y - candidate.height - 8])])];
    let best: DesignElement | undefined;
    let distance = Infinity;
    for (const x of xs) for (const y of ys) {
        if (x < 0 || y < 0 || x + candidate.width > 1000 || y + candidate.height > height) continue;
        const next = { ...candidate, x, y };
        const score = Math.abs(y - candidate.y) + Math.abs(x - candidate.x) * 2;
        if (score < distance && clear(next)) { best = next; distance = score; }
    }
    return best;
}

export interface Guide { axis: 'x' | 'y'; value: number }
export function snapElement(e: DesignElement, page: NewspaperPage, height: number, scale: number) {
    const others = page.elements.filter(b => b.id !== e.id && !b.hidden && b.kind !== 'shape');
    const xTargets = [page.margin, 500, 1000 - page.margin, ...columnRects(page).flatMap(c => [c.x, c.x + c.width / 2, c.x + c.width]), ...others.flatMap(b => [b.x, b.x + b.width / 2, b.x + b.width])];
    const yTargets = [page.margin, height / 2, height - page.margin, ...others.flatMap(b => [b.y, b.y + b.height / 2, b.y + b.height])];
    const guides: Guide[] = [];
    const nearest = (position: number, size: number, targets: number[], axis: 'x' | 'y') => {
        let best = 6 / Math.max(0.15, scale), delta = 0, target: number | undefined;
        for (const t of targets) for (const anchor of [position, position + size / 2, position + size]) {
            const d = t - anchor;
            if (Math.abs(d) < best) { best = Math.abs(d); delta = d; target = t; }
        }
        if (target !== undefined) guides.push({ axis, value: target });
        return position + delta;
    };
    return { element: { ...e, x: nearest(e.x, e.width, xTargets, 'x'), y: nearest(e.y, e.height, yTargets, 'y') }, guides };
}

export interface TextLine { text: string; x: number; y: number; width: number; last: boolean }
export interface TextLayout { lines: TextLine[]; neededHeight: number; overflow: boolean; narrow: boolean }
export function layoutText(e: DesignElement, text: string, images: DesignElement[], measure: (text: string) => number): TextLayout {
    const lines: TextLine[] = [];
    const lineHeight = e.fontSize * e.lineHeight;
    const inset = e.borderWidth;
    const width = Math.max(1, e.width - inset * 2);
    const blockers = images.filter(b => !b.hidden && intersects(e, b));
    let y = 0, narrow = false;
    // Bound work for pathological input while retaining an explicit overflow state.
    const maxRows = 10000;
    for (const paragraph of text.split('\n')) {
        const words = paragraph.trim().split(/\s+/).filter(Boolean);
        if (!words.length) { y += lineHeight; continue; }
        let word = 0;
        while (word < words.length && y / lineHeight < maxRows) {
            let segments: [number, number][] = [[0, width]];
            for (const image of blockers) {
                const gap = image.wrapGap ?? 12;
                if (e.y + inset + y + lineHeight <= image.y - gap || e.y + inset + y >= image.y + image.height + gap) continue;
                if (!image.wrapText) { segments = []; break; }
                const left = Math.max(0, image.x - e.x - inset - gap), right = Math.min(width, image.x + image.width - e.x - inset + gap);
                segments = segments.flatMap(([a, b]): [number, number][] => right <= a || left >= b ? [[a, b]] : [...(left > a ? [[a, left] as [number, number]] : []), ...(right < b ? [[right, b] as [number, number]] : [])]);
            }
            const usable = segments.filter(([a, b]) => b - a >= Math.min(width, Math.max(80, e.fontSize * 4)));
            for (const [left, right] of usable) {
                if (word >= words.length) break;
                let line = '';
                while (word < words.length) {
                    const next = line ? line + ' ' + words[word] : words[word];
                    if (measure(next) > right - left + 0.01) {
                        if (line) break;
                        // Long URLs/words are split without dropping characters.
                        const chars = Array.from(words[word]);
                        let chunk = '';
                        while (chars.length && measure(chunk + chars[0]) <= right - left) chunk += chars.shift();
                        if (!chunk) { narrow = true; break; }
                        line = chunk;
                        if (chars.length) words[word] = chars.join(''); else word++;
                        break;
                    }
                    line = next; word++;
                }
                if (line) lines.push({ text: line, x: left, y, width: right - left, last: word >= words.length });
            }
            y += lineHeight;
        }
        if (word < words.length) return { lines, neededHeight: y + lineHeight + inset * 2, overflow: true, narrow };
    }
    const neededHeight = Math.ceil(y + inset * 2);
    return { lines, neededHeight, overflow: neededHeight > e.height + 1, narrow };
}
let context: CanvasRenderingContext2D | null | undefined;
export function measureTextFor(e: DesignElement) {
    if (typeof document === 'undefined') throw new Error('Metin ölçümü için tarayıcı gerekir.');
    context ??= document.createElement('canvas').getContext('2d');
    if (!context) throw new Error('Metin ölçümü hazırlanamadı.');
    context.font = `${e.fontWeight} ${e.fontSize}px ${e.fontFamily === 'serif' ? 'Georgia' : 'Arial'}`;
    const font = context.font;
    return (text: string) => { context!.font = font; return context!.measureText(text).width; };
}
