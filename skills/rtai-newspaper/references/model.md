# Custom project model

Generate a demo and unpack it for complete defaults. Keep required fields, stable ids and dimensions; images are separate files mapped through assets.json. The HTML envelope is created by the CLI.

```ts
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

```

Coordinates use a 1000-unit page width; height is 1000 * heightMm / widthMm. All pages share the physical size. Text boxes can link to an article field or keep an excerpt. See scripts/runtime/validation.mjs for bounds and scripts/runtime/model.mjs for defaults. These files are bundled; no editor checkout is required.
