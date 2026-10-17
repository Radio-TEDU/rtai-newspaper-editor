# Gazete Atölyesi · RadioTEDU Hub teması

Bu paket, Gazete Atölyesi editörünün ([Radio-TEDU/rtai-newspaper-editor](https://github.com/Radio-TEDU/rtai-newspaper-editor)) yeşil temasını **RadioTEDU Hub'ın kırmızı/lacivert temasıyla** değiştirir.

- Hub açık moddayken editör açık, koyu moddayken koyu görünür.
- Hub'daki ay/güneş düğmesine basıldığında editör de anında değişir. Bunun için Hub'ın kodunda değişiklik gerekmez.
- Tema değişirken editör 0,3 saniyelik yumuşak bir geçiş yapar. Bu geçiş tarayıcının View Transitions özelliğini kullanır; desteklemeyen eski tarayıcılarda ve "animasyonları azalt" ayarı açık bilgisayarlarda tema anında değişir.
- Editörün kaydırma çubukları da temaya uyar: gri, oklu sistem çubuğu yerine ince, yuvarlak ve tema renginde bir çubuk görünür. Aynı tasarımın Hub'ın kendi çubuklarına da uygulanması için `erp-entegrasyon/gazete-atolyesi.user.js` (sürüm 1.1.1 ve üstü) kurulu olmalıdır.
- Gazete sayfasının kendisi (kâğıt rengi, içerik, PDF/baskı çıktısı) hiç değişmez. Yalnızca editörün arayüzü temalanır.

## İçerik

```
dosyalar/
  src/hub-theme.css   ← YENİ: Hub renkleri (açık + koyu)
  src/hub-theme.ts    ← YENİ: Hub ile tema senkronu
  src/main.tsx        ← DEĞİŞTİ: yukarıdaki iki dosyayı bağlar
  index.html          ← DEĞİŞTİ: Albert Sans yazı tipi + kırmızı theme-color
erp-entegrasyon/      ← Hub (radiotedu.com/erp) için Tampermonkey betiği: sidebar'a Atölye sekmesi
                         ekler ve Atölye'nin kaydırma çubuğu tasarımını tüm Hub'a uygular (kendi KURULUM.md'si var)
```

## Kurulum (Codex veya elle)

Aşağıdaki adımlar editörün kendi klasöründe (`package.json`'ın olduğu yer) yapılır. Codex kullanıyorsan şunu yazman yeterli:

> Bu paketteki KURULUM.md'yi oku ve Hub temasını editör projesine uygula.

### 1. Yeni dosyaları kopyala

`dosyalar/src/hub-theme.css` ve `dosyalar/src/hub-theme.ts` dosyalarını editörün `src/` klasörüne kopyala.

### 2. `src/main.tsx`'i güncelle

Editördeki `main.tsx` bu paketteki ile aynı değilse dosyayı körü körüne değiştirme, şu üç değişikliği yap:

1. `import './workspace.css';` satırı dosyanın sonundaysa yukarı, diğer CSS importlarının yanına taşı.
2. Tüm CSS importlarının **en sonuna** şunları ekle (`hub-theme.css` en son yüklenmeli):
   ```ts
   import './hub-theme.css';
   import { initHubTheme } from './hub-theme';
   ```
3. `ReactDOM.createRoot(...)` satırından **hemen önce** `initHubTheme();` çağır.

Beklenen sonuç:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './Workspace';
import './styles.css';
import './editor-enhancements.css';
import './workspace.css';
import './hub-theme.css';
import { initHubTheme } from './hub-theme';

initHubTheme();
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
```

### 3. `index.html`'i güncelle

`<head>` içinde:

- `<meta name="theme-color" content="#214d44"/>` → `<meta name="theme-color" content="#E31E26"/>`
- Hemen arkasına Hub'ın yazı tipini ekle:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700;800&display=swap"/>
  ```

### 4. Test et ve derle

Node 22.12 veya üstü gerekir.

```bash
npm ci
npm test
npm run build
```

Üçü de hatasız bitmeli. Derleme sonunda `dist/` klasörü güncellenir.

### 5. Gözle kontrol (isteğe bağlı)

`npm run dev` ile aç, sonra adresin sonuna parametre ekleyerek iki modu da dene:

- `http://127.0.0.1:5173/?theme=light` → beyaz/gri arayüz, kırmızı düğmeler
- `http://127.0.0.1:5173/?theme=dark` → lacivert arayüz, kırmızı düğmeler

### 6. Siteye yükle

Yeni `dist/` klasörünün içeriğini (`index.html` + `assets/`) sitede eski Atölye dosyalarının yerine koy. Eski `assets/` dosyalarını silebilirsin, adları her derlemede değişir.

## Tema nasıl seçiliyor?

Öncelik sırası:

1. Adresteki `?theme=light` / `?theme=dark` parametresi (test için)
2. Editör Hub'la aynı alan adındaysa (radiotedu.com): Hub sayfasının `<html data-theme>` değeri, canlı olarak izlenir
3. Hub'ın kaydettiği `localStorage.radiotedu_theme`
4. Bilgisayarın açık/koyu mod ayarı

Editör ileride **farklı bir alan adında** barındırılırsa 2. madde çalışmaz. O durumda Hub'daki `toggleTheme` fonksiyonuna şu satır eklenmeli:

```js
document.querySelector('iframe[src*="gazete"]')?.contentWindow
  ?.postMessage({ type: 'radiotedu-theme', theme: newTheme }, '*');
```

## Renkler

Hub'daki CSS değişkenlerinin aynısı kullanılır (`src/hub-theme.css` başında):

| | Açık | Koyu |
|---|---|---|
| Vurgu (`--rt-brand`) | `#E31E26` | `#E31E26` |
| Arka plan (`--rt-bg`) | `#f8fafc` | `#090d16` |
| Panel (`--rt-panel`) | `#ffffff` | `#101624` |
| Yazı (`--rt-ink`) | `#0f172a` | `#f8fafc` |
| Çizgi (`--rt-line`) | `#e2e8f0` | `#1e293b` |

Hub renkleri değişirse yalnızca bu tablodaki değişkenleri güncellemek yeterlidir.
değişiklik.