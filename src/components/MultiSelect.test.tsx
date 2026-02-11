/**
 * MultiSelect Component Tests
 * 
 * Tests for the reusable multi-select dropdown component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiSelect } from './MultiSelect';

describe('MultiSelect Component', () => {
  const mockOptions = ['Option 1', 'Option 2', 'Option 3'];
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    test('renders with placeholder text when no values selected', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          placeholder="Select options"
        />
      );

      expect(screen.getByText('Select options')).toBeInTheDocument();
    });

    test('displays count when values are selected', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={['Option 1', 'Option 2']}
          onChange={mockOnChange}
          placeholder="Select options"
        />
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    test('renders with custom label', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          label="Custom Label"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
    });

    test('displays "No options available" when options array is empty', () => {
      render(
        <MultiSelect
          options={[]}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('No options available')).toBeInTheDocument();
    });
  });

  describe('Dropdown Interaction', () => {
    test('opens dropdown when button is clicked', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Check if all options are visible
      mockOptions.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });
    });

    test('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <MultiSelect
            options={mockOptions}
            selectedValues={[]}
            onChange={mockOnChange}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Verify dropdown is open
      expect(screen.getByText('Option 1')).toBeInTheDocument();

      // Click outside
      const outsideElement = screen.getByTestId('outside');
      fireEvent.mouseDown(outsideElement);

      // Wait for dropdown to close
      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });

    test('rotates chevron icon when dropdown is open', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');

      // Initially not rotated
      expect(svg).not.toHaveClass('rotate-180');

      // Click to open
      fireEvent.click(button);

      // Should be rotated
      expect(svg).toHaveClass('rotate-180');
    });
  });

  describe('Selection Logic', () => {
    test('calls onChange with new value when option is selected', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Select first option
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith(['Option 1']);
    });

    test('calls onChange with removed value when option is deselected', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={['Option 1', 'Option 2']}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Deselect first option (it should be checked)
      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0];
      
      expect(firstCheckbox).toBeChecked();
      fireEvent.click(firstCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(['Option 2']);
    });

    test('handles multiple selections correctly', () => {
      const { rerender } = render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Select first option
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['Option 1']);

      // Rerender with updated selection
      rerender(
        <MultiSelect
          options={mockOptions}
          selectedValues={['Option 1']}
          onChange={mockOnChange}
        />
      );

      // Select second option
      fireEvent.click(checkboxes[1]);

      expect(mockOnChange).toHaveBeenCalledWith(['Option 1', 'Option 2']);
    });

    test('correctly shows checked state for selected options', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={['Option 1', 'Option 3']}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const checkboxes = screen.getAllByRole('checkbox');
      
      expect(checkboxes[0]).toBeChecked(); // Option 1
      expect(checkboxes[1]).not.toBeChecked(); // Option 2
      expect(checkboxes[2]).toBeChecked(); // Option 3
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          label="Test Label"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Test Label');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    test('updates aria-expanded when dropdown opens', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      
      // Initially closed
      expect(button).toHaveAttribute('aria-expanded', 'false');

      // Open dropdown
      fireEvent.click(button);

      // Should be expanded
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    test('checkboxes are keyboard accessible', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // All checkboxes should be accessible
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
      
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeInTheDocument();
      });
    });
  });

  describe('Dark Mode Support', () => {
    test('applies dark mode classes', () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('dark:bg-gray-700');
      expect(button).toHaveClass('dark:text-white');
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className', () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });

    test('applies custom dropdown className', () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          dropdownClassName="custom-dropdown"
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Find the dropdown container (the absolute positioned div)
      const dropdown = container.querySelector('.custom-dropdown');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveClass('custom-dropdown');
    });
  });
});
