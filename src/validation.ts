import { kindLabels, type Project } from './model';
const fail = (): never => { throw new Error('Proje dosyasının yapısı veya değerleri geçersiz. Desteklenen sürüm: 1.'); };
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : fail();
const str = (v: unknown, max = 100000) => typeof v === 'string' && v.length <= max ? v : fail();
const num = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : fail();
const bool = (v: unknown) => typeof v === 'boolean' ? v : fail();
const choice = (v: unknown, options: string[]) => options.includes(str(v, 80)) ? v : fail();
const id = (v: unknown) => /^[a-zA-Z0-9_-]{1,80}$/.test(str(v, 80)) ? v as string : fail();
const color = (v: unknown, transparent = false) => /^#[a-fA-F0-9]{6}$/.test(str(v, 20)) || (transparent && v === 'transparent') ? v : fail();
export function validateProject(value: unknown): Project {
    const p = obj(value);
    if (p.version !== 1)
        fail();
    id(p.id);
    str(p.name, 200);
    str(p.updatedAt, 80);
    num(p.widthMm, 100, 600);
    num(p.heightMm, 100, 900);
    if (!Array.isArray(p.pages) || p.pages.length < 1 || p.pages.length > 100 || !Array.isArray(p.articles) || p.articles.length > 2000)
        fail();
    const ids = new Set<string>();
    const unique = (v: unknown) => { const i = id(v); if (ids.has(i))
        fail(); ids.add(i); return i; };
    unique(p.id);
    const articleIds = new Set<string>();
    for (const raw of p.articles as unknown[]) {
        const a = obj(raw);
        articleIds.add(unique(a.id));
        for (const k of ['title', 'summary', 'body', 'section', 'url'])
            str(a[k], k === 'body' ? 1000000 : 10000);
    }
    const h = 1000 * Number(p.heightMm) / Number(p.widthMm);
    for (const raw of p.pages as unknown[]) {
        const pg = obj(raw);
        unique(pg.id);
        str(pg.name, 200);
        if (pg.layoutMode !== undefined) choice(pg.layoutMode, ['safe', 'free']);
        num(pg.margin, 0, 150);
        num(pg.gap, 0, 80);
        if (!Array.isArray(pg.columns) || pg.columns.length < 1 || pg.columns.length > 6)
            fail();
        for (const col of pg.columns as unknown[])
            num(col, 0.1, 10);
        if (1000 - Number(pg.margin) * 2 - Number(pg.gap) * ((pg.columns as unknown[]).length - 1) < 100)
            fail();
        if (!Array.isArray(pg.elements) || pg.elements.length > 500)
            fail();
        for (const rawEl of pg.elements as unknown[]) {
            const e = obj(rawEl);
            unique(e.id);
            choice(e.kind, Object.keys(kindLabels));
            str(e.name, 200);
            str(e.text);
            num(e.x, 0, 1000);
            num(e.y, 0, h);
            num(e.width, 1, 1000);
            num(e.height, 1, h);
            if (Number(e.x) + Number(e.width) > 1000.1 || Number(e.y) + Number(e.height) > h + 0.1)
                fail();
            num(e.fontSize, 6, 180);
            choice(e.fontFamily, ['serif', 'sans']);
            choice(e.align, ['left', 'center', 'right', 'justify']);
            num(e.fontWeight, 100, 900);
            num(e.lineHeight, 0.8, 3);
            color(e.color);
            color(e.background, true);
            color(e.borderColor);
            num(e.borderWidth, 0, 20);
            bool(e.locked);
            bool(e.hidden);
            if (e.wrapText !== undefined) bool(e.wrapText);
            if (e.wrapGap !== undefined) num(e.wrapGap, 0, 80);
            if (e.allowOverlap !== undefined) bool(e.allowOverlap);
            str(e.alt, 10000);
            str(e.caption, 10000);
            choice(e.fit, ['cover', 'contain']);
            num(e.focalX, 0, 100);
            num(e.focalY, 0, 100);
            if (e.assetId !== undefined)
                id(e.assetId);
            if (e.articleId !== undefined && !articleIds.has(id(e.articleId)))
                fail();
            if (e.articleField !== undefined) {
                choice(e.articleField, ['title', 'summary', 'body']);
                if (e.articleId === undefined)
                    fail();
            }
        }
    }
    // Reconstruct from JSON to eliminate prototypes and detach untrusted caller data.
    return JSON.parse(JSON.stringify(p)) as Project;
}
