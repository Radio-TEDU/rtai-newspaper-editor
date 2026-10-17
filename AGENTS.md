# Ajanlar için (Codex vb.)

Bu depo kendi başına çalışan bir uygulama değil, Gazete Atölyesi editörüne uygulanacak bir tema paketidir.

Kullanıcı temayı kurmanı isterse:

1. `KURULUM.md`'yi baştan sona oku ve adımları sırayla uygula.
2. Değişiklikleri bu depoda değil, kullanıcının editör projesinde yap (`package.json`'ında `"name": "rtai-newspaper-editor"` yazan klasör). Klasörü bulamazsan kullanıcıya sor.
3. Editörün mevcut CSS dosyalarını (`styles.css`, `workspace.css`, `editor-enhancements.css`) değiştirme. Tema tamamen `hub-theme.css` ile uygulanır.
4. `main.tsx` veya `index.html` bu paketteki örnekten farklıysa dosyanın tamamını değiştirme, yalnızca KURULUM.md'de anlatılan satırları ekle veya değiştir.
5. Sonunda `npm test` ve `npm run build` çalıştır, sonucu kullanıcıya bildir.
