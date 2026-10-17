import { test, expect } from '@playwright/test';
import { model, html } from '../scripts/lib/project-model.mjs';
import { demoImage } from '../scripts/lib/media.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
const artifacts = path.resolve('artifacts');
const saved = (page: any) => expect(page.getByText('Yerel olarak kaydedildi', { exact: true })).toBeVisible();
async function home(page: any) { await page.getByRole('button', { name: 'Çalışmalar', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Çalışmalar', exact: true })).toBeVisible(); }
async function addHtml(page: any, p: any, data = Buffer.from(demoImage()).toString('base64'), extra = '') {
    const source = html.buildEditableHtml(p, p.pages[0].elements.some((e: any) => e.assetId) ? [{ id: 'shared-photo', type: 'image/png', data }] : []) + extra;
    await page.getByLabel('Gazete dosyası').setInputFiles({ name: 'gazete.html', mimeType: 'text/html', buffer: Buffer.from(source) });
    await expect(page.getByText('Proje ve bütün görseller açıldı.', { exact: true })).toBeVisible(); return source;
}
function pictureProject(name: string) { const p = model.makeProject(false); p.name = name; p.pages[0].elements = [model.makeElement('image', { name: 'Ortak görsel', assetId: 'shared-photo', x: 40, y: 250, width: 500, height: 300 })]; return p; }
test.beforeEach(async ({ page }) => { await mkdir(artifacts, { recursive: true }); await page.goto('/'); await expect(page.getByRole('heading', { name: 'Çalışmalar', exact: true })).toBeVisible(); });

test('çalışmalar oluşturma, hemen çıkışta kaydetme, açma, arama ve silme', async ({ page }) => {
    await expect(page.locator('.work-card')).toHaveCount(0);
    await page.getByRole('button', { name: 'Yeni gazete oluştur', exact: true }).click();
    await page.getByRole('textbox', { name: 'Gazete adı', exact: true }).fill('Birinci gazetem');
    await page.getByRole('button', { name: 'Başlık', exact: true }).click();
    await page.getByRole('textbox', { name: 'Metin', exact: true }).fill('Kaybolmayan başlık');
    await home(page); await expect(page.locator('.work-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Şablondan gazete oluştur', exact: true }).click();
    await page.getByRole('textbox', { name: 'Gazete adı', exact: true }).fill('İkinci gazetem'); await home(page);
    await expect(page.locator('.work-card')).toHaveCount(2); await page.reload();
    await expect(page.locator('.work-card')).toHaveCount(2);
    await page.screenshot({ path: path.join(artifacts, 'workspace-home.png'), fullPage: true });
    await page.getByLabel('Çalışmalarda ara').fill('Birinci'); await expect(page.locator('.work-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Düzenle · Birinci gazetem', exact: true }).click();
    await expect(page.locator('.editable')).toContainText('Kaybolmayan başlık'); await home(page);
    page.once('dialog', dialog => dialog.accept('Yeni gazete adı'));
    await page.getByRole('button', { name: 'Adını değiştir · Birinci gazetem', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Yeni gazete adı', exact: true })).toBeVisible();
    page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Sil · İkinci gazetem', exact: true }).click();
    await expect(page.locator('.work-card')).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot({ path: path.join(artifacts, 'workspace-mobile.png'), fullPage: true });
});

test('aynı görsel ve proje kimlikli iki HTML birbirinin medyasını değiştirmez', async ({ page }) => {
    const p = pictureProject('Birinci HTML'), data = Buffer.from(demoImage()).toString('base64');
    await addHtml(page, p, data); await saved(page); await home(page);
    const second = structuredClone(p); second.name = 'İkinci HTML';
    const other = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 60; c.height = 40; c.getContext('2d')!.fillRect(0, 0, 60, 40); return c.toDataURL('image/png').split(',')[1]; });
    await addHtml(page, second, other); await saved(page); await home(page); await expect(page.locator('.work-card')).toHaveCount(2);
    const sourceIds = await page.locator('.work-card').evaluateAll(cards => cards.map(c => c.getAttribute('data-project-id')));
    expect(new Set(sourceIds).size).toBe(2);
    for (const [name, expected] of [['Birinci HTML', data], ['İkinci HTML', other]]) {
        await page.getByRole('button', { name: 'Düzenle · ' + name, exact: true }).click();
        const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'HTML indir', exact: true }).click();
        const file = path.join(artifacts, 'namespace-' + name + '.html'); await (await pending).saveAs(file);
        expect(html.extractEditableHtml(await readFile(file, 'utf8')).assets[0].data).toBe(expected); await home(page);
    }
    page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Sil · Birinci HTML', exact: true }).click();
    await page.getByRole('button', { name: 'Düzenle · İkinci HTML', exact: true }).click(); await expect(page.locator('.editable img')).toBeVisible();
});

test('eski tek proje ve görseli kayıpsız yerel çalışma alanına geçer', async ({ page }) => {
    await page.context().clearCookies();
    await page.route('**/migration-setup', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Setup</body></html>' }));
    await page.goto('/migration-setup');
    await page.evaluate(() => new Promise<void>((resolve, reject) => { const req = indexedDB.deleteDatabase('rtai-newspaper-editor'); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }));
    const p = pictureProject('Eski çalışma'), bytes = [...demoImage()];
    await page.evaluate(({ p, bytes }) => new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('rtai-newspaper-editor', 1); req.onupgradeneeded = () => { req.result.createObjectStore('projects'); req.result.createObjectStore('media'); };
        req.onsuccess = () => { const db = req.result, tx = db.transaction(['projects', 'media'], 'readwrite'); tx.objectStore('projects').put(p, 'current'); tx.objectStore('media').put(new Blob([new Uint8Array(bytes)], { type: 'image/png' }), 'shared-photo'); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); }; req.onerror = () => reject(req.error);
    }), { p, bytes });
    await page.goto('/'); await expect(page.locator('.work-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Düzenle · Eski çalışma', exact: true }).click();
    await expect(page.locator('.editable img')).toBeVisible();
    const keys = await page.evaluate(() => new Promise<any[]>((resolve, reject) => { const r = indexedDB.open('rtai-newspaper-editor'); r.onsuccess = () => { const q = r.result.transaction('media').objectStore('media').getAllKeys(); q.onsuccess = () => { r.result.close(); resolve(q.result); }; }; r.onerror = () => reject(r.error); }));
    expect(keys).toContain(p.id + ':shared-photo'); expect(keys).not.toContain('shared-photo');
});

