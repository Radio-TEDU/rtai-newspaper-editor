import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { model } from '../scripts/lib/project-model.mjs';
import { encode, decode } from '../scripts/lib/issue-package.mjs';
import { demoImage } from '../scripts/lib/media.mjs';

const artifacts = path.resolve('artifacts');
let generated: string;
const saved = (page: any) => expect(page.getByText('Yerel olarak kaydedildi', { exact: true })).toBeVisible();
async function openPackage(page: any, file: string) { await page.locator('input[type=file]').nth(1).setInputFiles(file); await expect(page.getByText('Proje ve bütün görseller açıldı.', { exact: true })).toBeVisible(); }
test.beforeAll(async () => {
    await mkdir(artifacts, { recursive: true });
    generated = path.join(artifacts, 'terminal-' + crypto.randomUUID() + '.rtai.zip');
    await promisify(execFile)(process.execPath, ['scripts/newspaper.mjs', 'demo', '--output', generated]);
});
test.beforeEach(async ({ page }) => { await page.goto('/'); await page.getByRole('button', { name: 'Şablondan gazete oluştur', exact: true }).click(); await saved(page); });

test('terminal paketi düzenlenir, yeniden paketlenir ve dokunulmayan sayfa korunur', async ({ page }) => {
    const original = decode(new Uint8Array(await readFile(generated))).project;
    await openPackage(page, generated);
    await expect(page.locator('.page-item')).toHaveCount(2);
    await expect(page.locator('.editable img')).toHaveCount(1);
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.print-root [data-overflow="true"]')).toHaveCount(0);
    await page.emulateMedia({ media: 'screen' });
    await page.getByRole('button', { name: 'Başlık · Birlikte ürettiğimiz yeni bir gelecek', exact: true }).click();
    await page.getByLabel('Haberden gelen metin').fill('Elle düzenlenen başlık');
    await saved(page);
    const waiting = page.waitForEvent('download'); await page.getByRole('button', { name: 'Paketi indir', exact: true }).click();
    const file = await waiting, output = path.join(artifacts, 'terminal-edited.rtai.zip'); await file.saveAs(output);
    const reopened = decode(new Uint8Array(await readFile(output)));
    expect(reopened.project.pages[1]).toEqual(original.pages[1]);
    expect(reopened.project.articles.find((a: any) => a.id === 'kampus-atolye')?.title).toBe('Elle düzenlenen başlık');
    expect(reopened.media.size).toBe(1);
    await page.reload(); await saved(page);
    await expect(page.locator('.editable')).toContainText('Elle düzenlenen başlık');
});

test('tuval zoom/pan ve panel kontrolü seçimi korur; Ctrl tekerlek tuvali yakınlaştırır', async ({ page }) => {
    await page.getByRole('button', { name: 'Manşet', exact: true }).click();
    const selectedId = await page.locator('.editable .selected').getAttribute('data-element-id');
    const workspace = page.locator('.workspace');
    const beforeWidth = (await workspace.boundingBox())!.width;
    await page.getByRole('button', { name: 'Panelleri gizle' }).click();
    expect((await workspace.boundingBox())!.width).toBeGreaterThan(beforeWidth);
    await expect(page.locator('.left-panel')).not.toBeVisible();
    await page.getByRole('button', { name: 'Panelleri göster' }).click();
    expect(await page.locator('.editable .selected').getAttribute('data-element-id')).toBe(selectedId);
    const initial = await workspace.locator('.paper-size').evaluate((el: HTMLElement) => el.offsetWidth);
    const ctrl = await workspace.evaluate((el: HTMLElement) => { const r = el.getBoundingClientRect(); const event = new WheelEvent('wheel', { ctrlKey: true, deltaY: -100, clientX: r.left + 100, clientY: r.top + 100, bubbles: true, cancelable: true }); el.dispatchEvent(event); return event.defaultPrevented; });
    expect(ctrl).toBe(true);
    await expect.poll(() => workspace.locator('.paper-size').evaluate((el: HTMLElement) => el.offsetWidth)).toBeGreaterThan(initial);
    const zoomed = await workspace.locator('.paper-size').evaluate((el: HTMLElement) => el.offsetWidth);
    const alt = await workspace.evaluate((el: HTMLElement) => { const r = el.getBoundingClientRect(); const event = new WheelEvent('wheel', { altKey: true, deltaY: -100, clientX: r.left + 100, clientY: r.top + 100, bubbles: true, cancelable: true }); el.dispatchEvent(event); return event.defaultPrevented; });
    expect(alt).toBe(true);
    await expect.poll(() => workspace.locator('.paper-size').evaluate((el: HTMLElement) => el.offsetWidth)).toBeGreaterThan(zoomed);
    for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Yakınlaştır', exact: true }).click();
    await workspace.evaluate((el: HTMLElement) => { el.scrollTop = 200; });
    const before = await workspace.evaluate((el: HTMLElement) => el.scrollTop);
    await page.getByRole('button', { name: 'Tuvali sürükleyerek gez' }).click();
    const rect = (await workspace.boundingBox())!;
    await page.mouse.move(rect.x + 90, rect.y + 140); await page.mouse.down();
    await page.mouse.move(rect.x + 90, rect.y + 70, { steps: 5 }); await page.mouse.up();
    expect(await workspace.evaluate((el: HTMLElement) => el.scrollTop)).toBeGreaterThan(before + 50);
    expect(await page.locator('.editable .selected').getAttribute('data-element-id')).toBe(selectedId);
    await page.getByRole('button', { name: 'Tuvali sürükleyerek gez' }).click();
    const scroll = await workspace.evaluate((el: HTMLElement) => el.scrollTop);
    await page.getByRole('button', { name: 'Okuma önizlemesi', exact: true }).click();
    await page.getByRole('button', { name: 'Editöre dön' }).click();
    await expect.poll(() => workspace.evaluate((el: HTMLElement) => el.scrollTop)).toBeCloseTo(scroll, 0);
});

