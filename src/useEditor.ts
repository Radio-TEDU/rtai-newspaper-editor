import { useState, useRef, useCallback } from 'react';
import type { Project, NewspaperPage, DesignElement } from './model';
import { clampRect, pageHeight } from './model';
import { placeSafely, isText } from './layout';
export function useEditor(initial: Project) {
    const [project, setProject] = useState(initial);
    const current = useRef(project);
    current.current = project;
    const undoStack = useRef<Project[]>([]);
    const redoStack = useRef<Project[]>([]);
    const [historyVersion, setHistoryVersion] = useState(0);
    const [pageId, setPageId] = useState(initial.pages[0].id);
    const [selectedId, setSelectedId] = useState<string>();
    const [layoutError, setLayoutError] = useState('');
    const mutate = useCallback((fn: (p: Project) => void, record = true) => {
        const before = current.current;
        const next = structuredClone(before);
        fn(next);
        next.updatedAt = new Date().toISOString();
        if (record) {
            undoStack.current.push(before);
            if (undoStack.current.length > 60)
                undoStack.current.shift();
            redoStack.current = [];
            setHistoryVersion(v => v + 1);
        }
        current.current = next;
        setProject(next);
    }, []);
    const checkpoint = () => { undoStack.current.push(structuredClone(current.current)); if (undoStack.current.length > 60)
        undoStack.current.shift(); redoStack.current = []; setHistoryVersion(v => v + 1); };
    const undo = () => { const previous = undoStack.current.pop(); if (previous) {
        redoStack.current.push(current.current);
        current.current = previous;
        setProject(previous);
        setHistoryVersion(v => v + 1);
    } };
    const redo = () => { const next = redoStack.current.pop(); if (next) {
        undoStack.current.push(current.current);
        current.current = next;
        setProject(next);
        setHistoryVersion(v => v + 1);
    } };
    const replace = (next: Project) => { undoStack.current = []; redoStack.current = []; current.current = next; setProject(next); setPageId(next.pages[0].id); setSelectedId(undefined); setHistoryVersion(v => v + 1); };
    const page = project.pages.find(p => p.id === pageId) ?? project.pages[0];
    const selected = page.elements.find(e => e.id === selectedId);
    const updatePage = (fn: (p: NewspaperPage) => void) => mutate(p => fn(p.pages.find(pg => pg.id === page.id)!));
    const updateElement = (id: string, patch: Partial<DesignElement>, record = true) => {
        const pg = current.current.pages.find(pg => pg.id === page.id)!;
        const before = pg.elements.find(e => e.id === id);
        if (!before) return;
        if (pg.layoutMode === 'safe' && patch.width !== undefined && isText(before) && before.width >= 80 && patch.width < 80) { setLayoutError('Okunabilir metin için kutu genişliğini en az 80 tasarım biriminde tutun.'); return; }
        const next = placeSafely(clampRect({ ...before, ...patch }, pageHeight(current.current)), pg, pageHeight(current.current));
        if (!next) { setLayoutError('Bu öğe için çakışmasız alan yok. Kutuyu küçültün, yeni sayfa ekleyin veya bilinçli katmanlama için serbest düzeni seçin.'); return; }
        setLayoutError('');
        mutate(p => { const target = p.pages.find(pg => pg.id === page.id)!; target.elements = target.elements.map(e => e.id === id ? next : e); }, record);
        return next;
    };
    return { project, mutate, replace, page, pageId, setPageId, selected, selectedId, setSelectedId, updatePage, updateElement, checkpoint, undo, redo, canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0, historyVersion, layoutError };
}
