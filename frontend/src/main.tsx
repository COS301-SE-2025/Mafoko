import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DarkModeProvider } from './components/ui/DarkModeComponent.tsx';
import App from './App.tsx';
import './i18n';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <React.Suspense fallback={<div>Loading translations...</div>}>
        <BrowserRouter basename="/Marito">
          <DarkModeProvider>
            <App />
          </DarkModeProvider>
        </BrowserRouter>
      </React.Suspense>
    </React.StrictMode>,
  );
} else {
  console.error(
    "Failed to find the root element. Ensure an element with id='root' exists in your index.html.",
  );
  console.error(
    "Failed to find the root element. Ensure an element with id='root' exists in your index.html.",
  );
}
