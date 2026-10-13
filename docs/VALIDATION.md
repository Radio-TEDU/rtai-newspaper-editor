# İlk kilometre taşı doğrulaması

## Kullanıcıyla HTML yeniden açma — 13 Ekim 2026

Bağımsız skill ile üretilen PUSULA gazetesinde kullanıcı kapak öğelerinin konumlarını değiştirdi. Açık Atölye sekmesinden HTML indirildi, Çalışmalar dosya seçicisiyle ayrı çalışma olarak açıldı ve yeniden HTML dışa aktarıldı. İki dosyanın model alanları karşılaştırıldı: project.id ve updatedAt dışındaki bütün proje verisi aynı. Üç sayfa, altı yazı, 50 öğe, sayfa sırası ve 297 × 420 mm ölçü korundu. İki medya kaydının MIME, bayt uzunluğu ve SHA-256 özetleri eşleşti. Okuma görünümünde görseller açıldı ve taşma işareti sayısı sıfırdı. Yerel kayıt göstergesi görüldü; eski çalışma korundu.

Bu denemede yazı metinleri değiştirilmedi ve bu sürümün PDF'si alınmadı. Otomatik test takımları bu deneme veya teknik belge hazırlığı için yeniden çalıştırılmadı. Kişisel çıktılar .local/issues/elle-deneme-13-ekim/ içinde kalır; ayrıntılı sonuç roundtrip-result.json dosyasındadır. Uygulama kaynaklarında değişiklik gerekmedi.

## Son kontrol — bağımsız skill, HTML ve Çalışmalar (12 Ekim 2026)

Windows/Node 24.19/sistem Edge. Önceki bölümler tarihsel kayıttır.

- TypeScript/Vite üretim derlemesi başarılı; son tarayıcı kontrolleri güncel üretim derlemesinde çalıştı.
- Birim testleri 12/12, terminal aracı testleri 6/6 geçti. Skill başka geçici klasöre kopyalandı; Atölye ve node_modules olmadan HTML üretme, kontrol, açma/revizyon/paketleme ve üzerine yazmama doğrulandı.
- Tam tarayıcı takımı 19/19 geçti (52.7 saniye). Çalışmalar oluşturma/açma/ad değiştirme/arama/silme, çıkışta kayıt, farklı gazetelerde aynı medya kimliğini ayırma, IndexedDB v1 geçişi, HTML import/export, kaynak HTML'i çalıştırmama, bozuk görseli reddetme, çevrimdışı HTML okuyucu ve metin sarma, normal tekerlek zoom/tercih/Ctrl davranışı, alt yolda iframe + kayıt eklendi. Önceki editör/ZIP/okuma/PDF/kota senaryoları da geçti.
- Son olarak işlem sırasında gazete adı alanının değiştirilmesi engellendi; etkilenen dört çalışma/medya/HTML/iframe senaryosu 4/4 yeniden geçti. Birim ve terminal testleri de tekrar başarılıydı.
- Bağımsız skill ve repo keşif girişleri quick_validate.py ile doğrulandı: Skill is valid! Uygulama bağımlılığı eklenmedi.
- Masaüstü/mobil Çalışmalar görüntüleri artifacts/workspace-home.png ve workspace-mobile.png olarak incelendi; 390 px belge genişliği taşmadı.
- Üç sayfalık örnek .local/issues/standalone-html/mercek-v2.html üretildi. Gerçek editörde açıldı; bütün görseller decode edildi, taşma/tarayıcı hatası yok, tek PDF 3 sayfa ve 297 × 420 mm. kontrol-02/gazete.pdf üç sayfası Windows.Data.Pdf ile render edilip görsel olarak incelendi.
- Taşınabilir skill arşivi .local/distribution/rtai-newspaper-standalone.zip. Üretilen dosyalar/test çıktıları Git dışında kalır.

Gerçek ERP entegrasyonu veya canlıya yükleme yapılmadı; otomatik yayınlama, hesap/uzak saklama ve ortak düzenleme yoktur. Iframe kontrolü aynı origin'de yerel bir statik sunucudadır. Mac/Linux, gerçek dokunmatik cihaz, ekran okuyucu, Firefox/Safari ve fiziksel yazıcı henüz doğrulanmadı. Genel HTML dönüştürme yok; düzenlenebilir HTML v1 verisi gerekir. Yerel kayıt tarayıcı profili/origin'e bağlıdır; kartlar grup halinde taşınmaz, metin otomatik başka sayfaya devam etmez.

