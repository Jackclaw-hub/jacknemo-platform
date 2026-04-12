/**
 * Startup Radar — Supply-side form logic
 * Shared by supply-equipment.html and supply-services.html.
 * Uses localStorage for draft persistence.
 */

// ── Tag picker helper ──────────────────────────────────────────────────────
function buildTagPicker(containerId, tags, selected) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  container.style.cssText = 'display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.35rem;';

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tag;
    btn.dataset.tag = tag;
    const isOn = selected.includes(tag);
    applyTagStyle(btn, isOn);
    btn.addEventListener('click', () => {
      const on = btn.dataset.active === '1';
      applyTagStyle(btn, !on);
    });
    container.appendChild(btn);
  });
}

function applyTagStyle(btn, active) {
  btn.dataset.active = active ? '1' : '0';
  if (active) {
    btn.style.cssText = 'background:var(--accent);color:#fff;border:1px solid var(--accent);border-radius:6px;padding:.25rem .65rem;font-size:.8rem;font-weight:600;cursor:pointer;transition:.12s;';
  } else {
    btn.style.cssText = 'background:var(--surface-2);color:var(--text-muted);border:1px solid var(--border);border-radius:6px;padding:.25rem .65rem;font-size:.8rem;cursor:pointer;transition:.12s;';
  }
}

function getSelectedTags(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll('button'))
    .filter(b => b.dataset.active === '1')
    .map(b => b.dataset.tag);
}

// ── Equipment form ─────────────────────────────────────────────────────────
function initSupplyForm(cfg) {
  const STAGES  = ['idea','mvp','early-revenue','growth'];
  buildTagPicker(cfg.tagsEl, cfg.availableTags, []);

  // Toggle city field visibility
  const geoEl    = document.getElementById(cfg.geoEl);
  const cityField = document.getElementById(cfg.cityField);
  function toggleCity() {
    cityField.style.display = geoEl.value === 'remote' ? 'none' : '';
  }
  geoEl.addEventListener('change', toggleCity);
  toggleCity();

  // Load existing drafts
  renderEquipmentDrafts(cfg);
  updateDraftCountBadge(cfg.storageKey);

  // Real-time validation
  setupFieldValidation(cfg);

  // Submit
  document.getElementById(cfg.submitEl).addEventListener('click', () => {
    const title   = document.getElementById(cfg.titleEl).value.trim();
    const owner   = document.getElementById(cfg.ownerEl).value.trim();
    const geo     = document.getElementById(cfg.geoEl).value;
    const city    = document.getElementById(cfg.cityEl).value.trim();
    const daily   = document.getElementById(cfg.dailyEl).value;
    const hourly  = document.getElementById(cfg.hourlyEl).value;
    const summary = document.getElementById(cfg.summaryEl).value.trim();
    const tags    = getSelectedTags(cfg.tagsEl);
    const ownerType = document.getElementById(cfg.ownerTypeEl).value;

    // Enhanced validation
    const errors = [];
    if (!title) errors.push('Title is required');
    if (!owner) errors.push('Owner/organization is required');
    if (geo === 'regional' && !city) errors.push('City is required for regional listings');
    if (!daily && !hourly) errors.push('At least one rate (daily or hourly) is required');
    if (summary.length < 20) errors.push('Description must be at least 20 characters');
    if (tags.length === 0) errors.push('Select at least one tag');

    if (errors.length > 0) {
      showValidationErrors(errors);
      return;
    }

    const item = {
      id: 'e-' + Date.now(),
      title, owner, ownerType, summary, tags, geo,
      city: geo === 'regional' ? city : null,
      dailyRate:  daily  ? Number(daily)  : null,
      hourlyRate: hourly ? Number(hourly) : null,
      url: '#',
      savedAt: new Date().toISOString(),
    };

    const drafts = loadDrafts(cfg.storageKey);
    drafts.unshift(item);
    saveDrafts(cfg.storageKey, drafts);
    renderEquipmentDrafts(cfg);
    updateDraftCountBadge(cfg.storageKey);

    // Reset form
    document.getElementById(cfg.titleEl).value   = '';
    document.getElementById(cfg.ownerEl).value   = '';
    document.getElementById(cfg.dailyEl).value   = '';
    document.getElementById(cfg.hourlyEl).value  = '';
    document.getElementById(cfg.summaryEl).value = '';
    buildTagPicker(cfg.tagsEl, cfg.availableTags, []);
    clearValidationErrors();

    const successEl = document.getElementById(cfg.successEl);
    successEl.style.display = 'inline';
    setTimeout(() => { successEl.style.display = 'none'; }, 3000);
  });
}