test('HTML içe aktarma kaynak HTML betiğini çalıştırmaz; sıradan HTML reddedilir', async ({ page }) => {
    const p = model.makeProject(false); p.name = 'Güvenli veri';
    await addHtml(page, p, '', '<script>window.unsafeImport=true</script><img src="https://invalid.example/not-loaded">');
    expect(await page.evaluate(() => (window as any).unsafeImport)).toBeUndefined(); await home(page);
    await page.getByLabel('Gazete dosyası').setInputFiles({ name: 'old.html', mimeType: 'text/html', buffer: Buffer.from('<h1>Unstructured HTML</h1><script>window.unsafeImport=true</script>') });
    await expect(page.getByRole('alert')).toContainText('düzenleme verisi taşımıyor');
    await expect(page.locator('.work-card')).toHaveCount(1); expect(await page.evaluate(() => (window as any).unsafeImport)).toBeUndefined();
});

test('tekerlek yalnızca gazete üzerinde zoom yapar; ayar korunur, Ctrl tekerlek zoom yapar', async ({ page }) => {
    await page.getByRole('button', { name: 'Şablondan gazete oluştur', exact: true }).click(); await saved(page);
    const paper = page.locator('.editable'), size = page.locator('.workspace .paper-size');
    const width = await size.evaluate((el: HTMLElement) => el.offsetWidth);
    const box = (await paper.boundingBox())!; await page.mouse.move(box.x + 200, box.y + 150); await page.mouse.wheel(0, -100);
    await expect.poll(() => size.evaluate((el: HTMLElement) => el.offsetWidth)).toBeGreaterThan(width);
    const ctrl = await paper.evaluate(el => { const e = new WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented; }); expect(ctrl).toBe(true);
    await page.getByLabel('Tekerlekle zoom').uncheck();
    const after = await size.evaluate((el: HTMLElement) => el.offsetWidth);
    const normal = await paper.evaluate(el => { const e = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented; }); expect(normal).toBe(false);
    expect(await size.evaluate((el: HTMLElement) => el.offsetWidth)).toBe(after);
    await page.reload(); await saved(page); await expect(page.getByLabel('Tekerlekle zoom')).not.toBeChecked();
});

