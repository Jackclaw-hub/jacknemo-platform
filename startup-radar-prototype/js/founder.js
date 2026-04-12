/**
 * Startup Radar — Founder Radar Logic
 * Scores and ranks funding + equipment + service listings against the
 * founder's profile (stage, sector, region, remote preference).
 */

(function () {
  const stageEl      = document.getElementById('stage');
  const sectorEl     = document.getElementById('sector');
  const regionEl     = document.getElementById('region');
  const remoteEl     = document.getElementById('remote-only');
  const listEl       = document.getElementById('radar-list');
  const countEl      = document.getElementById('result-count');

  // ── Scoring ───────────────────────────────────────────────────────────────
  /**
   * Score a listing 0–100 based on how well it matches the profile.
   * Returns null if the listing is definitively incompatible (filtered out).
   */
  function scoreFunding(item, stage, sector, region, remoteOnly) {
    if (item.stages.length && !item.stages.includes(stage)) return null;
    if (item.sectors.length && sector && !item.sectors.includes(sector)) return null;

    if (remoteOnly && item.geo !== 'remote') return null;

    let score = 50;

    // Stage match bonus
    if (item.stages.includes(stage)) score += 20;

    // Sector match bonus
    if (sector && item.sectors.includes(sector)) score += 15;
    else if (!item.sectors.length) score += 8; // open to all sectors

    // Geo match
    if (item.geo === 'remote') {
      score += 10;
    } else if (region && item.regions.includes(region)) {
      score += 12;
    } else if (!region) {
      score += 5;
    }

    // Deadline urgency bonus (within 60 days)
    if (item.deadline) {
      const days = (new Date(item.deadline) - Date.now()) / 86400000;
      if (days > 0 && days <= 60) score += 5;
    } else {
      score += 3; // rolling / no deadline
    }

    return Math.min(score, 100);
  }

  function scoreEquipment(item, stage, sector, region, remoteOnly) {
    if (item.tags.length && !item.tags.includes(stage) && !item.tags.some(t => t === sector)) {
      // must match at least stage or sector tag
      if (!item.tags.includes(stage)) return null;
    }
    if (remoteOnly && item.geo !== 'remote') return null;

    let score = 40;

    if (item.tags.includes(stage)) score += 18;
    if (sector && item.tags.includes(sector)) score += 15;

    if (item.geo === 'remote') {
      score += 12;
    } else if (region && item.city) {
      // city → region rough mapping
      const cityRegionMap = {
        'Berlin': ['Berlin', 'DE', 'EU'],
        'Munich': ['DE', 'EU'],
        'Hamburg': ['DE', 'EU'],
        'Frankfurt': ['DE', 'EU'],
        'Stuttgart': ['DE', 'EU'],
        'Amsterdam': ['NL', 'EU'],
      };
      const covered = cityRegionMap[item.city] || [];
      if (covered.includes(region)) score += 10;
    } else if (!region) {
      score += 4;
    }

    return Math.min(score, 100);
  }

  function scoreService(item, stage, sector, region, remoteOnly) {
    if (item.stages.length && !item.stages.includes(stage)) return null;
    if (item.sectors.length && sector && !item.sectors.includes(sector)) return null;
    if (remoteOnly && item.geo !== 'remote') return null;

    let score = 45;

    if (item.stages.includes(stage)) score += 18;
    if (sector && item.sectors.includes(sector)) score += 15;
    else if (!item.sectors.length) score += 8;

    if (item.starterFriendly) score += 10;
    if (item.geo === 'remote') score += 8;

    return Math.min(score, 100);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function metaForFunding(item) {
    const parts = [];
    if (item.org) parts.push(item.org);
    if (item.deadline) {
      const d = new Date(item.deadline);
      parts.push('Deadline: ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
    } else {
      parts.push('Rolling');
    }
    if (item.geo === 'remote') parts.push('Remote');
    else if (item.regions.length) parts.push(item.regions.join(', '));
    return parts;
  }

  function metaForEquipment(item) {
    const parts = [item.owner];
    if (item.city) parts.push(item.city);
    else parts.push('Remote / Ship');
    if (item.dailyRate) parts.push(`€${item.dailyRate}/day`);
    if (item.hourlyRate) parts.push(`€${item.hourlyRate}/hr`);
    return parts;
  }

  function metaForService(item) {
    const parts = [item.provider];
    if (item.fromPrice) parts.push(`From €${item.fromPrice.toLocaleString()}`);
    if (item.starterFriendly) parts.push('Starter-friendly');
    if (item.geo === 'remote') parts.push('Remote');
    return parts;
  }

  function renderCard(score, type, title, meta, summary, url) {
    const badgeClass = { funding: 'badge--funding', equipment: 'badge--equipment', service: 'badge--service' }[type];
    const metaHtml = meta.map(m => `<span>${escHtml(m)}</span>`).join('');
    return `
      <a href="${escHtml(url)}" class="radar-card" target="_blank" rel="noopener">
        <span class="radar-card__badge ${badgeClass}">${type}</span>
        <div class="radar-card__body">
          <div class="radar-card__title">${escHtml(title)}</div>
          <div class="radar-card__meta">${metaHtml}</div>
          <div style="margin-top:.5rem;font-size:.85rem;color:var(--text-muted)">${escHtml(summary)}</div>
        </div>
        <div class="radar-card__score">${score}</div>
      </a>`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Main update function ──────────────────────────────────────────────────
  function updateRadar() {
    const stage      = stageEl.value;
    const sector     = sectorEl.value;
    const region     = regionEl.value;
    const remoteOnly = remoteEl.checked;

    const results = [];

    // Funding
    for (const item of window.SR_DATA.funding) {
      const s = scoreFunding(item, stage, sector, region, remoteOnly);
      if (s !== null) results.push({ score: s, type: 'funding', title: item.title, meta: metaForFunding(item), summary: item.summary, url: item.url });
    }

    // Equipment
    for (const item of window.SR_DATA.equipment) {
      const s = scoreEquipment(item, stage, sector, region, remoteOnly);
      if (s !== null) results.push({ score: s, type: 'equipment', title: item.title, meta: metaForEquipment(item), summary: item.summary, url: item.url });
    }

    // Services
    for (const item of window.SR_DATA.services) {
      const s = scoreService(item, stage, sector, region, remoteOnly);
      if (s !== null) results.push({ score: s, type: 'service', title: item.title, meta: metaForService(item), summary: item.summary, url: item.url });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    countEl.textContent = `(${results.length} matched)`;

    if (results.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No matches for your current profile. Try broadening your filters.</div>';
      return;
    }

    listEl.innerHTML = results
      .map(r => renderCard(r.score, r.type, r.title, r.meta, r.summary, r.url))
      .join('');
  }

  // ── Wire up events ────────────────────────────────────────────────────────
  stageEl.addEventListener('change', updateRadar);
  sectorEl.addEventListener('change', updateRadar);
  regionEl.addEventListener('change', updateRadar);
  remoteEl.addEventListener('change', updateRadar);

  // Initial render
  updateRadar();
})();
