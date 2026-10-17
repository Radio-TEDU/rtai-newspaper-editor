// ==UserScript==
// @name         RadioTEDU ERP · Gazete Atölyesi sekmesi
// @namespace    radiotedu-gazete-atolyesi
// @version      1.1.1
// @description  radiotedu.com ERP sidebar'ına "Gazete Atölyesi" sekmesi ekler, Atölye'yi sayfa içinde açar ve Atölye'nin kaydırma çubuğu tasarımını tüm Hub'a uygular.
// @match        https://radiotedu.com/erp/*
// @match        https://www.radiotedu.com/erp/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// ==/UserScript==

(function () {
  'use strict';

  // Atölye'nin çalıştığı adres. İleride Atölye internette yayınlanırsa yalnızca burayı değiştirin.
  const ATOLYE_URL = 'http://127.0.0.1:4173/';
  const LABEL = 'Gazete Atölyesi';
  const ICON = '📰';
  // Yeni sekme bu menü öğesinin altına eklenir; bulunamazsa sıradakiler denenir.
  const ANCHOR_LABELS = ['Avantajlar', 'Stant Onay', 'Kapı Kontrol', 'Etkinlik Kontrol', 'Bilgilerim', 'Panel'];
  const ITEM_ID = 'rtai-gazete-tab';
  const PANEL_ID = 'rtai-gazete-panel';
  const OPEN_KEY = 'rtai-gazete-open';

  const SCROLL_STYLE_ID = 'rtai-scrollbar-style';

  // Atölye'deki kaydırma çubuğu tasarımı (src/hub-theme.css) Hub'daki tüm çubuklara da uygulanır.
  // Renkler Hub'ın <html data-theme> değerine göre açık/koyu değişir. Sayfaya sonradan eklenen
  // kaydırılabilir alanlar da bu kurallara otomatik olarak uyar.
  const SCROLL_CSS = `
    html{--rtai-scroll-thumb:#cbd5e1;--rtai-scroll-thumb-hover:#64748b}
    html[data-theme=dark]{--rtai-scroll-thumb:#2a3851;--rtai-scroll-thumb-hover:#475569}
    @supports selector(::-webkit-scrollbar){
      /* Chrome/Edge'de scrollbar-width/color ayarlı öğelerde ::-webkit-scrollbar yok sayılır (ör. Hub sidebar'ı) */
      *{scrollbar-width:auto!important;scrollbar-color:auto!important}
      ::-webkit-scrollbar{width:10px!important;height:10px!important}
      ::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent!important}
      ::-webkit-scrollbar-thumb{background:var(--rtai-scroll-thumb)!important;border-radius:10px!important;border:2px solid transparent!important;background-clip:padding-box!important}
      ::-webkit-scrollbar-thumb:hover{background-color:var(--rtai-scroll-thumb-hover)!important}
      ::-webkit-scrollbar-thumb:active{background-color:#E31E26!important}
      ::-webkit-scrollbar-button{display:none!important;width:0!important;height:0!important}
    }
    @supports not selector(::-webkit-scrollbar){
      *{scrollbar-width:thin;scrollbar-color:var(--rtai-scroll-thumb) transparent}
    }`;

  function ensureScrollStyle() {
    if (document.getElementById(SCROLL_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SCROLL_STYLE_ID;
    style.textContent = SCROLL_CSS;
    // Sitenin kendi stillerinden sonra gelsin.
    (document.head || document.documentElement).append(style);
  }

  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr');

  // Yazısı tam olarak verilen etiket olan sidebar menü öğesini bulur (ikon ayrı tutulur).
  function findNavItem(label) {
    const want = norm(label);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t = walker.currentNode;
      if (norm(t.nodeValue) !== want || !t.parentElement) continue;
      const el = t.parentElement;
      if (el.closest('#' + ITEM_ID) || el.closest('#' + PANEL_ID)) continue;
      const clickable = el.closest('a, button, [role="link"], [role="menuitem"], li');
      if (!clickable) continue;
      const rect = clickable.getBoundingClientRect();
      // Sidebar sol tarafta durur; sayfa içeriğindeki aynı yazılı düğmeleri ele.
      if (rect.width > 0 && rect.left < window.innerWidth * 0.35) return clickable;
    }
    return null;
  }

  // Menü öğesinin listedeki kardeşleriyle aynı seviyedeki sarmalayıcısı (ör. <li>).
  function rowOf(item) {
    let row = item;
    while (row.parentElement && row.parentElement.children.length === 1 && row.parentElement.tagName !== 'NAV') {
      row = row.parentElement;
    }
    return row;
  }

  function sidebarOf(item) {
    let el = item;
    while (el && el !== document.body) {
      const r = el.getBoundingClientRect();
      if (r.height >= window.innerHeight * 0.6 && r.width < window.innerWidth * 0.5) return el;
      el = el.parentElement;
    }
    return item.closest('aside, nav') || item.parentElement;
  }

  // Şu an kırmızı (aktif) görünen menü öğesinin rengini kopyalar.
  function activeStyleFrom(sidebar) {
    for (const el of sidebar.querySelectorAll('a, button')) {
      if (el.id === ITEM_ID) continue;
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return { el, background: bg, color: getComputedStyle(el).color };
      }
    }
    return { el: null, background: 'rgb(229, 33, 42)', color: '#fff' };
  }

  function buildItem(anchor, anchorLabel) {
    const anchorRow = rowOf(anchor);
    const row = anchorRow.cloneNode(true);
    // Kopyadaki satır içi olay kodları (onclick, onerror...) yeniden çalışmasın.
    for (const el of [row, ...row.querySelectorAll('*')]) {
      for (const attr of [...el.attributes]) if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    }
    const item = row.matches('a, button, [role="link"], [role="menuitem"]')
      ? row
      : row.querySelector('a, button, [role="link"], [role="menuitem"]') || row;

    // Kopyanın sitenin kendi davranışlarını tetiklememesi için bağlantı ve kimlikleri temizle.
    row.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    row.querySelectorAll('[aria-current]').forEach((el) => el.removeAttribute('aria-current'));
    item.removeAttribute('aria-current');
    if (item.tagName === 'A') item.setAttribute('href', '#gazete-atolyesi');
    item.id = ITEM_ID;
    item.setAttribute('title', LABEL);

    // Yazıyı ve simgeyi değiştir.
    const anchorText = norm(anchorLabel);
    let iconDone = false;
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    for (const t of texts) {
      const v = norm(t.nodeValue);
      if (!v) continue;
      if (v === anchorText) t.nodeValue = LABEL;
      else if (v.length <= 3 && !iconDone) { t.nodeValue = ICON; iconDone = true; }
    }
    const graphic = item.querySelector('svg, img, i, picture');
    if (graphic && !iconDone) {
      const r = graphic.getBoundingClientRect ? anchor.querySelector('svg, img, i, picture')?.getBoundingClientRect() : null;
      const span = document.createElement('span');
      span.textContent = ICON;
      span.setAttribute('aria-hidden', 'true');
      span.style.cssText = `display:inline-flex;align-items:center;justify-content:center;line-height:1;${r && r.width ? `width:${r.width}px;height:${r.height}px;font-size:${Math.round(r.height * 0.9)}px;` : ''}`;
      graphic.replaceWith(span);
    }
    // Kopyanın içinde başka bir yazı varsa (ör. "Avantajlar" doğrudan öğede değilse) sona ekle.
    if (!norm(item.textContent).includes(norm(LABEL))) item.append(' ' + LABEL);

    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isOpen() ? closePanel() : openPanel();
    }, true);

    anchorRow.after(row);
    return item;
  }

  function isOpen() {
    return !!document.getElementById(PANEL_ID);
  }

  // Atölye açıkken sitenin kendi aktif sekmesinin vurgusu geçici olarak kaldırılır.
  let dimmed = null;

  function setActive(on) {
    const item = document.getElementById(ITEM_ID);
    if (!item) return;
    if (on) {
      if (item.getAttribute('aria-current') === 'page') return;
      const idleColor = getComputedStyle(item).color;
      const s = activeStyleFrom(sidebarOf(item));
      item.style.background = s.background;
      item.style.color = s.color;
      item.setAttribute('aria-current', 'page');
      if (s.el) {
        dimmed = { el: s.el, background: s.el.style.background, color: s.el.style.color };
        s.el.style.background = 'transparent';
        s.el.style.color = idleColor;
      }
    } else {
      item.style.background = '';
      item.style.color = '';
      item.removeAttribute('aria-current');
      if (dimmed) {
        dimmed.el.style.background = dimmed.background;
        dimmed.el.style.color = dimmed.color;
        dimmed = null;
      }
    }
  }

  function placePanel(panel) {
    const item = document.getElementById(ITEM_ID);
    const left = item ? Math.round(sidebarOf(item).getBoundingClientRect().right) : 0;
    panel.style.left = (left > 0 && left < window.innerWidth * 0.5 ? left : 0) + 'px';
  }

  function ping() {
    return new Promise((resolve) => {
      if (typeof GM_xmlhttpRequest !== 'function') return resolve(true);
      GM_xmlhttpRequest({
        method: 'GET', url: ATOLYE_URL, timeout: 3000,
        onload: (r) => resolve(r.status >= 200 && r.status < 500),
        onerror: () => resolve(false), ontimeout: () => resolve(false),
      });
    });
  }

  async function openPanel() {
    if (isOpen()) return;
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = 'position:fixed;top:0;right:0;bottom:0;z-index:2147483000;display:flex;flex-direction:column;background:#0b0f1a;border-left:1px solid rgba(255,255,255,.08);font-family:inherit;';
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 14px;background:#111827;color:#e5e7eb;font-size:14px;font-weight:600;border-bottom:1px solid rgba(255,255,255,.08);';
    bar.innerHTML = `<span style="flex:1">${ICON} ${LABEL}</span>`;
    const btn = (text, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.style.cssText = 'background:transparent;color:#e5e7eb;border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:5px 10px;font:inherit;font-weight:500;cursor:pointer;';
      b.addEventListener('click', onClick);
      bar.append(b);
    };
    btn('Yeni sekmede aç', () => window.open(ATOLYE_URL, '_blank', 'noopener'));
    btn('Kapat ✕', closePanel);
    panel.append(bar);

    const body = document.createElement('div');
    body.style.cssText = 'flex:1;position:relative;';
    panel.append(body);
    document.body.append(panel);
    placePanel(panel);
    setActive(true);
    try { sessionStorage.setItem(OPEN_KEY, '1'); } catch {}

    if (!(await ping())) {
      body.innerHTML = `
        <div style="max-width:520px;margin:12vh auto;padding:28px;border-radius:16px;background:#151b2b;color:#e5e7eb;font-size:15px;line-height:1.6;text-align:center">
          <div style="font-size:40px">${ICON}</div>
          <h2 style="margin:8px 0 6px;font-size:20px">Gazete Atölyesi çalışmıyor</h2>
          <p style="margin:0 0 16px;color:#9ca3af">Bilgisayarınızda <b>“Gazete Atölyesi Başlat”</b> dosyasını çalıştırın, sonra yeniden deneyin.</p>
          <button type="button" id="rtai-gazete-retry" style="background:#e5212a;color:#fff;border:0;border-radius:10px;padding:10px 18px;font:inherit;font-weight:600;cursor:pointer">Yeniden dene</button>
        </div>`;
      body.querySelector('#rtai-gazete-retry').addEventListener('click', () => { closePanel(); openPanel(); });
      return;
    }
    const frame = document.createElement('iframe');
    frame.src = ATOLYE_URL;
    frame.title = LABEL;
    frame.setAttribute('allow', 'local-network-access; clipboard-read; clipboard-write; fullscreen');
    frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff;';
    body.append(frame);
  }

  function closePanel() {
    document.getElementById(PANEL_ID)?.remove();
    setActive(false);
    try { sessionStorage.removeItem(OPEN_KEY); } catch {}
  }

  function ensureItem() {
    if (document.getElementById(ITEM_ID)) return true;
    for (const label of ANCHOR_LABELS) {
      const anchor = findNavItem(label);
      if (anchor) {
        buildItem(anchor, label);
        if (isOpen()) setActive(true);
        return true;
      }
    }
    return false;
  }

  // Sidebar'daki başka bir sekmeye tıklanınca Atölye'yi kapat.
  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    const item = document.getElementById(ITEM_ID);
    const target = e.target instanceof Element ? e.target : null;
    if (!item || !target || item.contains(target) || target.closest('#' + PANEL_ID)) return;
    const link = target.closest('a, button');
    if (link && sidebarOf(item).contains(link)) closePanel();
  }, true);

  window.addEventListener('resize', () => {
    const panel = document.getElementById(PANEL_ID);
    if (panel) placePanel(panel);
  });

  // Site tek sayfa uygulaması olduğu için menü yeniden çizilebilir; sekmeyi gerekirse tekrar ekle.
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; ensureScrollStyle(); ensureItem(); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  ensureScrollStyle();
  ensureItem();
  let reopen = false;
  try { reopen = sessionStorage.getItem(OPEN_KEY) === '1'; } catch {}
  if (reopen) openPanel();
})();
