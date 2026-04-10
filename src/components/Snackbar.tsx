import { useEffect, useState } from 'react';

interface SnackbarProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

/**
 * Global snackbar notification component.
 * Slides up from the bottom and auto-dismisses.
 */
export function Snackbar({ message, type = 'success', duration = 4000, onClose }: SnackbarProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className="snackbar-container">
      <div className={`snackbar snackbar--${type}`}>
        {type === 'success' && '✓ '}
        {type === 'error' && '✗ '}
        {message}
      </div>
    </div>
  );
}
