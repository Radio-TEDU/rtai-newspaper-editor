import { useEffect, useId, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { DEFAULT_ZOOM_SENSITIVITY, type ZoomSensitivity } from '../useCanvasNavigation';

const MIN = 0.25, MAX = 3, STEP = 0.25;
const label = (value: number) => value.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + '×';

/** Zoom düğmelerinin yanındaki ayar: fare tekerleği ve touchpad zoom hassasiyeti ayrı ayrı. */
export default function ZoomSettings({ value, onChange }: { value: ZoomSensitivity; onChange: (value: ZoomSensitivity) => void }) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const panelId = useId();
    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus(); } };
        document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, [open]);
    const slider = (key: keyof ZoomSensitivity, title: string, hint: string) => <label className="zoom-sensitivity-field">
        <span><b>{title}</b><output>{label(value[key])}</output></span>
        <input type="range" min={MIN} max={MAX} step={STEP} value={value[key]} aria-label={title + ' hassasiyeti'} onChange={e => onChange({ ...value, [key]: Number(e.target.value) })}/>
        <small>{hint}</small>
    </label>;
    const isDefault = value.mouse === DEFAULT_ZOOM_SENSITIVITY.mouse && value.trackpad === DEFAULT_ZOOM_SENSITIVITY.trackpad;
    return <div className="zoom-settings" ref={root}>
        <button type="button" aria-label="Zoom hassasiyeti" title="Zoom hassasiyeti" aria-expanded={open} aria-controls={panelId} aria-pressed={open} onClick={() => setOpen(v => !v)}><SlidersHorizontal size={15}/></button>
        {open && <div className="zoom-settings-panel" id={panelId} role="dialog" aria-label="Zoom hassasiyeti">
            <h3>Zoom hassasiyeti</h3>
            {slider('mouse', 'Fare tekerleği', 'Bir tekerlek tıkının ne kadar yakınlaştıracağı')}
            {slider('trackpad', 'Touchpad', 'İki parmakla sıkıştırmanın hızı')}
            <button type="button" className="text-button" disabled={isDefault} onClick={() => onChange(DEFAULT_ZOOM_SENSITIVITY)}>Varsayılana dön</button>
        </div>}
    </div>;
}
