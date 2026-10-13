# İş akışı kullanılabilirlik ve mimari incelemesi

**Tarih:** 13 Ekim 2026

**İncelenen sürüm:** `3516c11`

**Kapsam:** Mevcut uygulama ve bağımsız skill. Bu çalışma bulgu ve öneri kaydıdır; aşağıdaki düzeltmeler uygulanmadı.

Üretim → Atölyeye yükleme → elle düzenleme → HTML yeniden açma → PDF akışı çalışıyor ve önceki kontroller geçti. Buna rağmen çoklu gazetede doğru bağlamı koruma, hata sonrası devam edebilme, metnin içerik kaynağı ve aynı dosyanın revizyonlarını yönetme açısından düzeltilmesi gereken noktalar var. Mimariyi yeniden kurmak gerekmiyor; önce kullanıcıya görünen tutarsızlıklar, ardından ortak iş kuralları ele alınmalı.

## İnceleme yöntemi ve kanıt düzeyi

- `Workspace`, `App`, `useEditor`, `storage`, model/yerleşim, özellikler, okuyucular, HTML/ZIP, CLI ve skill eşitleme kodu incelendi.
- Açık Atölyede ikinci haber kutusu seçilip Haber sekmesine geçildi. Panelin ilk haberde kaldığı görüldü. Yazı ve geometri değiştirilmedi; önceki seçim/sekme geri getirildi.
- Önceki HTML, uzun metin ve PDF kontrollerinin kayıtları dikkate alındı. Bunlar olumlu temel akış kanıtıdır; aşağıdaki bütün senaryoları kapsamaz.
- Bu incelemede otomatik test takımları tekrar çalıştırılmadı. Kullanıcı deposunda bozuk kayıt, kota veya eşzamanlı sekme hatası oluşturulmadı. Performans ölçümü, gerçek dokunmatik cihaz ve ekran okuyucu testi yapılmadı.

**Kanıt etiketleri:** “UI + kod” bu oturumda arayüzde doğrulanan davranış; “kod” doğrudan mevcut kontrol/işlem yolundan çıkan davranış; “risk” ek hata veya yük senaryosu gerektiren değerlendirme; “tasarım” bir ürün tercihi/iyileştirme önerisidir. Kod bulgusu, yeniden üretim adımları verilse bile bu oturumda bütün adımların çalıştırıldığı anlamına gelmez.

**Öncelikler:** P1 gerçek kullanım/ERP öncesi ele alınmalı; P2 yakın geliştirme turunda; P3 kullanım ve ölçek ihtiyacına göre. P0 düzeyinde doğrulanmış kritik bulgu yoktur. Öncelik olasılık ve etkiye ilişkin mühendislik değerlendirmesidir.

## Bulguların özeti

| No | Öncelik | Alan | Bulgu | Kanıt |
| --- | --- | --- | --- | --- |
| R01 | P1 | Akış ve mimari | Haber rotası gazete kimliği taşımıyor; aktif çalışmaya bağımlı. | Kod |
| R02 | P1 | Hata toparlama | Kayıtsız/geçici oturumda dosya indirmek editörden güvenli ayrılma yolu açmıyor. | Kod |
| R03 | P2 | Kullanılabilirlik | Seçilen haber kutusu ile Haber panelinin aktif yazısı eşleşmiyor. | UI + kod |
| R04 | P2 | Hata toparlama | Dosya hatası yeni dosya ekleme ve yeni gazete kontrollerini de kapatıyor. | Kod |
| R05 | P2 | İçerik mantığı | Bağımsız metne geçerken son görünen yazı yerine eski öğe metni dönebiliyor. | Kod |
| R06 | P2 | İçerik mantığı | Genel Haber ekle işlemi seçili kutunun bağlantısını örtük değiştiriyor. | Kod |
| R07 | P2 | Sürüm ve akış | Aynı dosyanın kopyaları aynı adla birikiyor; revizyon niyeti açık değil. | Tasarım + kod |
| R08 | P2 | Yerleşim mantığı | Geometri dışı özellik değişikliği de güvenli yerleşim aramasına giriyor. | Kod; koşullu senaryo |
| R09 | P2 | Kontrol tutarlılığı | Sayısal alan sınırları model sınırlarıyla uyuşmuyor. | Kod |
| R10 | P2 | Geçmiş | Yazma adımları gruplanmıyor; geçmiş proje kopyaları ve eski zaman bilgisi taşıyor. | Kod + risk |
| R11 | P2 | Medya | Kullanılmayan görsellerin yaşam döngüsü/temizliği tanımlı değil. | Kod + risk |
| R12 | P2 | Kayıt dayanıklılığı | Tek bozuk proje bütün çalışma listesinin yüklenmesini durdurabilir. | Kod; hata koşulu |
| R13 | P2 | Mimari tekrar | React ve bağımsız HTML okuyucularında sunum/hazırlık kuralları yineleniyor. | Kod |
| R14 | P2 | Dağıtım ve tekrar | İki CLI ve metin dilimleyen eşitleme işlemi sözleşme kaymasına açık. | Kod + risk |
| R15 | P2 | Mimari tekrar | Kayıt, açma ve medya koordinasyonu farklı girişlerde ayrı yönetiliyor. | Kod + risk |
| R16 | P3 | Ölçek | Bütün projeler ve gerçek kapaklar ana sayfada yükleniyor. | Kod; ölçüm bekliyor |
| R17 | P2 | Çıktı deneyimi | PDF ön kontrolü sorun sayısını söylüyor; sorunlu kutuya götürmüyor. | Kod + tasarım |
| R18 | P3 | Erişilebilirlik | Temel klavye desteği var; panel/tab/numara girişleri ve küçük ekran deneyimi tamamlanmalı. | Kod + tasarım |

