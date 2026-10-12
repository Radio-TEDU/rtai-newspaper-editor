import { spawn } from 'node:child_process';
const run=(args)=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true});child.on('exit',code=>code===0?resolve():reject(new Error('Komut başarısız: '+args.join(' '))));child.on('error',reject);});
await run(['node_modules/typescript/bin/tsc','-b']);
await run(['node_modules/vite/bin/vite.js','build','--configLoader','runner']);
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort','--configLoader','runner'],{stdio:'inherit',windowsHide:true});
process.on('SIGTERM',()=>server.kill());process.on('SIGINT',()=>server.kill());
