# Referans gazete incelemesi

`Weekly-TEDU-Yeni-Tasarim.html` yalnızca okundu. Kod/CSS incelemesine ek olarak kapak (1), ajanda (9) ve fikirler (13) sistem Edge'inde ayrı geçici tarayıcı oturumunda görüntülendi. Görseller `.local/reference-review/` içinde yerel inceleme çıktılarıdır. Referansın içeriği, fotoğrafları, logoları ve gömülü fontları uygulamaya kopyalanmadı.

## Sayfa ailesi ve aktarılabilecek düzenler

HTML'de 13 sayfa var: Ön sayfa, Kampüs, Bilim & teknoloji, Ekonomi, RadioTEDU & kültür, Çevre & kent, Spor & yaşam, Topluluklardan, Topluluk Ajandası, Ankara’da Bu Hafta, Dünya Gündemi & Küresel Ekonomi, Topluluk panosu, Fikirler & yeni sesler.

| Referans yapısı | Somut gözlem / üretimde kullanılabilecek örnek | Uygulamada karşılığı |
| --- | --- | --- |
| Kapak | Büyük serif/sans gazete başlığı, sağda sayı mührü, kategori şeridi; geniş ana görselin altında üç haber kartı ve alıntı/podcast bandı. Başlık/spot/görsel bağımsız hiyerarşiye sahip. | `model.ts/makePage`, terminal `cover` ön ayarı veya `pack` ile özel `Project`. Mevcut ön ayar aynı kapak düzeninin birebir kopyası değildir; özel manşet/görsel/kart geometrisi Codex tarafından ayrı öğelerle kurulabilir. |
| Kampüs/bilim/ekonomi/çevre/spor iç sayfaları | Ortak gazete üst bilgisi; ayrı bölüm başlığı; ana haber, küçük haberler, bilgi/istatistik şeridi, kaynak ve altyazı. | Terminal `news` düzeni; `section`, `headline`, `deck`, `body`, `image`, `caption`, `shape` öğeleri. |
| RadioTEDU/kültür ve fikirler | Büyük haber görseli, dar bilgi/istatistik bölgesi; podcast kapak görseli yanında metin, bölüm ve bağlantılar. 13. sayfada üstte büyük haber, altta iki parçalı podcast yazısı görüldü. | `voices` ön ayarı alıntı ağırlıklı bir başlangıçtır. Podcast kapak + yazı veya istatistik kutusu için `pack` ile özel geometri gerekir; tam yazı `Article` içinde kalır. |
| Topluluklardan | Görsel/logo ile metni yan yana koyan `society-dispatch` satırları; bölüm/kurum bilgisi, başlık ve ayrıntı bağlantısı. | Görsel, bölüm etiketi, başlık, spot/gövde grupları; ortak `articleId` bağlantıları. |
| Topluluk Ajandası | Görsel incelemede iki ana kolon, gün başlıkları ve kalın çizgiler; etkinlik/kurum/saat/yer/kaynak arasında belirgin sıra. Bir günde birden fazla etkinlik var. | `agenda` ön ayarında dört yazı/etkinlik satırı; yoğun iki kolonlu takvim için özel yerleşim. Tarih/saat/yer metin olarak korunur, modelde henüz ayrı etkinlik tipi yok. |
| Ankara’da Bu Hafta / dünya gündemi | `city-columns`, dünya haber kolonları ve ayraçlar; farklı haberlerin ayrı görsel ve metin ritmi. | `news` kolonları ve kolon oranları; gerektiğinde özel kutu geometrisi. |
| Topluluk panosu | Kartlar halinde görsel, bölüm, kısa metin ve yazı bağlantısı. | Aynı düzenlenebilir öğelerle kart ızgarası; ayrı otomatik kart bileşeni/modeli henüz eklenmedi. |

