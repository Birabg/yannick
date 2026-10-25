const TOAST_MS = 3200;
const LEAVE_MS = 260;

/** Small status message at the bottom of the screen. kind: 'ok' | 'error'. */
export function toast(message, kind = 'ok') {
  const host = document.getElementById('toasts');
  if (!host) return;
  const node = document.createElement('p');
  node.className = kind === 'error' ? 'toast toast--error' : 'toast';
  node.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  node.textContent = message;
  host.append(node);
  setTimeout(() => {
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), LEAVE_MS);
  }, TOAST_MS);
}