## İş akışı ve hata sonrası devam

### R01 Haber adresi doğru gazeteyi belirlemiyor

**Kaynak:** [Workspace.tsx](../src/Workspace.tsx) `boot/open`; [App.tsx](../src/App.tsx) `openArticle`, route effect ve `preview` başlangıcı; [Reader.tsx](../src/components/Reader.tsx) bağlantı kopyalama.

Adres `#haber/<articleId>` biçiminde. Gazete kimliği yok. İlk açılışta Workspace bu rotada `loadProject()` çağırıp son aktif gazeteyi yükler. İçe aktarma/çoğaltma sayfa ve yazı kimliklerini koruduğundan iki ayrı gazetede aynı yazı kimliği bulunabilir. A'dan kopyalanan haber adresi B aktif olduktan sonra yeniden açılırsa B'deki farklı revizyonu gösterebilir veya yazı bulunamaz. Bu, sunucu/uzak paylaşım özelliğinin yokluğundan ayrı bir **yerel proje bağlamı** sorunudur.

Ek tutarsızlık: Workspace `#okuma` rotasını tanıyor; `open()` bu hash'i `#duzenle/<id>` ile değiştiriyor ve App'in ilk `preview` değeri yalnız `#haber/` için true. Okuma rotasını yenilemek okuma modunu korumuyor. Workspace proje rotalarını yalnız ilk açılışta değerlendiriyor; App'in hash/popstate işleyicisi ise sadece haber kısmını yönetiyor.

**Öneri:** Proje/ekran/yazı bağlamını tek rota sözleşmesine almak; örneğin `#gazete/<projectId>/haber/<articleId>`. Bu örnek mevcut implementasyon değildir. Eski hash'ler için açık uyumluluk davranışı tanımlanmalı. Görünüm ve adres iki ayrı otorite olmamalı.

**Kabul:** A ve B aynı yazı kimliğini kullansa da A'nın bağlantısı A'yı açar. Okuma yenileme ve ileri/geri gezinme doğru ekranı/projeyi korur. Proje yoksa başka gazeteyi sessizce açmak yerine anlaşılır sonuç verilir.

### R02 Geçici çalışmadan çıkış kurtarma akışı eksik

**Kaynak:** [Workspace.tsx](../src/Workspace.tsx) `onTemporary`; [App.tsx](../src/App.tsx) `persistCurrent`, `goHome`, `newIssue`, `importProject`, `exportProject`.

Depolama kullanılamazsa “Kaydetmeden gazete oluştur” editörü `saveEnabled=false` ile açıyor. `persistCurrent()` bu durumda her zaman hata veriyor. Çalışmalar'a dönüş, yeni sayı ve dosya açma önce bu fonksiyonu çağırdığı için engelleniyor. HTML/ZIP indirilebiliyor fakat indirme sonrasında oturumu güvenli terk etmeyi sağlayan bir durum veya kontrol yok. Kota hatasında da dosyayla kurtarma mümkün olsa bile başarısız kayıt ana sayfaya dönmeyi engelleyebilir.

**Öneri:** Yerel kayıt hatası ile editörden ayrılma kararını ayırmak. “Dosya olarak yedekle” ve ardından açık bir “Bu oturumu terk et” yolu sağlamak; normal geçişte kayıt zorunluluğunu korumak. Dosyanın diske gerçekten kaydedildiğini yalnız indirme tetiklendi diye kesin kabul etmemek.

**Kabul:** Geçici kullanıcı yedek alıp ana sayfaya dönebilir. Bekleyen/kayıtsız veri kullanıcıya açık gösterilir. Sessiz veri kaybı olmadan kurtarma yapılır; çalışmanın indirilebilmesi bozuk kayıt sisteminin düzelmesini beklemez.

### R04 Bir dosya hatası bütün oluşturma akışını durduruyor

