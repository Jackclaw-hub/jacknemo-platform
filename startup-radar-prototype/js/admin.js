/**
 * Startup Radar — Admin Dashboard Logic
 * Reads from window.SR_DATA and populates stats + tabbed tables.
 */

(function () {
  const data = window.SR_DATA;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const statsEl = document.getElementById('admin-stats');
  const users   = data.adminUsers;

  const pending  = users.filter(u => u.status === 'pending').length;
  const flagged  = users.filter(u => u.status === 'flagged').length;
  const verified = users.filter(u => u.status === 'verified').length;
  const active   = users.filter(u => u.status === 'active').length;

  const stats = [
    { num: users.length,             label: 'Total users' },
    { num: active,                   label: 'Active founders' },
    { num: verified,                 label: 'Verified suppliers' },
    { num: pending,                  label: 'Pending review',  color: 'var(--amber)' },
    { num: flagged,                  label: 'Flagged',         color: 'var(--red)'   },
    { num: data.funding.length,      label: 'Funding signals' },
    { num: data.equipment.length,    label: 'Equipment listings' },
    { num: data.services.length,     label: 'Service offers' },
  ];

  statsEl.innerHTML = stats.map(s => `
    <div class="stat-card">
      <span class="stat-card__num" style="${s.color ? 'color:' + s.color : ''}">${s.num}</span>
      <div class="stat-card__label">${s.label}</div>
    </div>`).join('');

  // ── Tab switching ──────────────────────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // ── Users table ────────────────────────────────────────────────────────────
  const statusBadge = (s) => {
    const cls = { active: 'status--active', pending: 'status--pending', flagged: 'status--flagged', verified: 'status--verified' }[s] || '';
    return `<span class="status-badge ${cls}">${s}</span>`;
  };

  document.querySelector('#users-table tbody').innerHTML = users.map(u => `
    <tr>
      <td><strong>${esc(u.name)}</strong></td>
      <td>${esc(u.role)}</td>
      <td>${esc(u.stage)}</td>
      <td>${esc(u.sector)}</td>
      <td style="color:var(--text-muted)">${esc(u.joined)}</td>
      <td>${statusBadge(u.status)}</td>
      <td>
        ${u.status === 'pending' ? `<button class="btn btn--primary" style="padding:.35rem .75rem;font-size:.8rem" onclick="changeStatus('${u.id}','verified',this)">Verify</button>` : ''}
        ${u.status !== 'flagged' ? `<button class="btn btn--danger" style="padding:.35rem .75rem;font-size:.8rem;margin-left:.4rem" onclick="changeStatus('${u.id}','flagged',this)">Flag</button>` : ''}
      </td>
    </tr>`).join('');

  // ── Funding table ──────────────────────────────────────────────────────────
  document.querySelector('#funding-table tbody').innerHTML = data.funding.map(f => `
    <tr>
      <td><strong>${esc(f.title)}</strong></td>
      <td style="color:var(--text-muted)">${esc(f.org)}</td>
      <td>${f.stages.join(', ') || '—'}</td>
      <td>${f.geo === 'remote' ? 'Remote' : (f.regions.join(', ') || 'Regional')}</td>
      <td style="color:var(--text-muted)">${f.deadline || 'Rolling'}</td>
    </tr>`).join('');

  // ── Equipment table ────────────────────────────────────────────────────────
  document.querySelector('#equipment-table tbody').innerHTML = data.equipment.map(e => `
    <tr>
      <td><strong>${esc(e.title)}</strong></td>
      <td style="color:var(--text-muted)">${esc(e.owner)}</td>
      <td>${e.city || '<span style="color:var(--text-muted)">Remote</span>'}</td>
      <td>${e.dailyRate != null ? '€' + e.dailyRate : '—'}</td>
      <td>${e.hourlyRate != null ? '€' + e.hourlyRate : '—'}</td>
    </tr>`).join('');

  // ── Services table ─────────────────────────────────────────────────────────
  document.querySelector('#services-table tbody').innerHTML = data.services.map(s => `
    <tr>
      <td><strong>${esc(s.title)}</strong></td>
      <td style="color:var(--text-muted)">${esc(s.provider)}</td>
      <td>${s.stages.join(', ') || 'All'}</td>
      <td>${s.fromPrice ? '€' + s.fromPrice.toLocaleString() : 'Free / TBD'}</td>
      <td style="text-align:center">${s.starterFriendly ? '<span style="color:var(--green)">✓</span>' : '<span style="color:var(--text-muted)">—</span>'}</td>
    </tr>`).join('');

  // ── Status action (mock — in-memory only) ──────────────────────────────────
  window.changeStatus = function (userId, newStatus, btn) {
    const user = data.adminUsers.find(u => u.id === userId);
    if (!user) return;
    user.status = newStatus;
    // Re-render users table
    btn.closest('tr').querySelector('td:nth-child(6)').innerHTML = statusBadge(newStatus);
    // Re-render action buttons
    const actionsCell = btn.closest('tr').querySelector('td:last-child');
    actionsCell.innerHTML =
      (newStatus === 'pending' ? `<button class="btn btn--primary" style="padding:.35rem .75rem;font-size:.8rem" onclick="changeStatus('${userId}','verified',this)">Verify</button>` : '') +
      (newStatus !== 'flagged' ? `<button class="btn btn--danger" style="padding:.35rem .75rem;font-size:.8rem;margin-left:.4rem" onclick="changeStatus('${userId}','flagged',this)">Flag</button>` : '');
    // Update stats
    const newPending  = data.adminUsers.filter(u => u.status === 'pending').length;
    const newFlagged  = data.adminUsers.filter(u => u.status === 'flagged').length;
    const newVerified = data.adminUsers.filter(u => u.status === 'verified').length;
    const newActive   = data.adminUsers.filter(u => u.status === 'active').length;
    const nums = statsEl.querySelectorAll('.stat-card__num');
    nums[0].textContent = data.adminUsers.length;
    nums[1].textContent = newActive;
    nums[2].textContent = newVerified;
    nums[3].textContent = newPending;
    nums[4].textContent = newFlagged;
  };

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
