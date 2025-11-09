import React from 'react';
import { AuthProvider } from '../hooks/useAuth.js';
import { ThemeProvider } from '../hooks/useTheme.js';
import { BrowserRouter } from 'react-router-dom';
import App from '../App.jsx';

export default function Layout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
