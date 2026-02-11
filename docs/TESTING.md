# 🧪 Testing Documentation

## Overview

This document describes the testing strategy and test suites for the Real-Time Collaborative Task Board application.

---

## Test Suites

### ✅ MultiSelect Component Tests
**File:** `src/components/MultiSelect.test.tsx`

**Coverage:** 17 tests covering the reusable MultiSelect dropdown component

#### Test Categories:

1. **Rendering (4 tests)**
   - ✓ Renders with placeholder text when no values selected
   - ✓ Displays count when values are selected
   - ✓ Renders with custom label
   - ✓ Displays "No options available" when options array is empty

2. **Dropdown Interaction (3 tests)**
   - ✓ Opens dropdown when button is clicked
   - ✓ Closes dropdown when clicking outside
   - ✓ Rotates chevron icon when dropdown is open

3. **Selection Logic (4 tests)**
   - ✓ Calls onChange with new value when option is selected
   - ✓ Calls onChange with removed value when option is deselected
   - ✓ Handles multiple selections correctly
   - ✓ Correctly shows checked state for selected options

4. **Accessibility (3 tests)**
   - ✓ Has proper ARIA attributes
   - ✓ Updates aria-expanded when dropdown opens
   - ✓ Checkboxes are keyboard accessible

5. **Dark Mode Support (1 test)**
   - ✓ Applies dark mode classes

6. **Custom Styling (2 tests)**
   - ✓ Applies custom className
   - ✓ Applies custom dropdown className

---

### ✅ useVirtualization Hook Tests
**File:** `src/hooks/useVirtualization.test.ts`

**Coverage:** 11 tests covering the custom virtualization hook

#### Test Categories:

1. **Basic Functionality (4 tests)**
   - ✓ Initializes with correct values for empty list
   - ✓ Calculates correct total height
   - ✓ Calculates visible range at scroll position 0
   - ✓ Includes overscan in calculations

2. **Performance (2 tests)**
   - ✓ Renders constant number of items for large lists
   - ✓ Does not render all items for large lists

3. **Edge Cases (3 tests)**
   - ✓ Handles single item
   - ✓ Handles zero height container
   - ✓ Handles very small items

4. **Utilities (2 tests)**
   - ✓ Provides scrollToIndex function
   - ✓ Calculates correct offsetY

---

## Test Results

```
Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        ~1.4s
```

### Coverage Summary

| Component/Hook | Tests | Status |
|----------------|-------|--------|
| MultiSelect | 17 | ✅ All Pass |
| useVirtualization | 11 | ✅ All Pass |
| **Total** | **28** | **✅ 100%** |

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# MultiSelect tests only
npm test -- --testPathPattern="MultiSelect"

# useVirtualization tests only
npm test -- --testPathPattern="useVirtualization"

# Both test suites
npm test -- --testPathPattern="MultiSelect|useVirtualization"
```

### Run with Coverage
```bash
npm test -- --coverage --watchAll=false
```

### Run in Watch Mode
```bash
npm test -- --watch
```

---

## Testing Tools & Libraries

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner and assertion library |
| **React Testing Library** | Component testing utilities |
| **@testing-library/react** | React-specific testing utilities |
| **@testing-library/jest-dom** | Custom Jest matchers for DOM |

---

## Test Best Practices

### ✅ What We Test

1. **Component Rendering**
   - Initial state
   - Props handling
   - Conditional rendering

2. **User Interactions**
   - Click events
   - Keyboard events
   - Form submissions

3. **State Changes**
   - State updates
   - Callback invocations
   - Side effects

4. **Accessibility**
   - ARIA attributes
   - Keyboard navigation
   - Screen reader support

5. **Edge Cases**
   - Empty states
   - Error conditions
   - Boundary values

### ❌ What We Don't Test

- Implementation details
- Third-party libraries
- CSS styling (except class application)
- Browser-specific behavior

---

## Writing New Tests

### Test Structure

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear state
  });

  describe('Feature Category', () => {
    test('specific behavior', () => {
      // Arrange
      const props = { /* ... */ };
      
      // Act
      render(<Component {...props} />);
      
      // Assert
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });
});
```

### Naming Conventions

- **Test files**: `ComponentName.test.tsx` or `hookName.test.ts`
- **Test descriptions**: Use clear, descriptive names
- **Test organization**: Group related tests in `describe` blocks

### Assertions

```typescript
// Existence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Text content
expect(element).toHaveTextContent('text');

// Attributes
expect(element).toHaveAttribute('aria-label', 'value');
expect(element).toHaveClass('className');

// State
expect(checkbox).toBeChecked();
expect(button).toBeDisabled();

// Callbacks
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
```

---

## Future Testing Goals

### Components to Test

- [ ] TaskBoard
- [ ] TaskColumn
- [ ] VirtualizedTaskColumn
- [ ] TaskCard
- [ ] TaskModal
- [ ] FilterBar
- [ ] Toast

### Hooks to Test

- [ ] useTasks
- [ ] useDarkMode
- [ ] useToast
- [ ] useKeyboardShortcuts

### Integration Tests

- [ ] Complete task creation flow
- [ ] Drag-and-drop workflow
- [ ] Filter and search functionality
- [ ] Undo/Redo operations
- [ ] Virtualization toggle

### E2E Tests

- [ ] Full user workflows
- [ ] Cross-browser testing
- [ ] Performance testing
- [ ] Accessibility testing

---

## Continuous Integration

### GitHub Actions (Recommended)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage --watchAll=false
```

---

## Test Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Components | 15% | 80% |
| Hooks | 20% | 90% |
| Utils | 0% | 70% |
| **Overall** | **~12%** | **80%** |

---

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout: `jest.setTimeout(10000)`
   - Check for infinite loops
   - Verify async operations complete

2. **Act warnings**
   - Wrap state updates in `act()`
   - Use `waitFor` for async updates
   - Check React Testing Library docs

3. **Element not found**
   - Use `screen.debug()` to see DOM
   - Check selectors and queries
   - Verify element is rendered

---

**Last Updated**: February 2026  
**Test Framework**: Jest + React Testing Library  
**Total Tests**: 28 passing ✅

