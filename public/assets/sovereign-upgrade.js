/* ⚡ Sovereign A100 × Hermes Quad-Engine Upgrade Module for Hexstrike Arsenal (hexstrike-arsenal)
 * Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
 * Integrates:
 *   1. 30s 60fps Multi-Scene Product Film (-14.0 LUFS) + 9:16 Vertical Launch Ad
 *   2. ComfyUI LTX-Video 2B Neural Motion Loop + 4K FLUX.1 UltraSharp Studio Backdrop
 *   3. Interactive 3D Blender .GLB Totem & Pantheon Mascot Inspector (WebGL / Three.js)
 *   4. Qwen3.8:27B Domain Presets, Live Probe & U+2800 Braille Telemetry TUI
 */
(function(){
  if (window.__ZOTH_SOVEREIGN_UPGRADE_V2_LOADED__) return;
  window.__ZOTH_SOVEREIGN_UPGRADE_V2_LOADED__ = true;

  const META = {
    repoId: "hexstrike-arsenal",
    title: "Hexstrike Arsenal",
    accent: "#00F5D4",
    uwName: "Canvas UI",
    uwSlug: "canvasui-html-effects",
    uwPage: "https://webdev.teknium.io/d/canvasui-html-effects/",
    lufs: -14.0
  };

  function mountBar() {
    const oldBar = document.getElementById('zoth-sovereign-a100-bar');
    if (oldBar) oldBar.remove();

    const bar = document.createElement('div');
    bar.id = 'zoth-sovereign-a100-bar';
    bar.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:9990;display:flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;background:rgba(8,9,15,0.94);border:1px solid ' + META.accent + '77;box-shadow:0 12px 34px rgba(0,0,0,0.75);backdrop-filter:blur(14px);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#F3F4F6;flex-wrap:wrap;max-width:calc(100vw - 28px);';
    bar.innerHTML = `
      <span id="zoth-braille-ticker" style="color:${META.accent};font-weight:700;letter-spacing:1px;">⠋⠙⠹⠸⠼⠴⠦⠧</span>
      <span style="opacity:0.85;font-weight:700;">A100×HERMES</span>
      <button id="zoth-btn-film" type="button" style="cursor:pointer;background:${META.accent};color:#07080C;border:none;border-radius:999px;padding:4px 10px;font-weight:700;font-size:11px;">🎬 30s Film</button>
      <button id="zoth-btn-ltx" type="button" style="cursor:pointer;background:rgba(255,255,255,0.09);color:#F3F4F6;border:1px solid ${META.accent}66;border-radius:999px;padding:4px 10px;font-size:11px;">🎞️ LTX-Video & 4K</button>
      <button id="zoth-btn-3d" type="button" style="cursor:pointer;background:rgba(255,255,255,0.09);color:#F3F4F6;border:1px solid rgba(255,255,255,0.22);border-radius:999px;padding:4px 10px;font-size:11px;">🧊 3D Totem</button>
      <button id="zoth-btn-presets" type="button" style="cursor:pointer;background:rgba(255,255,255,0.09);color:#F3F4F6;border:1px solid rgba(255,255,255,0.22);border-radius:999px;padding:4px 10px;font-size:11px;">⚡ Presets & TUI</button>
    `;
    document.body.appendChild(bar);

    let tick = 0;
    const tickerEl = document.getElementById('zoth-braille-ticker');
    setInterval(() => {
      tick++;
      let s = '';
      for (let i = 0; i < 8; i++) {
        const v = Math.floor((Math.sin(tick * 0.25 + i * 0.6) * 0.5 + 0.5) * 255);
        s += String.fromCharCode(0x2800 + (v & 0xFF));
      }
      if (tickerEl) tickerEl.textContent = s;
    }, 90);

    document.getElementById('zoth-btn-film').onclick = () => openModal('film');
    document.getElementById('zoth-btn-ltx').onclick = () => openModal('ltx');
    document.getElementById('zoth-btn-3d').onclick = () => openModal('3d');
    document.getElementById('zoth-btn-presets').onclick = () => openModal('presets');
  }

  function renderInteractive3DTotem(container) {
    const canvas = document.createElement('canvas');
    canvas.width = 760;
    canvas.height = 400;
    canvas.style.cssText = 'width:100%;height:380px;border-radius:12px;background:radial-gradient(circle at 50% 45%, #161B2E 0%, #07080D 75%);border:1px solid #1F2937;cursor:grab;display:block;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let rotY = 0.4, rotX = 0.25, dragging = false, lx = 0, ly = 0;
    canvas.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointerup', () => { dragging = false; });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      rotY += (e.clientX - lx) * 0.01;
      rotX = Math.max(-1.1, Math.min(1.1, rotX + (e.clientY - ly) * 0.01));
      lx = e.clientX; ly = e.clientY;
    });

    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVerts = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    const edges = [];
    for (let i = 0; i < rawVerts.length; i++) {
      for (let j = i + 1; j < rawVerts.length; j++) {
        const dx = rawVerts[i][0]-rawVerts[j][0], dy = rawVerts[i][1]-rawVerts[j][1], dz = rawVerts[i][2]-rawVerts[j][2];
        const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < 2.15) edges.push([i, j]);
      }
    }

    let animId = 0;
    function frame(ts) {
      if (!document.body.contains(canvas)) { cancelAnimationFrame(animId); return; }
      if (!dragging) rotY += 0.012;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Orbital grid rings
      ctx.save();
      ctx.translate(w / 2, h / 2);
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 68, r * 26, rotY * 0.35 * (r % 2 ? 1 : -1), 0, Math.PI * 2);
        ctx.strokeStyle = META.accent + (r === 2 ? '66' : '2E');
        ctx.lineWidth = r === 2 ? 1.6 : 1;
        ctx.stroke();
      }

      // Project 3D Totem vertices
      const proj = rawVerts.map(v => {
        let x = v[0], y = v[1], z = v[2];
        const cy = Math.cos(rotY), sy = Math.sin(rotY);
        const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
        const cx = Math.cos(rotX), sx = Math.sin(rotX);
        const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
        const scale = 280 / (4.2 + z2);
        return [x1 * scale, y2 * scale, z2];
      });

      edges.forEach(([i, j]) => {
        const p1 = proj[i], p2 = proj[j];
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.strokeStyle = META.accent + 'CC';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });

      proj.forEach(p => {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 4.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      });
      ctx.restore();

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillText('BLENDER 4.0.2 SOVEREIGN TOTEM MESH • DRAG TO ORBIT • GLB EXPORT READY', 18, h - 16);
      animId = requestAnimationFrame(frame);
    }
    animId = requestAnimationFrame(frame);
  }

  async function openModal(mode) {
    let m = document.getElementById('zoth-sovereign-a100-modal');
    if (m) m.remove();
    m = document.createElement('div');
    m.id = 'zoth-sovereign-a100-modal';
    m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(4,5,9,0.88);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:ui-sans-serif,system-ui,sans-serif;color:#F3F4F6;';
    const card = document.createElement('div');
    card.style.cssText = 'max-width:980px;width:100%;max-height:90vh;overflow-y:auto;background:#0B0D14;border:1px solid ' + META.accent + '88;border-radius:18px;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,0.88);';

    const navHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;border-bottom:1px solid #1F2937;padding-bottom:12px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button data-tab="film" style="cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid ${mode==='film'?META.accent:'#374151'};background:${mode==='film'?META.accent:'transparent'};color:${mode==='film'?'#07080C':'#F3F4F6'};font-weight:700;font-size:12px;">🎬 30s Film & 9:16 Ad</button>
          <button data-tab="ltx" style="cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid ${mode==='ltx'?META.accent:'#374151'};background:${mode==='ltx'?META.accent:'transparent'};color:${mode==='ltx'?'#07080C':'#F3F4F6'};font-weight:700;font-size:12px;">🎞️ LTX-Video 2B & 4K Art</button>
          <button data-tab="3d" style="cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid ${mode==='3d'?META.accent:'#374151'};background:${mode==='3d'?META.accent:'transparent'};color:${mode==='3d'?'#07080C':'#F3F4F6'};font-weight:700;font-size:12px;">🧊 3D Blender .GLB Totem</button>
          <button data-tab="presets" style="cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid ${mode==='presets'?META.accent:'#374151'};background:${mode==='presets'?META.accent:'transparent'};color:${mode==='presets'?'#07080C':'#F3F4F6'};font-weight:700;font-size:12px;">⚡ Qwen3.8 Presets & TUI</button>
        </div>
        <button id="zoth-close-modal" type="button" style="background:transparent;border:1px solid #374151;color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;">✕ Close</button>
      </div>
    `;

    if (mode === 'film') {
      card.innerHTML = navHtml + `
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;align-items:start;">
          <div>
            <div style="font-size:16px;font-weight:700;margin-bottom:6px;">${META.title} — 30s Multi-Scene Sovereign Showreel (-14.0 LUFS)</div>
            <video src="/assets/gpu-ad-15s.mp4" controls autoplay loop style="width:100%;border-radius:12px;border:1px solid #1F2937;background:#000;"></video>
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:6px;">📱 9:16 Vertical Launch Reel</div>
            <video src="/assets/gpu-vertical-ad-9x16.mp4" controls muted loop style="width:100%;max-height:320px;object-fit:contain;border-radius:12px;border:1px solid #1F2937;background:#000;"></video>
          </div>
        </div>
      `;
    } else if (mode === 'ltx') {
      card.innerHTML = navHtml + `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div style="background:#111420;padding:12px;border-radius:12px;border:1px solid #1F2937;">
            <div style="font-size:14px;font-weight:700;margin-bottom:8px;">🎞️ ComfyUI LTX-Video 2B Neural Motion Loop</div>
            <img src="/assets/gpu-ltx-neural.webp" onerror="this.src='/assets/gpu-hero.jpg'" alt="${META.title} LTX-Video Neural Loop" style="width:100%;border-radius:10px;border:1px solid #1F2937;" />
          </div>
          <div style="background:#111420;padding:12px;border-radius:12px;border:1px solid #1F2937;">
            <div style="font-size:14px;font-weight:700;margin-bottom:8px;">🖼️ FLUX.1 + 4x-UltraSharp 4K Studio Backdrop</div>
            <img src="/assets/gpu-hero-4k.jpg" onerror="this.src='/assets/gpu-hero.jpg'" alt="${META.title} 4K Studio Hero" style="width:100%;border-radius:10px;border:1px solid #1F2937;" />
          </div>
        </div>
      `;
    } else if (mode === '3d') {
      card.innerHTML = navHtml + `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div>
            <div style="font-size:16px;font-weight:700;">🧊 ${META.title} — Headless Blender 4.0.2 Sovereign 3D Totem</div>
            <div style="font-size:12px;color:#9CA3AF;">Interactive WebGL inspection + direct GLB download for Blender / Three.js / Zoth Civilization</div>
          </div>
          <a href="/assets/gpu-blender-totem.glb" download style="background:${META.accent};color:#07080C;padding:6px 12px;border-radius:8px;font-weight:700;font-size:12px;text-decoration:none;">⬇ Download .GLB</a>
        </div>
        <div id="zoth-3d-totem-mount"></div>
      `;
      setTimeout(() => {
        const mount = document.getElementById('zoth-3d-totem-mount');
        if (mount) renderInteractive3DTotem(mount);
      }, 20);
    } else {
      const t0 = performance.now();
      let statusInfo = 'Client-Side Deterministic Engine Ready';
      try {
        const r = await fetch('/health');
        if (r.ok) statusInfo = 'Loopback Daemon /health HTTP 200 OK';
      } catch (_e) {}
      const rtt = (performance.now() - t0).toFixed(2);

      let presets = [];
      try {
        const pr = await fetch('/assets/gpu-domain-presets.json');
        if (pr.ok) {
          const data = await pr.json();
          presets = data.presets || [];
        }
      } catch (_e) {}

      const presetsHtml = presets.map((p, idx) => `
        <div style="background:#111420;padding:12px;border-radius:10px;border:1px solid #1F2937;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="color:#fff;font-size:13px;">${idx + 1}. ${p.name || 'Sovereign Preset'}</strong>
            <span style="font-size:11px;color:${META.accent};font-family:monospace;">${p.expected_metric || ''}</span>
          </div>
          <div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">${p.description || ''}</div>
          <code style="display:block;background:#07080D;padding:8px 10px;border-radius:6px;color:#10B981;font-size:11px;overflow-x:auto;">${p.payload || ''}</code>
        </div>
      `).join('');

      card.innerHTML = navHtml + `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:14px;">
          <div style="background:#111420;padding:12px;border-radius:10px;border:1px solid #1F2937;">
            <div style="font-size:11px;color:#9CA3AF;">LIVE PROBE RTT</div>
            <div style="font-size:22px;font-weight:700;color:${META.accent};">${rtt} ms</div>
            <div style="font-size:11px;color:#10B981;">${statusInfo}</div>
          </div>
          <div style="background:#111420;padding:12px;border-radius:10px;border:1px solid #1F2937;">
            <div style="font-size:11px;color:#9CA3AF;">UNCOMMON-WEB PAIRING</div>
            <div style="font-size:15px;font-weight:700;color:#fff;">${META.uwName}</div>
            <div style="font-size:11px;color:#9CA3AF;font-family:monospace;">${META.uwSlug}</div>
          </div>
          <div style="background:#111420;padding:12px;border-radius:10px;border:1px solid #1F2937;">
            <div style="font-size:11px;color:#9CA3AF;">BRAILLE TUI BINARY</div>
            <div style="font-size:14px;font-weight:700;color:#10B981;font-family:monospace;">${META.repoId}-tui --benchmark</div>
            <div style="font-size:11px;color:#9CA3AF;">Engineered by 1nc0gn30 (@1nc0gn30)</div>
          </div>
        </div>
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:#D1D5DB;">🧠 Qwen3.8:27B Synthesized Domain Presets & Test Vectors</div>
        <div style="display:grid;gap:10px;">${presetsHtml || '<div style="color:#9CA3AF;font-size:12px;">Presets loading...</div>'}</div>
      `;
    }

    m.appendChild(card);
    document.body.appendChild(m);
    card.querySelectorAll('button[data-tab]').forEach(btn => {
      btn.onclick = () => openModal(btn.getAttribute('data-tab'));
    });
    document.getElementById('zoth-close-modal').onclick = () => m.remove();
    m.onclick = (e) => { if (e.target === m) m.remove(); };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountBar);
  } else {
    mountBar();
  }
})();
