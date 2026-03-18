// Barpath — Rest Timer Component
let timerInterval = null;

export function showRestTimer(seconds = 120) {
  clearInterval(timerInterval);
  let remaining = seconds;
  const total = seconds;

  const overlay = document.createElement('div');
  overlay.className = 'rest-timer-overlay';
  overlay.id = 'rest-timer';

  const circumference = 2 * Math.PI * 110;

  function render() {
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    const progress = remaining / total;
    const offset = circumference * (1 - progress);

    const color = remaining > total * 0.5 ? 'var(--bp-green)' :
      remaining > total * 0.2 ? 'var(--bp-amber)' : 'var(--bp-red)';

    overlay.innerHTML = `
      <div class="rest-timer-ring" style="position: relative;">
        <svg viewBox="0 0 240 240" width="240" height="240">
          <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="6"/>
          <circle cx="120" cy="120" r="110" fill="none" stroke="${color}" stroke-width="6"
            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
            style="transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 1s linear;"/>
        </svg>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div class="rest-timer-time">${min}:${sec.toString().padStart(2, '0')}</div>
          <div class="t-label" style="color: rgba(255,255,255,0.5)">REST</div>
        </div>
      </div>

      <div style="display: flex; gap: var(--sp-lg); margin-top: var(--sp-xxxl);">
        <button class="btn" style="background: rgba(255,255,255,0.15); color: white; padding: var(--sp-md) var(--sp-xl);" id="rest-minus">-30s</button>
        <button class="btn" style="background: rgba(255,255,255,0.15); color: white; padding: var(--sp-md) var(--sp-xl);" id="rest-skip">Skip</button>
        <button class="btn" style="background: rgba(255,255,255,0.15); color: white; padding: var(--sp-md) var(--sp-xl);" id="rest-plus">+30s</button>
      </div>
    `;

    overlay.querySelector('#rest-minus')?.addEventListener('click', (e) => {
      e.stopPropagation();
      remaining = Math.max(0, remaining - 30);
      render();
    });
    overlay.querySelector('#rest-plus')?.addEventListener('click', (e) => {
      e.stopPropagation();
      remaining += 30;
      render();
    });
    overlay.querySelector('#rest-skip')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTimer();
    });
  }

  function closeTimer() {
    clearInterval(timerInterval);
    overlay.remove();
    // Vibrate on finish
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeTimer();
  });

  render();
  document.body.appendChild(overlay);

  timerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      closeTimer();
      return;
    }
    render();
  }, 1000);
}