test('bağımsız skill HTML’i çevrimdışı okunur; editör HTML çıktısı da çalışır', async ({ page }) => {
    const input = path.join(artifacts, 'independent-' + crypto.randomUUID() + '.html');
    await promisify(execFile)(process.execPath, ['skills/rtai-newspaper/scripts/newspaper.mjs', 'demo', '--output', input]);
    const filePage = await page.context().newPage(), errors: string[] = []; filePage.on('pageerror', e => errors.push(e.message));
    await page.context().setOffline(true); await filePage.goto(pathToFileURL(input).href);
    await expect(filePage.locator('#status')).toContainText('Düzenlenebilir gazete'); await expect(filePage.locator('.sheet-box')).toHaveCount(1);
    await expect.poll(() => filePage.locator('img').first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(640);
    await filePage.locator('nav a').first().click(); await expect(filePage.getByRole('dialog')).toBeVisible(); await filePage.keyboard.press('Escape');
    await filePage.pdf({ path: path.join(artifacts, 'independent-html.pdf'), preferCSSPageSize: true, printBackground: true });
    await page.context().setOffline(false); await filePage.close();
    const editable = html.extractEditableHtml(await readFile(input, 'utf8'));
    const a = editable.project.articles[0];
    a.body = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(14);
    editable.project.pages[0].elements = [model.makeElement('headline', { name: 'Manşet', articleId: a.id, articleField: 'title', x: 50, y: 60, width: 650, height: 130, fontSize: 35 }), model.makeElement('body', { name: 'Akış metni', articleId: a.id, articleField: 'body', x: 50, y: 220, width: 600, height: 900, fontSize: 20 }), model.makeElement('image', { name: 'Akış görseli', assetId: editable.assets[0].id, x: 50, y: 230, width: 220, height: 280, wrapText: true })];
    const flowInput = input + '.flow.html'; await writeFile(flowInput, html.buildEditableHtml(editable.project, editable.assets));
    await page.getByLabel('Gazete dosyası').setInputFiles(flowInput); await saved(page);
    await page.getByRole('button', { name: 'Manşet', exact: true }).click(); await page.getByLabel('Haberden gelen metin').fill('HTML üzerinden yeni başlık');
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'HTML indir', exact: true }).click();
    const output = path.join(artifacts, 'edited-independent.html'); await (await pending).saveAs(output);
    const result = html.extractEditableHtml(await readFile(output, 'utf8')); expect(result.project.articles[0].title).toBe('HTML üzerinden yeni başlık');
    const exportedPage = await page.context().newPage(); exportedPage.on('pageerror', e => errors.push(e.message));
    await page.context().setOffline(true); await exportedPage.goto(pathToFileURL(output).href);
    await expect(exportedPage.locator('#status')).toContainText('Düzenlenebilir gazete'); await expect(exportedPage.locator('main')).toContainText('HTML üzerinden yeni başlık');
    expect(await exportedPage.locator('.text-content > span').count()).toBeGreaterThan(5);
    expect(await exportedPage.evaluate(() => { const image = document.querySelector('img')!.getBoundingClientRect(); return [...document.querySelectorAll('.text-content > span')].some(line => { const r = line.getBoundingClientRect(); return r.left < image.right && r.right > image.left && r.top < image.bottom && r.bottom > image.top; }); })).toBe(false);
    expect(errors).toEqual([]);
    await page.context().setOffline(false); await exportedPage.close();
});

