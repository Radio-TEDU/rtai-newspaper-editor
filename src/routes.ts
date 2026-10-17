export interface ProjectRoute { kind: 'edit' | 'read'; projectId: string; articleId?: string; pageId?: string }
export type Route = ProjectRoute | { kind: 'home' } | { kind: 'legacy'; articleId?: string; pageId?: string } | { kind: 'invalid' };
const id = (value: string) => /^[a-zA-Z0-9_-]{1,80}$/.test(value);
export function parseRoute(hash: string): Route {
    if (!hash || hash === '#' || hash === '#calismalar') return { kind: 'home' };
    try {
        const parts = hash.slice(1).split('/').map(decodeURIComponent);
        if (parts[0] === 'duzenle' && parts.length === 2 && id(parts[1])) return { kind: 'edit', projectId: parts[1] };
        if (parts[0] === 'haber' && parts.length === 3 && id(parts[1]) && id(parts[2])) return { kind: 'read', projectId: parts[1], articleId: parts[2] };
        if (parts[0] === 'okuma' && id(parts[1] ?? '')) {
            if (parts.length === 2) return { kind: 'read', projectId: parts[1] };
            if (parts.length === 4 && parts[2] === 'sayfa' && id(parts[3])) return { kind: 'read', projectId: parts[1], pageId: parts[3] };
        }
        if (parts[0] === 'haber' && parts.length === 2 && id(parts[1])) return { kind: 'legacy', articleId: parts[1] };
        if (hash === '#okuma') return { kind: 'legacy' };
        if (hash.startsWith('#okuma-sayfa-') && id(hash.slice(13))) return { kind: 'legacy', pageId: hash.slice(13) };
    } catch { /* Do not resolve malformed links against another project. */ }
    return { kind: 'invalid' };
}
export function routeHash(route: ProjectRoute | { kind: 'home' }) {
    if (route.kind === 'home') return '#calismalar';
    const project = encodeURIComponent(route.projectId);
    if (route.kind === 'edit') return '#duzenle/' + project;
    if (route.articleId) return '#haber/' + project + '/' + encodeURIComponent(route.articleId);
    if (route.pageId) return '#okuma/' + project + '/sayfa/' + encodeURIComponent(route.pageId);
    return '#okuma/' + project;
}