function renderEquipmentDrafts(cfg) {
  const el     = document.getElementById(cfg.draftsEl);
  const drafts = loadDrafts(cfg.storageKey);
  if (!drafts.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:.9rem">No listings yet.</p>';
    return;
  }
  el.innerHTML = drafts.map(d => `
    <div class="draft-item">
      <div class="draft-item__info">
        <strong>${escHtml(d.title)}</strong>
        <span>${escHtml(d.owner)} · ${d.geo === 'remote' ? 'Remote' : (d.city || 'Local')}${d.dailyRate != null ? ' · €' + d.dailyRate + '/day' : ''}</span>
      </div>
      <button class="btn btn--danger" data-id="${d.id}" data-store="${cfg.storageKey}">Remove</button>
    </div>`).join('');

  el.querySelectorAll('.btn--danger').forEach(btn => {
    btn.addEventListener('click', () => {
      removeDraft(btn.dataset.store, btn.dataset.id);
      renderEquipmentDrafts(cfg);
    });
  });
}

// ── Service form ───────────────────────────────────────────────────────────
function initServiceForm(cfg) {
  const STAGES  = ['idea','mvp','early-revenue','growth'];
  const SECTORS = ['saas','tech','health','climate','hardware','b2b','agritech','creative','media'];

  buildTagPicker(cfg.stagesEl, STAGES, []);
  buildTagPicker(cfg.sectorsEl, SECTORS, []);

  renderServiceDrafts(cfg);
  updateDraftCountBadge(cfg.storageKey);

  // Real-time validation
  setupFieldValidation(cfg);

  document.getElementById(cfg.submitEl).addEventListener('click', () => {
    const title    = document.getElementById(cfg.titleEl).value.trim();
    const provider = document.getElementById(cfg.providerEl).value.trim();
    const price    = document.getElementById(cfg.priceEl).value;
    const geo      = document.getElementById(cfg.geoEl).value;
    const starter  = document.getElementById(cfg.starterEl).checked;
    const summary  = document.getElementById(cfg.summaryEl).value.trim();
    const stages   = getSelectedTags(cfg.stagesEl);
    const sectors  = getSelectedTags(cfg.sectorsEl);

    // Enhanced validation
    const errors = [];
    if (!title) errors.push('Title is required');
    if (!provider) errors.push('Provider name is required');
    if (summary.length < 20) errors.push('Description must be at least 20 characters');
    if (stages.length === 0) errors.push('Select at least one stage');
    if (sectors.length === 0) errors.push('Select at least one sector');

    if (errors.length > 0) {
      showValidationErrors(errors);
      return;
    }

    const item = {
      id: 's-' + Date.now(),
      title, provider, summary, stages, sectors,
      geo, starterFriendly: starter,
      fromPrice: price ? Number(price) : null,
      url: '#',
      savedAt: new Date().toISOString(),
    };

    const drafts = loadDrafts(cfg.storageKey);
    drafts.unshift(item);
    saveDrafts(cfg.storageKey, drafts);
    renderServiceDrafts(cfg);
    updateDraftCountBadge(cfg.storageKey);

    document.getElementById(cfg.titleEl).value    = '';
    document.getElementById(cfg.providerEl).value = '';
    document.getElementById(cfg.priceEl).value    = '';
    document.getElementById(cfg.summaryEl).value  = '';
    buildTagPicker(cfg.stagesEl, STAGES, []);
    buildTagPicker(cfg.sectorsEl, SECTORS, []);
    clearValidationErrors();

    const successEl = document.getElementById(cfg.successEl);
    successEl.style.display = 'inline';
    setTimeout(() => { successEl.style.display = 'none'; }, 3000);
  });
}

