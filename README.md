# RTAI · Gazete Atölyesi

Tarayıcıda çalışan, Türkçe arayüzlü bağımsız gazete tasarım editörü. React, TypeScript ve Vite kullanır. Sunucu hesabı, ERP, rol yönetimi veya bulut depolama içermez.

## Kurulum ve çalıştırma

Node.js 22.12+ (bu çalışmada 24.19 kullanıldı) ve npm gerekir.

~~~sh
npm install
npm run dev
~~~

Geliştirme adresi terminalde görünür; varsayılan http://127.0.0.1:5173. İlk kilit dosyası oluştuktan sonraki temiz kurulumlarda npm ci kullanın.

~~~sh
npm run build
npm run preview
~~~

Üretim önizlemesi http://127.0.0.1:4173 adresindedir. dist/ klasörü statik sunucuda barındırılabilir. HTML dosyasını file:// ile açmayın. Kayıtlar **adres + port + tarayıcı profiline** bağlıdır: geliştirme ve üretim önizlemesi aynı yerel kaydı paylaşmaz. Aralarında proje paketiyle geçiş yapın.

Vite komutları configLoader runner kullanır; bu çalışma ortamının üst klasör erişim kısıtı nedeniyle varsayılan yapılandırma paketleyicisine alternatif seçildi. Bu kısıtlı ortamın geliştirme bağımlılığı tarayıcısı da engellenebilir; üretim derlemesi + preview kullanılabilir. Kendi terminalinizde normal geliştirme sunucusu desteklenir.

## İlk sürümde kullanım

Terminaldeki Codex ile düzenlenebilir gazete üretip `.rtai.zip` paketini burada açabilirsiniz. Projeyle taşınan skill `.agents/skills/rtai-newspaper/SKILL.md`, yerel araç `scripts/newspaper.mjs` içindedir. Üretim, son elle düzenlemeleri koruyarak revizyon ve başka bilgisayara kurulum adımları: [Terminal iş akışı](docs/TERMINAL-WORKFLOW.md).

~~~sh
npm run issue -- demo --output .local/issues/ornek.rtai.zip
~~~

Ardından **Paket aç** ile örneği yükleyin; metin, görsel ve yerleşimi elle değiştirin. Tam yazılar sayfadaki kutulardan ayrı korunur.

1. Düzenlenebilir ön sayfa şablonuyla başlayın veya soldan Boş sayı açın. Yeni sayı mevcut yerel çalışmayı değiştirir; önce paketi indirin.
2. Soldan başlık, spot, gövde, metin, alıntı, bölüm etiketi, altyazı, şekil ve görsel ekleyin.
3. Öğeyi tuvalden seçin. Sürükleyin veya sekiz tutamaçtan boyutlandırın. Sağ panelden metin, renk, hizalama, yazı boyutu, dolgu, kenarlık, konum ve boyut düzenleyin.
4. Seçili öğeyi kilitleyin, gizleyin, çoğaltın, silin veya katman sırasını değiştirin. Katman listesi önden arkaya sıralanır.
5. Boş tuvale tıklayarak sayfa ayarlarına dönün. Kolon sayısını, oranlarını, aralığı ve iç boşluğu düzenleyin. Kılavuzlar görünümü ve Hizala seçeneği bağımsızdır. Kolon ayarı öğeleri kendiliğinden taşımaz; öğeyi seçip Kolona yerleştir kullanın.
6. Haber panelinde ayrıntılı içeriği yazın. Bir öğeyi habere bağlayın; başlık/spot/gövde alanını tuvale yansıtmayı seçin. Haber güncellenince kutu konumu ve boyutu korunur.
7. Okuma önizlemesinde sayfaları, haber arşivini ve erişilebilir haber penceresini inceleyin. Escape veya kapatma düğmesi gazeteye döndürür.
8. Paketi indir ile yedek alın. Paket aç ile başka profilde/tarayıcıda metin ve görsellerle birlikte geri yükleyin.