11 Ekim 2026 çalışma kapsamı. Windows, Node.js 24.19, Vite 7.3.7, React 19.2 ve sistem Microsoft Edge üzerinde yürütüldü. Sunucu olarak üretim derlemesinin 127.0.0.1:4173 önizlemesi kullanıldı.

## Çalıştırılan kontroller

- npm run build: TypeScript ve üretim derlemesi başarılı.
- npm test: 6/6 birim kontrolü başarılı.
- Playwright: 5/5 tarayıcı senaryosu başarılı; son çalışma yaklaşık 18 saniye.

Tarayıcı senaryoları: şablonda metin taşması olmaması; fareyle taşıma ve tutamaçla boyutlandırma; klavye konumu ve geri alma; kilitleme/çoğaltma/silme/geri alma; katmanlar; yeniden yükleyince kayıt; boş projede metin + bilgisayardan PNG; görsel altyazısı/alternatif metin; medya içeren paketin indirilip yeni projeye açılması; sayfa sırasının korunması; okuma ve hash ile haber ayrıntısı; doğrudan bağlantıda yeniden açılma ve Escape ile kapanma; küçük ekran genişliği; bozuk paketin mevcut çalışmayı koruması.

Depolama hata senaryosunda IndexedDB medya yazısına QuotaExceededError enjekte edildi. Sayfa kaydı ve medya aynı işlem içinde iptal edildi; önceki yerel proje bozulmadı. Açık oturumdaki görsel medya içeren paket olarak kurtarılabildi. Bu senaryo gerçek disk doldurarak denenmedi.

## PDF kanıtı

artifacts/verified-a3.pdf: iki sayfa; MediaBox fiziksel ölçü kontrolü 297 × 420 mm. Sayfa sırası önce Test sayfası iki, sonra görselli Test sayfası bir olarak doğrulandı. Editör araçları baskıda yok.

artifacts/verified-a4.pdf: tek sayfa; MediaBox fiziksel ölçü kontrolü 210 × 297 mm.

artifacts/template-a3.pdf: özgün gazete şablonu, tek sayfa. Şablonun manşet ve yan kolon metnindeki başlangıç kesilmeleri düzeltildi.

Bu üç gerçek PDF dosyası Windows.Data.Pdf ile tekrar açıldı, PNG'ye render edildi ve bütün sayfaları gözle incelendi. Yalnızca DOM ekran görüntüsüne dayanılmadı. Metinler, Türkçe karakterler, kâğıt rengi, çizgiler, görsel ve sıra görüntülerde kontrol edildi. Görüntüler artifacts/pdf-render, artifacts/pdf-a4 ve artifacts/pdf-template içindedir.

Windows'ta yeniden rasterleştirmek için:

~~~sh
node scripts/render-pdf.mjs artifacts/verified-a3.pdf artifacts/pdf-render
~~~

Bu yardımcı Windows'un yerleşik PDF API'sini kullanır; sistem ayarını veya PowerShell yürütme politikasını değiştirmez. Diğer platformlarda PDF görüntüleyicisi veya Poppler kullanılabilir.

## Görsel inceleme

artifacts/editor-desktop.png ve artifacts/editor-mobile.png üretildi. Masaüstünde üç panel, sayfa/kolon ayarları ve gazete hiyerarşisi incelendi. 390 px görünümün belge genişliğinin ekranı aşmadığı testle doğrulandı. Dokunmatik donanım ve ekran okuyucu ile ayrıca test yapılmadı.

## Kapsam sınırları

- Yerel kayıt aynı tarayıcı profili ve aynı adres/porta bağlıdır. Tek sekmede çalışılmalıdır; sekmeler arasında çatışma çözümü yoktur.
- Elle kullanılan Edge/Chrome yazdırma penceresindeki bütün ayar kombinasyonları denenmedi. Otomatik PDF Chromium baskı motorundan, CSS sayfa ölçüsü ve arka plan açık olarak alındı.
- Firefox, Safari, fiziksel yazıcı, CMYK/PDF-X ve taşma payı doğrulaması yoktur.
- İlk sürüm bağımsız paylaşılabilir HTML yayın dosyası üretmez. Okuma görünümü yerel proje içinde çalışır.
- Kullanıcının sonradan kutuya sığmayacak metin yazması otomatik yeniden akışa yol açmaz; kutu/yazı boyutu elle düzenlenir.

