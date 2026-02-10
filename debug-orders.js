// Debug script to check task orders
// Run this in browser console: copy and paste

console.log('=== TASK ORDERS DEBUG ===');

// Get tasks from localStorage
const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

// Group by status
const grouped = {
  TODO: [],
  IN_PROGRESS: [],
  DONE: []
};

tasks.forEach(task => {
  if (task.status === 'TODO') grouped.TODO.push(task);
  else if (task.status === 'IN_PROGRESS') grouped.IN_PROGRESS.push(task);
  else if (task.status === 'DONE') grouped.DONE.push(task);
});

// Display orders for each column
Object.keys(grouped).forEach(status => {
  console.log(`\n${status} Column:`);
  const columnTasks = grouped[status].sort((a, b) => (a.order || 0) - (b.order || 0));
  columnTasks.forEach((task, index) => {
    console.log(`  ${index + 1}. "${task.title.substring(0, 30)}..." - order: ${task.order}`);
  });
  console.log(`  Total: ${columnTasks.length} tasks`);
});

// Check for duplicate orders
Object.keys(grouped).forEach(status => {
  const orders = grouped[status].map(t => t.order);
  const duplicates = orders.filter((item, index) => orders.indexOf(item) !== index);
  if (duplicates.length > 0) {
    console.warn(`⚠️ ${status} has duplicate orders:`, duplicates);
  }
});

console.log('\n=== END DEBUG ===');
