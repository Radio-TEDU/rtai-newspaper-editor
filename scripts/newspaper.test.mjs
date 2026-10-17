import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { encode, decode, compose, readAsset, writeNew, layoutIssues } from './lib/issue-package.mjs';
import { model } from './lib/project-model.mjs';
import { demoImage } from './lib/media.mjs';
import { zipSync, strToU8 } from 'fflate';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('paket metin/geometri/kimlikler ve medyayı kayıpsız taşır', () => {
    const project = model.makeProject(false), media = new Map([['photo', demoImage()]]);
    project.pages[0].elements.push(model.makeElement('image', { assetId: 'photo', wrapText: true, wrapGap: 16 }));
    project.articles.push({ id: 'draft', title: '<script>metindir</script>', summary: '', body: 'Taslak yazı', section: 'Yazılar', url: '' });
    const reopened = decode(encode(project, media));
    assert.deepEqual(reopened.project, project); assert.deepEqual(reopened.media.get('photo'), new Uint8Array(media.get('photo')));
});
test('eksik görsel ve ZIP yol kaçışı reddedilir', () => {
    const project = model.makeProject(false); project.pages[0].elements.push(model.makeElement('image', { assetId: 'missing' }));
    assert.throws(() => encode(project, new Map()), /Eksik görsel/);
    assert.throws(() => decode(zipSync({ '../escape': strToU8('bad') })), /dosya yolları/);
});
test('yerel görsel klasör kaçışı ve mevcut çıktının üzerine yazma reddedilir', async () => {
    const directory = path.resolve('.local/tool-test-' + crypto.randomUUID()); await fs.mkdir(directory, { recursive: true });
    await writeNew(path.join(directory, 'existing.json'), 'orijinal');
    await assert.rejects(() => writeNew(path.join(directory, 'existing.json'), 'değişti'), { code: 'EEXIST' });
    assert.equal(await fs.readFile(path.join(directory, 'existing.json'), 'utf8'), 'orijinal');
    await assert.rejects(() => readAsset(directory, '../../package.json'), /dışında/);
});
test('örnek içerik iki sayfa ve bağımsız yerel yazılar üretir', async () => {
    const brief = JSON.parse(await fs.readFile('examples/issue.json', 'utf8')), result = await compose(brief, process.cwd());
    assert.equal(result.project.pages.length, 2); assert.equal(result.project.articles[0].url, '');
    assert.deepEqual(layoutIssues(result.project), []);
    assert.deepEqual(decode(encode(result.project, result.media)).project, result.project);
});
test('CLI unpack/pack elle düzenlenen projede kimlik ve dokunulmayan sayfayı korur', async () => {
    const directory = path.resolve('.local/cli-roundtrip-' + crypto.randomUUID()); await fs.mkdir(directory, { recursive: true });
    const brief = JSON.parse(await fs.readFile('examples/issue.json', 'utf8')), { project, media } = await compose(brief, process.cwd());
    const before = structuredClone(project.pages[1]);
    const input = path.join(directory, 'original.rtai.zip'); await writeNew(input, encode(project, media));
    const run = args => promisify(execFile)(process.execPath, ['scripts/newspaper.mjs', ...args]);
    const unpacked = path.join(directory, 'edit'); await run(['unpack', '--input', input, '--output', unpacked]);
    const json = JSON.parse(await fs.readFile(path.join(unpacked, 'project.json'), 'utf8'));
    json.pages[0].name = 'Elle güncellenmiş kapak';
    await fs.writeFile(path.join(unpacked, 'project.json'), JSON.stringify(json));
    const output = path.join(directory, 'revised.rtai.zip');
    await run(['pack', '--input', path.join(unpacked, 'project.json'), '--assets', path.join(unpacked, 'assets.json'), '--output', output]);
    const after = decode(new Uint8Array(await fs.readFile(output))).project;
    assert.equal(after.pages[0].id, project.pages[0].id); assert.equal(after.pages[0].name, 'Elle güncellenmiş kapak'); assert.deepEqual(after.pages[1], before);
    await assert.rejects(() => run(['pack', '--input', path.join(unpacked, 'project.json'), '--output', output]), /Çıktı zaten var/);
});
