// GitHub Issue Focus - Popup Script

const DEFAULT_FILTERS = {
  addedToProject: true,
  movedInProject: true,
  statusChanged: true,
  labeled: true,
  unlabeled: true,
  assigned: true,
  milestoned: true,
  renamed: true,
  crossReferenced: true,
  closed: true,
  reopened: true
};

const FILTER_IDS = Object.keys(DEFAULT_FILTERS);

function loadFilters() {
  chrome.storage.sync.get(['filters'], (result) => {
    const filters = { ...DEFAULT_FILTERS, ...result.filters };
    FILTER_IDS.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = filters[id];
      }
    });
    updateMasterToggle();
  });
}

function saveFilters() {
  const filters = {};
  FILTER_IDS.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      filters[id] = checkbox.checked;
    }
  });
  chrome.storage.sync.set({ filters });
  updateMasterToggle();
}

function updateMasterToggle() {
  const masterToggle = document.getElementById('masterToggle');
  if (!masterToggle) return;

  const allChecked = FILTER_IDS.every(id => {
    const checkbox = document.getElementById(id);
    return checkbox && checkbox.checked;
  });
  const allUnchecked = FILTER_IDS.every(id => {
    const checkbox = document.getElementById(id);
    return checkbox && !checkbox.checked;
  });

  masterToggle.checked = allChecked;

  // Fade master card when individual toggles are in a mixed state
  const masterCard = document.querySelector('.master-card');
  if (masterCard) {
    if (!allChecked && !allUnchecked) {
      masterCard.classList.add('master-overridden');
    } else {
      masterCard.classList.remove('master-overridden');
    }
  }
}

function toggleAll(checked) {
  FILTER_IDS.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = checked;
    }
  });
  saveFilters();
}

function resetFilters() {
  chrome.storage.sync.set({ filters: DEFAULT_FILTERS }, () => {
    loadFilters();
  });
}

function applyTheme() {
  chrome.storage.local.get(['githubTheme'], (result) => {
    const theme = result.githubTheme || 'auto';
    let isDark = false;

    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'auto') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    // 'light' → isDark stays false

    document.documentElement.classList.toggle('dark-theme', isDark);
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  loadFilters();

  // Individual filter toggles
  FILTER_IDS.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', saveFilters);
    }
  });

  // Master toggle
  const masterToggle = document.getElementById('masterToggle');
  if (masterToggle) {
    masterToggle.addEventListener('change', (e) => {
      toggleAll(e.target.checked);
    });
  }

  // Click anywhere on a filter row to toggle its checkbox
  document.querySelectorAll('.filter-row[data-for]').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.toggle')) return;
      const id = row.getAttribute('data-for');
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        saveFilters();
      }
    });
  });

  // Reset button (hidden but functional)
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
});
