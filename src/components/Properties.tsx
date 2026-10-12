import { Copy, Trash2, LockKeyhole, Unlock, ArrowUp, ArrowDown, Eye, EyeOff, ImagePlus, Link2 } from 'lucide-react';
import { kindLabels, columnRects, type DesignElement, type Project, type NewspaperPage, type Article } from '../model';
import { layoutText, measureTextFor } from '../layout';
import { elementText } from '../model';
export function NumberField({ label, value, onChange, min = 0, max = 2000, step = 1 }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}) { return <label className="field"><span>{label}</span><input type="number" value={Math.round(value * 100) / 100} min={min} max={max} step={step} onChange={e => { if (e.target.value !== '' && Number.isFinite(e.target.valueAsNumber))
    onChange(Math.max(min, Math.min(max, e.target.valueAsNumber))); }}/></label>; }
interface Props {
    element: DesignElement;
    project: Project;
    page: NewspaperPage;
    update: (patch: Partial<DesignElement>) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onOrder: (direction: number) => void;
    onImage: () => void;
    updateArticle: (id: string, patch: Partial<Article>) => void;
    onCreateArticle: () => void;
}
export default function Properties({ element: e, project, page, update, onDelete, onDuplicate, onOrder, onImage, updateArticle, onCreateArticle }: Props) {
    const article = project.articles.find(a => a.id === e.articleId);
    const isText = !['image', 'shape'].includes(e.kind);
    return <><div className="panel-heading"><div><span className="eyebrow">SEÇİLİ ÖĞE</span><h2>{kindLabels[e.kind]}</h2></div><span className="selection-dot"/></div>
    <div className="properties-content"><label className="field"><span>Öğe adı</span><input value={e.name} maxLength={200} onChange={event => update({ name: event.target.value })}/></label>
    <div className="button-row compact"><button onClick={onDuplicate} title="Öğeyi çoğalt" aria-label="Öğeyi çoğalt"><Copy size={16}/></button><button onClick={() => update({ locked: !e.locked })} title={e.locked ? 'Kilidi aç' : 'Kilitle'} aria-label={e.locked ? 'Kilidi aç' : 'Kilitle'}>{e.locked ? <Unlock size={16}/> : <LockKeyhole size={16}/>}</button><button onClick={() => update({ hidden: !e.hidden })} title={e.hidden ? 'Göster' : 'Gizle'} aria-label={e.hidden ? 'Göster' : 'Gizle'}>{e.hidden ? <EyeOff size={16}/> : <Eye size={16}/>}</button><button onClick={() => onOrder(1)} title="Bir öne al" aria-label="Bir öne al"><ArrowUp size={16}/></button><button onClick={() => onOrder(-1)} title="Bir arkaya gönder" aria-label="Bir arkaya gönder"><ArrowDown size={16}/></button><button className="danger" onClick={onDelete} title="Öğeyi sil" aria-label="Öğeyi sil"><Trash2 size={16}/></button></div>
    {e.locked && <p className="helper">Öğe kilitli. Konumunu veya içeriğini değiştirmek için kilidi açın.</p>}
    <fieldset disabled={e.locked}>
    {isText && <><label className="field"><span>{e.articleField && article ? 'Haberden gelen metin' : 'Metin'}</span><textarea maxLength={e.articleField === 'body' ? 1000000 : e.articleField ? 10000 : 100000} rows={5} value={e.articleField && article ? article[e.articleField] : e.text} onChange={event => e.articleField && article ? updateArticle(article.id, { [e.articleField]: event.target.value }) : update({ text: event.target.value })}/></label>
      <div className="field-grid"><NumberField label="Yazı boyutu" value={e.fontSize} min={6} max={180} onChange={fontSize => update({ fontSize })}/><NumberField label="Satır aralığı" value={e.lineHeight} min={0.8} max={3} step={0.05} onChange={lineHeight => update({ lineHeight })}/></div>
      <div className="field-grid"><label className="field"><span>Yazı tipi</span><select value={e.fontFamily} onChange={event => update({ fontFamily: event.target.value as 'serif' | 'sans' })}><option value="serif">Serif · Georgia</option><option value="sans">Sans · Arial</option></select></label><label className="field"><span>Ağırlık</span><select value={e.fontWeight} onChange={event => update({ fontWeight: Number(event.target.value) })}><option value={400}>Normal</option><option value={700}>Kalın</option></select></label></div>
      <label className="field"><span>Hizalama</span><select value={e.align} onChange={event => update({ align: event.target.value as DesignElement['align'] })}><option value="left">Sola</option><option value="center">Ortala</option><option value="right">Sağa</option><option value="justify">İki yana</option></select></label>
      <button className="wide" onClick={() => { const flow = layoutText(e, elementText(e, project.articles), e.allowOverlap ? [] : page.elements.filter(b => b.kind === 'image' && (!b.allowOverlap || b.wrapText)), measureTextFor(e)); update({ height: Math.min(1000 * project.heightMm / project.widthMm - e.y, flow.neededHeight + 3) }); }}>Metne göre yüksekliği ayarla</button>
      <p className="helper">Taşan metin tuvalde işaretlenir. Kutuyu büyütün veya yazı boyutunu düzenleyin; metin silinmez.</p>
    </>}
    {e.kind === 'image' && <><button className="wide" onClick={onImage}><ImagePlus size={16}/>{e.assetId ? 'Görseli değiştir' : 'Bilgisayardan yükle'}</button><label className="field"><span>Alternatif metin</span><textarea maxLength={10000} rows={2} value={e.alt} onChange={event => update({ alt: event.target.value })}/></label><label className="field"><span>Görsel altyazısı</span><input maxLength={10000} value={e.caption} onChange={event => update({ caption: event.target.value })}/><small>Okuma görünümündeki görsel listesinde görünür. Tuvalde ayrı bir Altyazı öğesi ekleyebilirsiniz.</small></label><label className="field"><span>Görsel yerleşimi</span><select value={e.fit} onChange={event => update({ fit: event.target.value as 'cover' | 'contain' })}><option value="cover">Doldur / kırp</option><option value="contain">Tamamını sığdır</option></select></label><div className="field-grid"><NumberField label="Odak X (%)" value={e.focalX} max={100} onChange={focalX => update({ focalX })}/><NumberField label="Odak Y (%)" value={e.focalY} max={100} onChange={focalY => update({ focalY })}/></div><p className="helper">PNG, JPEG, WebP, GIF · En fazla 20 MB / 32 MP. Animasyon PDF’de sabit bir kare olur.</p></>}
    <h3>Konum ve boyut</h3><div className="field-grid"><NumberField label="X" value={e.x} max={1000} onChange={x => update({ x })}/><NumberField label="Y" value={e.y} onChange={y => update({ y })}/><NumberField label="Genişlik" value={e.width} min={10} max={1000} onChange={width => update({ width })}/><NumberField label="Yükseklik" value={e.height} min={e.kind === 'shape' ? 1 : 10} onChange={height => update({ height })}/></div>
    {e.kind === 'image' && <><label className="check-field"><input type="checkbox" checked={e.wrapText ?? false} onChange={event => update({ wrapText: event.target.checked })}/> Metin görselin çevresinden aksın</label><NumberField label="Metin ile görsel aralığı" value={e.wrapGap ?? 12} max={80} onChange={wrapGap => update({ wrapGap })}/><p className="helper">Görselle kesişen metin kutuları bu boşluğu kullanır. Çok dar satırlar atlanır; taşma varsa metin kutusunu büyütün. Güvenli düzende sarma kapatılırsa görsel uygun boş alana alınır.</p></>}
    <label className="check-field"><input type="checkbox" checked={e.allowOverlap ?? false} onChange={event => update({ allowOverlap: event.target.checked })}/> Bilinçli üst üste yerleşime izin ver</label>
    <label className="field"><span>Kolona yerleştir</span><select value="" onChange={event => { const col = columnRects(page)[Number(event.target.value)]; if (col)
        update({ x: col.x, width: col.width }); }}><option value="">Kolon seçin…</option>{page.columns.map((_, i) => <option key={i} value={i}>{i + 1}. kolon</option>)}</select></label>
    <h3>Renk ve kenarlık</h3><div className="field-grid"><label className="field"><span>Yazı rengi</span><input type="color" value={e.color} onChange={event => update({ color: event.target.value })}/></label><label className="field"><span>Dolgu</span><input type="color" value={e.background === 'transparent' ? '#f7f3e9' : e.background} onChange={event => update({ background: event.target.value })}/></label></div><button className="text-button" onClick={() => update({ background: 'transparent' })}>Dolguyu kaldır</button><div className="field-grid"><NumberField label="Kenarlık" value={e.borderWidth} max={20} onChange={borderWidth => update({ borderWidth })}/><label className="field"><span>Kenarlık rengi</span><input type="color" value={e.borderColor} onChange={event => update({ borderColor: event.target.value })}/></label></div>
    <h3><Link2 size={14}/> Haber bağlantısı</h3><label className="field"><span>Bağlı haber</span><select value={e.articleId ?? ''} onChange={event => update({ articleId: event.target.value || undefined, articleField: undefined })}><option value="">Bağlantı yok</option>{project.articles.map(a => <option key={a.id} value={a.id}>{a.title.replace(/\n/g, ' ').slice(0, 60)}</option>)}</select></label>
    {article && isText && <label className="field"><span>Tuvale yansıtılan alan</span><select value={e.articleField ?? ''} onChange={event => update({ articleField: event.target.value as DesignElement['articleField'] || undefined })}><option value="">Bağımsız metin</option><option value="title">Haber başlığı</option><option value="summary">Haber spotu</option><option value="body">Haber gövdesi</option></select></label>}
    <button className="wide" onClick={onCreateArticle}><Link2 size={15}/> Yeni haber oluştur ve bağla</button>
    </fieldset></div></>;
}
