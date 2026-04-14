/**
 * EXO — Interactive Stadium Map
 * 2D overhead view with path tracing animation
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle) navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

  const canvas = document.getElementById('stadiumCanvas');
  const ctx = canvas.getContext('2d');
  const gateSelect = document.getElementById('gateSelect');
  const sectionSelect = document.getElementById('sectionSelect');
  const pathInfo = document.getElementById('pathInfo');
  const pathDistance = document.getElementById('pathDistance');
  const pathTime = document.getElementById('pathTime');
  const pathCrowd = document.getElementById('pathCrowd');

  let stadiumData = null;
  let hoveredElement = null;
  let selectedGate = null;
  let selectedSection = null;
  let pathAnimation = { active: false, progress: 0, points: [] };

  // ─── Fetch Stadium Data ──────────────────────────────────────
  try {
    const res = await fetch('/api/stadium');
    stadiumData = await res.json();
    populateSelects();
  } catch (err) {
    console.error('Failed to load stadium data:', err);
    return;
  }

  // ─── Canvas Setup ────────────────────────────────────────────
  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    draw();
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ─── Populate Selects ────────────────────────────────────────
  function populateSelects() {
    stadiumData.gates.forEach(gate => {
      const opt = document.createElement('option');
      opt.value = gate.id;
      opt.textContent = gate.name;
      gateSelect.appendChild(opt);
    });

    stadiumData.sections.forEach(section => {
      const opt = document.createElement('option');
      opt.value = section.id;
      opt.textContent = `${section.name} (${section.type})`;
      sectionSelect.appendChild(opt);
    });
  }

  gateSelect.addEventListener('change', onRouteChange);
  sectionSelect.addEventListener('change', onRouteChange);

  function onRouteChange() {
    const gateId = gateSelect.value;
    const sectionId = sectionSelect.value;

    selectedGate = gateId ? stadiumData.gates.find(g => g.id === gateId) : null;
    selectedSection = sectionId ? stadiumData.sections.find(s => s.id === sectionId) : null;

    if (selectedGate && selectedSection) {
      calculatePath();
    } else {
      pathInfo.classList.remove('visible');
      pathAnimation.active = false;
    }

    draw();
  }

  // ─── Path Calculation ────────────────────────────────────────
  function calculatePath() {
    const scaleX = canvas.width / 760;
    const scaleY = canvas.height / 530;

    const startX = selectedGate.x * scaleX;
    const startY = selectedGate.y * scaleY;
    const endX = selectedSection.x * scaleX;
    const endY = selectedSection.y * scaleY;

    // Generate waypoints for a natural-looking path
    const midX1 = startX + (endX - startX) * 0.3 + (Math.random() - 0.5) * 40;
    const midY1 = startY + (endY - startY) * 0.3 + (Math.random() - 0.5) * 40;
    const midX2 = startX + (endX - startX) * 0.7 + (Math.random() - 0.5) * 40;
    const midY2 = startY + (endY - startY) * 0.7 + (Math.random() - 0.5) * 40;

    pathAnimation.points = [
      { x: startX, y: startY },
      { x: midX1, y: midY1 },
      { x: midX2, y: midY2 },
      { x: endX, y: endY },
    ];

    pathAnimation.active = true;
    pathAnimation.progress = 0;

    // Calculate stats
    const dx = endX - startX;
    const dy = endY - startY;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    const meters = Math.round(pixelDist * 0.8);
    const minutes = Math.max(1, Math.round(meters / 80));

    pathDistance.textContent = `${meters}m`;
    pathTime.textContent = `${minutes} min`;

    const crowdLevels = ['Low', 'Moderate', 'Busy', 'Very Busy'];
    const crowdColors = ['var(--accent-green)', 'var(--accent-yellow)', 'var(--accent-orange)', 'var(--accent-red)'];
    const idx = Math.min(3, Math.floor(selectedSection.occupancy * 4));
    pathCrowd.textContent = crowdLevels[idx];
    pathCrowd.style.color = crowdColors[idx];

    pathInfo.classList.add('visible');
    animatePath();
  }

  function animatePath() {
    if (!pathAnimation.active) return;

    pathAnimation.progress += 0.015;
    if (pathAnimation.progress > 1) pathAnimation.progress = 1;

    draw();

    if (pathAnimation.progress < 1) {
      requestAnimationFrame(animatePath);
    }
  }

  // ─── Mouse Hover ─────────────────────────────────────────────
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = canvas.width / 760;
    const scaleY = canvas.height / 530;

    hoveredElement = null;

    const allElements = [
      ...stadiumData.sections,
      ...stadiumData.concessions,
      ...stadiumData.restrooms,
      ...stadiumData.gates,
    ];

    for (const el of allElements) {
      const ex = el.x * scaleX;
      const ey = el.y * scaleY;
      const dist = Math.sqrt((mx - ex) ** 2 + (my - ey) ** 2);

      if (dist < 24) {
        hoveredElement = el;
        canvas.style.cursor = 'pointer';
        break;
      }
    }

    if (!hoveredElement) canvas.style.cursor = 'crosshair';
    draw();
  });

  canvas.addEventListener('click', (e) => {
    if (hoveredElement) {
      // If it's a gate, select it
      if (stadiumData.gates.find(g => g.id === hoveredElement.id)) {
        gateSelect.value = hoveredElement.id;
        onRouteChange();
      }
      // If it's a section, select it
      else if (stadiumData.sections.find(s => s.id === hoveredElement.id)) {
        sectionSelect.value = hoveredElement.id;
        onRouteChange();
      }
    }
  });

  // ─── Draw Everything ─────────────────────────────────────────
  function draw() {
    if (!stadiumData) return;

    const w = canvas.width;
    const h = canvas.height;
    const scaleX = w / 760;
    const scaleY = h / 530;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(0, 0, w, h);

    // Draw field (center of stadium)
    drawField(w, h, scaleX, scaleY);

    // Draw sections
    stadiumData.sections.forEach(section => {
      const x = section.x * scaleX;
      const y = section.y * scaleY;
      const r = 22 * Math.min(scaleX, scaleY);
      const isHovered = hoveredElement && hoveredElement.id === section.id;
      const isSelected = selectedSection && selectedSection.id === section.id;

      // Occupancy-based color
      const hue = 260 - section.occupancy * 200; // Purple to red
      const alpha = isHovered || isSelected ? 0.9 : 0.5;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);

      if (isSelected) {
        ctx.fillStyle = `rgba(108, 92, 231, 0.8)`;
        ctx.shadowColor = 'rgba(108, 92, 231, 0.6)';
        ctx.shadowBlur = 20;
      } else {
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.shadowBlur = 0;

      // Border
      ctx.strokeStyle = isHovered || isSelected
        ? 'rgba(255,255,255,0.6)'
        : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isHovered || isSelected ? 2 : 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `${isHovered ? 'bold' : 'normal'} ${11 * Math.min(scaleX, scaleY)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(section.id, x, y);
    });

    // Draw concessions
    stadiumData.concessions.forEach(c => {
      const x = c.x * scaleX;
      const y = c.y * scaleY;
      const isHovered = hoveredElement && hoveredElement.id === c.id;
      const size = isHovered ? 14 : 10;

      ctx.fillStyle = isHovered ? '#00cec9' : 'rgba(0, 206, 201, 0.7)';
      ctx.beginPath();
      roundedRect(ctx, x - size, y - size, size * 2, size * 2, 4);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = `${12 * Math.min(scaleX, scaleY)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍔', x, y);
    });

    // Draw restrooms
    stadiumData.restrooms.forEach(r => {
      const x = r.x * scaleX;
      const y = r.y * scaleY;
      const isHovered = hoveredElement && hoveredElement.id === r.id;
      const size = isHovered ? 14 : 10;

      ctx.fillStyle = isHovered ? '#fd79a8' : 'rgba(253, 121, 168, 0.7)';
      ctx.beginPath();
      roundedRect(ctx, x - size, y - size, size * 2, size * 2, 4);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = `${12 * Math.min(scaleX, scaleY)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚻', x, y);
    });

    // Draw gates
    stadiumData.gates.forEach(g => {
      const x = g.x * scaleX;
      const y = g.y * scaleY;
      const isHovered = hoveredElement && hoveredElement.id === g.id;
      const isSelected = selectedGate && selectedGate.id === g.id;
      const size = (isHovered || isSelected) ? 16 : 12;

      ctx.fillStyle = (isHovered || isSelected) ? '#fdcb6e' : 'rgba(253, 203, 110, 0.7)';

      if (isSelected) {
        ctx.shadowColor = 'rgba(253, 203, 110, 0.5)';
        ctx.shadowBlur = 15;
      }

      // Diamond shape for gates
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#111';
      ctx.font = `bold ${9 * Math.min(scaleX, scaleY)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(g.id, x, y);
    });

    // Draw animated path
    if (pathAnimation.active && pathAnimation.points.length >= 2) {
      drawAnimatedPath();
    }

    // Tooltip
    if (hoveredElement) {
      drawTooltip(hoveredElement, scaleX, scaleY);
    }
  }

  function drawField(w, h, scaleX, scaleY) {
    const cx = 380 * scaleX;
    const cy = 265 * scaleY;
    const fw = 200 * scaleX;
    const fh = 150 * scaleY;

    ctx.strokeStyle = 'rgba(0, 184, 148, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);

    // Field outline
    roundedRect(ctx, cx - fw / 2, cy - fh / 2, fw, fh, 12);
    ctx.stroke();

    // Center line
    ctx.beginPath();
    ctx.moveTo(cx - fw / 2, cy);
    ctx.lineTo(cx + fw / 2, cy);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 30 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);

    // "FIELD" label
    ctx.fillStyle = 'rgba(0, 184, 148, 0.2)';
    ctx.font = `bold ${16 * Math.min(scaleX, scaleY)}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FIELD', cx, cy);
  }

  function drawAnimatedPath() {
    const pts = pathAnimation.points;
    const progress = pathAnimation.progress;

    // Draw full path faintly
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = 'rgba(108, 92, 231, 0.15)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw animated progress
    const totalLength = getPathLength(pts);
    const targetLength = totalLength * progress;
    let accumulated = 0;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    let endX = pts[0].x;
    let endY = pts[0].y;

    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      const segLen = Math.sqrt(dx * dx + dy * dy);

      if (accumulated + segLen <= targetLength) {
        ctx.lineTo(pts[i].x, pts[i].y);
        endX = pts[i].x;
        endY = pts[i].y;
        accumulated += segLen;
      } else {
        const remaining = targetLength - accumulated;
        const t = remaining / segLen;
        endX = pts[i - 1].x + dx * t;
        endY = pts[i - 1].y + dy * t;
        ctx.lineTo(endX, endY);
        break;
      }
    }

    // Gradient stroke
    const grad = ctx.createLinearGradient(pts[0].x, pts[0].y, endX, endY);
    grad.addColorStop(0, '#fdcb6e');
    grad.addColorStop(0.5, '#6c5ce7');
    grad.addColorStop(1, '#00cec9');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(108, 92, 231, 0.5)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Animated dot at the end
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Start marker
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fdcb6e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function getPathLength(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  function drawTooltip(el, scaleX, scaleY) {
    const x = el.x * scaleX;
    const y = el.y * scaleY;

    let label = el.name;
    let extra = '';

    if (el.occupancy !== undefined) {
      extra = `Occupancy: ${Math.round(el.occupancy * 100)}%`;
    }
    if (el.waitTime !== undefined) {
      extra = `Wait: ${el.waitTime} min`;
    }

    const padding = 10;
    const lineHeight = 16;
    const lines = extra ? [label, extra] : [label];

    ctx.font = '12px Inter, sans-serif';
    let maxWidth = 0;
    lines.forEach(l => {
      maxWidth = Math.max(maxWidth, ctx.measureText(l).width);
    });

    const boxW = maxWidth + padding * 2;
    const boxH = lines.length * lineHeight + padding * 2;
    let bx = x - boxW / 2;
    let by = y - 40 - boxH;

    // Keep within canvas
    bx = Math.max(4, Math.min(canvas.width - boxW - 4, bx));
    by = Math.max(4, by);

    // Background
    ctx.fillStyle = 'rgba(18, 18, 26, 0.95)';
    roundedRect(ctx, bx, by, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    roundedRect(ctx, bx, by, boxW, boxH, 8);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#f0f0f5';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(lines[0], bx + padding, by + padding);

    if (lines[1]) {
      ctx.fillStyle = '#8a8a9a';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(lines[1], bx + padding, by + padding + lineHeight);
    }
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Initial draw
  draw();
});
