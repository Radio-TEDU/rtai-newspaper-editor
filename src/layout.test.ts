import { describe, it, expect } from 'vitest';
import { makeProject, makeElement, pageHeight } from './model';
import { conflicts, placeSafely, snapElement, layoutText } from './layout';

describe('Yerleşim ve metin akışı', () => {
    it('yeni/kopyalanan öğeye boş alan bulur; dolu sayfayı sessizce örtüştürmez', () => {
        const p = makeProject(false), page = p.pages[0];
        const a = makeElement('body', { x: 34, y: 300, width: 400, height: 200 }); page.elements.push(a);
        const b = placeSafely(makeElement('image', { x: 34, y: 300, width: 400, height: 200 }), page, pageHeight(p));
        expect(b).toBeDefined(); expect(conflicts(a, b!)).toBe(false);
        page.elements = [makeElement('image', { x: 0, y: 0, width: 1000, height: pageHeight(p) })];
        expect(placeSafely(makeElement('body'), page, pageHeight(p))).toBeUndefined();
    });
    it('komşu merkezine yakalar; gizli öğeleri aday yapmaz', () => {
        const p = makeProject(false), pg = p.pages[0]; pg.columns = [1];
        pg.elements = [makeElement('image', { x: 250, y: 400, width: 200, height: 200 })];
        const e = makeElement('text', { x: 303, y: 405, width: 100, height: 80 });
        const result = snapElement(e, pg, pageHeight(p), 1);
        expect(result.element.x).toBe(300); expect(result.guides).toContainEqual({ axis: 'x', value: 350 });
        pg.elements[0].hidden = true; expect(snapElement(e, pg, pageHeight(p), 1).element.x).toBe(303);
    });
    it('sarma görselin çevresinden akar; kapalıyken o satırları ayırır; metin kaybolmaz', () => {
        const text = 'Bir iki üç dört beş altı yedi sekiz dokuz on';
        const e = makeElement('body', { x: 0, y: 0, width: 300, height: 500, fontSize: 20, lineHeight: 1 });
        const image = makeElement('image', { x: 0, y: 0, width: 120, height: 100, wrapText: true, wrapGap: 10 });
        const wrap = layoutText(e, text, [image], s => s.length * 10);
        expect(wrap.lines[0].x).toBe(130); expect(wrap.lines[0].y).toBe(0);
        expect(wrap.lines.map(l => l.text).join(' ')).toBe(text); expect(wrap.overflow).toBe(false);
        image.wrapText = false;
        const plain = layoutText(e, text, [image], s => s.length * 10);
        expect(plain.lines[0].y).toBeGreaterThanOrEqual(110);
        expect(plain.lines.map(l => l.text).join(' ')).toBe(text);
    });
    it('dar boşluklara metin sıkıştırmaz ve taşmayı açıkça bildirir', () => {
        const e = makeElement('body', { x: 0, y: 0, width: 300, height: 40, fontSize: 20, lineHeight: 1 });
        const image = makeElement('image', { x: 40, y: 0, width: 220, height: 100, wrapText: true });
        const result = layoutText(e, 'Uzun yazı burada korunur', [image], s => s.length * 10);
        expect(result.lines[0].y).toBeGreaterThan(100); expect(result.overflow).toBe(true);
    });
});