Türkçe referans HTML'in çalışma başı içeriği ile son içeriğinin SHA-256 özeti karşılaştırıldı: değişmedi. Başlangıç ve bitişte klasör Git deposu değildi. Commit, push veya uzak depo işlemi yapılmadı.

## Terminal üretimi ve pazartesi işleri — sonraki kilometre taşı

11 Ekim 2026, aynı Windows/Node/Edge ortamı. Yukarıdaki ilk kilometre taşı kaydı tarihsel olarak korundu.

- TypeScript ve Vite üretim derlemesi başarılı; tarayıcı test sunucusu güncel derlemeyi hazırladı.
- `npm test`: 10/10. Önceki 6 modele ek olarak güvenli yerleştirme, merkez yakalama, görselden kaçınan satırlar ve dar alan/taşma kontrolleri.
- `npm run test:tool`: 5/5. Medyalı paket, eksik medya/yol kaçışı, mevcut çıktıyı koruma, bağımsız yazılar, CLI açma–elle değiştirme–yeniden paketleme; kimlikler ve dokunulmayan sayfa korunuyor.
- `npm run test:e2e`: 11/11, son tam çalışma yaklaşık 58 saniye. Önceki senaryoların yanında terminal paketinin elle düzenlenmesi/yeniden açılması, zoom/pan/paneller, çakışmasız çoğaltma, taşan metinde PDF engeli, aç/kapatılabilir sarma/geri alma/yeniden yükleme, kaydedilmeyi beklemeyen bağlantısız taslak ve geçici hizalama çizgileri.
- Son terminal örneğinde metin kutusu yüksekliği/yazı boyutu düzeltildi. `npm run test:e2e -- --grep 'terminal paketi'` 1/1 yeniden geçti; örneğin baskı görünümünde taşma olmadığı da senaryoya eklendi. Terminal araçlarının 5/5 kontrolleri yeniden geçti.
- Repo skill'i, skill-creator'ın `quick_validate.py` aracıyla doğrulandı: `Skill is valid!`. Doğrulama için PyYAML yalnızca Git dışındaki `.local/skill-validation-deps` dizinine kuruldu; uygulama bağımlılığı eklenmedi.

### Gerçek paket ve PDF incelemesi

`npm run issue -- demo --output .local/issues/ucuncu-deneme.rtai.zip` ile üretilen iki sayfalık medyalı örnek, `issue:verify` üzerinden mevcut editörde gerçekten açıldı. Bütün yazılar/görseller, metin taşması, PDF sayfa sayısı ve 297 × 420 mm ölçüsü doğrulandı. Çıktılar `.local/issues/kontrol-03/` içinde: editör ve sayfa görüntüleri, `gazete.pdf`, `sonuc.json`.

Bu PDF Windows.Data.Pdf üzerinden PNG'ye çevrildi; iki sayfası da görsel olarak incelendi. Türkçe metin, görsel, bölüm/başlık hiyerarşisi, alt bilgi, sıra ve kesilme kontrol edildi. İkinci sayfanın boş alanı örnekte tek yazı bulunmasından kaynaklanıyor. Ayrıca `artifacts/wrapped-a3.pdf` gerçek baskısı render edilip incelendi: metin görselin yanında daraltılmış alanda başlıyor ve altında tam kutu genişliğine dönüyor; görsel üzerine yazmıyor. `artifacts/smart-guides.png` geçici yatay hizalama çizgisini gösteriyor. Önceki A3/A4 fiziksel ölçü senaryoları tam test çalışmasında tekrar geçti.

### Bu kilometre taşının sınırları