Sayfalar eklenebilir, çoğaltılabilir, silinebilir ve yukarı/aşağı sıralanabilir. En az bir sayfa kalır. Yakınlaştırma %15–200 aralığındadır; Sığdır mevcut alanı kullanır. Tuval üzerinde **Alt + tekerlek** işaretçi çevresinde yakınlaştırır. Ctrl/Cmd + tekerlek tarayıcıya bırakılır. El düğmesi, basılı Space veya orta fare düğmesiyle tuvalde gezinebilirsiniz. Üstte **Paneller** iki kenar panelini açıp kapatır; seçiminiz korunur. İlk sürüm sınırları: 100 sayfa, sayfa başına 500 öğe, 2000 haber.

### Yerleşim, hizalama ve metin akışı

Yeni sayfalar **Çakışmayı önle** düzeniyle açılır. Ekleme, çoğaltma ve konum/boyut değişiminde uygun boş konum aranır; yer yoksa işlem uygulanmaz ve açıklama gösterilir. Eski paketlerin serbest yerleşimi korunur. Sayfa ayarlarından serbest yerleşim seçilebilir; öğe özelliklerinde bilinçli örtüşmeye izin verilebilir. Dekoratif şekiller çakışma hesabına girmez.

**Hizala** açıkken sürükleme sırasında kenar, merkez, kolon ve komşu öğe kılavuzları görünür; bırakınca kalkar. Kolon değişimi mevcut kutuları yeniden akıtmaz. Görsel özelliklerinden **Metin görselin çevresinden aksın** ve çevre boşluğu ayarlanır. Akış dikdörtgen görsel sınırını kullanır; sarma kapalıyken güvenli düzen görsel/metin çakışmasını önler. Serbest yerleşimde çakışan görselin kapladığı satırlar metne ayrılmaz.

Taşan metin tuvalde işaretlenir; içerik silinmez. **Metne göre yüksekliği ayarla**, kutu boyutu veya yazı boyutuyla düzeltin. Dar bölgeler metin için atlanır; gerekirse kutuyu genişletin. Sayfalar arasında otomatik metin devamı yoktur. Sayfa doluysa yeni sayfa eklemek gerekir; mevcut tasarım kendiliğinden yeniden kurulmaz.

### Klavye ve dokunmatik

Tab ile tuval öğelerini seçin. Ok tuşları 1, Shift + ok 10 tasarım birimi taşır. Alt + ok boyutu değiştirir. Ctrl/Cmd + D çoğaltır; Delete siler; Escape seçimi kaldırır. Ctrl/Cmd + Z geri alır; Ctrl/Cmd + Shift + Z veya Ctrl/Cmd + Y yineler. Form alanlarında tarayıcının yerel metin düzenleme kısayolları korunur. Geçmiş son 60 işlemi tutar, sayfa değişimlerini de kapsar, yeniden açıldığında korunmaz.

Pointer Events ile fare, kalem ve dokunmatik düzenleme desteklenir. Küçük ekranda paneller tuvalin altına geçer. Sayısal özellik alanları sürükleme ve küçük tutamaçlara alternatif sunar. Gerçek dokunmatik cihazda kullanım henüz ayrıca doğrulanmadı.

## Yerel kayıt ve görseller

IndexedDB tek açık sayı için otomatik kayıt tutar. Son değişiklikten yaklaşık 650 ms sonra kayıt başlar; üstteki kayıt durumunu kontrol edin. Bekleyen/başarısız kayıt varken sekmeyi kapatmak tarayıcının çıkış uyarısını tetikler. Depolama hataları bildirilir; otomatik kurtarma mümkün değilse kaydetmeden çalışma ve paket indirme seçeneği vardır. Çalışmayı tek sekmede düzenleyin; eşzamanlı sekmeler için çatışma çözümü yoktur.

Görseller JSON içine Base64 olarak yazılmaz. IndexedDB'de Blob, oturumda geçici object URL olarak tutulur. Çoğaltma aynı medya kimliğini kullanır. PNG, JPEG, WebP ve GIF kabul edilir; yüklenen HTML/SVG çalıştırılmaz. Tek görsel 20 MB / 32 megapiksel, paket ve açılmış paket toplamı 100 MB, paket içindeki metin/model 10 MB ve ayrı medya sayısı 1000 ile sınırlıdır. GIF baskıda sabit kare olarak görünür. Doldur/kırp, sığdır ve odak X/Y seçenekleri vardır; piksel üzerinde yıkıcı kırpma yapılmaz.

