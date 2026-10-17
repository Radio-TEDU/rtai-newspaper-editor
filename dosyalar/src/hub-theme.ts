// RadioTEDU Hub ile açık/koyu tema senkronu.
// Öncelik: ?theme= parametresi > Hub'dan gelen mesaj / üst sayfanın teması > Hub'ın localStorage kaydı > sistem tercihi.
// Hub aynı alan adındaysa (radiotedu.com) üst sayfadaki değişiklikler doğrudan izlenir; Hub'da değişiklik gerekmez.
// Farklı alan adında barındırılıyorsa Hub şu mesajı göndermelidir:
//   frame.contentWindow.postMessage({ type: 'radiotedu-theme', theme: 'dark' }, '*')

export type HubTheme = 'light' | 'dark';

const STORAGE_KEYS = ['radiotedu_theme', 'theme'];
const MESSAGE_TYPE = 'radiotedu-theme';

const isTheme = (value: unknown): value is HubTheme => value === 'light' || value === 'dark';

function setTheme(root: HTMLElement, theme: HubTheme) {
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
}

// İlk yüklemede tema anında uygulanır, sonraki değişikliklerde sayfa tek parça hâlinde yumuşakça geçer.
// Öğe öğe renk geçişi iç içe yazılarda teklemeye yol açtığı için View Transitions kullanılır;
// desteklemeyen tarayıcılarda tema anında değişir.
function apply(theme: HubTheme) {
  const root = document.documentElement;
  const previous = root.getAttribute('data-theme');
  if (previous === theme) return;
  const animate = previous !== null
    && typeof document.startViewTransition === 'function'
    && document.visibilityState === 'visible'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animate) document.startViewTransition(() => setTheme(root, theme));
  else setTheme(root, theme);
}

function fromQuery(): HubTheme | null {
  const value = new URLSearchParams(location.search).get('theme');
  return isTheme(value) ? value : null;
}

// Aynı kökenli üst sayfanın <html> öğesi; farklı kökende erişim hata verir.
function parentRoot(): HTMLElement | null {
  try {
    if (window.parent === window) return null;
    return window.parent.document.documentElement;
  } catch {
    return null;
  }
}

function fromRoot(root: HTMLElement): HubTheme | null {
  const attr = root.getAttribute('data-theme');
  if (isTheme(attr)) return attr;
  return root.classList.contains('dark') ? 'dark' : null;
}

function fromStorage(): HubTheme | null {
  try {
    for (const key of STORAGE_KEYS) {
      const value = localStorage.getItem(key);
      if (isTheme(value)) return value;
    }
  } catch {
    // Depolama kapalıysa sistem tercihine düşülür.
  }
  return null;
}

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function initHubTheme() {
  const forced = fromQuery();
  if (forced) {
    apply(forced);
    return;
  }

  const parent = parentRoot();
  const resolve = (): HubTheme =>
    (parent && fromRoot(parent)) || fromStorage() || (systemQuery().matches ? 'dark' : 'light');
  apply(resolve());

  // Hub'daki tema düğmesi üst sayfanın <html> özniteliklerini değiştirir.
  if (parent) {
    new MutationObserver(() => apply(resolve())).observe(parent, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  }
  // Hub başka bir sekmede ya da aynı kökende tema değiştirdiğinde.
  window.addEventListener('storage', (event) => {
    if (event.key && STORAGE_KEYS.includes(event.key)) apply(resolve());
  });
  // Farklı kökenden gömülü kullanım.
  window.addEventListener('message', (event) => {
    const data = event.data as { type?: unknown; theme?: unknown } | null;
    if (data && data.type === MESSAGE_TYPE && isTheme(data.theme)) apply(data.theme);
  });
  systemQuery().addEventListener('change', () => apply(resolve()));
}