- Güvenli düzen boş konum bulur; dolu sayfayı veya eski serbest tasarımları kendiliğinden yeniden kurmaz. Bilinçli örtüşme ve serbest düzen seçenekleri var. Dekoratif şekiller çakışma hesabına girmez.
- Sarma dikdörtgen görsel sınırını kullanır; şekil çevresi veya sayfalar arası bağlı metin akışı yoktur. Taşma uyarısı ve PDF engeli içerik kaybını önlemeye yardımcı olur; kullanıcı kutuyu/yazı boyutunu düzenler. Kolon değişimi mevcut kutuları yeniden akıtmaz.
- CLI medya başlık/boyut kontrolü tam decode değildir. Gerçek tarayıcı kontrolü ve PDF görsel incelemesi gerekir. Sabit şablonlar her uzunluktaki içeriğe otomatik uymaz.
- Ctrl tekerleğin yakalanmadığı ve Alt tekerleğin tuvalde çalıştığı olay bazında test edildi; bütün trackpad/işletim sistemi hareketleri denenmedi.
- Gerçek dokunmatik donanım, ekran okuyucu, Firefox/Safari, fiziksel yazıcı ve başka işletim sistemi üzerinde CLI henüz doğrulanmadı. Üretim skill'i talimat/araç olarak hazır; farklı bilgisayarda Codex ile uçtan uca kullanım henüz yapılmadı.
- GitHub'a yükleme ve yayına alma yapılmadı. Bu klasör henüz Git deposu değil; `.local/` ignore kuralı ayrı geçici Git metaverisi ile kontrol edildi.

## Skill ile özel gazete üretimi — 12 Ekim 2026

Bu bölüm üstteki tarihsel Git/kapsam kayıtlarından sonraki durumdur. GitHub deposu artık `Radio-TEDU/rtai-newspaper-editor`; `main` dalıyla geliştirilir.

`rtai-newspaper` skill'i bu sohbet tarafından okunup uygulandı. Mevcut örnek paket ve ortak model üzerinden MERCEK adlı, 19–25 Ekim 2026 etiketli üç sayfalık A3 deneme gazetesi üretildi. İçerik Lorem Ipsum ve açıkça örnek olarak etiketlenmiş Türkçe başlıklardan oluşur. Gazetede 7 bağımsız yazı, 80 ayrı öğe (26/18/36) ve iki yerde kullanılan tek PNG medya kimliği var. PNG kodla üretilmiş soyut kompozisyondur; gerçek haber/fotoğraf değildir. Kapakta rakam şeridi, ikinci sayfada görsel çevresinde akış ve alıntı paneli, üçüncü sayfada ajanda kartları kullanıldı.

Yerel çıktı: `.local/issues/hafta-19-ekim-2026-01/mercek-v2.rtai.zip`. JSON, medya, ara sürümler ve PDF kontrolü bu yerel klasördedir; GitHub'a eklenmez.

- CLI `pack` ve `check`: şema, medya ve güvenli düzen geçerli.
- `issue:verify`: gerçek editörde 3 sayfa açıldı, görseller decode edildi; metin taşması ve tarayıcı hatası yok. Tek PDF'nin 3 sayfa ve 297 × 420 mm olduğu doğrulandı.
- Son PDF `kontrol-02/gazete.pdf` Windows.Data.Pdf üzerinden render edildi; üç sayfası görsel olarak incelendi. Başlık, Türkçe karakterler, renkli bloklar, akış, sıra ve alt bilgiler kontrol edildi.
- Ayrı geçici tarayıcı profiliyle örnek üzerinde düzenleme denendi: manşet değişimi kutu geometrisini korudu, görsel X konumu değişti, şerit dolgu rengi değişti; yeni başlık önizlemede yenileme olmadan açıldı. Dışa aktarılan paket tekrar çözümlendi; diğer iki sayfa ve medya baytları aynı kaldı. Yeniden yükleme düzenlenmiş başlığı korudu. Sonuç: `.local/issues/hafta-19-ekim-2026-01/elle-duzenleme-sonucu.json`.

Bu görev uygulama kaynaklarını değiştirmedi; genel test takımı tekrar çalıştırılmadı. Yeni Codex sohbetinde üretim henüz kullanıcı tarafından denenmedi; yerel skill keşfi ve açık `$` çağrısı resmi OpenAI belgeleriyle kontrol edildi, kullanım promptları `docs/CODEX-PROMPTS.md` içine eklendi. Grup halinde taşıma yok; blok parçaları ayrı düzenlenir. Kullanıcının açık tarayıcı profiline deneme paketi yüklenmedi veya mevcut taslağı değiştirilmedi.
