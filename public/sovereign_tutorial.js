/**
 * Sovereign Reusable Kid-Friendly Tutorial & Braille/ASCII Magic Engine
 * Author: Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */
(function() {
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  window.createSovereignTutorial = function(config) {
    const {
      toolId,
      toolName,
      tagline,
      steps, // [{ icon, title, desc }]
      accentColor = "#FFB800"
    } = config;

    // Check if modal already exists
    if (document.getElementById(`sovTutorial-${toolId}`)) return;

    // Remove any legacy floating A100 bar
    const oldA100 = document.getElementById('zoth-sovereign-a100-bar');
    if (oldA100) oldA100.remove();

    // Create modal HTML
    const modal = document.createElement('div');
    modal.id = `sovTutorial-${toolId}`;
    modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:999999; background:rgba(4,6,12,0.85); backdrop-filter:blur(14px); align-items:center; justify-content:center; padding:18px; box-sizing:border-box;';

    const stepsHtml = steps.map((s, idx) => `
      <div style="display:flex; gap:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px; align-items:flex-start;">
        <span style="font-size:26px; line-height:1;">${s.icon}</span>
        <div>
          <h4 style="margin:0 0 4px; color:${idx === 0 ? accentColor : '#38BDF8'}; font-size:14px; font-weight:700;">Step ${idx + 1}: ${s.title}</h4>
          <p style="margin:0; color:#CBD5E1; font-size:12px; line-height:1.5;">${s.desc}</p>
        </div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="background:#0D111E; border:2px solid ${accentColor}; border-radius:20px; max-width:640px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.8), 0 0 35px ${accentColor}33; padding:28px; color:#F8FAFC; position:relative; font-family:ui-monospace, 'JetBrains Mono', SFMono-Regular, monospace; box-sizing:border-box;">
        
        <button id="sovCloseBtn-${toolId}" style="position:absolute; top:18px; right:18px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#F8FAFC; width:34px; height:34px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">✕</button>

        <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
          <span style="font-size:32px;">✨</span>
          <div>
            <h2 style="margin:0; font-size:20px; font-weight:800; color:${accentColor}; text-transform:uppercase; letter-spacing:0.04em;">${toolName}</h2>
            <p style="margin:3px 0 0; color:#94A3B8; font-size:11px;">${tagline} · Kid-friendly quickstart</p>
          </div>
        </div>

        <!-- Live ASCII / Braille Magic Stage -->
        <div style="background:#05070D; border:1px solid ${accentColor}44; border-radius:10px; padding:10px; margin-bottom:20px; text-align:center; overflow:hidden;">
          <pre id="sovBrailleCanvas-${toolId}" style="font-size:9.5px; line-height:9.5px; color:#38BDF8; margin:0; font-family:monospace; white-space:pre;"></pre>
        </div>

        <!-- Steps List -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${stepsHtml}
        </div>

        <div style="margin-top:22px; display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:1px solid rgba(255,255,255,0.1); flex-wrap:wrap; gap:12px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:11px; color:#94A3B8; cursor:pointer;">
            <input type="checkbox" id="sovDontShow-${toolId}" style="cursor:pointer;"> Don't show automatically on first visit
          </label>
          <button id="sovActionBtn-${toolId}" style="background:${accentColor}; color:#000; border:none; padding:9px 22px; border-radius:999px; font-weight:800; font-size:12px; cursor:pointer; letter-spacing:0.04em;">Got It, Let's Build! 🚀</button>
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    let animInterval = null;
    let tick = 0;

    function renderBrailleWave() {
      const el = document.getElementById(`sovBrailleCanvas-${toolId}`);
      if (!el) return;
      tick += 0.16;
      const W = 34, H = 7;
      let out = '';
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let mask = 0;
          const dots = [
            [0,0,0x01],[0,1,0x02],[0,2,0x04],[0,3,0x40],
            [1,0,0x08],[1,1,0x10],[1,2,0x20],[1,3,0x80]
          ];
          for (let d = 0; d < 8; d++) {
            const px = x * 2 + dots[d][0];
            const py = y * 4 + dots[d][1];
            const v = Math.sin(px * 0.2 + tick) * Math.cos(py * 0.35 + tick);
            if (v > 0.08) mask |= dots[d][2];
          }
          out += String.fromCharCode(0x2800 | mask);
        }
        out += '\n';
      }
      el.textContent = out;
    }

    function openModal() {
      modal.style.display = 'flex';
      if (!animInterval) {
        animInterval = setInterval(renderBrailleWave, 55);
      }
    }

    function closeModal() {
      modal.style.display = 'none';
      if (animInterval) {
        clearInterval(animInterval);
        animInterval = null;
      }
      const chk = document.getElementById(`sovDontShow-${toolId}`);
      if (chk && chk.checked) {
        localStorage.setItem(`sov_tutorial_seen_${toolId}`, 'true');
      }
    }

    document.getElementById(`sovCloseBtn-${toolId}`).addEventListener('click', closeModal);
    document.getElementById(`sovActionBtn-${toolId}`).addEventListener('click', closeModal);

    // Auto-launch if not seen
    if (!localStorage.getItem(`sov_tutorial_seen_${toolId}`)) {
      setTimeout(openModal, 600);
    }

    return {
      open: openModal,
      close: closeModal
    };
  };
})();
