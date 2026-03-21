// Mock Chrome storage API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        callback({});
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      })
    },
    onChanged: {
      addListener: jest.fn()
    },
    local: {
      get: jest.fn((keys, callback) => {
        if (callback) callback({});
      }),
      set: jest.fn()
    }
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn()
  }
};

// Reset DOM before each test
beforeEach(() => {
  document.body.innerHTML = '';
  jest.clearAllMocks();
});