**Kaynak:** [WorkspaceHome.tsx](../src/components/WorkspaceHome.tsx) `disabled={busy || !!error}`; [Workspace.tsx](../src/Workspace.tsx) `run` ve `boot`.

Geçersiz dosya açma hatası `error` durumuna yazılıyor. Aynı error yeni gazete, şablon ve dosya seçiciyi devre dışı bırakıyor. Kullanıcı hemen doğru dosyayı seçemiyor; önce “Yeniden dene” ile çalışma alanı başlangıcını yeniden çalıştırmalı. Depolama hatası için anlamlı olabilecek engel, yanlış HTML seçme gibi tek işlem hatalarına da uygulanıyor. “Kaydetmeden gazete oluştur” önerisi bu durumda asıl problemin türünü yanlış anlatıyor.

**Öneri:** Başlangıç/depolama hatası, tek dosyanın doğrulama hatası ve son işlemin hatasını ayrı durumlarda tutmak. İşlem hatası bildirimle kapatılabilir olmalı; yeni dosya seçimi engellenmemeli.

**Kabul:** Hatalı dosyadan sonra doğru dosya doğrudan seçilir. Mevcut işler açılabilir. Geçici çalışma seçeneği dosya bozukluğu yerine gerçekten depolama kullanılamadığında sunulur.

### R07 Kopya ve revizyon niyeti yeterince görünür değil

**Kaynak:** [Workspace.tsx](../src/Workspace.tsx) `onImport`; [App.tsx](../src/App.tsx) proje dosyası/yeni sayı kontrolleri; [WorkspaceHome.tsx](../src/components/WorkspaceHome.tsx) kartlar.

İçe aktarma her seferinde yeni proje kimliği oluşturuyor; önceki işi koruması olumlu. Ancak ad aynı kalıyor ve kartlarda revizyon ilişkisi görünmüyor. Kullanıcının “son düzenlenmiş dosyayı aç” isteği ile “bağımsız yeni kopya ekle” isteği ürün düzeyinde ayırt edilmiyor. Yeni gazete ve şablon oluşturma hem ana sayfada hem editörde var. “Paket aç” kontrolü HTML de kabul ediyor; ana sayfadaki “Dosyadan gazete ekle” ile terminoloji farklı.

**Öneri:** İçe aktarmanın varsayılanını kayıpsız kopya olarak korumak, “yeni kopya” sonucunu açık göstermek ve ad/son düzenleme/revizyon bilgisiyle ayırmak. “Mevcut çalışmanın yeni sürümü” ileride eklenirse açık hedef, karşılaştırma ve geri dönüş gerekir; otomatik üzerine yazma önerilmiyor. Dosya ve gazete terimleri aynı anlamda kullanılmalı.

**Kabul:** Kullanıcı hangi dosyanın yeni kopya olduğunu ve hangi kartın son çalışma olduğunu anlayabilir. HTML ve ZIP aynı dosya açma kontrolünden ulaşılabilir. Revizyon açma eski çalışmayı sessizce ezmez.

## İçerik düzenleme mantığı

### R03 Seçili kutu ile Haber paneli farklı yazıları gösteriyor

**Kaynak:** [App.tsx](../src/App.tsx) `activeArticle`, `active`, Paper `onSelect` ve Haber tabının `setRightTab`; [Paper.tsx](../src/components/Paper.tsx).

`activeArticle` ilk yazıyla başlatılıyor. Tuval seçimi sadece `selectedId` değiştiriyor. Haber sekmesine geçiş seçili öğenin `articleId` değerini aktarmıyor.

**Bu oturumdaki gözlem:** “Küçük bir mola” başlık kutusu seçiliyken Haber panelindeki başlık “Yeni hafta, yeni başlangıç” oldu. Kullanıcı kutudan içeriğe geçtiğini düşünerek farklı yazıyı düzenleyebilir. Yerel kanıt görüntüsü `.local/reviews/13-ekim/haber-baglam-uyumsuzlugu.jpg` içinde; kullanıcı içeriği Git'e alınmadı.

**Öneri:** Seçili öğe bir yazıya bağlıysa Haber paneline geçişte o yazıyı açmak; bağımsız kutuda bağlamı açık göstermek. Manuel Haber seçimi ile tuval seçiminin hangi durumda öncelikli olacağı tanımlanmalı.

**Kabul:** İkinci haber seçilince Haber sekmesi ikinci haberi gösterir. Seçimsiz/bağlantısız durumda ilk yazıya sessiz yönlenmek yerine anlaşılır boş/bağımsız bağlam vardır.

### R05 Haber bağını kaldırmak son görünen metni korumuyor

**Kaynak:** [Properties.tsx](../src/components/Properties.tsx) “Bağlı haber” ve “Tuvale yansıtılan alan”; [model.ts](../src/model.ts) `elementText`.