test('güvenli sayfada yeni öğeler örtüşmez; taşan metin PDF hazırlığını durdurur', async ({ page }) => {
    await page.getByRole('button', { name: 'Boş sayı', exact: true }).click();
    await page.getByRole('button', { name: 'Gövde yazısı', exact: true }).click();
    await page.getByRole('button', { name: 'Öğeyi çoğalt', exact: true }).click();
    const boxes = await page.locator('.editable .design-element').evaluateAll(nodes => nodes.map(el => ({ x: parseFloat((el as HTMLElement).style.left), y: parseFloat((el as HTMLElement).style.top), w: parseFloat((el as HTMLElement).style.width), h: parseFloat((el as HTMLElement).style.height) })));
    expect(boxes).toHaveLength(2);
    expect(boxes[0].x + boxes[0].w <= boxes[1].x || boxes[1].x + boxes[1].w <= boxes[0].x || boxes[0].y + boxes[0].h <= boxes[1].y || boxes[1].y + boxes[1].h <= boxes[0].y).toBe(true);
    await page.getByRole('textbox', { name: 'Metin', exact: true }).fill('Bu metin uzun bir taslak olarak korunmalıdır. '.repeat(100));
    await expect(page.locator('.editable .selected .element-text')).toHaveAttribute('data-overflow', 'true');
    await page.evaluate(() => { (window as any).__printed = false; window.print = () => { (window as any).__printed = true; }; });
    await page.getByRole('button', { name: 'PDF / Yazdır', exact: true }).click();
    await expect(page.getByText(/metin kutusunda taşma var/)).toBeVisible();
    expect(await page.evaluate(() => (window as any).__printed)).toBe(false);
    await expect(page.getByRole('textbox', { name: 'Metin', exact: true })).toHaveValue('Bu metin uzun bir taslak olarak korunmalıdır. '.repeat(100));
});

