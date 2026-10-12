# Yeni Codex sohbetinden gazete üretme

Codex'te bu projenin klasörünü seçip yeni bir sohbet açın. Skill `.agents/skills/rtai-newspaper/SKILL.md` içinde, proje kapsamındadır; ayrıca genel skill kurulumu gerekmez. Başka bilgisayarda depoyu klonlayın, `npm ci` çalıştırın ve Codex'i klonladığınız klasörde açın.

Codex `.agents/skills` dizinlerini keşfeder; skill'i `$rtai-newspaper` ile açıkça çağırabilirsiniz. Görünmüyorsa Codex'i yeniden başlatın. Kaynak: [OpenAI — Build skills](https://learn.chatgpt.com/docs/build-skills). Skill adı seçiciye gelmezse aşağıdaki prompttaki dosya yolunu okuma talimatı iş akışını açıkça belirtir.

## Kopyalanabilir deneme promptu

```text
$rtai-newspaper

Bu proje klasöründe .agents/skills/rtai-newspaper/SKILL.md ve docs/TERMINAL-WORKFLOW.md dosyalarını okuyup uygula.

19–25 Ekim 2026 için MERCEK adlı, üç sayfalık A3 dikey bir deneme gazetesi üret. Lorem Ipsum gövde yazıları ve kısa Türkçe örnek başlıklar kullan; içeriği açıkça örnek yayın olarak etiketle.

Kapakta güçlü bir manşet ve renkli rakam şeridi, ikinci sayfada görsel çevresinde akan metin ve alıntı bloğu, üçüncü sayfada ajanda kartları olsun. Yeni bir görsel dilini dene. Kullanılacak gerçek görsel yoksa yerel bir örnek kompozisyon ya da düzenlenebilir görsel yer tutucusu kullan.

Başlık, metin, görsel, altyazı ve şekiller editörde ayrı ayrı düzenlenebilir kalsın. Tam yazıları sayfa kutularından ayrı sakla ve önizlemede açılacak şekilde bağla. Uygulama kaynaklarını değiştirmeden mevcut üretim araçlarını kullan.

Sonucu .local/issues/yeni-sohbet-denemesi/ içinde yeni isimli bir .rtai.zip olarak oluştur; mevcut dosyaların üzerine yazma. Paket kontrolünü ve gerçek editör/PDF doğrulamasını çalıştır, sayfaları görsel olarak incele ve taşmaları düzelt. Sonunda açacağım paketin yolunu ve gerçekten yapılan kontrolleri bildir.
```

Tarih, gazete adı, sayfa sayısı, renkler ve içerik isteğini değiştirebilirsiniz. Özel tasarım tam proje modeli ve `pack` ile oluşturulabilir; hazır `new` yerleşimleriyle sınırlı değildir. Gerçek metin/görselleri kullanacaksanız girdileri `.local/` altında sağlayıp promptta yollarını belirtin.

## Elle düzenlenen gazeteyi revize etme

Editörden **Paketi indir** ile son halini alın ve `.local/` içine koyun. Önceki üretilmiş sayı yerine son düzenlediğiniz paketi kullanın. Örnek:

```text
$rtai-newspaper

.local/issues/benim-duzenlemem.rtai.zip paketini yeni bir klasöre aç. Yalnızca ikinci sayfanın alıntı bloğunu yeşilden bordo tonlarına dönüştür. Metinleri, görselleri, kimlikleri ve diğer sayfaları koru. Değişmeyen sayfaları özgün paketle karşılaştır. Sonucu yeni isimli .rtai.zip olarak paketle; editör/PDF kontrolünden geçirip çıktı yolunu bildir. Uygulama kaynaklarını değiştirme.
```

## Editörde deneme

1. `npm run dev` ile editörü açın. Mevcut çalışmanız varsa **Paketi indir** ile yedekleyin.
2. **Paket aç** ile Codex'in ürettiği `.rtai.zip` dosyasını seçin.
3. Başlığı seçip **Haberden gelen metin** alanını değiştirin; görseli taşıyın ve renkli zeminin **Dolgu** rengini düzenleyin.
4. İkinci sayfanın görselindeki metin sarma seçeneğini ve yazı ayrıntısı önizlemesini deneyin.
5. Son halini **Paketi indir** ile yeni bir dosya olarak dışa aktarın.

Kartlar/şeritler ayrı metin, görsel ve şekillerden oluşur; grup halinde taşıma henüz yoktur. Uzayan metin kutuya sığmayabilir; taşma uyarısını düzeltin. Skill bu uygulamaya ait modelleri/araçları kullanır; gazete üretim çıktıları `.local/` içinde Git dışında kalır.