Bağlı kutunun görünür metni `Article` alanından geliyor; `element.text` eski değeri tutabiliyor. “Bağımsız metin” seçilince sadece `articleField` kaldırılıyor; bağlantı kaldırılırken de mevcut görünür metin öğeye kopyalanmıyor. Böylece kullanıcı yeni başlığı güncelledikten sonra bağlantıyı ayırırsa eski başlık yeniden görünebilir. Tam Article silinmiyor fakat kutunun görünür içerik geçişi beklenmedik.

**Öneri:** İçerik kaynağını değiştirme işlemi mevcut efektif metni hesaplayıp bağımsız metne aktarmalı; bilerek eski metne dönme ayrı işlem olmalı.

**Kabul:** Başlığı değiştir → bağımsız metne geç adımlarında son görünen başlık korunur. Geri al eski bağlantı ve metni birlikte geri getirir.

### R06 Genel Haber ekle mevcut seçimi örtük yeniden bağlıyor

**Kaynak:** [App.tsx](../src/App.tsx) `createArticle` ve Haber panelindeki “Haber ekle”; [Properties.tsx](../src/components/Properties.tsx) “Yeni haber oluştur ve bağla”.

İki farklı etiket aynı `createArticle()` fonksiyonunu çağırıyor. Fonksiyon, seçili ve kilitsiz öğe varsa onun `articleId` değerini yeni yazıya değiştiriyor. Genel Haber ekle düğmesini kullanan kişi eski seçimin hâlâ etkin olduğunu fark etmeyebilir. Seçili kutu spot/gövdeyse yeni başlık o kutunun metninden üretiliyor ve mevcut `articleField` yeni yazının varsayılan alanına bağlanıyor. İşlem niyeti belirsiz.

**Öneri:** `createArticle()` ile `createArticleAndBind(elementId)` komutlarını ayırmak. Genel yeni yazı işleminde mevcut kutu bağlantısına dokunmamak; açık bağlama işleminde tür/alan ve kullanılacak başlangıç içeriğini belirlemek. Ortak düşük seviyeli yardımcı kullanılabilir.

**Kabul:** Genel Haber ekle seçili kutunun önceki yazısını değiştirmez. “Oluştur ve bağla” seçilen kutuya açık biçimde bağlar, tek geri alma adımıdır.

Ek tasarım noktası: Aynı Article alanına birden çok kutu bağlanabilir. Sağ panelden düzenlemenin diğer kutuları da güncellediği kullanıcıya bağlı öğe sayısı/bağlantı bilgisiyle görünür olmalı; bu ortak içerik davranışı hata olarak kaldırılmamalı.

## Tuval ve özellik paneli

### R08 Renk veya ad değişikliği de yerleşimi değiştirebilir

**Kaynak:** [useEditor.ts](../src/useEditor.ts) `updateElement`; [layout.ts](../src/layout.ts) `placeSafely`.

Her özellik yaması `clampRect` ve `placeSafely` üzerinden geçiyor. Geometri, metin, ad, renk ve kilit değişikliği arasında ayrım yok. Örtüşen bir tasarım güvenli moda alındığında sayfa başlangıçta yeniden kurulmaz; sonrasında yalnız renk/ad değiştirmek bile o öğenin boş yere taşınmasına veya işlemin reddedilmesine neden olabilir. Geçerli çakışmasız başlangıçta bu sorun ortaya çıkmaz; koşullu bir mantık bulgusudur.

**Öneri:** Geometriyi/engel durumunu etkileyen yamalarla sunum/meta veri yamalarını ayırmak. Güvenli moda geçişte mevcut çakışmalar ayrıca raporlanmalı; sıradan stil değişikliği konumu örtük değiştirmemeli.

**Kabul:** Renk veya öğe adı değiştirmek x/y/width/height değerlerini değiştirmez. Sarma/geometri değişikliği için güvenli yerleşim korunur; çakışma düzeltmesi açık kullanıcı işlemi olur.

### R09 Sayısal alanlar bütün desteklenen modele erişemiyor

**Kaynak:** [Properties.tsx](../src/components/Properties.tsx) `NumberField` ve konum alanları; [validation.ts](../src/validation.ts); [model.ts](../src/model.ts) `clampRect`.

Y ve Yükseklik alanları `NumberField` varsayılanı olan 2000'i kullanıyor. Modelde özel ölçü 100 × 900 mm olabilir; bu durumda tuval 9000 birim yüksekliğinde. Panel desteklenen sayfanın alt bölgesine konum veremiyor. Şekil genişliği modelde 1 olabilir; özellik panelinin Genişlik alt sınırı bütün türlerde 10. Bir birimlik dikey çizgi aynı alan üzerinden hassas düzenlenemiyor. Değerler ayrıca iki basamakla gösterilip her onChange'de sınırlandırılıyor; ara değer yazma hissi cihaz/klavyeyle gözden geçirilmeli.

