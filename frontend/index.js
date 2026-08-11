const SHIOMI_PANEL_URL = 'https://cdn.jsdelivr.net/gh/dongyue233/shiomi-newcomer@v1.0.1/frontend/panel.html';
const HOST_SELECTOR = '[data-shiomi-panel]';
let panelSourcePromise;

function getPanelSource() {
  panelSourcePromise ||= fetch(SHIOMI_PANEL_URL, { cache: 'force-cache' }).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  });
  return panelSourcePromise;
}

async function mountPanel(host) {
  if (!(host instanceof HTMLElement) || host.dataset.shiomiMounted === 'true') return;
  host.dataset.shiomiMounted = 'true';
  host.textContent = '汐见调查手账正在打开……';
  try {
    const source = await getPanelSource();
    if (!host.isConnected) return;
    const frame = document.createElement('iframe');
    frame.className = 'shiomi-panel-frame';
    frame.title = '汐见调查手账';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    frame.srcdoc = source;
    host.replaceChildren(frame);
    frame.addEventListener('load', () => {
      try {
        const body = frame.contentDocument?.body;
        if (!body || typeof ResizeObserver === 'undefined') return;
        const resize = () => frame.style.height = `${Math.max(620, Math.min(960, body.scrollHeight + 8))}px`;
        new ResizeObserver(resize).observe(body);
        resize();
      } catch { frame.style.height = '780px'; }
    }, { once: true });
  } catch (error) {
    console.error('[汐见新客] 调查面板载入失败', error);
    host.classList.add('shiomi-panel-failed');
    host.textContent = '调查手账暂时未能连接。正文与文字行动仍可继续使用。';
  }
}

function scanPanels(root = document) {
  if (root instanceof Element && root.matches(HOST_SELECTOR)) mountPanel(root);
  root.querySelectorAll?.(HOST_SELECTOR).forEach(mountPanel);
}

if (!document.querySelector('[data-shiomi-panel-style]')) {
  const style = document.createElement('style');
  style.dataset.shiomiPanelStyle = 'true';
  style.textContent = `${HOST_SELECTOR}{display:block;width:100%;min-height:76px;margin:12px 0 2px;padding:12px;box-sizing:border-box;border:1px solid #8f826f;border-radius:12px;background:#272823;color:#eee5d5;font-family:serif}${HOST_SELECTOR}:has(.shiomi-panel-frame){padding:0;overflow:hidden}.shiomi-panel-frame{display:block;width:100%;height:780px;border:0;background:#1f211e}.shiomi-panel-failed{color:#d9c9ad}@media(max-width:720px){.shiomi-panel-frame{height:76vh;min-height:620px}}`;
  document.head.append(style);
}

scanPanels();
new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
  if (node instanceof Element) scanPanels(node);
}))).observe(document.body, { childList: true, subtree: true });