Tarayıcı kotası, özel gezinme, site verisini temizleme veya işletim sisteminin alan geri kazanımı kayıtları etkileyebilir. Sağ altta yaklaşık kullanım/kota gösterilir. Paketler kalıcı yedektir. Silinmiş görseller geri alma için yerel depoda tutulur; ilk sürüm kullanılmayan medyayı otomatik temizlemez. Tarayıcı site verisini temizlemeden önce bütün çalışmaları paket olarak indirin.

.rtai.zip paketi manifest.json içinde sürümlü proje modelini ve media/ altında görsel dosyalarını taşır. İçe aktarma boyutları, kimlikleri, renkleri, haber referanslarını ve görselleri doğrular; bozuk paket açık projeyi değiştirmez. Dosya adları indirmede temizlenir. Kullanıcı metni React tarafından düz metin olarak işlenir; harici bağlantılarda yalnızca http/https ve noopener noreferrer kullanılır.

## Okuma bağlantıları ve PDF

Haber adresleri #haber/<id> biçimindedir. Bağlantı aynı projeyi içeren tarayıcıda doğrudan ayrıntı penceresini açar. Yeni yazı kaynak bağlantısı veya yayımlanmış/kaydedilmiş durum şartı olmadan güncel taslaktan açılır. Normal haber tıklaması sayfayı yenilemez; pencere kapanınca okuma konumu, editöre dönünce tuval konumu korunur. Bu bağlantı bir bulut yayını değildir; başka bilgisayara içerik göndermek için proje paketi gerekir. İlk sürüm bağımsız HTML yayın dosyası üretmez.

Varsayılan **A3 dikey: 297 × 420 mm**. A4 ve özel ölçü de seçilebilir; bütün sayı aynı ölçüyü kullanır. Tuval genişliği 1000 tasarım birimidir; yüksekliği fiziksel en-boy oranından türetilir. Varsayılan 34 birim iç boşluk A3'te yaklaşık 10 mm'dir. Referansın son baskı kuralı A3 + 10 mm dış kenar boşluğudur; uygulamada PDF sayfa ölçüsünü tam tutmak için @page margin:0 kullanılır, boşluk tasarımın içinde kalır. Referanstaki eski 216 × 288 mm kuralı varsayılan alınmadı.

PDF / Yazdır görseller ve yazı tipleri hazır olduğunda tarayıcı yazdırma penceresini açar. Bütün sayfalar sırayla tek belgeye gider. Seçimler, kılavuzlar, katmanlar, haber penceresi ve editör araçları basılmaz. Haber ayrıntı metni PDF'ye ek sayfa olarak eklenmez; PDF tuvaldeki yerleşimi basar.

Chromium tabanlı güncel Edge/Chrome için:

- Hedef: PDF olarak kaydet.
- Sayfa ölçüsü: uygulamadaki ölçü (varsayılan A3), yön: dikey.
- Ölçek: %100; kenar boşluğu: yok; üst/alt bilgi: kapalı.
- Arka plan grafikleri: açık.

Yazdırma ayarları veya tarayıcı CSS sayfa boyutunu geçersiz kılabilir. Firefox/Safari ve fiziksel yazıcılar ayrıca doğrulanmadı. Profesyonel matbaa için CMYK, taşma payı, kesim işaretleri ve PDF/X yoktur. **PDF / Yazdır** taşan metin bulunduğunda yazdırmayı durdurur; kullanıcı kutuyu büyütmeli, yazı boyutunu küçültmeli veya sayfada gösterilen metni düzenlemelidir. Şablon ve terminal örneği taşma kontrolünden geçirilir.

## Kontroller

~~~sh
npm run build
npm test
npm run test:tool
npm run test:e2e
~~~

Tarayıcı testleri mevcut sistem Edge'ini kullanır. Edge bulunamazsa npx playwright install chromium çalıştırın. İstenirse PLAYWRIGHT_EXECUTABLE_PATH ile tarayıcı yolu verilebilir. Test sunucusu üretim derlemesini kullanır; 4173'te mevcut sunucu varsa yeniden kullanılır, önce npm run build ile güncel olduğundan emin olun.

