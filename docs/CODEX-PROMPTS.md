# Yeni Codex sohbetinden gazete üretme

Bu depoda Codex keşif girişi hazırdır. Atölye olmayan bilgisayarda yalnızca bağımsız `skills/rtai-newspaper/` klasörünü kullanıcı skill dizinine kurun; [kurulum](TERMINAL-WORKFLOW.md). Node.js 22.12+ gerekir, npm/React/Atölye kurulumu gerekmez. Üretim için kendi Codex hesabınızı kullanın.

Codex `.agents/skills` dizinlerini keşfeder; skill'i `$rtai-newspaper` ile açıkça çağırabilirsiniz. Görünmüyorsa Codex'i yeniden başlatın. Kaynak: [OpenAI — Build skills](https://learn.chatgpt.com/docs/build-skills). Skill adı seçiciye gelmezse aşağıdaki prompttaki dosya yolunu okuma talimatı iş akışını açıkça belirtir.

## Kopyalanabilir deneme promptu

```text
$rtai-newspaper

Kurulu rtai-newspaper skill'inin kılavuzlarını ve kendi üretim betiğini kullan.

19–25 Ekim 2026 için MERCEK adlı, üç sayfalık A3 dikey bir deneme gazetesi üret. Lorem Ipsum gövde yazıları ve kısa Türkçe örnek başlıklar kullan; içeriği açıkça örnek yayın olarak etiketle.

Kapakta güçlü bir manşet ve renkli rakam şeridi, ikinci sayfada görsel çevresinde akan metin ve alıntı bloğu, üçüncü sayfada ajanda kartları olsun. Yeni bir görsel dilini dene. Kullanılacak gerçek görsel yoksa yerel bir örnek kompozisyon ya da düzenlenebilir görsel yer tutucusu kullan.

Başlık, metin, görsel, altyazı ve şekiller editörde ayrı ayrı düzenlenebilir kalsın. Tam yazıları sayfa kutularından ayrı sakla ve önizlemede açılacak şekilde bağla. Uygulama kaynaklarını değiştirmeden mevcut üretim araçlarını kullan.

Sonucu .local/issues/yeni-sohbet-denemesi/ içinde yeni isimli bir HTML olarak oluştur; mevcut dosyaların üzerine yazma. Tek HTML çevrimdışı okunabilsin ve Atölye'ye dosyadan eklendiğinde düzenlenebilir kalsın. Skill'in check komutunu çalıştır; tarayıcı olanağı varsa her sayfayı, metin taşmasını, görselleri ve yazı penceresini incele. Atölye bu bilgisayarda yoksa kurmaya çalışma; sonunda HTML yolunu ve gerçekten yapılan kontrolleri bildir. Otomatik yayınlama yapma.
```

Tarih, gazete adı, sayfa sayısı, renkler ve içerik isteğini değiştirebilirsiniz. Özel tasarım tam proje modeli ve `pack` ile oluşturulabilir; hazır `new` yerleşimleriyle sınırlı değildir. Gerçek metin/görselleri kullanacaksanız girdileri `.local/` altında sağlayıp promptta yollarını belirtin.

## Elle düzenlenen gazeteyi revize etme

Editörden **HTML indir** ile son halini alın ve `.local/` içine koyun. Revizyonda son düzenlediğiniz dosyayı kullanın. Örnek:

```text
$rtai-newspaper

.local/issues/benim-duzenlemem.html dosyasını skill'in unpack komutuyla yeni bir klasöre aç. Yalnızca ikinci sayfanın alıntı bloğunu bordo tonlarına dönüştür. Metinleri, görselleri, kimlikleri ve diğer sayfaları koru. Değişmeyen sayfaları özgün dosyayla karşılaştır. Yeni isimli HTML üret, check ve mevcut tarayıcı kontrollerini yapıp yolu bildir. Atölye kurulumu veya otomatik yayınlama yapma.
```

## Editörde deneme

1. `npm run dev` ile editörü açın. Mevcut çalışmanız varsa **Paketi indir** ile yedekleyin.
2. Çalışmalar'da **Dosyadan gazete ekle** ile Codex'in HTML dosyasını seçin.
3. Başlığı seçip **Haberden gelen metin** alanını değiştirin; görseli taşıyın ve renkli zeminin **Dolgu** rengini düzenleyin.
4. İkinci sayfanın görselindeki metin sarma seçeneğini ve yazı ayrıntısı önizlemesini deneyin.
5. Son halini **HTML indir** ile alın; dosyayı yeniden Atölye'ye ekleyebilir veya Codex'e revizyon için verebilirsiniz. `.rtai.zip` de desteklenir.

Kartlar/şeritler ayrı metin, görsel ve şekillerden oluşur; grup halinde taşıma henüz yoktur. Uzayan metin kutuya sığmayabilir; taşma uyarısını düzeltin. Skill bu uygulamaya ait modelleri/araçları kullanır; gazete üretim çıktıları `.local/` içinde Git dışında kalır.
