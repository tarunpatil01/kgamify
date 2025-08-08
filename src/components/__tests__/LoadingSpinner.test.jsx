import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner, { Skeleton, CardSkeleton, TableSkeleton } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders with custom text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  test('renders without text', () => {
    render(<LoadingSpinner text="" />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  test('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByText('Loading...').parentElement;
    expect(spinner.querySelector('div')).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(spinner.querySelector('div')).toHaveClass('w-12', 'h-12');
  });

  test('applies correct color classes', () => {
    const { rerender } = render(<LoadingSpinner color="blue" />);
    const spinner = screen.getByText('Loading...').parentElement;
    expect(spinner.querySelector('div')).toHaveClass('text-blue-600');

    rerender(<LoadingSpinner color="red" />);
    expect(spinner.querySelector('div')).toHaveClass('text-red-600');
  });

  test('renders fullscreen overlay when fullScreen is true', () => {
    render(<LoadingSpinner fullScreen />);
    const overlay = screen.getByText('Loading...').closest('div');
    expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50');
  });
});

describe('Skeleton', () => {
  test('renders with default props', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  test('renders correct number of lines', () => {
    render(<Skeleton lines={3} />);
    const lines = document.querySelectorAll('.bg-gray-300');
    expect(lines).toHaveLength(3);
  });

  test('applies custom height class', () => {
    render(<Skeleton height="h-8" />);
    const line = document.querySelector('.bg-gray-300');
    expect(line).toHaveClass('h-8');
  });
});

describe('CardSkeleton', () => {
  test('renders card skeleton structure', () => {
    render(<CardSkeleton />);
    expect(document.querySelector('.bg-white')).toBeInTheDocument();
    expect(document.querySelector('.rounded-lg')).toBeInTheDocument();
    expect(document.querySelector('.shadow-md')).toBeInTheDocument();
  });

  test('has correct dark mode classes', () => {
    render(<CardSkeleton />);
    const card = document.querySelector('.bg-white');
    expect(card).toHaveClass('dark:bg-gray-800');
  });
});

describe('TableSkeleton', () => {
  test('renders table skeleton with default props', () => {
    render(<TableSkeleton />);
    expect(document.querySelector('.bg-white')).toBeInTheDocument();
    expect(document.querySelector('.rounded-lg')).toBeInTheDocument();
  });

  test('renders correct number of rows and columns', () => {
    render(<TableSkeleton rows={3} columns={2} />);
    const headerCells = document.querySelectorAll('.bg-gray-50 .bg-gray-300');
    const dataRows = document.querySelectorAll('.border-b');
    
    expect(headerCells).toHaveLength(2); // 2 columns
    expect(dataRows).toHaveLength(3); // 3 rows
  });
}); 