**Öneri:** Sınırları `pageHeight`, öğe türü ve ortak model sabitlerinden türetmek. İnce şekil genişliğinde 1'i korumak. Sayısal girişlerin ara metnini gerekirse odak kaybına kadar yerel tutmak.

**Kabul:** Desteklenen özel sayfanın tamamında X/Y ve boyut ayarlanabilir. Bir birim çizgi panelde korunabilir. Geçersiz girdi modeli bozmaz ve kontrol beklenmedik sayı üretmez.

### R10 Geçmiş yazı yazma adımlarını gruplayamıyor

**Kaynak:** [useEditor.ts](../src/useEditor.ts) `mutate`, `checkpoint`, `undo/redo`; [App.tsx](../src/App.tsx) input onChange'leri; [storage.ts](../src/storage.ts) sıralama.

Sürükleme tek checkpoint ile doğru gruplanıyor. Metin alanlarının her onChange'i ise bütün projeyi kopyalayıp ayrı geçmiş girdisi ekliyor. 60 karakterlik yazma, 60 adımlık kapasiteyi doldurabilir; önceki anlamlı işlemler geçmişten düşer. Büyük makale ve yoğun sayfada bellek/CPU etkisi ölçülmeli. Görseller anlık görüntülere Base64 olarak gömülmediği için risk bütün medya boyutuyla aynı değildir.

Undo eski Project'i `updatedAt` değeriyle geri getiriyor. Çalışma gerçekten yeni değiştirilmiş olsa da listede daha eski bir zaman/sıra alabilir.

**Öneri:** Metin girişini odak veya kısa zaman penceresiyle anlamlı geçmiş adımı haline getirmek; geri alırken içerik anlık görüntüsünü geri getirip kayıt zamanını güncel tutmak. Önce gruplayarak kazanım ölçülmeli; daha karmaşık patch tabanlı geçmiş ancak ihtiyaç varsa düşünülmeli.

**Kabul:** Bir yazı düzenleme oturumu tek veya birkaç anlaşılır adımda geri alınır; önceki taşıma adımı kaybolmaz. Geri al/yinele sonrası yerel listede değişiklik zamanı tutarlıdır. Büyük proje için ölçülmüş kaynak kullanımı vardır.

### R17 PDF ön kontrolü düzeltilecek yere götürmüyor

**Kaynak:** [App.tsx](../src/App.tsx) `printIssue`; [Paper.tsx](../src/components/Paper.tsx) taşma işareti; [html-document.ts](../src/html-document.ts) okuyucu status'u.

Taşmada PDF'yi durdurmak doğru. Ancak mesaj yalnız kutu sayısını söylüyor. Çok sayfalı gazetede kullanıcı hangi sayfa/öğeyi düzelteceğini aramak zorunda. HTML dışa aktarma taslak/taşma durumunda mümkün; bu kurtarma için korunmalı fakat dosyanın baskıya hazır olmadığı daha açık gösterilebilir.

**Öneri:** Sayfa adı, öğe adı ve nedenden oluşan ön kontrol listesi; tıklayınca kutuyu seçip görünür hale getirme. Eksik görsel, taşma ve baskı hazırlığı tek özet üzerinden anlaşılmalı; yedek HTML/ZIP indirme bloklanmamalı.

**Kabul:** Üçüncü sayfadaki taşmaya mesajdan tek adımda ulaşılır. Kullanıcı bütün sayfaları aramaz. Hatalı taslak yine yedeklenebilir; “yedeklendi” ile “baskıya hazır” farklı durumlar olarak görünür.

### R18 Erişilebilirlik ve küçük ekran deneyimi tamamlanmalı

**Kaynak:** [Paper.tsx](../src/components/Paper.tsx) öğe/tutamaçlar; [App.tsx](../src/App.tsx) tablist ve global kısayollar; [Properties.tsx](../src/components/Properties.tsx); [useCanvasNavigation.ts](../src/useCanvasNavigation.ts).

Öğeler odaklanabilir, ok tuşlarıyla taşınabilir ve Alt+ok ile boyutlandırılabilir. Bunlar korunmalı. Tutamaçlar `role=presentation`; panel tablarında tablist/aria-selected var fakat tam tab–tabpanel ilişkisi ve roving tabindex/ok tuşu gezinmesi yok. Global ok tuşu işleyicisi metin alanlarını hariç tutuyor; panel düğmesi/tab gibi başka kontrol bağlamlarında seçili öğeyi hareket ettirme davranışı ayrıca gözden geçirilmeli. Her kutu ayrı tab durağı olduğundan yoğun sayfada gezinme uzayabilir.

Küçük görünümde iki panel tuvalin büyük bölümünü kaplıyor; sığdırma gazeteyi çok küçültebiliyor. Panelleri gizleme ve zoom zaten var; kullanıcıya bunların bulunabilirliği ve tek özellik çekmecesi gibi seçenekler gerçek denemeyle değerlendirilmeli. Bu oturumda erişilebilirlik standardına tam uyum veya gerçek touch başarısızlığı iddia edilmiyor.

