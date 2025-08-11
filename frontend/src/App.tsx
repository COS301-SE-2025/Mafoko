import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import AnalyticsPage from './pages/AnalyticsPage';
import HelpPage from './pages/help/HelpPage.tsx';
import GettingStarted from './pages/help/GettingStarted';
import CommunityHelpPage from './pages/help/CommunityHelp.tsx';
import TermHelpPage from './pages/help/TermHelpPage.tsx';
import FrequentlyAskedPage from './pages/help/FrequentlyAskedPage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import NewGlossary from './pages/NewGlossary';
import { TermDetailPage } from './pages/TermDetailPage.tsx';
import './App.css';

import {
  Chart as ChartJS,
  PieController,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register all Chart.js components once at the application entry point
ChartJS.register(
  PieController,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

function App() {
  return (
    <div className="MaritoApp">
      <Routes>
        <Route path="/Landing" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/home" element={<DashboardPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/help/getting-started" element={<GettingStarted />} />
        <Route path="/help/community-feature" element={<CommunityHelpPage />} />
        <Route path="/help/terms" element={<TermHelpPage />} />
        <Route path="/help/faqs" element={<FrequentlyAskedPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/glossary" element={<NewGlossary />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/term/:termId" element={<TermDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
