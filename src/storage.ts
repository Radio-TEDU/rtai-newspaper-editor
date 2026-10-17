import type { Project } from './model';
import { validateProject } from './validation';
const DB = 'rtai-newspaper-editor';
let database: Promise<IDBDatabase> | undefined;
function db() {
    return database ??= new Promise((resolve, reject) => {
        let blocked = false;
        const request = indexedDB.open(DB, 2);
        request.onupgradeneeded = event => {
            const connection = request.result, tx = request.transaction!;
            if (!connection.objectStoreNames.contains('projects')) connection.createObjectStore('projects');
            if (!connection.objectStoreNames.contains('media')) connection.createObjectStore('media');
            if (!connection.objectStoreNames.contains('meta')) connection.createObjectStore('meta');
            if ((event as IDBVersionChangeEvent).oldVersion === 1) {
                const old = tx.objectStore('projects').get('current');
                old.onsuccess = () => { if (!old.result) return; try {
                    const p = validateProject(old.result);
                    tx.objectStore('projects').put(p, p.id); tx.objectStore('meta').put(p.id, 'active');
                    const cursor = tx.objectStore('media').openCursor();
                    cursor.onsuccess = () => { const c = cursor.result; if (!c) return; if (typeof c.key === 'string' && !c.key.includes(':')) { tx.objectStore('media').put(c.value, mediaKey(p.id, c.key)); c.delete(); } c.continue(); };
                } catch { tx.abort(); } };
            }
        };
        request.onsuccess = () => { if (blocked) { request.result.close(); return; } request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
        request.onerror = () => { database = undefined; reject(request.error); };
        request.onblocked = () => { blocked = true; database = undefined; reject(new Error('Diğer gazete sekmelerini kapatıp tekrar deneyin.')); };
    });
}
function completed(tx: IDBTransaction) { return new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error('Kayıt tamamlanamadı.')); }); }
const mediaKey = (projectId: string, id: string) => projectId + ':' + id;
function read<T>(request: IDBRequest<T>) { return new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
export async function listProjects(): Promise<Project[]> {
    const connection = await db(), store = connection.transaction('projects').objectStore('projects');
    const [keys, values] = await Promise.all([read(store.getAllKeys()), read(store.getAll())]);
    return values.filter((_, i) => keys[i] !== 'current').map(validateProject).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function loadProject(id?: string): Promise<Project | undefined> {
    const connection = await db(), key = id ?? await read(connection.transaction('meta').objectStore('meta').get('active'));
    if (!key) return undefined;
    const value = await read(connection.transaction('projects').objectStore('projects').get(key));
    return value ? validateProject(value) : undefined;
}
export async function saveProject(project: Project, media?: Map<string, Blob>, activate = true) {
    const database = await db();
    const tx = database.transaction(['projects', 'media', 'meta'], 'readwrite');
    const done = completed(tx);
    try {
        tx.objectStore('projects').put(project, project.id);
        if (activate) { tx.objectStore('projects').put(project, 'current'); tx.objectStore('meta').put(project.id, 'active'); }
        if (media)
            for (const [id, blob] of media)
                tx.objectStore('media').put(blob, mediaKey(project.id, id));
    }
    catch (error) {
        tx.abort();
        await done.catch(() => { });
        throw error;
    }
    await done;
}
export async function readMedia(id: string, projectId?: string): Promise<Blob | undefined> { const connection = await db(), active = projectId ?? await read(connection.transaction('meta').objectStore('meta').get('active')); if (!active) return undefined; return read(connection.transaction('media').objectStore('media').get(mediaKey(active, id))); }
export async function deleteProject(id: string) {
    const connection = await db(), tx = connection.transaction(['projects', 'media', 'meta'], 'readwrite'), done = completed(tx);
    tx.objectStore('projects').delete(id);
    const active = tx.objectStore('meta').get('active'); active.onsuccess = () => { if (active.result === id) { tx.objectStore('meta').delete('active'); tx.objectStore('projects').delete('current'); } };
    const prefix = id + ':', cursor = tx.objectStore('media').openCursor(IDBKeyRange.bound(prefix, prefix + '\uffff'));
    cursor.onsuccess = () => { const c = cursor.result; if (c) { c.delete(); c.continue(); } };
    await done;
}
export function storageError(error: unknown) { return error instanceof DOMException && error.name === 'QuotaExceededError' ? 'Tarayıcı depolama alanı doldu. Çalışmanızı proje paketi veya HTML olarak indirin.' : 'Yerel kayıt yapılamadı. Çalışmanızı paket veya HTML olarak indirin. ' + (error instanceof Error ? error.message : 'Tarayıcı depolamasını kontrol edin.'); }
