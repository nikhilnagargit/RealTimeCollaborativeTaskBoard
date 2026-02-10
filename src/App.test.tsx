import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * Test Suite for App Component
 * 
 * These tests verify the basic rendering and accessibility of the main App component.
 */

describe('App Component', () => {
  test('renders hello world heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/Hello World!/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders task board title', () => {
    render(<App />);
    const titleElement = screen.getByText(/Real-Time Collaborative Task Board/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders all feature cards', () => {
    render(<App />);
    
    // Check for React 18 card
    expect(screen.getByText('React 18')).toBeInTheDocument();
    
    // Check for Tailwind CSS card
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
    
    // Check for Ready to Build card
    expect(screen.getByText('Ready to Build')).toBeInTheDocument();
  });

  test('renders welcome section with proper heading', () => {
    render(<App />);
    const welcomeHeading = screen.getByText(/Welcome to Your Task Board/i);
    expect(welcomeHeading).toBeInTheDocument();
  });

  test('has proper semantic HTML structure', () => {
    const { container } = render(<App />);
    
    // Check for header element
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    
    // Check for main element
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    
    // Check for footer element
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });
});