**Kabul:** Tab/Shift+Tab ve panel ok tuşları tutarlı; panel etiket/ilişkileri tamamlanmış. Klavyeyle boyutlandırma açıkça anlatılmış. Gerçek dokunmatik ve ekran okuyucu senaryoları, küçük ekran taşması yanında görev tamamlama açısından test edilmiş.

## Mimari ve gereksiz tekrarlar

### R11 Kullanılmayan medyanın temizliği eksik

**Kaynak:** [App.tsx](../src/App.tsx) `uploadImage`, `pendingMedia`, `resetMedia`; [storage.ts](../src/storage.ts) `saveProject/deleteProject`; [project-package.ts](../src/project-package.ts) `assetIds`.

Görsel değiştirme yeni assetId üretir. Aktif görsel kimlikleri dışa aktarılır fakat önceki kayıtlar otomatik silinmez. Modelden silinen öğenin Blob'u ve Object URL'si açık oturumda kalabilir; kalıcı medya proje silinene kadar birikebilir. Başarısız yerleştirmeden önce oturum medyasına eklenmiş veri de aktif modele bağlanmadan kalabilir. Uzun üretim oturumunda kota/bellek baskısı ihtimali var; büyüklüğü ölçülmedi.

**Öneri:** Medya referanslarının mevcut proje, geri al/yinele ve geçici işlem tarafından kullanılıp kullanılmadığını sayan yaşam döngüsü. Geçmişten hâlâ geri getirilebilecek görseli hemen silmemek. Başarısız ekleme geçici verisini temizlemek. Kalıcı temizlik ayrı, güvenli işlem olmalı.

**Kabul:** Gereksiz görsel ve Object URL birikimi sınırlandırılmıştır; görsel değiştirme/silme sonrası undo çalışır. Kaydetme hatasında kurtarma ve eski medya korunur.

### R12 Tek geçersiz kayıt bütün listeyi durdurabilir

**Kaynak:** [storage.ts](../src/storage.ts) `listProjects`; [Workspace.tsx](../src/Workspace.tsx) başlangıç hata yolu.

`listProjects()` bütün kayıtları `map(validateProject)` ile doğrular. Bir kaydın doğrulaması hata verirse bütün liste çağrısı reddedilir. Başka sağlam gazeteler de ana sayfada görünmez. Bu durum kullanıcı profilinde oluşturulmadı; bozuk/uyumsuz bir kalıcı kayıt koşulundan çıkan kod davranışıdır.

**Öneri:** Kayıt bazında doğrulama; bozuk işi kayıpsız karantinada/ayrı hata kartında göstermek, sağlam işleri açmak. Kayıtları sessiz silmemek ve kurtarılabilecek ham veriyi yerel olarak dışa alacak yol düşünmek.

**Kabul:** Tek hatalı kayıt başka gazetelerin açılmasını engellemez. Hatalı kayıt kimliği ve neden anlaşılır; güvenilir veri kendi başına korunur. Migration bu davranıştan ayrı olarak test edilir.

### R13 İki görüntüleme ortamında aynı kurallar farklı kodla yazılmış

**Kaynak:** [Paper.tsx](../src/components/Paper.tsx), [Reader.tsx](../src/components/Reader.tsx), [PrintView.tsx](../src/components/PrintView.tsx), [html-document.ts](../src/html-document.ts), ilgili CSS dosyaları.

Atölyede ortak Paper kullanılması doğru bir tekrar azaltımıdır. Bağımsız HTML'de React kullanılmaması da gerekli. Ancak öğe stil üretimi, font seçimi, okuyucu/dialog, metin taşma hazırlığı ve baskı CSS'i React tarafı ile HTML üreteci arasında yeniden yazılıyor. Ortak `layoutText` kullanımı bu farkı azaltıyor ama bütün sunum sözleşmesini ortaklaştırmıyor.

**Öneri:** React'i skill'e bağımlılık yapmak yerine framework bağımsız sunum sabitleri/öğe stil tanımı, yerleşim hazırlığı ve çıktı sözleşmesi paylaşılmalı. İki adapter ve dialog davranışı gerektiği kadar ayrı kalabilir. Aynı örnek dosyanın iki ortamda görünüm/geometri/akış eşitliğini kontrol eden testler eklenmeli.

**Kabul:** Font/kenarlık/sarma/baskı kuralı değişikliği iki yerde elle aranmaz. Portable HTML React/npm istemez. Metin, görünürlük, görsel yerleşimi ve fiziksel boyut iki çıktıda tutarlı kalır.

### R14 CLI ve eşitleme hattı kırılgan tekrar taşıyor

