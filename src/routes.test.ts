import { expect, test } from 'vitest';
import { parseRoute, routeHash } from './routes';

test('article and page links retain their project on refresh', () => {
    for (const route of [
        { kind: 'edit' as const, projectId: 'issue-a' },
        { kind: 'read' as const, projectId: 'issue-a', articleId: 'shared-story' },
        { kind: 'read' as const, projectId: 'issue-b', pageId: 'page-2' },
        { kind: 'read' as const, projectId: 'issue-a' },
    ]) expect(parseRoute(routeHash(route))).toEqual(route);
    expect(routeHash({ kind: 'read', projectId: 'issue-a', articleId: 'story' })).not.toBe(routeHash({ kind: 'read', projectId: 'issue-b', articleId: 'story' }));
});
test('old links are explicitly unresolved until their project is identified', () => {
    expect(parseRoute('#haber/story')).toEqual({ kind: 'legacy', articleId: 'story' });
    expect(parseRoute('#okuma')).toEqual({ kind: 'legacy' });
    expect(parseRoute('#okuma-sayfa-page-2')).toEqual({ kind: 'legacy', pageId: 'page-2' });
});
test('malformed links cannot select a project or an active article', () => {
    for (const hash of ['#haber/%/story', '#haber/a/../b', '#duzenle/a/extra', '#okuma/a/sayfa/', '#unknown', '#haber//story']) expect(parseRoute(hash)).toEqual({ kind: 'invalid' });
});
