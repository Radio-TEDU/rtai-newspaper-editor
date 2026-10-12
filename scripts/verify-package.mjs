import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { preview } from 'vite';
import { chromium } from '@playwright/test';
import { projectFile, layoutIssues } from './lib/issue-package.mjs';

const args = process.argv.slice(2), options = {};
for (let i = 0; i < args.length; i += 2) {
    if (!['--input', '--output'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options[args[i].slice(2)]) throw new Error('--input paket.rtai.zip --output yeni-kontrol-klasoru kullanın.');
    options[args[i].slice(2)] = args[i + 1];
}
let server, browser;
try {
    if (!options.input || !options.output) throw new Error('--input ve --output gerekli.');
    const input = path.resolve(options.input), output = path.resolve(options.output);
    const { project } = await projectFile(input);
    const conflicts = layoutIssues(project); if (conflicts.length) throw new Error(conflicts.join('\n'));
    if (!existsSync('dist/index.html')) throw new Error('Önce npm run build çalıştırın.');
    // An empty new directory and an isolated browser profile protect existing work.
    await fs.mkdir(path.dirname(output), { recursive: true }); await fs.mkdir(output);
    server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0, strictPort: false } });
    const address = server.httpServer.address();
    const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH ?? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.getByRole('heading', { name: 'Çalışmalar', exact: true }).waitFor();
    await page.getByLabel('Gazete dosyası').setInputFiles(input);
    await page.getByText('Proje ve bütün görseller açıldı.', { exact: true }).waitFor();
    await page.getByText('Yerel olarak kaydedildi', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'editor.png'), fullPage: true });
    await page.getByRole('button', { name: 'Okuma önizlemesi', exact: true }).click();
    const count = await page.locator('.reader-page').count(); if (count !== project.pages.length) throw new Error('Okuma sayfa sayısı uyuşmuyor.');
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('.print-root img')].map(img => img.decode())); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
    const overflow = await page.locator('.print-root .element-text').evaluateAll(nodes => nodes.filter(el => el.dataset.overflow === 'true' || el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2).map(el => ({ element: el.closest('[data-element-id]')?.getAttribute('data-element-id'), text: el.textContent?.slice(0, 100) })));
    if (overflow.length) throw new Error('Taşan metinler: ' + JSON.stringify(overflow));
    const papers = page.locator('.print-page');
    for (let i = 0; i < project.pages.length; i++) await papers.nth(i).screenshot({ path: path.join(output, `sayfa-${String(i + 1).padStart(2, '0')}.png`) });
    const pdf = await page.pdf({ path: path.join(output, 'gazete.pdf'), preferCSSPageSize: true, printBackground: true });
    const source = pdf.toString('latin1'), pages = [...source.matchAll(/\/Type \/Page\b/g)], boxes = [...source.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/g)];
    if (pages.length !== project.pages.length || boxes.length !== project.pages.length || boxes.some(b => Math.abs(Number(b[1]) * 25.4 / 72 - project.widthMm) > 0.5 || Math.abs(Number(b[2]) * 25.4 / 72 - project.heightMm) > 0.5)) throw new Error('PDF sayfa sayısı/ölçüsü uyuşmuyor.');
    if (errors.length) throw new Error('Tarayıcı hataları: ' + errors.join('; '));
    await fs.writeFile(path.join(output, 'sonuc.json'), JSON.stringify({ pages: pages.length, widthMm: project.widthMm, heightMm: project.heightMm, overflow, browserErrors: errors, source: input }, null, 2));
    console.log(`${pages.length} sayfa gerçekten açıldı. Görseller çözümlendi, metin taşması yok; PDF sayısı/ölçüsü doğrulandı. Görsel inceleme için: ${output}`);
} catch (error) { console.error('Paket doğrulama: ' + (error.code === 'EEXIST' ? 'Çıktı klasörü zaten var; yeni bir ad seçin.' : error.message)); process.exitCode = 1; }
finally { await browser?.close(); await new Promise(resolve => server ? server.httpServer.close(resolve) : resolve()); }