**Kaynak:** [scripts/newspaper.mjs](../scripts/newspaper.mjs), [portable CLI](../skills/rtai-newspaper/scripts/newspaper.mjs), [sync-skill.mjs](../scripts/sync-skill.mjs), [project-model.mjs](../scripts/lib/project-model.mjs), [serve-tests.mjs](../scripts/serve-tests.mjs), [standalone.test.mjs](../scripts/standalone.test.mjs).

Kök CLI ve portable CLI'de seçenek çözme, new/pack/unpack/check, çıktı üzerine yazmama ve hata mesajları ayrı yazılmış. Kök araç daha geniş HTML/ZIP desteği taşıyor; ikisinin tamamen aynı olması şart değil, fakat ortak komut kuralları değişince iki yerde bakım gerekiyor.

Eşitleme `issue-package.mjs` içinden fonksiyonları `indexOf/slice` ile çıkarıyor. Fonksiyon sırası veya isimleri değişirse üretim hattı kırılabilir. Paylaşılan TS modülleri kök CLI'de dinamik transpile edilirken portable tarafta commit edilmiş `.mjs` kullanılıyor. `npm run build` bunları eşitler; E2E test sunucusu ise sadece TS/Vite derler. Portable kopya testi bağımsızlığı doğruluyor ama çalışma dosyalarının kaynakla güncel olduğunu tek başına garanti etmiyor.

**Öneri:** Ön ayar oluşturucusunu zaten import edilebilir bağımsız kaynak modüle ayırmak; metin dilimleme yerine normal modül/bundle üretimi. CLI ortak işlemlerini çekirdeğe almak, HTML/ZIP seçeneklerini adapter bırakmak. Dağıtımda `skill:sync` sonrası kaynak/artifact fark denetimi ve çapraz biçim testi çalıştırmak.

**Kabul:** Kaynak refactor'u sessiz eksik runtime üretmez. Temiz checkout'ta paket tekrar üretilebilir, kaynakla eşleşir ve Atölyesiz çalışır. ZIP desteği olan kök araç ile HTML portable aracı belgede ve `help` çıktısında net ayrılır.

### R15 Kayıt ve dosya açma koordinasyonunun iki sahibi var

**Kaynak:** [Workspace.tsx](../src/Workspace.tsx), [App.tsx](../src/App.tsx), [storage.ts](../src/storage.ts), [WorkspaceHome.tsx](../src/components/WorkspaceHome.tsx).

Ana sayfadan açma ile editörden açma, HTML/ZIP seçimi, yeni kimlik, zaman, medya yükleme ve hata yönetimini ayrı akışlarda yapıyor. Geçişte mevcut editörü kaydetmek sadece editör akışının görevi; bu fark gerekli. İş kurallarının geri kalanı ortak olabilir. Otomatik kayıt `saveQueue` üzerinden, `persistCurrent()` ve yeni çalışma yazıları ayrıca doğrudan storage üzerinden yürütülüyor. Bunların tek koordinasyon noktası olmaması bakım ve yavaş işlem yarışları açısından inceleme ihtiyacı yaratıyor; bu oturumda bir kayıt yarışı yeniden üretilmedi.

Storage her aktif kayıtta hem `project.id` hem `current` anahtarıyla tam Project yazıyor; `active` kimliği de ayrıca tutuluyor. Yeni yükleme `active` üzerinden kimlikli kaydı kullanıyor. `current` eski sürüm migration'ında okunuyor ve uyumluluk kopyası olarak tutuluyor. Bu tekrar hemen silinmemeli; geriye uyumluluk gereksinimi/testler doğrulandıktan sonra tek kimlikli kayıt + aktif işaret yeterli olabilir.

Medya yükleme ve Object URL oluşturma/temizleme de editör ile kapak kartları arasında ayrı uygulanmış. Tek bir dev bileşenle hepsini birleştirmek yerine `useProjectPersistence`, dosya açma komutu ve medya oturumu gibi küçük sorumluluklar öneriliyor. App JSX'inin yoğun tek satırlar halinde yazılması da bu akışları gözden geçirmeyi güçleştiriyor.

**Kabul:** Kopya kimliği, doğrulama ve medya izolasyonu tek komut sözleşmesinden uygulanır. Kayıt/geçiş işlemleri son revizyonun tamamlanmasını tek koordinatörden bekler. Kota ve gecikmiş kayıt testleri iki girişte tutarlıdır. Kullanıcı taslağı korunarak adım adım refactor yapılır.

### R16 Büyük çalışma alanı için kaynak kullanımı ölçülmeli

**Kaynak:** [storage.ts](../src/storage.ts) `getAll/map(validateProject)`; [WorkspaceHome.tsx](../src/components/WorkspaceHome.tsx) her kartın Cover/Paper'ı; [layout.ts](../src/layout.ts) aday x/y ve çakışma döngüleri; [useEditor.ts](../src/useEditor.ts).

