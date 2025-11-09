import React from 'react';
import useTheme from '../hooks/useTheme.js';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="btn" onClick={toggle} title="Toggle theme">
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
