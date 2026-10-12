import fs from 'node:fs/promises';
import path from 'node:path';
import { zipSync } from 'fflate';
const directory = path.resolve('skills/rtai-newspaper'), files = {};
async function collect(current, prefix) { for (const entry of await fs.readdir(current, { withFileTypes: true })) { const file = path.join(current, entry.name), name = prefix + '/' + entry.name; if (entry.isDirectory()) await collect(file, name); else if (entry.isFile()) files[name] = new Uint8Array(await fs.readFile(file)); } }
await collect(directory, 'rtai-newspaper');
const output = path.resolve(process.argv[2] ?? '.local/distribution/rtai-newspaper-skill.zip');
await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, zipSync(files), { flag: 'wx' });
console.log('Bağımsız skill paketi: ' + output);
