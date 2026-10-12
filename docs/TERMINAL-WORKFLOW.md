# Terminalden düzenlenebilir gazete üretimi

Gazete üretimi terminaldeki Codex oturumunda yapılır. Atölye düzenlenebilir `.html` veya `.rtai.zip` açar. Bağımsız üretici `skills/rtai-newspaper/` içindedir; başka bilgisayarda yalnızca bu klasör, Node >=22.12 ve kendi hesabıyla giriş yapılmış Codex gerekir. Atölye ve npm kurulumu gerekmez. Hazır HTML çevrimdışı okunabilir; düzenlemek için yerel veya canlı Atölye'ye dosyadan eklenir.

## Bağımsız skill kurulumu

Skill ZIP'ini açın, `rtai-newspaper` klasörünü kullanıcı skill dizinine (`~/.agents/skills/rtai-newspaper`) koyun. Windows'ta bu kullanıcı klasörünüzün `.agents/skills/` altıdır. Dosyalar doğrudan bu klasörde olmalı; iç içe ikinci `rtai-newspaper` klasörü oluşturmamaya dikkat edin. `$rtai-newspaper` ile çağırın; görünmezse Codex'i yeniden başlatın. Kaynak: [OpenAI — local skills](https://learn.chatgpt.com/docs/build-skills).

Genel kurulum yapmadan `SKILL.md` yolunu Codex'e verip okumasını da isteyebilirsiniz. Skill klasöründe doğrudan deneme:

```sh
node scripts/newspaper.mjs demo --output output/ornek.html
node scripts/newspaper.mjs check --input output/ornek.html
```

Girdi/yerleşim rehberi [bağımsız skill](../skills/rtai-newspaper/SKILL.md) içindedir. Geliştirici `npm run skill:sync` ile sözleşmeyi eşitler, `npm run skill:bundle -- yeni-skill.zip` ile arşiv oluşturur. Aşağıdaki npm komutları bu depo içindir; tek başına kurulmuş skill için yukarıdaki Node komutlarını kullanın.

Projeyi aynı klasörde açınca `.agents/skills/rtai-newspaper/SKILL.md` skill'i kullanılabilir. Terminalde örnek talimat:

> $rtai-newspaper Bu klasördeki haberlerden ve görsellerden üç sayfalık A3 gazete hazırla. Kapakta kampüs haberi olsun. Sonucu .local/issues/ekim/sayi-01.html olarak oluştur; Atölye'de düzenlenebilir kalsın.

Skill otomatik üretim servisi değildir: Codex'in içerik/tasarım hazırlamasını yönlendirir; yerel komutlar veriyi kontrol edip paketler. API anahtarı, uygulama içi sohbet veya yerel AI köprüsü yoktur.

## İlk örnek

```sh
npm ci
npm run issue -- demo --output .local/issues/ornek.rtai.zip
npm run issue -- check --input .local/issues/ornek.rtai.zip
npm run dev
```

Çalışmalar'da **Dosyadan gazete ekle** ile dosyayı açın. Her içe aktarma ayrı çalışma oluşturur. Editörün **Paket aç** kontrolü de mevcut gazeteyi kaydedip dosyayı yeni çalışma olarak açar. Başlık/metin/görseller ayrı düzenlenir. Son halini **HTML indir** veya **Paketi indir** ile alın. Sıradan HTML yerine skill'in düzenleme verisini taşıyan HTML kabul edilir.

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
