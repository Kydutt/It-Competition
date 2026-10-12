import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WebsiteConfigProvider } from './context/WebsiteConfigContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes/AppRoutes';

export const App = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <WebsiteConfigProvider>
            <AppRoutes />
          </WebsiteConfigProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
