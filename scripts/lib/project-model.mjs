import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Use exactly the editor's model/validation without another TS runtime dependency.
const root = fileURLToPath(new URL('../../', import.meta.url));
const modules = new Map();
async function moduleUrl(name) {
    if (modules.has(name)) return modules.get(name);
    const source = await fs.readFile(path.join(root, 'src', name + '.ts'), 'utf8');
    let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    for (const match of [...code.matchAll(/from ['"]\.\/([\w-]+)['"]/g)]) code = code.replace(match[0], `from '${await moduleUrl(match[1])}'`);
    const url = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
    modules.set(name, url);
    return url;
}
export const model = await import(await moduleUrl('model'));
export const { validateProject } = await import(await moduleUrl('validation'));
export const layout = await import(await moduleUrl('layout'));
