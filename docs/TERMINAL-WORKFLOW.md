# Terminalden düzenlenebilir gazete üretimi

Gazete üretimi terminaldeki Codex oturumunda yapılır. Web editörü GPT'ye bağlanmaz; üretilen `.rtai.zip` paketini açar. Skill, şema ve araçlar bu projeyle birlikte taşınır. Başka bilgisayarda Node >=22.12, `npm ci` ve üretim için kendi hesabınızla giriş yapılmış Codex gerekir. Codex üretimi internet/hesap erişimi gerektirir; hazır paketi düzenlemek için Codex gerekmez.

Projeyi aynı klasörde açınca `.agents/skills/rtai-newspaper/SKILL.md` skill'i kullanılabilir. Terminalde örnek talimat:

> $rtai-newspaper Bu klasördeki haberlerden ve görsellerden üç sayfalık A3 gazete hazırla. Kapakta kampüs haberi olsun. Sonucu .local/issues/ekim/sayi-01.rtai.zip olarak oluştur; editörde düzenlenebilir kalsın.

Skill otomatik üretim servisi değildir: Codex'in içerik/tasarım hazırlamasını yönlendirir; yerel komutlar veriyi kontrol edip paketler. API anahtarı, uygulama içi sohbet veya yerel AI köprüsü yoktur.

## İlk örnek

```sh
npm ci
npm run issue -- demo --output .local/issues/ornek.rtai.zip
npm run issue -- check --input .local/issues/ornek.rtai.zip
npm run dev
```

Editörde **Paket aç** ile dosyayı açın. Açık çalışmanız varsa önce **Paketi indir** ile yedek alın; içe aktarma açık sayının yerine geçer. Başlık/metin/görseller ayrı öğelerdir; konum, boyut ve içerikleri değiştirilebilir. Okuma görünümünde yazı ayrıntısı açılır. Son düzenlemeleri yeni paketle dışa aktarın.

## İçerikten hazır yerleşim

```sh
npm run issue -- new --input examples/issue.json --output .local/issues/yeni-sayi.rtai.zip
```

`issue.json` alanları:

- `name`, `masthead`, `tagline`, `edition`: sayı ve üst bilgi metinleri.
- `widthMm`, `heightMm`: ortak sayfa ölçüsü; varsayılan 297 × 420 mm.
- `articles`: benzersiz `id`, `title`, `summary`, `body`, `section`, isteğe bağlı `url`, `image`, `alt`, `caption`, `excerpt`. Kaynak bağlantısı/yayın durumu şartı yoktur. `image` dosya yolu JSON'un klasörüne göre göreli olmalı ve bu klasörün dışına çıkmamalıdır; symlink kaçışı da reddedilir.
- `pages`: `name`, `type`, `articleIds`. Türler `cover`, `news`, `agenda`, `voices`; ajandada en fazla dört, diğer türlerde en fazla iki yazı. Bir yazı farklı sayfalarda kullanılabilir. Tam yazı bağımsız saklanır; sayfadaki gövde gerektiğinde kısa bir önizleme olur.

Örnek biçim `examples/issue.json` içindedir. Codex bu dosyayı kendi haberlerinizle üretir. Sabit yerleşim her metne otomatik olarak uygun değildir; uzun başlık/spotlarda tarayıcı kontrolü yapıp kutu/boyut/düzeni düzeltin. Aşırı özel en-boy oranlarında özel yerleşim hazırlayın.

## Tam yerleşim ve elle düzenlenen sayıyı yeniden kullanma

```sh
npm run issue -- unpack --input .local/issues/elle-duzenlenmis.rtai.zip --output .local/issues/duzenleme-01
npm run issue -- pack --input .local/issues/duzenleme-01/project.json --assets .local/issues/duzenleme-01/assets.json --output .local/issues/duzeltilmis.rtai.zip
```

`unpack` mevcut bir çıktı klasörüne yazmaz. `pack`, `new` ve `demo` mevcut çıktı dosyasının üzerine yazmaz. Yeni bir ad seçin. `project.json` editörün tam modelidir; `assets.json` medya kimliklerini dosya yollarına eşleyen bir nesnedir. Örnek: `{"photo-1":"media/photo-1.bin"}`. `.bin` dosyasındaki görsel tipi içerikten okunur.

Sadece üçüncü sayfa değişecekse mevcut paketi açıp o sayfayı düzenleyin; kalan sayfaları ve kimlikleri aynen koruyun. `new` yeni sayı üretir; elle düzenlenmiş bir sayıyı güncellemek için kullanılmamalıdır. Kullanıcının son hali her zaman editörden dışa aktardığı pakettir. Tarayıcıdaki otomatik kayıt başka bilgisayara kendiliğinden taşınmaz.

## Doğrulama ve baskı

```sh
npm run issue -- check --input .local/issues/duzeltilmis.rtai.zip
npm run build
npm run issue:verify -- --input .local/issues/duzeltilmis.rtai.zip --output .local/issues/kontrol-01
```

`check`: aynı editör şeması, kimlikler, sınırlar, medya başlık/boyutları ve güvenli sayfalardaki çakışmalar. Metin taşmasını veya tam görsel çözümlenmesini tek başına kanıtlamaz.

`issue:verify`: mevcut `dist` derlemesini ayrı geçici tarayıcı oturumunda açar, paketi gerçekten içe aktarır, bütün sayfalardaki metin taşmasını ve görsel decode işlemini kontrol eder; sayfa ekran görüntüleri ve tek `gazete.pdf` üretir. Kullanıcının tarayıcı profiline/yerel taslağına dokunmaz. Çıktı klasörü yeni olmalıdır. PDF görsel incelemesi hâlâ gereklidir. Sistem Edge'i veya `PLAYWRIGHT_EXECUTABLE_PATH` kullanılır; gerekirse `npx playwright install chromium`.

Sınırlar: 100 sayfa, sayfada 500 öğe, 2000 yazı, 1000 ayrı medya, tek görsel 20 MB / 32 MP, manifest 10 MB, paket/açılmış toplam 100 MB. PNG/JPEG/WebP/GIF kabul edilir; HTML/SVG çalıştırılmaz. GIF baskıda sabit karedir. Yapısal kontrolün yanında bozuk/truncated görseller tarayıcıda reddedilebilir.

## Kaynak koddan ayrı yerel çalışma

`.local/` Git dışında tutulur. Gerçek haberler, görseller, kişisel taslaklar ve üretilen sayılar burada çalışılabilir. `.agents/skills`, `scripts`, `examples`, uygulama kaynakları ve dokümantasyon GitHub'a taşınabilir. Örnek içerikler gerçek haber değildir. Skill/araç sürümüyle uyumlu editörü kullanın. Commit/push veya yayına alma ayrıca kullanıcı talimatıyla yapılır.
