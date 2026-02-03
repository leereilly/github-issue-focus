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
    }
  }
};

// Reset DOM before each test
beforeEach(() => {
  document.body.innerHTML = '';
  jest.clearAllMocks();
});
