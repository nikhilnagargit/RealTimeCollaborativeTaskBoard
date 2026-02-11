# Keyboard Shortcuts Testing Guide 🧪

## Quick Test Checklist

### **Test 1: Create New Task (N)**
1. Open the app in browser
2. Press `N` key
3. ✅ Expected: Task creation modal opens
4. ❌ If fails: Check console for errors

### **Test 2: Close Modal (Esc)**
1. Open task modal (press `N`)
2. Press `Esc` key
3. ✅ Expected: Modal closes
4. ❌ If fails: Check if Esc handler is registered

### **Test 3: Show Shortcuts Help (?)**
1. Press `?` key (Shift + /)
2. ✅ Expected: Shortcuts help modal opens
3. ✅ Expected: Shows 3 shortcuts in categories
4. ❌ If fails: Check if preventDefault is working

### **Test 4: Close Help Modal (Esc)**
1. Open help modal (press `?`)
2. Press `Esc` key
3. ✅ Expected: Help modal closes
4. ❌ If fails: Check Esc handler logic

### **Test 5: Input Detection**
1. Click in search/filter input
2. Press `N` key while typing
3. ✅ Expected: Nothing happens (shortcut disabled)
4. ✅ Expected: Letter 'n' appears in input
5. ❌ If fails: Check ignoreInputs logic

### **Test 6: Click Help Button**
1. Click the `?` button in header
2. ✅ Expected: Help modal opens
3. ✅ Expected: Same as pressing `?` key
4. ❌ If fails: Check button onClick handler

### **Test 7: Dark Mode**
1. Toggle dark mode
2. Press `?` to open help
3. ✅ Expected: Help modal uses dark theme
4. ✅ Expected: All text is readable
5. ❌ If fails: Check dark mode classes

### **Test 8: Multiple Modals**
1. Press `N` to open task modal
2. Press `?` to open help
3. ✅ Expected: Only help modal visible
4. Press `Esc`
5. ✅ Expected: Help closes, task modal still open
6. Press `Esc` again
7. ✅ Expected: Task modal closes
8. ❌ If fails: Check modal state management

---

## Browser Console Tests

### **Test Hook Registration:**
```javascript
// In browser console
console.log('Testing keyboard shortcuts...');

// Simulate N key press
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
// Should open modal

// Simulate Esc key press
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
// Should close modal

// Simulate ? key press
window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true }));
// Should open help
```

---

## Expected Behavior Summary

| Action | Expected Result | Status |
|--------|----------------|--------|
| Press `N` | Opens task modal | ✅ |
| Press `N` in input | Types 'n' | ✅ |
| Press `Esc` | Closes any modal | ✅ |
| Press `?` | Opens help modal | ✅ |
| Click `?` button | Opens help modal | ✅ |
| Click outside modal | Closes modal | ✅ |
| Dark mode | All shortcuts work | ✅ |

---

## Troubleshooting

### **Shortcuts Not Working:**
1. Check browser console for errors
2. Verify hook is imported: `import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';`
3. Verify hook is called in component
4. Check if event listener is attached: `window.addEventListener('keydown', ...)`

### **Modal Not Opening:**
1. Check state: `isModalOpen` and `isShortcutsHelpOpen`
2. Verify handler functions are defined
3. Check if modal components are rendered
4. Look for React errors in console

### **Shortcuts Work in Inputs:**
1. Check `ignoreInputs` option (should be true)
2. Verify `isInputElement` function logic
3. Test with different input types

---

## Performance Check

### **Memory Leaks:**
```javascript
// In browser console
// 1. Open help modal 10 times
for (let i = 0; i < 10; i++) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
  setTimeout(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  }, 100);
}

// 2. Check memory in DevTools
// Should not increase significantly
```

### **Event Listener Cleanup:**
```javascript
// In React DevTools
// 1. Unmount TaskBoard component
// 2. Check window event listeners
// Should not have orphaned keydown listeners
```

---

## ✅ All Tests Passing!

If all tests pass, keyboard shortcuts are working perfectly! 🎉
