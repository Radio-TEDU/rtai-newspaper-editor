import type { Project } from './model';
import { validateProject } from './validation';
const DB = 'rtai-newspaper-editor';
let database: Promise<IDBDatabase> | undefined;
function db() {
    return database ??= new Promise((resolve, reject) => {
        const request = indexedDB.open(DB, 1);
        request.onupgradeneeded = () => { request.result.createObjectStore('projects'); request.result.createObjectStore('media'); };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => { database = undefined; reject(request.error); };
        request.onblocked = () => reject(new Error('Diğer gazete sekmelerini kapatıp tekrar deneyin.'));
    });
}
function completed(tx: IDBTransaction) { return new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error('Kayıt tamamlanamadı.')); }); }
export async function loadProject(): Promise<Project | undefined> {
    const database = await db();
    return new Promise((resolve, reject) => { const req = database.transaction('projects').objectStore('projects').get('current'); req.onsuccess = () => { try {
        resolve(req.result ? validateProject(req.result) : undefined);
    }
    catch (e) {
        reject(e);
    } }; req.onerror = () => reject(req.error); });
}
export async function saveProject(project: Project, media?: Map<string, Blob>) {
    const database = await db();
    const tx = database.transaction(['projects', 'media'], 'readwrite');
    const done = completed(tx);
    try {
        tx.objectStore('projects').put(project, 'current');
        if (media)
            for (const [id, blob] of media)
                tx.objectStore('media').put(blob, id);
    }
    catch (error) {
        tx.abort();
        await done.catch(() => { });
        throw error;
    }
    await done;
}
export async function readMedia(id: string): Promise<Blob | undefined> { const database = await db(); return new Promise((resolve, reject) => { const req = database.transaction('media').objectStore('media').get(id); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
export function storageError(error: unknown) { return error instanceof DOMException && error.name === 'QuotaExceededError' ? 'Tarayıcı depolama alanı doldu. Çalışmanızı proje paketi olarak indirin.' : 'Yerel kayıt yapılamadı. Çalışmanızı paket olarak indirin. ' + (error instanceof Error ? error.message : 'Tarayıcı depolamasını kontrol edin.'); }
