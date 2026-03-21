// GitHub Issue Focus - Content Script

const DEFAULT_FILTERS = {
  addedToProject: true,
  movedInProject: true,
  statusChanged: true,
  labeled: true,
  unlabeled: true,
  assigned: true,
  unassigned: true,
  milestoned: true,
  renamed: true,
  crossReferenced: true,
  closed: true,
  reopened: true
};

let currentFilters = { ...DEFAULT_FILTERS };

// Event type detection patterns
const EVENT_PATTERNS = {
  milestoned: {
    selectors: ['[class*="milestoned"]', '[class*="MilestonedEvent"]'],
    textPatterns: ['milestone']
  },
  addedToProject: {
    selectors: ['[class*="AddedToProjectV2Event"]'],
    textPatterns: ['added this to']
  },
  movedInProject: {
    selectors: ['[class*="ProjectV2ItemStatusChangedEvent"]'],
    textPatterns: ['moved this to', 'moved this from']
  },
  statusChanged: {
    selectors: ['[class*="ProjectV2ItemStatusChangedEvent"]'],
    textPatterns: ['set the']
  },
  labeled: {
    selectors: ['[class*="labeledEvent"]', '[class*="LabeledEvent"]'],
    textPatterns: ['added', 'labeled'],
    iconClass: 'octicon-tag'
  },
  unlabeled: {
    selectors: ['[class*="unlabeledEvent"]', '[class*="UnlabeledEvent"]'],
    textPatterns: ['removed', 'unlabeled'],
    iconClass: 'octicon-tag'
  },
  unassigned: {
    selectors: ['[class*="UnassignedEvent"]'],
    textPatterns: ['unassigned'],
    iconClass: 'octicon-person'
  },
  assigned: {
    selectors: ['[class*="assignee"]', '[class*="AssignedEvent"]'],
    textPatterns: ['assigned', 'self-assigned'],
    iconClass: 'octicon-person'
  },
  renamed: {
    selectors: ['[class*="renamed"]', '[class*="RenamedTitleEvent"]'],
    textPatterns: ['changed the title']
  },
  crossReferenced: {
    selectors: ['[class*="cross-referenced"]', '[class*="CrossReferencedEvent"]'],
    textPatterns: ['mentioned this', 'referenced this']
  },
  closed: {
    selectors: ['[class*="ClosedEvent"]'],
    textPatterns: ['closed this'],
    iconClass: 'octicon-issue-closed'
  },
  reopened: {
    selectors: ['[class*="ReopenedEvent"]'],
    textPatterns: ['reopened this']
  }
};

function getTimelineItems() {
  // Find timeline event rows by their data attributes
  const items = document.querySelectorAll('[data-timeline-event-id]');
  return Array.from(items);
}

function getEventWrapper(element) {
  // Walk up to find the wrapper div with data-wrapper-timeline-id
  let current = element;
  while (current && current !== document.body) {
    if (current.hasAttribute('data-wrapper-timeline-id')) {
      return current;
    }
    current = current.parentElement;
  }
  return element.closest('[data-wrapper-timeline-id]') || element;
}

function detectEventType(element) {
  const wrapper = getEventWrapper(element);
  const html = wrapper.innerHTML || '';
  const text = wrapper.textContent || '';
  
  for (const [eventType, patterns] of Object.entries(EVENT_PATTERNS)) {
    // Check selectors first - these are most specific
    for (const selector of patterns.selectors) {
      if (wrapper.querySelector(selector) || wrapper.matches(selector)) {
        return eventType;
      }
    }
  }
  
  // Then check text patterns with icon requirements - these need disambiguation
  for (const [eventType, patterns] of Object.entries(EVENT_PATTERNS)) {
    if (patterns.iconClass) {
      for (const pattern of patterns.textPatterns) {
        if (text.toLowerCase().includes(pattern.toLowerCase())) {
          if (html.includes(patterns.iconClass)) {
            return eventType;
          }
        }
      }
    }
  }
  
  // Finally check text patterns without icon requirements - these are least specific
  for (const [eventType, patterns] of Object.entries(EVENT_PATTERNS)) {
    if (!patterns.iconClass) {
      for (const pattern of patterns.textPatterns) {
        if (text.toLowerCase().includes(pattern.toLowerCase())) {
          return eventType;
        }
      }
    }
  }
  
  return null;
}

function updateBadge() {
  const hiddenCount = document.querySelectorAll('.gh-cleaner-hidden').length;
  if (chrome.action && chrome.action.setBadgeText) {
    chrome.action.setBadgeText({ text: hiddenCount > 0 ? String(hiddenCount) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#006e2c' });
  }
}

function filterTimelineItems(overrideFilters) {
  const filters = overrideFilters || currentFilters;
  const items = getTimelineItems();
  
  items.forEach(item => {
    const wrapper = getEventWrapper(item);
    const eventType = detectEventType(item);
    
    if (eventType && filters[eventType]) {
      wrapper.classList.add('gh-cleaner-hidden');
    } else {
      wrapper.classList.remove('gh-cleaner-hidden');
    }
  });

  updateBadge();
}

function loadFilters() {
  chrome.storage.sync.get(['filters'], (result) => {
    if (result.filters) {
      currentFilters = { ...DEFAULT_FILTERS, ...result.filters };
    }
    filterTimelineItems();
  });
}

// Detect GitHub's theme setting and store it for the popup
function detectGitHubTheme() {
  const colorMode = document.documentElement.getAttribute('data-color-mode');
  if (colorMode) {
    chrome.storage.local.set({ githubTheme: colorMode });
  }
}

// Only run side effects in browser context (not during test require())
if (typeof module === 'undefined') {
  detectGitHubTheme();

  // Watch for theme changes (e.g. user toggles GitHub appearance settings)
  new MutationObserver(() => detectGitHubTheme()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-color-mode']
  });

  // Initialize
  loadFilters();

  // Listen for filter changes from popup
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.filters) {
      currentFilters = { ...DEFAULT_FILTERS, ...changes.filters.newValue };
      filterTimelineItems();
    }
  });

  // Observe DOM changes for dynamically loaded content
  const observer = new MutationObserver((mutations) => {
    let shouldFilter = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldFilter = true;
        break;
      }
    }
    if (shouldFilter) {
      setTimeout(filterTimelineItems, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Re-filter on navigation (GitHub uses client-side routing)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(filterTimelineItems, 500);
    }
  }).observe(document, { subtree: true, childList: true });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_FILTERS, EVENT_PATTERNS, getTimelineItems, getEventWrapper, detectEventType, filterTimelineItems };
}
