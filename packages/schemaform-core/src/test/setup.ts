import '@testing-library/jest-dom';

// Add custom matchers from jest-dom
// This allows us to use assertions like .toBeInTheDocument()

// Mock IntersectionObserver for tests
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: class IntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  },
});

// Mock ResizeObserver for tests
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: class ResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  },
});
