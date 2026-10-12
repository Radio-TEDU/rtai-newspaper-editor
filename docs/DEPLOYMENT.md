# Statik sunma ve ERP içine gömme

Atölye statik web uygulamasıdır. `npm ci` ve `npm run build` ile `dist/` oluşturulur; bu klasör HTTPS web sunucusunda/CDN'de sunulabilir. `npm run preview` yerel üretim kontrolüdür; canlı sunucu olarak kullanılmaz. [Vite — static deployment](https://vite.dev/guide/static-deploy.html).

Vite `base: './'` kullanır; dosya referansları göreli üretilir ve `/gazete/` gibi alt klasörde çalışır. İç gezinme hash kullanır. `index.html` ve `assets/` birlikte sunulmalıdır. [Vite — relative base](https://vite.dev/guide/build.html#relative-base).

ERP'de örnek:

```html
<iframe src="/gazete/" title="Gazete Atölyesi"
        style="width:100%;height:calc(100vh - 100px);border:0"></iframe>
```

Adres yer tutucudur; gerçek hedef seçilmedi ve canlıya yükleme yapılmadı. Yerelde statik dosyalar aynı origin'de alt yolda iframe içinde açıldı; oluşturma, Çalışmalar'a dönüş ve yenilemede kayıt test edildi. Gerçek ERP'nin stilleri, başlıkları ve kullanıcı oturumu bu denemeye dahil değildir.

Sunucunun `Content-Security-Policy: frame-ancestors` ve/veya `X-Frame-Options` politikası ERP origin'inden gömmeye izin vermelidir. ERP `sandbox` kullanıyorsa JavaScript, origin/depolama, dosya indirme ve modal/yazdırma davranışları seçilen izinlerle değerlendirilmelidir. Gelen gazete HTML'i bu iframe'de çalıştırılmaz; Atölye'ye veri olarak içe aktarılır. [MDN — iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe).

Çalışmalar şu an hesap/sunucuya yüklenmez; aynı tarayıcı profili ve origin'de kalır. Iframe'de tarayıcı depolama politikaları geçerlidir. Farklı cihaz/hesap/ortak gazeteler için ileride ERP saklama servisi gerekir; şimdiki aktarım yöntemi HTML/.rtai.zip indirme ve eklemedir.

Otomatik yayınlama ve dağıtım workflow'u kurulmadı. ERP mimarisi, hedef ve yetkilendirme geldikten sonra yayınlama ayrı bir adım olarak eklenecek.
