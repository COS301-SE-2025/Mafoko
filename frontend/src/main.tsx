import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { DarkModeProvider } from './components/ui/DarkModeComponent.tsx';
import App from './App.tsx';
import './i18n';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <React.Suspense fallback={<div>Loading translations...</div>}>
        <HashRouter>
          <DarkModeProvider>
            <GoogleOAuthProvider clientId={googleClientId}>
              <App />
            </GoogleOAuthProvider>
          </DarkModeProvider>
        </HashRouter>
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
