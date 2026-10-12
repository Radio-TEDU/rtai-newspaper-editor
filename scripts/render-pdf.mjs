// Windows'ta ek paket gerektirmeyen, salt okunur PDF sayfası doğrulaması.
// PdfDocument / RenderToStreamAsync: https://learn.microsoft.com/en-us/uwp/api/windows.data.pdf
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
if(process.platform!=='win32')throw new Error('Bu yardımcı Windows PDF API kullanır. Diğer platformlarda PDF görüntüleyicisi veya Poppler kullanın.');
const input=path.resolve(process.argv[2]??'artifacts/verified-a3.pdf');
const output=path.resolve(process.argv[3]??'artifacts/pdf-render');
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const source=readFileSync(fileURLToPath(new URL('./render-pdf.ps1',import.meta.url)),'utf8');
const command=source.replace(/^param\([^\n]+\)\r?\n/,'$InputPdf = '+quote(input)+'\n$OutputDirectory = '+quote(output)+'\n');
execFileSync('powershell.exe',['-NoProfile','-Command',command],{windowsHide:true,stdio:'inherit'});
