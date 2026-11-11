import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingFormModal from '../src/components/ReadingFormModal';
import * as readingsApi from '../src/api/readings';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock readings API
vi.mock('../src/api/readings', () => ({
  createReadingApi: vi.fn(),
  updateReadingApi: vi.fn()
}));

describe('ReadingFormModal Component Validation Rules', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with required inputs when isOpen is true', () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        initialData={null}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('reading-date')).toBeInTheDocument();
    expect(screen.getByTestId('time-slot')).toBeInTheDocument();
    expect(screen.getByTestId('glucose-value')).toBeInTheDocument();
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
  });

  it('validates: Value is required -> "Please enter a glucose value."', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        initialData={null}
        onSuccess={mockOnSuccess}
      />
    );

    const submitBtn = screen.getByTestId('submit-btn');
    fireEvent.click(submitBtn);

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Please enter a glucose value.'
    );
    expect(readingsApi.createReadingApi).not.toHaveBeenCalled();
  });

  it('validates: Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        initialData={null}
        onSuccess={mockOnSuccess}
      />
    );

    const glucoseInput = screen.getByTestId('glucose-value');
    const submitBtn = screen.getByTestId('submit-btn');

    // Test under minimum (e.g. 35)
    fireEvent.change(glucoseInput, { target: { value: '35' } });
    fireEvent.click(submitBtn);
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Value must be between 40 and 600 mg/dl.'
    );

    // Test over maximum (e.g. 650)
    fireEvent.change(glucoseInput, { target: { value: '650' } });
    fireEvent.click(submitBtn);
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Value must be between 40 and 600 mg/dl.'
    );

    // Test decimal number (e.g. 120.5)
    fireEvent.change(glucoseInput, { target: { value: '120.5' } });
    fireEvent.click(submitBtn);
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Value must be between 40 and 600 mg/dl.'
    );
  });

  it('validates: Date cannot be in the future -> "Date cannot be in the future."', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        initialData={null}
        onSuccess={mockOnSuccess}
      />
    );

    const dateInput = screen.getByTestId('reading-date');
    const glucoseInput = screen.getByTestId('glucose-value');
    const submitBtn = screen.getByTestId('submit-btn');

    fireEvent.change(dateInput, { target: { value: '2099-12-31' } });
    fireEvent.change(glucoseInput, { target: { value: '110' } });
    fireEvent.click(submitBtn);

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Date cannot be in the future.'
    );
    expect(readingsApi.createReadingApi).not.toHaveBeenCalled();
  });

  it('submits valid reading and calls onSuccess and onClose', async () => {
    readingsApi.createReadingApi.mockResolvedValueOnce({
      message: 'Reading recorded successfully.',
      reading: { id: 1, glucose_value: 115 }
    });

    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        initialData={null}
        onSuccess={mockOnSuccess}
      />
    );

    const glucoseInput = screen.getByTestId('glucose-value');
    const submitBtn = screen.getByTestId('submit-btn');

    fireEvent.change(glucoseInput, { target: { value: '115' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(readingsApi.createReadingApi).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
