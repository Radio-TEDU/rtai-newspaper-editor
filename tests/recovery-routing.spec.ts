import { test, expect } from '@playwright/test';
import { model, html } from '../scripts/lib/project-model.mjs';
import { demoImage } from '../scripts/lib/media.mjs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const artifacts = path.resolve('artifacts');
async function add(page: any, project: any) {
    await page.getByLabel('Gazete dosyası').setInputFiles({ name: 'gazete.html', mimeType: 'text/html', buffer: Buffer.from(html.buildEditableHtml(project, [])) });
    await expect(page.getByText('Yerel olarak kaydedildi', { exact: true })).toBeVisible();
    return new URL(page.url()).hash.slice('#duzenle/'.length);
}
async function home(page: any) { await page.getByRole('button', { name: 'Çalışmalar', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Çalışmalar', exact: true })).toBeVisible(); }
test.beforeEach(async ({ page }) => { await mkdir(artifacts, { recursive: true }); await page.goto('/'); await expect(page.getByRole('heading', { name: 'Çalışmalar', exact: true })).toBeVisible(); });

test('haber adresi aktif gazete değişse de doğru kopyayı açar; okuma ve geçmiş korunur', async ({ page }) => {
    const a = model.makeProject(); a.name = 'Gazete A'; a.articles[0].title = 'A sürümü'; a.pages.push(model.makePage());
    const aId = await add(page, a);
    await page.getByRole('button', { name: 'Okuma önizlemesi', exact: true }).click();
    await page.locator('.article-index a').first().click();
    const link = page.url(); expect(link).toContain('#haber/' + aId + '/' + a.articles[0].id);
    await page.getByRole('button', { name: 'Haberi kapat' }).click(); await page.getByRole('button', { name: 'Editöre dön' }).click(); await home(page);
    const b = structuredClone(a); b.name = 'Gazete B'; b.articles[0].title = 'B sürümü'; await add(page, b);
    await page.goto(link); await expect(page.getByRole('dialog')).toContainText('A sürümü'); await expect(page.getByRole('dialog')).not.toContainText('B sürümü');
    await page.keyboard.press('Escape'); await expect(page).toHaveURL(new RegExp('#okuma/' + aId + '$'));
    await page.reload(); await expect(page.getByRole('button', { name: 'Editöre dön' })).toBeVisible();
    await page.getByRole('link', { name: '02 · Yeni sayfa', exact: true }).click(); await expect(page).toHaveURL(new RegExp('#okuma/' + aId + '/sayfa/'));
    await page.reload(); await expect(page.locator('.reader-page').last()).toBeInViewport();
    await page.getByRole('button', { name: 'Editöre dön' }).click(); await expect(page.locator('.editable')).toBeVisible();
    await page.goBack(); await expect(page.getByRole('button', { name: 'Editöre dön' })).toBeVisible();
    await page.screenshot({ path: path.join(artifacts, 'scoped-reader.png'), fullPage: true });
});

test('eski haber adresi yalnız tek eşleşmede taşınır; belirsiz veya eksik gazete seçilmez', async ({ page }) => {
    const p = model.makeProject(); p.name = 'Eski bağlantı A'; const id = await add(page, p);
    await page.goto('/#haber/' + p.articles[0].id); await expect(page.getByRole('dialog')).toBeVisible(); await expect(page).toHaveURL(new RegExp('#haber/' + id + '/'));
    await page.getByRole('button', { name: 'Haberi kapat' }).click(); await page.getByRole('button', { name: 'Editöre dön' }).click(); await home(page);
    const copy = structuredClone(p); copy.name = 'Eski bağlantı B'; await add(page, copy);
    await page.goto('/#haber/' + p.articles[0].id);
    await expect(page.getByText(/Bu eski haber bağlantısı birden fazla gazeteye ait/)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Gazete adı', exact: true })).toHaveValue('Eski bağlantı B');
    await home(page);
    await page.goto('/#haber/' + p.articles[0].id); await expect(page.getByRole('alert')).toContainText('birden fazla gazeteye ait'); await expect(page.locator('.work-card')).toHaveCount(2);
    await expect(page.getByLabel('Gazete dosyası')).toBeEnabled();
    await page.goto('/#haber/missing-project/' + p.articles[0].id); await expect(page.getByRole('alert')).toContainText('Başka bir gazete açılmadı'); await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('bozuk HTML sonrasında doğru dosya yeniden dene gerektirmeden eklenir', async ({ page }) => {
    await page.getByLabel('Gazete dosyası').setInputFiles({ name: 'bad.html', mimeType: 'text/html', buffer: Buffer.from('<h1>ordinary HTML</h1>') });
    await expect(page.getByRole('alert')).toContainText('düzenleme verisi taşımıyor');
    await expect(page.getByLabel('Gazete dosyası')).toBeEnabled(); await expect(page.getByRole('button', { name: 'Yeni gazete oluştur', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Kaydetmeden gazete oluştur' })).not.toBeVisible();
    const p = model.makeProject(false); p.name = 'Geçerli dosya'; await add(page, p);
    await expect(page.getByRole('textbox', { name: 'Gazete adı', exact: true })).toHaveValue('Geçerli dosya');
});

test('kota hatasında güncel medya yedeklenir; çıkış onayı ve eski kayıt korunur', async ({ page }) => {
    await page.getByRole('button', { name: 'Yeni gazete oluştur', exact: true }).click(); await expect(page.getByText('Yerel olarak kaydedildi', { exact: true })).toBeVisible();
    await page.evaluate(() => { const put = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args: any[]) { if (this.name === 'media') throw new DOMException('test quota', 'QuotaExceededError'); return put.apply(this, args as any); }; });
    await page.locator('input[type=file]').first().setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(demoImage()) });
    await expect(page.getByText('Kayıt yapılamadı', { exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Çalışmalar', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Çalışmanı yedekle ve çık' }); await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Yedeğimle Çalışmalar’a dön', exact: true })).toBeDisabled();
    await page.evaluate(() => { (window as any).__arrayBuffer = Blob.prototype.arrayBuffer; Blob.prototype.arrayBuffer = () => Promise.reject(new Error('test export failure')); });
    await dialog.getByRole('button', { name: 'HTML yedeği indir' }).click(); await expect(page.getByText('test export failure', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('checkbox', { name: 'Yedek dosyasını kaydettim' })).toBeDisabled();
    await page.evaluate(() => { Blob.prototype.arrayBuffer = (window as any).__arrayBuffer; });
    const pending = page.waitForEvent('download'); await dialog.getByRole('button', { name: 'HTML yedeği indir' }).click();
    const file = path.join(artifacts, 'recovery-current.html'); await (await pending).saveAs(file);
    const doc = html.extractEditableHtml(await readFile(file, 'utf8')); expect(doc.assets).toHaveLength(1); expect(doc.assets[0].data).toBe(Buffer.from(demoImage()).toString('base64'));
    await expect(dialog.getByRole('button', { name: 'Yedeğimle Çalışmalar’a dön', exact: true })).toBeDisabled();
    await dialog.getByRole('checkbox', { name: 'Yedek dosyasını kaydettim' }).check();
    await page.screenshot({ path: path.join(artifacts, 'save-recovery.png'), fullPage: true });
    await dialog.getByRole('button', { name: 'Düzenlemeye dön' }).click(); await expect(page.locator('.editable img')).toBeVisible();
    await page.getByRole('textbox', { name: 'Gazete adı', exact: true }).fill('Yeni revizyon');
    await page.getByRole('button', { name: 'Yedekle ve çık', exact: true }).click(); await expect(dialog.getByRole('checkbox', { name: 'Yedek dosyasını kaydettim' })).toBeDisabled();
    const fresh = page.waitForEvent('download'); await dialog.getByRole('button', { name: 'ZIP yedeği indir' }).click(); await (await fresh).saveAs(path.join(artifacts, 'recovery-fresh.rtai.zip'));
    await dialog.getByRole('checkbox', { name: 'Yedek dosyasını kaydettim' }).check(); await dialog.getByRole('button', { name: 'Yedeğimle Çalışmalar’a dön', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Çalışmalar', exact: true })).toBeVisible(); await expect(page.locator('.work-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Düzenle · Haftalık · İlk sayı', exact: true }).click(); await expect(page.locator('.editable img')).toHaveCount(0);
});

test('yerel kayıt kapalıysa yedek alıp geçici çalışmadan çıkılabilir', async ({ page }) => {
    await page.addInitScript(() => { indexedDB.open = () => { throw new DOMException('test blocked storage', 'SecurityError'); }; }); await page.reload();
    await expect(page.getByRole('button', { name: 'Kaydetmeden gazete oluştur' })).toBeVisible(); await page.getByRole('button', { name: 'Kaydetmeden gazete oluştur' }).click();
    await expect(page.getByText('Yerel kayıt kapalı', { exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Yedekle ve çık', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Çalışmanı yedekle ve çık' });
    const pending = page.waitForEvent('download'); await dialog.getByRole('button', { name: 'HTML yedeği indir' }).click(); await (await pending).saveAs(path.join(artifacts, 'temporary-backup.html'));
    await dialog.getByRole('checkbox', { name: 'Yedek dosyasını kaydettim' }).check(); await dialog.getByRole('button', { name: 'Yedeğimle Çalışmalar’a dön', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Çalışmalar', exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Kaydetmeden gazete oluştur' })).toBeVisible();
});

test('canlı proje rota geçişi son düzenlemeyi kaydeder ve geri dönünce gösterir', async ({ page }) => {
    const a = model.makeProject(); a.name = 'Geçiş A'; const aId = await add(page, a); await home(page);
    const b = model.makeProject(); b.name = 'Geçiş B'; const bId = await add(page, b);
    await page.evaluate(hash => { location.hash = hash; }, '#duzenle/' + aId);
    await expect(page.getByRole('textbox', { name: 'Gazete adı', exact: true })).toHaveValue('Geçiş A');
    await page.getByRole('textbox', { name: 'Gazete adı', exact: true }).fill('Geçiş A son taslak');
    await page.evaluate(hash => { location.hash = hash; }, '#duzenle/' + bId);
    await expect(page.getByRole('textbox', { name: 'Gazete adı', exact: true })).toHaveValue('Geçiş B');
    await page.evaluate(hash => { location.hash = hash; }, '#duzenle/' + aId);
    await expect(page.getByRole('textbox', { name: 'Gazete adı', exact: true })).toHaveValue('Geçiş A son taslak');
});