function renderServiceDrafts(cfg) {
  const el     = document.getElementById(cfg.draftsEl);
  const drafts = loadDrafts(cfg.storageKey);
  if (!drafts.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:.9rem">No offers yet.</p>';
    return;
  }
  el.innerHTML = drafts.map(d => `
    <div class="draft-item">
      <div class="draft-item__info">
        <strong>${escHtml(d.title)}</strong>
        <span>${escHtml(d.provider)}${d.fromPrice ? ' · From €' + d.fromPrice.toLocaleString() : ''}${d.starterFriendly ? ' · Starter-friendly' : ''}</span>
      </div>
      <button class="btn btn--danger" data-id="${d.id}" data-store="${cfg.storageKey}">Remove</button>
    </div>`).join('');

  el.querySelectorAll('.btn--danger').forEach(btn => {
    btn.addEventListener('click', () => {
      removeDraft(btn.dataset.store, btn.dataset.id);
      renderServiceDrafts(cfg);
    });
  });
}

// ── localStorage helpers ───────────────────────────────────────────────────
function loadDrafts(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}
function saveDrafts(key, drafts) {
  try { localStorage.setItem(key, JSON.stringify(drafts)); } catch {}
}
function removeDraft(key, id) {
  const drafts = loadDrafts(key).filter(d => d.id !== id);
  saveDrafts(key, drafts);
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Validation helpers ────────────────────────────────────────────────────
function setupFieldValidation(cfg) {
  // Add validation styles to form fields
  const formFields = [
    cfg.titleEl, cfg.ownerEl, cfg.geoEl, cfg.cityEl, cfg.dailyEl, cfg.hourlyEl, cfg.summaryEl
  ].filter(id => id && document.getElementById(id));

  formFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    field.addEventListener('input', () => validateField(field));
    field.addEventListener('blur', () => validateField(field, true));
  });
}

function validateField(field, showError = false) {
  const value = field.value.trim();
  let isValid = true;
  let message = '';

  if (field.type === 'text' || field.type === 'textarea') {
    if (field.required && !value) {
      isValid = false;
      message = 'This field is required';
    } else if (field.id.includes('summary') && value.length < 20 && value.length > 0) {
      isValid = false;
      message = 'Description too short (min 20 chars)';
    }
  }

  if (field.type === 'number') {
    const numValue = Number(field.value);
    if (field.value && (numValue < 0 || isNaN(numValue))) {
      isValid = false;
      message = 'Must be a positive number';
    }
  }

  // Update field appearance
  field.classList.toggle('field--invalid', !isValid && showError);
  field.classList.toggle('field--valid', isValid && value.length > 0);

  // Show/hide error message
  let errorEl = field.nextElementSibling;
  if (!errorEl || !errorEl.classList.contains('field-error')) {
    errorEl = document.createElement('div');
    errorEl.className = 'field-error';
    field.parentNode.appendChild(errorEl);
  }

  if (!isValid && showError) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  } else {
    errorEl.style.display = 'none';
  }

  return isValid;
}

function showValidationErrors(errors) {
  const errorContainer = document.createElement('div');
  errorContainer.className = 'validation-errors';
  errorContainer.innerHTML = `
    <strong>Please fix the following:</strong>
    <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
  `;
  
  // Remove existing error container
  const existing = document.querySelector('.validation-errors');
  if (existing) existing.remove();
  
  document.querySelector('.supply-form').prepend(errorContainer);
  setTimeout(() => errorContainer.scrollIntoView({ behavior: 'smooth' }), 100);
}

function clearValidationErrors() {
  const errors = document.querySelectorAll('.validation-errors, .field-error');
  errors.forEach(el => el.remove());
  
  // Clear validation styles
  document.querySelectorAll('.field--invalid, .field--valid').forEach(el => {
    el.classList.remove('field--invalid', 'field--valid');
  });
}

// ── Draft count badge ─────────────────────────────────────────────────────
function updateDraftCountBadge(storageKey) {
  const drafts = loadDrafts(storageKey);
  const count = drafts.length;
  
  // Find or create badge
  let badge = document.querySelector('.draft-count-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'draft-count-badge';
    document.querySelector('h2').appendChild(badge);
  }
  
  badge.textContent = count > 0 ? `(${count} draft${count !== 1 ? 's' : ''})` : '';
  badge.style.cssText = count > 0 ? 
    'display:inline-block;margin-left:.75rem;background:var(--accent);color:#fff;padding:.15rem .5rem;border-radius:12px;font-size:.75rem;font-weight:600;' :
    'display:none;';
}