Birim kontrolleri veri modelini, kolon geometrisini ve geçersiz proje/URL değerlerini sınar. Tarayıcı senaryoları yerleşim, geçmiş, yerel kayıt, görseller, paket taşıma, haber penceresi, küçük ekran ve baskıyı kapsar. Testler artifacts/ altında ekran görüntüleri, proje paketi ve deneme PDF'si üretir; bunlar Git'e eklenmez. Son çalıştırma sonuçları docs/VALIDATION.md içindedir. Windows üzerinde gerçek PDF rasterleştirme yardımcı komutu: node scripts/render-pdf.mjs artifacts/verified-a3.pdf artifacts/pdf-render.

## Kod yapısı

- src/model.ts: proje, sayfa, haber ve öğe modeli; şablon ve geometri.
- src/useEditor.ts: düzenleme durumu, seçili sayfa/öğe ve geri al/yinele.
- src/layout.ts: çakışma, akıllı hizalama ve görsel çevresinde metin akışı.
- src/useCanvasNavigation.ts: odaklı zoom, gezinme ve tuval konumunu koruma.
- src/components/Paper.tsx: ortak editör, okuma ve baskı tuvali; pointer hareketleri.
- src/components/Properties.tsx: seçili öğe özellikleri.
- src/components/Reader.tsx: okuma sayfaları, haber arşivi ve native dialog.
- src/storage.ts: IndexedDB kayıtları ve medya.
- src/validation.ts, src/project-package.ts: şema kontrolü ve medya içeren paket.
- src/components/PrintView.tsx: fiziksel ölçü ve çok sayfalı baskı.
- src/App.tsx: Türkçe editör ekranı ve akışların bağlanması.
- scripts/newspaper.mjs, scripts/lib/: terminal üretimi, paketleme ve mevcut sayıyı açma.
- scripts/verify-package.mjs: gerçek editörde paket/PDF doğrulaması.
- .agents/skills/rtai-newspaper/: Codex için taşınabilir üretim talimatları.

Dil için kod/alan adları İngilizcedir. Öğe etiketleri merkezî sözlükte bulunur; kalan arayüz metinleri henüz çeviri kataloğuna çıkarılmadı. İkinci dil için bu metinler ayrı kataloğa taşınabilir.

## Referanslar ve Git çalışma düzeni

GitHub deposu: [Radio-TEDU/rtai-newspaper-editor](https://github.com/Radio-TEDU/rtai-newspaper-editor).

Başka bilgisayarda, depoya erişimi olan GitHub hesabınızla:

~~~sh
git clone https://github.com/Radio-TEDU/rtai-newspaper-editor.git
cd rtai-newspaper-editor
npm ci
npm run dev
~~~

Klasördeki Weekly-TEDU-Yeni-Tasarim.html yalnızca tasarım ve baskı incelemesinde kullanıldı; içeriği, fontları, görselleri veya bütün HTML'i uygulamaya kopyalanmadı. İngilizce referans da korunur. Büyük yerel referanslar .gitignore ile uygulama deposundan ayrı tutulur.

Proje bağımsız Git deposunda `main` dalıyla geliştirilir. Çalışan kilometre taşları küçük ve anlaşılır Conventional Commit mesajlarıyla kaydedilir (`feat:`, `fix:`, `docs:`). GitHub ve commit işlemleri kullanıcının talimatıyla yürütülür; yayına alma ayrı bir adımdır. CHANGELOG.md kısa ilerleme kaydıdır.

`.local/` içindeki devam notları, gerçek haberler ve üretilen gazeteler; `artifacts/` test çıktıları; yerel referans HTML dosyaları; bağımlılıklar ve derleme çıktıları commit kapsamı dışındadır. Skill, uygulama kodu, örnek içerik ve kilit dosyası depoya dahildir. Kaynak kodu klonlamak tarayıcıdaki taslağı veya Git dışında tutulan gazete paketlerini taşımaz; çalışmanızı **Paketi indir** ile alıp yeni bilgisayarda **Paket aç** ile yükleyin.
