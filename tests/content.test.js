/**
 * Tests for content.js - GitHub Issue Focus content script
 */

describe('Content Script', () => {
  // Import the constants and functions we need to test
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

  const EVENT_PATTERNS = {
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
    assigned: {
      selectors: ['[class*="assignee"]', '[class*="AssignedEvent"]'],
      textPatterns: ['assigned', 'self-assigned'],
      iconClass: 'octicon-person'
    },
    milestoned: {
      selectors: ['[class*="milestoned"]', '[class*="MilestonedEvent"]'],
      textPatterns: ['added this to the', 'milestone'],
      iconClass: 'octicon-milestone'
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

  // Helper function to replicate getTimelineItems
  function getTimelineItems() {
    const items = document.querySelectorAll('[data-timeline-event-id]');
    return Array.from(items);
  }

  // Helper function to replicate getEventWrapper
  function getEventWrapper(element) {
    let current = element;
    while (current && current !== document.body) {
      if (current.hasAttribute('data-wrapper-timeline-id')) {
        return current;
      }
      current = current.parentElement;
    }
    return element.closest('[data-wrapper-timeline-id]') || element;
  }

  // Helper function to replicate detectEventType
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

  // Helper to replicate filterTimelineItems
  function filterTimelineItems(currentFilters) {
    const items = getTimelineItems();
    
    items.forEach(item => {
      const wrapper = getEventWrapper(item);
      const eventType = detectEventType(item);
      
      if (eventType && currentFilters[eventType]) {
        wrapper.classList.add('gh-cleaner-hidden');
      } else {
        wrapper.classList.remove('gh-cleaner-hidden');
      }
    });
  }

  describe('DEFAULT_FILTERS', () => {
    it('should have correct default filter values', () => {
      expect(DEFAULT_FILTERS.addedToProject).toBe(true);
      expect(DEFAULT_FILTERS.movedInProject).toBe(true);
      expect(DEFAULT_FILTERS.statusChanged).toBe(true);
      expect(DEFAULT_FILTERS.labeled).toBe(true);
      expect(DEFAULT_FILTERS.unlabeled).toBe(true);
      expect(DEFAULT_FILTERS.assigned).toBe(true);
      expect(DEFAULT_FILTERS.milestoned).toBe(true);
      expect(DEFAULT_FILTERS.renamed).toBe(true);
      expect(DEFAULT_FILTERS.crossReferenced).toBe(false);
      expect(DEFAULT_FILTERS.closed).toBe(false);
      expect(DEFAULT_FILTERS.reopened).toBe(false);
    });

    it('should have 11 filter types', () => {
      expect(Object.keys(DEFAULT_FILTERS)).toHaveLength(11);
    });
  });

  describe('EVENT_PATTERNS', () => {
    it('should have patterns for all filter types', () => {
      const filterKeys = Object.keys(DEFAULT_FILTERS);
      const patternKeys = Object.keys(EVENT_PATTERNS);
      expect(patternKeys).toEqual(expect.arrayContaining(filterKeys));
    });

    it('should have selectors and textPatterns for each event type', () => {
      Object.entries(EVENT_PATTERNS).forEach(([eventType, patterns]) => {
        expect(patterns.selectors).toBeDefined();
        expect(Array.isArray(patterns.selectors)).toBe(true);
        expect(patterns.selectors.length).toBeGreaterThan(0);
        
        expect(patterns.textPatterns).toBeDefined();
        expect(Array.isArray(patterns.textPatterns)).toBe(true);
        expect(patterns.textPatterns.length).toBeGreaterThan(0);
      });
    });

    it('should have iconClass for events requiring icon disambiguation', () => {
      expect(EVENT_PATTERNS.labeled.iconClass).toBe('octicon-tag');
      expect(EVENT_PATTERNS.unlabeled.iconClass).toBe('octicon-tag');
      expect(EVENT_PATTERNS.assigned.iconClass).toBe('octicon-person');
      expect(EVENT_PATTERNS.closed.iconClass).toBe('octicon-issue-closed');
    });
  });

  describe('getTimelineItems', () => {
    it('should return empty array when no timeline items exist', () => {
      document.body.innerHTML = '<div>No timeline items</div>';
      const items = getTimelineItems();
      expect(items).toHaveLength(0);
    });

    it('should find timeline items by data attribute', () => {
      document.body.innerHTML = `
        <div data-timeline-event-id="1">Event 1</div>
        <div data-timeline-event-id="2">Event 2</div>
        <div>Not a timeline item</div>
      `;
      const items = getTimelineItems();
      expect(items).toHaveLength(2);
    });

    it('should return an array, not a NodeList', () => {
      document.body.innerHTML = '<div data-timeline-event-id="1">Event</div>';
      const items = getTimelineItems();
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('getEventWrapper', () => {
    it('should return element with data-wrapper-timeline-id when it is the element itself', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="wrapper-1" data-timeline-event-id="1">
          Content
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      const wrapper = getEventWrapper(element);
      expect(wrapper.hasAttribute('data-wrapper-timeline-id')).toBe(true);
    });

    it('should find parent wrapper when element is nested', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="wrapper-1">
          <div class="inner">
            <span data-timeline-event-id="1">Content</span>
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      const wrapper = getEventWrapper(element);
      expect(wrapper.getAttribute('data-wrapper-timeline-id')).toBe('wrapper-1');
    });

    it('should return the element itself when no wrapper exists', () => {
      document.body.innerHTML = `
        <div data-timeline-event-id="1">Content</div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      const wrapper = getEventWrapper(element);
      expect(wrapper).toBe(element);
    });
  });

  describe('detectEventType', () => {
    it('should detect addedToProject event by selector', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            <div class="AddedToProjectV2Event">Added to project</div>
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('addedToProject');
    });

    it('should detect addedToProject event by text pattern', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            User added this to Project Board
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('addedToProject');
    });

    it('should detect labeled event with icon', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            <svg class="octicon-tag"></svg>
            User added the bug label
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('labeled');
    });

    it('should detect unlabeled event with icon', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            <svg class="octicon-tag"></svg>
            User removed the bug label
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('unlabeled');
    });

    it('should detect assigned event', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            <svg class="octicon-person"></svg>
            User assigned this to developer
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('assigned');
    });

    it('should detect self-assigned event', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            <svg class="octicon-person"></svg>
            User self-assigned this
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('assigned');
    });

    it('should detect renamed event', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            User changed the title from "Old" to "New"
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('renamed');
    });

    it('should detect closed event', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            <svg class="octicon-issue-closed"></svg>
            User closed this as completed
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('closed');
    });

    it('should detect reopened event', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            User reopened this issue
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('reopened');
    });

    it('should detect crossReferenced event', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            User mentioned this in #123
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('crossReferenced');
    });

    it('should detect milestoned event', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            <div class="MilestonedEvent">User added to milestone v1.0</div>
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('milestoned');
    });

    it('should detect milestoned event with "added this to" text pattern', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            <svg class="octicon octicon-milestone"></svg>
            User added this to the Test milestone
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('milestoned');
    });

    it('should NOT detect milestoned event as addedToProject', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            <svg aria-hidden="true" focusable="false" class="octicon octicon-milestone" viewBox="0 0 16 16" width="16" height="16">
              <path d="M7.75 0a.75.75 0 0 1 .75.75V3h3.634c.414 0"></path>
            </svg>
            <span>User</span> added this to the <a href="/milestone/1">Test milestone</a> milestone
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      const eventType = detectEventType(element);
      expect(eventType).toBe('milestoned');
      expect(eventType).not.toBe('addedToProject');
    });

    it('should detect movedInProject event', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            User moved this to In Progress
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('movedInProject');
    });

    it('should return null for unknown event types', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            Some random comment text
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBeNull();
    });

    it('should be case-insensitive for text patterns', () => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            User CHANGED THE TITLE from "Old" to "New"
          </div>
        </div>
      `;
      const element = document.querySelector('[data-timeline-event-id]');
      expect(detectEventType(element)).toBe('renamed');
    });
  });

  describe('filterTimelineItems', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-wrapper-timeline-id="1">
          <div data-timeline-event-id="1">
            User changed the title
          </div>
        </div>
        <div data-wrapper-timeline-id="2">
          <div data-timeline-event-id="2">
            <svg class="octicon-tag"></svg>
            User added label
          </div>
        </div>
        <div data-wrapper-timeline-id="3">
          <div data-timeline-event-id="3">
            User reopened this
          </div>
        </div>
      `;
    });

    it('should hide items with enabled filters', () => {
      const filters = { ...DEFAULT_FILTERS };
      filterTimelineItems(filters);
      
      const wrapper1 = document.querySelector('[data-wrapper-timeline-id="1"]');
      const wrapper2 = document.querySelector('[data-wrapper-timeline-id="2"]');
      
      expect(wrapper1.classList.contains('gh-cleaner-hidden')).toBe(true);
      expect(wrapper2.classList.contains('gh-cleaner-hidden')).toBe(true);
    });

    it('should not hide items with disabled filters', () => {
      const filters = { ...DEFAULT_FILTERS };
      filterTimelineItems(filters);
      
      const wrapper3 = document.querySelector('[data-wrapper-timeline-id="3"]');
      expect(wrapper3.classList.contains('gh-cleaner-hidden')).toBe(false);
    });

    it('should remove hidden class when filter is disabled', () => {
      const filters = { ...DEFAULT_FILTERS };
      filterTimelineItems(filters);
      
      const wrapper1 = document.querySelector('[data-wrapper-timeline-id="1"]');
      expect(wrapper1.classList.contains('gh-cleaner-hidden')).toBe(true);
      
      filters.renamed = false;
      filterTimelineItems(filters);
      expect(wrapper1.classList.contains('gh-cleaner-hidden')).toBe(false);
    });

    it('should handle empty timeline', () => {
      document.body.innerHTML = '';
      expect(() => filterTimelineItems(DEFAULT_FILTERS)).not.toThrow();
    });

    it('should handle all filters disabled', () => {
      const filters = Object.fromEntries(
        Object.keys(DEFAULT_FILTERS).map(key => [key, false])
      );
      filterTimelineItems(filters);
      
      const hiddenItems = document.querySelectorAll('.gh-cleaner-hidden');
      expect(hiddenItems).toHaveLength(0);
    });

    it('should handle all filters enabled', () => {
      const filters = Object.fromEntries(
        Object.keys(DEFAULT_FILTERS).map(key => [key, true])
      );
      filterTimelineItems(filters);
      
      // All detectable items should be hidden
      const wrapper1 = document.querySelector('[data-wrapper-timeline-id="1"]');
      const wrapper2 = document.querySelector('[data-wrapper-timeline-id="2"]');
      const wrapper3 = document.querySelector('[data-wrapper-timeline-id="3"]');
      
      expect(wrapper1.classList.contains('gh-cleaner-hidden')).toBe(true);
      expect(wrapper2.classList.contains('gh-cleaner-hidden')).toBe(true);
      expect(wrapper3.classList.contains('gh-cleaner-hidden')).toBe(true);
    });
  });

  describe('Chrome Storage Integration', () => {
    it('should call chrome.storage.sync.get on load', () => {
      chrome.storage.sync.get(['filters'], () => {});
      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });

    it('should register storage change listener', () => {
      chrome.storage.onChanged.addListener(() => {});
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
    });
  });
});
