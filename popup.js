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
  crossReferenced: false,
  closed: false,
  reopened: false
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
}

function resetFilters() {
  chrome.storage.sync.set({ filters: DEFAULT_FILTERS }, () => {
    loadFilters();
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadFilters();
  
  // Add change listeners to all toggles
  FILTER_IDS.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', saveFilters);
    }
  });
  
  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetFilters);
});