test('statik derleme alt yolda iframe içinde çalışır ve yerel gazeteyi saklar', async ({ page }) => {
    const root = path.resolve('dist');
    const server = createServer(async (req, res) => {
        if (req.url === '/') { res.setHeader('Content-Type', 'text/html;charset=utf-8'); res.end('<iframe title="Gazete Atölyesi" src="/gazete/" style="width:100%;height:950px;border:0"></iframe>'); return; }
        const pathname = new URL(req.url!, 'http://localhost').pathname;
        const file = path.resolve(root, pathname.replace(/^\/gazete\//, '') || 'index.html');
        if (!pathname.startsWith('/gazete/') || !file.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
        try { const data = await readFile(file); res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); res.end(data); } catch { res.writeHead(404).end(); }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as any;
    try {
        await page.goto('http://127.0.0.1:' + address.port);
        const frame = page.frameLocator('iframe[title="Gazete Atölyesi"]');
        await expect(frame.getByRole('heading', { name: 'Çalışmalar', exact: true })).toBeVisible();
        await frame.getByRole('button', { name: 'Yeni gazete oluştur', exact: true }).click();
        await frame.getByRole('textbox', { name: 'Gazete adı', exact: true }).fill('Gömülü çalışma');
        await frame.getByRole('button', { name: 'Çalışmalar', exact: true }).click();
        await expect(frame.locator('.work-card')).toHaveCount(1); await page.reload();
        await expect(frame.getByRole('heading', { name: 'Gömülü çalışma', exact: true })).toBeVisible();
    } finally { await page.goto('/'); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('bozuk görsel HTML okuyucusunda bildirilir ve çalışma alanına alınmaz', async ({ page }) => {
    const p = pictureProject('Bozuk görsel'), data = Buffer.from(demoImage().slice(0, 33)).toString('base64');
    const source = html.buildEditableHtml(p, [{ id: 'shared-photo', type: 'image/png', data }]);
    const file = path.join(artifacts, 'broken-image.html'); await writeFile(file, source);
    const reader = await page.context().newPage(); await reader.goto(pathToFileURL(file).href);
    await expect(reader.locator('#status')).toContainText('görseller okunamadı'); await expect(reader.locator('#print')).toBeDisabled(); await reader.close();
    await page.getByLabel('Gazete dosyası').setInputFiles(file);
    await expect(page.getByRole('alert')).toContainText('Görsel okunamadı'); await expect(page.locator('.work-card')).toHaveCount(0);
});

test('touchpad iki parmakla kaydırır, sıkıştırınca zoom yapar; dokunmatikte iki parmak zoom ve tek parmak kaydırma', async ({ page }) => {
    await page.getByRole('button', { name: 'Şablondan gazete oluştur', exact: true }).click(); await saved(page);
    const workspace = page.locator('.workspace'), paper = page.locator('.editable'), size = page.locator('.workspace .paper-size'), label = page.locator('.zoom-controls > span');
    const width = () => size.evaluate((el: HTMLElement) => el.offsetWidth);
    const start = await width(), startLabel = await label.textContent();
    // Touchpad iki parmak kaydırması (yatay bileşenli ya da küçük, kesirli değerler) zoom yapmaz, tarayıcının kaydırmasına bırakılır.
    const swipe = await paper.evaluate(el => { const r = el.getBoundingClientRect(); return [{ deltaX: 12, deltaY: 4 }, { deltaY: 3.5 }].map(d => { const e = new WheelEvent('wheel', { ...d, clientX: r.left + 100, clientY: r.top + 100, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented; }); });
    expect(swipe).toEqual([false, false]);
    await page.waitForTimeout(300); expect(await width()).toBe(start);
    // Touchpad sıkıştırması (Ctrl + küçük tekerlek adımları) işaretçi merkezli zoom yapar ve sonunda zoom değerine işlenir.
    const pinch = await paper.evaluate(async el => { const r = el.getBoundingClientRect(); let prevented = 0; for (let i = 0; i < 12; i++) { const e = new WheelEvent('wheel', { ctrlKey: true, deltaY: -4.5, clientX: r.left + 150, clientY: r.top + 150, bubbles: true, cancelable: true }); el.dispatchEvent(e); if (e.defaultPrevented) prevented++; await new Promise(f => requestAnimationFrame(() => f(null))); } return prevented; });
    expect(pinch).toBe(12);
    await expect.poll(width).toBeGreaterThan(start);
    await expect(label).not.toHaveText(startLabel!);
    // Dokunmatik: iki parmak açılınca yakınlaşır.
    const touch = (type: string, id: number, x: number, y: number) => workspace.evaluate((el: HTMLElement, a) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(a.type, { pointerId: a.id, pointerType: 'touch', isPrimary: a.id === 11, clientX: r.left + a.x, clientY: r.top + a.y, bubbles: true, cancelable: true })); }, { type, id, x, y });
    await page.getByRole('button', { name: 'Sığdır' }).click(); await expect.poll(width).toBeLessThan(1000);
    const beforeTouch = await width();
    await touch('pointerdown', 11, 20, 200); await touch('pointerdown', 12, 60, 200);
    for (let i = 1; i <= 6; i++) { await touch('pointermove', 11, 20 - i * 3, 200); await touch('pointermove', 12, 60 + i * 12, 200); }
    await touch('pointerup', 11, 2, 200); await touch('pointerup', 12, 132, 200);
    await expect.poll(width).toBeGreaterThan(beforeTouch * 1.5);
    // Dokunmatik: boşlukta tek parmakla sürükleme tuvali kaydırır, seçimi bozmaz.
    const top = await workspace.evaluate((el: HTMLElement) => el.scrollTop);
    await touch('pointerdown', 21, 20, 300);
    for (let i = 1; i <= 5; i++) await touch('pointermove', 21, 20, 300 - i * 30);
    await touch('pointerup', 21, 20, 150);
    expect(await workspace.evaluate((el: HTMLElement) => el.scrollTop)).toBeGreaterThan(top + 100);
    // Seçili olmayan öğenin üzerinde tek parmak tuvali kaydırır, öğeyi taşımaz.
    await page.locator('.editable .selected').count() && await page.keyboard.press('Escape');
    const element = page.locator('.editable .design-element:not(.selected):not(.locked)').first();
    const id = await element.getAttribute('data-element-id'); const style = await element.getAttribute('style');
    const at = (await element.boundingBox())!; const drag = (type: string, dy: number) => element.evaluate((el: HTMLElement, a) => { el.dispatchEvent(new PointerEvent(a.type, { pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: a.x, clientY: a.y, bubbles: true, cancelable: true })); }, { type, x: at.x + 10, y: at.y + 10 + dy });
    const scrolled = await workspace.evaluate((el: HTMLElement) => el.scrollTop);
    await drag('pointerdown', 0); for (let i = 1; i <= 4; i++) await drag('pointermove', -i * 25); await drag('pointerup', -100);
    expect(await workspace.evaluate((el: HTMLElement) => el.scrollTop)).not.toBe(scrolled);
    expect(await page.locator(`.editable [data-element-id="${id}"]`).getAttribute('style')).toBe(style);
});

test('zoom hassasiyeti fare ve touchpad için ayrı ayarlanır ve saklanır', async ({ page }) => {
    await page.getByRole('button', { name: 'Şablondan gazete oluştur', exact: true }).click(); await saved(page);
    const paper = page.locator('.editable'), size = page.locator('.workspace .paper-size');
    const width = () => size.evaluate((el: HTMLElement) => el.offsetWidth);
    // Bir tekerlek tıkı ve bir sıkıştırma adımının büyütme oranını ölçer; her ölçümden önce ekrana sığdırır.
    const ratio = async (init: WheelEventInit) => {
        await page.getByRole('button', { name: 'Sığdır' }).click(); await page.waitForTimeout(250);
        const before = await width();
        await paper.evaluate((el, i) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new WheelEvent('wheel', { ...i, clientX: r.left + 100, clientY: r.top + 100, bubbles: true, cancelable: true })); }, init);
        await expect.poll(width).not.toBe(before);
        return (await width()) / before;
    };
    const mouse = { deltaY: -100 }, pinch = { ctrlKey: true, deltaY: -4.5 };
    const mouseDefault = await ratio(mouse), pinchDefault = await ratio(pinch);
    await page.getByRole('button', { name: 'Zoom hassasiyeti' }).click();
    await page.getByLabel('Fare tekerleği hassasiyeti').fill('3');
    await expect(page.locator('.zoom-sensitivity-field output').first()).toHaveText('3×');
    await page.keyboard.press('Escape'); await expect(page.locator('.zoom-settings-panel')).toHaveCount(0);
    expect(Math.log(await ratio(mouse))).toBeCloseTo(Math.log(mouseDefault) * 3, 1);
    expect(Math.log(await ratio(pinch))).toBeCloseTo(Math.log(pinchDefault), 1);
    await page.reload(); await saved(page);
    await page.getByRole('button', { name: 'Zoom hassasiyeti' }).click();
    await expect(page.getByLabel('Fare tekerleği hassasiyeti')).toHaveValue('3');
    await page.getByLabel('Touchpad hassasiyeti').fill('0.5');
    await page.keyboard.press('Escape');
    expect(Math.log(await ratio(pinch))).toBeCloseTo(Math.log(pinchDefault) * 0.5, 1);
    // Tam sayı ama küçük sıkıştırma adımı da (eski wheelDeltaY'si ne olursa olsun) touchpad hızını kullanır: 12 × 0,025 × 0,5.
    expect(Math.log(await ratio({ ctrlKey: true, deltaY: -12 }))).toBeCloseTo(0.15, 1);
    await page.getByRole('button', { name: 'Zoom hassasiyeti' }).click();
    await page.getByRole('button', { name: 'Varsayılana dön' }).click();
    await expect(page.getByLabel('Fare tekerleği hassasiyeti')).toHaveValue('1');
    await expect(page.getByLabel('Touchpad hassasiyeti')).toHaveValue('1');
});
