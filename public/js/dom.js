export function esc(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
  return parts.map(part => part[0] || '').join('').toUpperCase() || '?';
}

export function truncate(value, length) {
  const text = String(value || 'No hook recorded yet.');
  return text.length > length ? text.slice(0, length - 1).trimEnd() + '…' : text;
}

export function createToast(toastEl) {
  function toast(message, isErr = false) {
    toastEl.textContent = message;
    toastEl.className = 'toast' + (isErr ? ' error' : '') + ' show';
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => toastEl.classList.remove('show'), 3200);
  }
  return toast;
}
