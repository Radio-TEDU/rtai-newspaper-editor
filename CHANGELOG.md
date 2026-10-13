# Değişiklik kaydı

## 13 Ekim 2026 · teknik rehberin güncellenmesi

- Teknik rehber e9cf1be kod durumuna yenilendi: rota sahipliği ve bileşen sınırları, yedekle çıkış/güncellik onayı, hata ayrımı, 15/6/25 test sonuçları ve açık inceleme maddeleri. Rota ve kurtarma şemaları eklendi.

## 13 Ekim 2026 · haber bağlantıları ve hata sonrası devam

- Haber, okuma ve sayfa hash'lerinde gazete kimliği; doğru projeyle yenileme/geçmiş, canlı proje geçişinde son taslağı kaydetme ve belirsiz eski linkte tahmin yapmama.
- Dosya doğrulama ve depolama hatalarını ayırma; bozuk dosyadan sonra doğrudan yeniden yükleme.
- Kayıtsız/kota hatalı oturumda güncel HTML/ZIP yedeği ve dosya kaydetme onayıyla çıkış; başarısız/eski yedekte engel, iptalde taslağı koruma.
- 15 birim, 6 CLI ve 25 tarayıcı kontrolü geçti; R01/R02/R04 kapandı.

## 13 Ekim 2026 · iş akışı ve mimari incelemesi

- İş akışı, kullanılabilirlik, içerik mantığı ve mimari tekrarlar için 18 bulguluk rapor eklendi. Kod/UI kanıtı, öncelik, öneri ve kabul ölçütleri ayrıldı; bu incelemede uygulama kaynakları değiştirilmedi.

## 13 Ekim 2026 · teknik belge

- Ayrıntılı teknik rehber: sistem mimarisi, veri modeli, editör/yerleşim, IndexedDB, medya, bağımsız skill, HTML/ZIP, okuma, PDF, güvenlik, testler ve ERP kararları; altı Mermaid şeması.
- Kullanıcıyla HTML indir–yeniden aç denemesinin kapsamı ve doğrulama sonucu belgelendi; kişisel deneme dosyaları Git dışında tutulur.
- Ayrı test kopyasında başlık/uzun Türkçe yazı, taşmada PDF engeli ve HTML yeniden açma doğrulandı. Güncel üç sayfalık A3 PDF'nin sıra, ölçü, metin ve gerçek render kontrolleri belgelendi; uygulama kodunda değişiklik gerekmedi.

## Yayınlanmamış · bağımsız HTML skill'i ve Çalışmalar

- `skills/rtai-newspaper/` bağımsız Node üretici; Atölye/npm olmadan HTML üretme, açma, revizyon ve kontrol. Taşınabilir ZIP paketleme ve ortak sözleşme eşitleme.
- Sürümlü düzenleme verisi ve bir kez gömülen medya taşıyan çevrimdışı HTML; okuma penceresi, metin sarma, fiziksel ölçülü yazdırma ve bozuk görsel/taşma bildirimi.
- Kaynak HTML'i çalıştırmadan doğrulanmış veriyle içe aktarma; editör ve kartlardan HTML dışa aktarma. Eski ZIP desteği korunur.
- Çalışmalar ana sayfası, ayrı gazeteler, kapak görüntüleri, yeni/şablon/dosyadan ekleme, arama, ad değiştirme ve silme; dönüşte bekleyen kaydı tamamlama.
- IndexedDB v2 geçişi ve proje kapsamlı medya; eski kayıtları koruma ve aynı görsel kimlikli gazetelerin birbirini etkilemesini önleme.
- Gazete üzerinde normal tekerlek zoom; kapatılabilir/hatırlanan tercih, panellerde normal kaydırma ve Ctrl tarayıcı zoom'unu koruma.
- Göreli statik dosya yolları, yerel alt yol/iframe testi ve ERP mimarisi için belgeler. Otomatik yayınlama eklenmedi.

## Yayınlanmamış · terminal üretimi ve düzenleme

- Bağımsız GitHub deposu ve `main` dalı; klonlama/kurulum adımları ve Git dışındaki kullanıcı çalışmalarını paketle taşıma açıklaması.
- Yeni Codex sohbetinden skill çağırma, özel yerleşim üretme ve elle düzenlenen sayıyı koruyarak revize etme promptları; üç sayfalık Lorem örneğiyle yerel üretim/düzenleme doğrulaması.

- Projeyle taşınan `rtai-newspaper` Codex skill'i; API bağlantısı olmadan içerikten düzenlenebilir gazete üretim akışı.
- Terminalde `new`, `pack`, `unpack`, `check`, `demo`; mevcut çıktıyı koruma, ortak şema doğrulaması, medya sınırları ve dosya yolu kontrolü.
- Kapak/haber/ajanda/fikir yerleşimleri, iki sayfalık özgün örnek içerik ve PNG; editöre aktarım ve elle düzenlenen sayıyı yeniden paketleme.
- Ayrı tarayıcı profilinde paket açma, taşma/görsel kontrolü, sayfa görüntüleri ve fiziksel ölçülü PDF üreten doğrulama aracı.
- %15–200 yakınlaştırma, tuval üzerinde Alt + tekerlek, ayrı pan aracı/Boşluk/orta fare; Ctrl tarayıcı etkileşimi korunur.
- Seçimi ve panel durumunu koruyan tek paneller kontrolü; tuval alanını genişletme, önizlemeden dönüşte tuval konumunu koruma.
- Sürükleme sırasında kenar/merkez/kolon/komşu akıllı çizgiler; bırakma/iptalde temizleme.
- Yeni sayfalarda güvenli yerleşim, isteğe bağlı serbest düzen/bilinçli katmanlama; yeni/kopya/taşınan öğelere boş alan arama.
- Görsel başına metin sarma ve boşluk kontrolü, dar satırların atlanması; taşma uyarısı/yükseklik ayarı ve taşan metin için baskı engeli.
- Güncel yerel yazıyı yenilemeden açan hash işleyicisi; haber penceresi sonrası okuma konumunun korunması ve pencere genişliğine uyum.
- Terminal, geometri/metin akışı ve uçtan uca üretim/düzenleme kontrolleri; referansın sayfa aileleri/okuma/baskı incelemesi.

## 0.1.0 · 2026-10-11

- React, TypeScript ve Vite başlangıç yapısı; Türkçe Gazete Atölyesi arayüzü.
- A3 varsayılanı, A4/özel ölçü, düzenlenebilir özgün ön sayfa şablonu.
- Sayfa ekleme, çoğaltma, silme, sıralama; dokuz öğe türü, pointer sürükleme ve sekiz tutamaçla boyutlandırma.
- Özellikler, kolon oranları ve kılavuzlar, katman sırası, kilit/gizleme, çoğaltma, klavye ve geri al/yinele.
- Ayrı haber modeli, okunabilir haber arşivi, hash ile ayrıntı penceresi.
- IndexedDB otomatik kayıt, Blob görseller, yerleşim/odak ayarı, medya içeren doğrulamalı ZIP paketleri.
- Bütün sayı için fiziksel ölçüyü koruyan tarayıcı baskı/PDF görünümü.
- Model/güvenlik kontrolleri ve tarayıcı senaryoları; kurulum, yedekleme ve baskı belgeleri.
