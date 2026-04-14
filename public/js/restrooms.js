/**
 * EXO — Restroom Radar
 * Real-time restroom wait times & occupancy cards
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile nav
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle) navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

  const restroomGrid = document.getElementById('restroomGrid');

  async function loadRestrooms() {
    try {
      const res = await fetch('/api/restrooms');
      const restrooms = await res.json();
      renderRestrooms(restrooms);
    } catch (err) {
      restroomGrid.innerHTML = '<p style="color: var(--accent-red);">Failed to load restroom data.</p>';
    }
  }

  function renderRestrooms(restrooms) {
    // Sort by wait time (shortest first)
    restrooms.sort((a, b) => a.waitTime - b.waitTime);

    restroomGrid.innerHTML = '';
    restrooms.forEach((restroom, i) => {
      const level = getLevel(restroom.occupancy);
      const card = document.createElement('div');
      card.className = 'restroom-card';
      card.style.animation = `fadeUp 0.4s ease-out ${i * 0.1}s both`;

      card.innerHTML = `
        <div class="restroom-card-header">
          <h3>🚻 ${restroom.name}</h3>
          <span class="restroom-status ${level}">${level}</span>
        </div>

        <div class="restroom-stats">
          <div class="restroom-stat">
            <div class="restroom-stat-value" style="color: ${getColor(level)};">${restroom.waitTime}</div>
            <div class="restroom-stat-label">Min Wait</div>
          </div>
          <div class="restroom-stat">
            <div class="restroom-stat-value" style="color: ${getColor(level)};">${Math.round(restroom.occupancy * 100)}%</div>
            <div class="restroom-stat-label">Occupancy</div>
          </div>
        </div>

        <div class="occupancy-bar">
          <div class="occupancy-fill ${level}" style="width: ${Math.round(restroom.occupancy * 100)}%;"></div>
        </div>

        <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; color: var(--text-muted);">
            Updated ${formatTime(restroom.lastUpdated)}
          </span>
          ${i === 0 ? '<span style="font-size: 11px; font-weight: 700; color: var(--accent-green);">⚡ Recommended</span>' : ''}
        </div>
      `;

      restroomGrid.appendChild(card);
    });
  }

  function getLevel(occupancy) {
    if (occupancy < 0.4) return 'low';
    if (occupancy < 0.7) return 'medium';
    return 'high';
  }

  function getColor(level) {
    switch (level) {
      case 'low': return 'var(--accent-green)';
      case 'medium': return 'var(--accent-yellow)';
      case 'high': return 'var(--accent-red)';
    }
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // Initial load
  await loadRestrooms();

  // Auto-refresh every 15 seconds
  setInterval(loadRestrooms, 15000);
});
