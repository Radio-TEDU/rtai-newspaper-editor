import { test, expect } from 'vitest';
import { makeProject, makeElement } from './model';
import { buildEditableHtml, extractEditableHtml } from './html-document';
test('HTML retains editable geometry, articles and shared images exactly once', () => {
    const p = makeProject(false); p.pages[0].elements = [makeElement('image', { assetId: 'photo' }), makeElement('image', { assetId: 'photo' })];
    const data = 'aGVsbG9waG90bw=='; const assets = [{ id: 'photo', type: 'image/png', data }];
    const html = buildEditableHtml(p, assets), doc = extractEditableHtml(html);
    expect(doc.project).toEqual(p); expect(doc.assets).toEqual(assets); expect(html.split(data)).toHaveLength(2);
});
test('HTML treats user text as text and requires its versioned editing envelope', () => {
    const p = makeProject(false); p.name = '</script><script>window.compromised=true</script>';
    p.pages[0].elements = [makeElement('headline', { text: p.name })];
    const html = buildEditableHtml(p, []);
    expect(html).not.toContain('<script>window.compromised'); expect(extractEditableHtml(html).project.name).toBe(p.name);
    expect(() => extractEditableHtml('<h1>Ordinary HTML</h1><script>alert(1)</script>')).toThrow('düzenleme verisi');
    expect(() => extractEditableHtml(html.replace('"format":"rtai-editable-html","version":1', '"format":"rtai-editable-html","version":2'))).toThrow();
});
