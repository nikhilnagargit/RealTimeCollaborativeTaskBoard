import React, { Profiler } from 'react';
import { TaskProvider } from './context/TaskContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import { TaskBoard } from './components';
import { trackingOnRenderCallback } from './utils/profiler';

/**
 * App Content Component
 * Renders TaskBoard with ToastContainer
 * Wrapped with React Profiler for performance monitoring
 */
const AppContent: React.FC = () => {
  const { toasts, removeToast } = useToast();
  
  return (
    <>
      <Profiler id="TaskBoard" onRender={trackingOnRenderCallback}>
        <TaskBoard />
      </Profiler>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

/**
 * Main App Component
 * 
 * Root component of the Real-Time Collaborative Task Board application.
 * Wraps the TaskBoard with providers for global state management.
 * 
 * Features:
 * - Task management with drag-and-drop
 * - Optimistic updates with rollback
 * - Toast notifications
 * - Advanced filtering and search
 * - Responsive design with Tailwind CSS
 * - Accessibility-first approach
 * - Clean, maintainable code structure
 */
const App: React.FC = () => {
  return (
    <ToastProvider>
      <TaskProvider>
        <AppContent />
      </TaskProvider>
    </ToastProvider>
  );
};

export default App;