Bu aileler terminal üretimine rehberlik eder. Ön ayarlar sadece bir başlangıçtır; metin uzunluğuna göre görsel kontrol ve düzenleme gerekir. Gazete görselini tek bitmap olarak üretmek bütün kutuların elle düzenlenebilir olması hedefini karşılamaz.

## Hiyerarşi, kolon ve akış

Son CSS paleti: kâğıt `#f7f3e9`, mürekkep `#242720`, yeşil `#214d44`, kırmızı `#c94131`, sarı `#ead66c`, ayraç `#b9b9a9`. Kapakta büyük başlık ve fotoğraf, iç sayfalarda tekrar eden üst bilgi/etiket/ayraçlar gazeteye ortak kimlik veriyor. Uygulamada bu renkler, serif/sans seçenekleri, bölüm etiketleri ve çizgiler ayrı öğelerde kullanılabilir; font dosyaları taşınmadı.

Referans Grid/Flex ve bazı CSS metin kolonlarıyla içerik akışını kuruyor. Editör mutlak kutular kullanır; kolon ayarları kılavuz yapısını kurar, mevcut kutuları kendiliğinden yeniden dizmez. Yeni güvenli yerleşim boş alan arar; görsel sarma satırların kullanılabilir bölümlerini hesaplar. Bu yaklaşım serbest tasarımı ve okunabilir metin bölgelerini birlikte kullanır. Keyfi içerikten otomatik çok sayfalı haber akışı henüz yoktur.

## Okuma ve haber bağlantıları

Referansta `#sayfa-…`, `#haber-…`, `#yazi-…` rotaları ve native `dialog` var. Sayfa gezinmesi önceki/sonraki kontrolleriyle; “Rahat oku” modu sabit baskı yerleşimini daha akıcı, genişliği uyarlanan bir görünümle değiştiriyor. Kaynak bağlantısı ve yerel ayrıntı metni farklı görevler üstleniyor.

Editör `#haber/<id>` ile kendi taslağındaki `Article` kaydını açar; harici yayımlanmış habere ihtiyaç duymaz. Yeni tıklama işleyicisi hash'i tam gezinme yapmadan değiştirir, kaydırma konumunu tutar; dialog kapatılınca gazeteye dönülür. Mevcut okuma görünümü baskı tuvalini ölçekleyerek gösterir; referanstaki bütün “Rahat oku” yeniden akış davranışları aynen taşınmadı. Tam yazı penceresi uzun içeriği okunabilir biçimde sunar.

## Baskı ölçüsü ve araçların gizlenmesi

- Eski kurallar: 1080 × 1440 tasarım; 216 × 288 mm, sıfır kenar boşluğu, `zoom:.7559055118`.
- Sonraki kurallar: 1000 × 1414 tasarım; A3 dikey, 10 mm dış boşluk, `zoom:1.047`; 37/42/26 px iç boşluk ve her gazete sayfasında `break-after:page`.
- Referans baskıda bütün sayfaları açıp toolbar/gezinme/pencereleri gizler. CSS'in sonraki bloklarını dikkate almak gerekir; ilk görülen `@page` tek başına son ölçüyü açıklamaz.
- Editör 1000 birim tuvali gerçek sayı ölçüsüne çevirir; `@page` tam mm ölçüsü ve sıfır dış boşluk kullanır. İç boşluk modelin parçasıdır; varsayılan 34 birim A3'te yaklaşık 10 mm. Sayfa sırası model sırasıdır, kılavuz/seçim/akıllı çizgi/editör/dialog baskıda gizlenir.
- Yeni metin akışı editör, okuma ve baskıda aynı `Paper` üzerinden oluşturulur. Taşma düzeltmeden uygulamanın PDF komutu ilerlemez. Terminal `check` ölçüm yapmaz; tarayıcı `issue:verify` ile gerçek paket/PDF kontrolü gerekir.

Referans HTML'in iki dildeki dosyalarının SHA-256 özetleri önceki incelemeyle aynı kaldı. Referansın görselleri, fontları ve HTML'i uygulamaya kopyalanmadı.
