import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import DashboardPage from './pages/DashboardPage';
import SavedTermsPage from './pages/SavedTermsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HelpPage from './pages/help/HelpPage.tsx';
import GettingStarted from './pages/help/GettingStarted';
import CommunityHelpPage from './pages/help/CommunityHelp.tsx';
import TermHelpPage from './pages/help/TermHelpPage.tsx';
import FrequentlyAskedPage from './pages/help/FrequentlyAskedPage.tsx';
import GlossaryPage from './pages/GlossaryPage';
import './App.css';

function App() {
  return (
    <div className="MavitoApp">
      <Routes>
        <Route path="/Landing" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/home" element={<DashboardPage />} />
        <Route path="/saved-terms" element={<SavedTermsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/help/getting-started" element={<GettingStarted />} />
        <Route path="/help/community-feature" element={<CommunityHelpPage />} />
        <Route path="/help/terms" element={<TermHelpPage />} />
        <Route path="/help/faqs" element={<FrequentlyAskedPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
      </Routes>
    </div>
  );
}

export default App;