Liste bütün proje modelini yükleyip doğruluyor; kapaklar gerçek öğeler ve görsellerle çiziliyor. Arama veri tabanı sorgusu yerine bellekte filtre. Güvenli yerleşim, komşulardan türetilen x/y aday kombinasyonlarını diğer öğelerle karşılaştırıyor. Üst sınırların 100 sayfa/500 öğe olması bu yükte etkileşim garantisi vermiyor.

**Öneri:** Önce 10/50/100 gazete ve yoğun sayfa için açılış/arama/sürükleme ölçümü. Yavaşlık kanıtlanırsa özet kayıt, lazy kapak, metin ölçümü önbelleği veya hedefli yerleşim optimizasyonu. Şimdiden genel worker/uzak servis altyapısı kurmak gerekmiyor.

**Kabul:** Gerçekçi örneklerde ölçülmüş görev süreleri ve bellek kullanımı var; iyileştirme öncesi/sonrası karşılaştırılmış. Gereken optimizasyonlar dosya sözleşmesini değiştirmeden uygulanmış.

## Gereksiz tekrar olarak kaldırılmaması gerekenler

| Yapı | Neden gerekli | İyileştirme sınırı |
| --- | --- | --- |
| `src/` ve dağıtılan skill runtime | Başka bilgisayarda npm/Atölye olmadan çalışma | Üretilmiş kopya korunmalı; drift kontrolü eklenmeli. |
| React Paper ve bağımsız DOM adapter | İki ayrı çalışma ortamı | Ortak sunum kuralları paylaşılmalı; skill React'e bağlanmamalı. |
| HTML ve ZIP | Bağımsız okuma ve kompakt yedek farklı görevler | İçe/dışa aktarım çekirdeği ortak; iki formatın yararı korunmalı. |
| Article ve tasarım metni | Tam yazı ile sayfa özeti farklı olabilir | İçerik kaynağı geçişleri açık ve kayıpsız olmalı. |
| Model ve DOM taşma kontrolü | Hesaplanmış akış ile gerçek tarayıcı/font sonucu farklı kanıtlar | Tek kontrolü kaldırmak yerine ortak preflight sonucu üretmek. |
| Editör/okuma/baskı görünümü | Ayrı kullanıcı görevleri | Yerleşim kuralları ortak kalmalı. |
| Proje kapsamlı medya | Dosya kopyalarında aynı assetId'nin izolasyonu | İçerik bazlı tekilleştirme düşünülürse referans ve silme kuralları korunmalı. |

Aynı dosyanın iki medya kimliğiyle tutulması gerçek bayt tekrarına yol açabilir. Ancak bütün projeler arasında hash depolama katmanı kurmak mevcut küçük kapsam için zorunlu değil; önce R11 yaşam döngüsü ve kaynak ölçümleri ele alınmalı.

## Önerilen uygulama sırası

1. **Bağlam ve hata toparlama:** R01–R04. Proje içeren rota, doğru Haber paneli, hata türleri ve yedek aldıktan sonra güvenli çıkış. Bunlar kullanıcı beklentisini en doğrudan etkiliyor.
2. **İçerik ve düzenleme tutarlılığı:** R05–R10, R17. Bağımsız metne geçiş, açık oluştur/bağla ayrımı, kopya/revizyon açıklığı, stil-geometri ayrımı, alan sınırları, gruplanmış geçmiş ve baskı ön kontrol listesi.
3. **Bakım sınırları:** R11–R15. Medya yaşam döngüsü, kayıt bazında dayanıklılık, paylaşılabilir sunum sözleşmesi, modül tabanlı portable üretim ve tek işlem koordinasyonu. Uygulamanın tamamını yeniden kurmadan küçük parçalar.
4. **Ölçüm ve erişilebilirlik:** R16, R18. Yoğun gerçek örnekler, klavye/ekran okuyucu ve dokunmatik cihazlarla göreve dayalı değerlendirme.

Her parça ayrı ve gözden geçirilebilir commit olmalı. Örnek sonraki commit başlıkları `fix: keep article routes scoped to projects`, `fix: sync article panel with selected element`, `fix: recover workspace after import errors`, `refactor: share newspaper import commands`. Bu incelemede bu commit'ler veya düzeltmeler oluşturulmadı; sadece rapor belgeleniyor.

**Tamamlanma ölçüsü:** Mevcut HTML/ZIP, medya izolasyonu ve PDF kontrolleri korunurken yeni bağlam/hata senaryoları da geçmeli. Yalnız bütün eski testlerin yeşil olması yukarıdaki yeni kabul ölçütlerinin tamamlandığı anlamına gelmez. ERP ve otomatik yayınlama bu düzeltmelerden ayrı, kullanıcının mimari kararını bekleyen kapsamdır.
