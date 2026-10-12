export type ElementKind = 'text' | 'headline' | 'deck' | 'body' | 'quote' | 'section' | 'image' | 'caption' | 'shape';
export type ArticleField = 'title' | 'summary' | 'body';
export interface Article {
    id: string;
    title: string;
    summary: string;
    body: string;
    section: string;
    url: string;
}
export interface DesignElement {
    id: string;
    kind: ElementKind;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fontSize: number;
    fontFamily: 'serif' | 'sans';
    fontWeight: number;
    lineHeight: number;
    color: string;
    background: string;
    align: 'left' | 'center' | 'right' | 'justify';
    borderWidth: number;
    borderColor: string;
    locked: boolean;
    hidden: boolean;
    articleId?: string;
    articleField?: ArticleField;
    assetId?: string;
    alt: string;
    caption: string;
    fit: 'cover' | 'contain';
    focalX: number;
    focalY: number;
    wrapText?: boolean;
    wrapGap?: number;
    allowOverlap?: boolean;
}
export interface NewspaperPage {
    id: string;
    name: string;
    columns: number[];
    gap: number;
    margin: number;
    elements: DesignElement[];
    layoutMode?: 'safe' | 'free';
}
export interface Project {
    version: 1;
    id: string;
    name: string;
    widthMm: number;
    heightMm: number;
    pages: NewspaperPage[];
    articles: Article[];
    updatedAt: string;
}
export const kindLabels: Record<ElementKind, string> = { text: 'Metin', headline: 'Başlık', deck: 'Spot', body: 'Gövde yazısı', quote: 'Alıntı', section: 'Bölüm etiketi', image: 'Görsel', caption: 'Altyazı', shape: 'Şekil' };
export const uid = () => crypto.randomUUID();
export const pageHeight = (p: Project) => 1000 * p.heightMm / p.widthMm;
export const safeUrl = (value: string) => { try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
}
catch {
    return '';
} };
export function elementText(element: DesignElement, articles: Article[]) {
    const article = articles.find(a => a.id === element.articleId);
    return article && element.articleField ? article[element.articleField] : element.text;
}
export function makeElement(kind: ElementKind, overrides: Partial<DesignElement> = {}): DesignElement {
    const size = { text: 24, headline: 60, deck: 28, body: 23, quote: 38, section: 16, image: 16, caption: 15, shape: 16 }[kind];
    return { id: uid(), kind, name: kindLabels[kind], x: 50, y: 260, width: 440, height: kind === 'image' ? 280 : kind === 'shape' ? 5 : kind === 'body' ? 250 : kind === 'headline' ? 220 : 120,
        text: { text: 'Yeni metin', headline: 'Hikâyeniz burada başlıyor', deck: 'Okurunuzu hikâyeye davet eden kısa bir giriş.', body: 'Gazetenizin metnini buraya yazın. Haber ayrıntılarını ayrı içerik alanında düzenleyebilir, sayfadaki yerleşimi koruyabilirsiniz.', quote: '“Her sayfa yeni bir hikâye.”', section: 'GÜNDEM', image: '', caption: 'Fotoğraf açıklaması · Fotoğrafçı', shape: '' }[kind],
        fontSize: size, fontFamily: ['section', 'caption'].includes(kind) ? 'sans' : 'serif', fontWeight: kind === 'headline' || kind === 'section' ? 700 : 400, lineHeight: kind === 'headline' ? 1.04 : 1.35, color: kind === 'section' ? '#c94131' : '#242720', background: kind === 'shape' ? '#214d44' : 'transparent', align: 'left', borderWidth: 0, borderColor: '#b9b9a9', locked: false, hidden: false, alt: '', caption: '', fit: 'cover', focalX: 50, focalY: 50, ...overrides };
}
export function makePage(template = false): NewspaperPage {
    const page: NewspaperPage = { id: uid(), name: template ? 'Ön sayfa' : 'Yeni sayfa', columns: [1, 1, 1], gap: 24, margin: 34, elements: [], layoutMode: 'safe' };
    if (template)
        page.elements = [
            makeElement('section', { name: 'Üst bilgi', text: 'BAĞIMSIZ HABERLER · YENİ FİKİRLER', x: 42, y: 32, width: 916, height: 24, fontSize: 13, color: '#214d44' }),
            makeElement('headline', { name: 'Gazete adı', text: 'Haftalık', x: 40, y: 66, width: 700, height: 122, fontSize: 112, fontWeight: 400 }),
            makeElement('quote', { name: 'Sayı bilgisi', text: 'Sayı 01\nEkim 2026', x: 785, y: 92, width: 170, height: 85, fontSize: 24, align: 'center', borderWidth: 1, borderColor: '#214d44' }),
            makeElement('shape', { name: 'Üst çizgi', x: 42, y: 198, width: 916, height: 3 }),
            makeElement('section', { text: 'KAMPÜS   /   KÜLTÜR   /   BİLİM   /   YAŞAM', x: 42, y: 212, width: 916, height: 24, fontSize: 13, color: '#242720' }),
            makeElement('shape', { name: 'Bölüm çizgisi', x: 42, y: 251, width: 916, height: 1, background: '#242720' }),
            makeElement('section', { text: 'BU HAFTANIN HİKÂYESİ', x: 42, y: 278, width: 600, height: 28 }),
            makeElement('headline', { name: 'Manşet', text: 'Birlikte ürettiğimiz\nyeni bir gelecek', x: 42, y: 320, width: 600, height: 166, fontSize: 58, fontWeight: 400 }),
            makeElement('deck', { name: 'Haber spotu', x: 42, y: 508, width: 600, height: 100, text: 'Kampüsten şehre uzanan fikirler, yeni karşılaşmalar ve paylaşmaya değer hikâyeler.', fontSize: 29 }),
            makeElement('image', { name: 'Manşet görseli', x: 42, y: 638, width: 600, height: 328, alt: 'Manşet haberinin görseli' }),
            makeElement('caption', { x: 42, y: 978, width: 600, height: 34, text: 'Görsel eklemek için bu alanı seçin.' }),
            makeElement('body', { name: 'Haber özeti', x: 42, y: 1036, width: 600, height: 244, text: 'Her yayın bir soruyla başlar: Bu hafta hangi hikâyeyi anlatmak istiyoruz?\n\nBu şablonun bütün parçaları düzenlenebilir. Başlıkları değiştirin, kendi fotoğrafınızı ekleyin ve sayfanızı kolonlara hizalayın.', fontSize: 24 }),
            makeElement('shape', { name: 'Kolon ayracı', x: 674, y: 278, width: 1, height: 1002, background: '#b9b9a9' }),
            makeElement('section', { text: 'EDİTÖRDEN', x: 705, y: 278, width: 250, height: 28 }),
            makeElement('headline', { text: 'Bir sayfa,\nbin ihtimal.', x: 705, y: 320, width: 250, height: 148, fontSize: 45, fontWeight: 400 }),
            makeElement('body', { text: 'Metni, görseli ve boşluğu bir araya getirin. Kendi gazetenizin ritmini bulun.\n\nSoldan yeni öğeler ekleyebilir, sağdan özelliklerini düzenleyebilirsiniz.', x: 705, y: 495, width: 250, height: 266, fontSize: 21 }),
            makeElement('shape', { x: 705, y: 798, width: 250, height: 2, background: '#242720' }),
            makeElement('quote', { text: '“İyi bir hikâye,\npaylaşıldıkça\nçoğalır.”', x: 705, y: 832, width: 250, height: 228, fontSize: 37, color: '#214d44' }),
            makeElement('section', { text: 'SİZİN YAYININIZ,\nSİZİN SESİNİZ.', x: 705, y: 1110, width: 250, height: 100, fontSize: 17 }),
            makeElement('shape', { name: 'Alt çizgi', x: 42, y: 1334, width: 916, height: 1, background: '#242720' }),
            makeElement('caption', { name: 'Alt bilgi', text: 'HAFTALIK · GAZETE ATÖLYESİ', x: 42, y: 1350, width: 700, height: 25, fontSize: 12 }),
            makeElement('caption', { name: 'Sayfa numarası', text: '01', x: 890, y: 1344, width: 68, height: 32, fontSize: 22, align: 'right' })
        ];
    return page;
}
export function makeProject(template = true): Project {
    const page = makePage(template);
    const article: Article = { id: uid(), title: 'Birlikte ürettiğimiz\nyeni bir gelecek', summary: 'Kampüsten şehre uzanan fikirler, yeni karşılaşmalar ve paylaşmaya değer hikâyeler.', body: 'Her yayın bir soruyla başlar: Bu hafta hangi hikâyeyi anlatmak istiyoruz?\n\nGazete Atölyesi; haberleri, fikirleri ve görselleri kendi sayfalarınızda buluşturmanız için tasarlandı. Bu örnek yazıyı kendi haberinizle değiştirebilirsiniz.', section: 'Bu haftanın hikâyesi', url: '' };
    if (template)
        for (const element of page.elements) {
            if (element.name === 'Manşet') {
                element.articleId = article.id;
                element.articleField = 'title';
            }
            if (element.name === 'Haber spotu') {
                element.articleId = article.id;
                element.articleField = 'summary';
            }
        }
    return { version: 1, id: uid(), name: 'Haftalık · İlk sayı', widthMm: 297, heightMm: 420, pages: [page], articles: template ? [article] : [], updatedAt: new Date().toISOString() };
}
export function columnRects(page: NewspaperPage) {
    const usable = 1000 - page.margin * 2 - page.gap * (page.columns.length - 1);
    const total = page.columns.reduce((a, b) => a + b, 0);
    let x = page.margin;
    return page.columns.map(weight => { const width = usable * weight / total; const rect = { x, width }; x += width + page.gap; return rect; });
}
export function clampRect(element: DesignElement, height: number) {
    const width = Math.max(element.kind === 'shape' ? 1 : 10, Math.min(1000, element.width));
    const h = Math.max(element.kind === 'shape' ? 1 : 10, Math.min(height, element.height));
    return { ...element, width, height: h, x: Math.max(0, Math.min(1000 - width, element.x)), y: Math.max(0, Math.min(height - h, element.y)) };
}
