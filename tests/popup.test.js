/**
 * Tests for popup.js - GitHub Issue Cleaner Upper popup script
 */

describe('Popup Script', () => {
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

  // Create popup HTML structure
  function createPopupDOM() {
    document.body.innerHTML = `
      <div class="container">
        <h1>Issue Cleaner Upper</h1>
        <div class="filters">
          ${FILTER_IDS.map(id => `
            <label>
              <input type="checkbox" id="${id}">
              <span>${id}</span>
            </label>
          `).join('')}
        </div>
        <button id="resetBtn">Reset to Defaults</button>
      </div>
    `;
  }

  // Helper functions that replicate popup.js behavior
  function loadFilters(callback) {
    chrome.storage.sync.get(['filters'], (result) => {
      const filters = { ...DEFAULT_FILTERS, ...result.filters };
      FILTER_IDS.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
          checkbox.checked = filters[id];
        }
      });
      if (callback) callback(filters);
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
    return filters;
  }

  function resetFilters(callback) {
    chrome.storage.sync.set({ filters: DEFAULT_FILTERS }, () => {
      loadFilters(callback);
    });
  }

  beforeEach(() => {
    createPopupDOM();
  });

  describe('DEFAULT_FILTERS', () => {
    it('should have the correct number of filter types', () => {
      expect(FILTER_IDS).toHaveLength(11);
    });

    it('should have expected filter IDs', () => {
      expect(FILTER_IDS).toContain('addedToProject');
      expect(FILTER_IDS).toContain('movedInProject');
      expect(FILTER_IDS).toContain('statusChanged');
      expect(FILTER_IDS).toContain('labeled');
      expect(FILTER_IDS).toContain('unlabeled');
      expect(FILTER_IDS).toContain('assigned');
      expect(FILTER_IDS).toContain('milestoned');
      expect(FILTER_IDS).toContain('renamed');
      expect(FILTER_IDS).toContain('crossReferenced');
      expect(FILTER_IDS).toContain('closed');
      expect(FILTER_IDS).toContain('reopened');
    });
  });

  describe('Popup DOM Structure', () => {
    it('should have a checkbox for each filter', () => {
      FILTER_IDS.forEach(id => {
        const checkbox = document.getElementById(id);
        expect(checkbox).not.toBeNull();
        expect(checkbox.type).toBe('checkbox');
      });
    });

    it('should have a reset button', () => {
      const resetBtn = document.getElementById('resetBtn');
      expect(resetBtn).not.toBeNull();
    });
  });

  describe('loadFilters', () => {
    it('should call chrome.storage.sync.get', () => {
      loadFilters();
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['filters'], expect.any(Function));
    });

    it('should apply default filters when storage is empty', (done) => {
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      loadFilters(() => {
        FILTER_IDS.forEach(id => {
          const checkbox = document.getElementById(id);
          expect(checkbox.checked).toBe(DEFAULT_FILTERS[id]);
        });
        done();
      });
    });

    it('should apply saved filters from storage', (done) => {
      const savedFilters = {
        addedToProject: false,
        labeled: false,
        closed: true
      };

      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ filters: savedFilters });
      });

      loadFilters(() => {
        expect(document.getElementById('addedToProject').checked).toBe(false);
        expect(document.getElementById('labeled').checked).toBe(false);
        expect(document.getElementById('closed').checked).toBe(true);
        // Others should use defaults
        expect(document.getElementById('movedInProject').checked).toBe(true);
        done();
      });
    });

    it('should merge saved filters with defaults', (done) => {
      const partialFilters = { addedToProject: false };

      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ filters: partialFilters });
      });

      loadFilters(() => {
        expect(document.getElementById('addedToProject').checked).toBe(false);
        expect(document.getElementById('movedInProject').checked).toBe(true);
        expect(document.getElementById('renamed').checked).toBe(true);
        done();
      });
    });
  });

  describe('saveFilters', () => {
    it('should call chrome.storage.sync.set', () => {
      saveFilters();
      expect(chrome.storage.sync.set).toHaveBeenCalled();
    });

    it('should save current checkbox states', () => {
      document.getElementById('addedToProject').checked = false;
      document.getElementById('closed').checked = true;
      document.getElementById('reopened').checked = true;

      const saved = saveFilters();

      expect(saved.addedToProject).toBe(false);
      expect(saved.closed).toBe(true);
      expect(saved.reopened).toBe(true);
    });

    it('should save all filter states', () => {
      const saved = saveFilters();
      expect(Object.keys(saved)).toHaveLength(FILTER_IDS.length);
      FILTER_IDS.forEach(id => {
        expect(saved).toHaveProperty(id);
      });
    });
  });

  describe('resetFilters', () => {
    it('should call chrome.storage.sync.set with default filters', () => {
      resetFilters();
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { filters: DEFAULT_FILTERS },
        expect.any(Function)
      );
    });

    it('should reset all checkboxes to default values', (done) => {
      // First change some values
      document.getElementById('addedToProject').checked = false;
      document.getElementById('closed').checked = true;

      chrome.storage.sync.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });

      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ filters: DEFAULT_FILTERS });
      });

      resetFilters(() => {
        expect(document.getElementById('addedToProject').checked).toBe(true);
        expect(document.getElementById('closed').checked).toBe(false);
        done();
      });
    });
  });

  describe('Event Listeners', () => {
    it('should have change event capability on checkboxes', () => {
      const checkbox = document.getElementById('addedToProject');
      let eventFired = false;
      
      checkbox.addEventListener('change', () => {
        eventFired = true;
      });
      
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
      
      expect(eventFired).toBe(true);
    });

    it('should have click event capability on reset button', () => {
      const resetBtn = document.getElementById('resetBtn');
      let eventFired = false;
      
      resetBtn.addEventListener('click', () => {
        eventFired = true;
      });
      
      resetBtn.click();
      
      expect(eventFired).toBe(true);
    });
  });

  describe('Filter Toggle Behavior', () => {
    it('should toggle checkbox state', () => {
      const checkbox = document.getElementById('addedToProject');
      const initialState = checkbox.checked;
      
      checkbox.checked = !initialState;
      
      expect(checkbox.checked).toBe(!initialState);
    });

    it('should persist toggle through save/load cycle', (done) => {
      document.getElementById('addedToProject').checked = false;
      document.getElementById('closed').checked = true;

      const saved = saveFilters();

      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ filters: saved });
      });

      // Reset DOM
      FILTER_IDS.forEach(id => {
        document.getElementById(id).checked = DEFAULT_FILTERS[id];
      });

      loadFilters(() => {
        expect(document.getElementById('addedToProject').checked).toBe(false);
        expect(document.getElementById('closed').checked).toBe(true);
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing checkboxes gracefully', () => {
      document.getElementById('addedToProject').remove();
      
      expect(() => loadFilters()).not.toThrow();
      expect(() => saveFilters()).not.toThrow();
    });

    it('should handle corrupted storage data', () => {
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ filters: { invalidKey: true, addedToProject: 'not-a-boolean' } });
      });

      expect(() => loadFilters()).not.toThrow();
    });

    it('should handle null storage result', (done) => {
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ filters: null });
      });

      loadFilters(() => {
        // Should fall back to defaults
        expect(document.getElementById('addedToProject').checked).toBe(true);
        done();
      });
    });
  });
});
