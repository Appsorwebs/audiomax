import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from '../components/Dashboard';
import { User } from '../types';

describe('dashboard upload smoke flow', () => {
  it('passes selected file to onFileSelect', () => {
    const onFileSelect = vi.fn();

    const user: User = {
      email: 'smoke@example.com',
      subscription: 'Free',
      meetings: []
    };

    const { container } = render(
      <Dashboard
        user={user}
        onFileSelect={onFileSelect}
        onViewMeeting={vi.fn()}
        onRecord={vi.fn()}
        onUpgrade={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();

    const file = new File([new Uint8Array([1, 2, 3])], 'meeting.mp3', { type: 'audio/mpeg' });
    fireEvent.change(input!, { target: { files: [file] } });

    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });
});