test('görsel çevresinde sarma ve kapatma; geri alma ve baskı aynı yerleşimi kullanır', async ({ page }) => {
    const project = model.makeProject(false), pg = project.pages[0];
    pg.elements = [model.makeElement('body', { id: 'flow-body', name: 'Akış metni', x: 60, y: 100, width: 600, height: 900, fontSize: 23, text: 'Gazete metni, görselin çevresinden düzenli biçimde akmalıdır. '.repeat(18) }), model.makeElement('image', { id: 'flow-image', name: 'Akış görseli', assetId: 'flow-photo', x: 60, y: 110, width: 240, height: 300, wrapText: true })];
    const file = path.join(artifacts, 'flow.rtai.zip'); await writeFile(file, encode(project, new Map([['flow-photo', demoImage()]])));
    await openPackage(page, file);
    const lines = page.locator('.editable .flow-line'); await expect(lines.first()).toBeVisible();
    expect(await lines.first().evaluate((el: HTMLElement) => parseFloat(el.style.left))).toBe(252);
    const overlap = await page.locator('.editable').evaluate(root => {
        const image = root.querySelector('[data-element-id="flow-image"]')!.getBoundingClientRect();
        return [...root.querySelectorAll('.flow-line')].some(line => { const r = line.getBoundingClientRect(); return r.left < image.right && r.right > image.left && r.top < image.bottom && r.bottom > image.top; });
    });
    expect(overlap).toBe(false);
    await page.pdf({ path: path.join(artifacts, 'wrapped-a3.pdf'), preferCSSPageSize: true, printBackground: true });
    await page.getByRole('button', { name: 'Akış görseli', exact: true }).click();
    await page.getByLabel('Metin görselin çevresinden aksın').uncheck();
    expect(Number(await page.getByLabel('Y', { exact: true }).inputValue())).toBeGreaterThanOrEqual(1000);
    await expect(page.locator('.editable .flow-line')).toHaveCount(0);
    await page.getByRole('button', { name: 'Geri al', exact: true }).click();
    await expect(page.getByLabel('Metin görselin çevresinden aksın')).toBeChecked();
    await expect(lines.first()).toBeVisible();
    await saved(page); await page.reload(); await saved(page);
    await expect(page.locator('.editable .flow-line').first()).toBeVisible();
    await page.screenshot({ path: path.join(artifacts, 'wrapped-editor.png'), fullPage: true });
});

test('kaynak bağlantısız yeni taslak açılır; haber tıklaması yenilemez veya konumu sıfırlamaz', async ({ page }) => {
    await page.getByRole('tab', { name: 'Haber', exact: true }).click();
    await page.getByRole('button', { name: 'Haber ekle', exact: true }).click();
    await page.getByLabel('Haber başlığı', { exact: true }).fill('Yeni bağımsız taslak');
    await page.getByRole('textbox', { name: 'Haberin tamamı', exact: true }).fill('Kaydedilmeyi beklemeden okunabilen metin.');
    await page.evaluate(() => { (window as any).__draftMarker = 'korundu'; });
    await page.getByRole('button', { name: 'Okuma önizlemesi', exact: true }).click();
    const link = page.locator('.article-index a').last(); await link.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    await link.click();
    await expect(page.getByRole('dialog')).toContainText('Kaydedilmeyi beklemeden okunabilen metin.');
    expect(await page.evaluate(() => (window as any).__draftMarker)).toBe('korundu');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(before, 0);
    await page.getByRole('button', { name: 'Editöre dön' }).click();
    await expect(page.getByLabel('Haber başlığı', { exact: true })).toHaveValue('Yeni bağımsız taslak');
});

test('akıllı çizgiler yalnızca sürüklerken görünür ve bırakınca kalkar', async ({ page }) => {
    const project = model.makeProject(false);
    project.pages[0].elements = [model.makeElement('headline', { name: 'Sol haber', x: 60, y: 100, width: 300, height: 120, fontSize: 24, text: 'Sol başlık' }), model.makeElement('headline', { name: 'Sağ haber', x: 460, y: 101, width: 300, height: 120, fontSize: 24, text: 'Sağ başlık' })];
    const file = path.join(artifacts, 'guides.rtai.zip'); await writeFile(file, encode(project, new Map()));
    await openPackage(page, file);
    const target = page.getByRole('button', { name: 'Sağ haber', exact: true }), box = (await target.boundingBox())!;
    const scale = await page.locator('.workspace .paper-size').evaluate((el: HTMLElement) => el.offsetWidth / 1000);
    await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down();
    await page.mouse.move(box.x + 20 + 12 * scale, box.y + 20 - scale, { steps: 4 });
    await expect(page.locator('.editable .smart-guide.y')).toBeVisible();
    await page.screenshot({ path: path.join(artifacts, 'smart-guides.png'), fullPage: true });
    await page.mouse.up();
    await expect(page.locator('.smart-guide')).toHaveCount(0);
    await expect(page.getByLabel('Y', { exact: true })).toHaveValue('100');
});
