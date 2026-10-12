import { describe, it, expect } from 'vitest';
import { makeProject, makeElement, clampRect, pageHeight, columnRects, safeUrl, elementText } from './model';
import { validateProject } from './validation';
describe('Gazete veri modeli', () => {
    it('şablon ve boş projeyi kayıpsız JSON olarak doğrular', () => { for (const template of [true, false]) {
        const p = makeProject(template);
        expect(validateProject(JSON.parse(JSON.stringify(p)))).toEqual(p);
    } });
    it('haber düzenlenirken yerleşimi değiştirmez', () => { const p = makeProject(); const headline = p.pages[0].elements.find(e => e.name === 'Manşet')!; const before = { x: headline.x, y: headline.y, width: headline.width, height: headline.height }; p.articles[0].title = 'Yeni başlık'; expect(elementText(headline, p.articles)).toBe('Yeni başlık'); expect({ x: headline.x, y: headline.y, width: headline.width, height: headline.height }).toEqual(before); });
    it('kolon oranlarını ve aralıklarını korur', () => { const pg = makeProject(false).pages[0]; pg.columns = [2, 1]; const cols = columnRects(pg); expect(cols[0].width).toBeCloseTo(cols[1].width * 2); expect(cols[1].x - cols[0].x - cols[0].width).toBeCloseTo(pg.gap); expect(cols[1].x + cols[1].width).toBeCloseTo(1000 - pg.margin); });
    it('öğeleri sayfa sınırında tutar ve ince çizgiyi korur', () => { const p = makeProject(); const e = clampRect(makeElement('image', { x: 990, y: 9999, width: 200, height: 300 }), pageHeight(p)); expect(e.x + e.width).toBeLessThanOrEqual(1000); expect(e.y + e.height).toBeLessThanOrEqual(pageHeight(p)); expect(clampRect(makeElement('shape', { width: 1 }), pageHeight(p)).width).toBe(1); });
    it('çalıştırılabilir ve göreli bağlantıları reddeder', () => { for (const url of ['javascript:alert(1)', 'data:text/html,<script>', 'file:///etc/passwd', '/yerel'])
        expect(safeUrl(url)).toBe(''); expect(safeUrl('https://example.com/haber')).toBe('https://example.com/haber'); });
    it('bozuk sürüm, kimlik, geometri, CSS ve haber referansını reddeder', () => { for (const change of [(p: any) => p.version = 2, (p: any) => p.pages[0].id = '../x', (p: any) => p.pages[0].elements[0].width = Infinity, (p: any) => p.pages[0].elements[0].background = 'url(https://evil.test)', (p: any) => p.pages[0].elements[0].articleId = 'missing', (p: any) => p.pages[0].elements[0].x = -2]) {
        const p = makeProject();
        change(p);
        expect(() => validateProject(p)).toThrow();
    } });
});
