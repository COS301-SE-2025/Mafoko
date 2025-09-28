import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import AnalyticsPage from './pages/AnalyticsPage';
import FeedbackPage from './pages/FeedbackPage';
import HelpPage from './pages/help/HelpPage.tsx';
import GettingStarted from './pages/help/GettingStarted';
import CommunityHelpPage from './pages/help/CommunityHelp.tsx';
import TermHelpPage from './pages/help/TermHelpPage.tsx';
import FrequentlyAskedPage from './pages/help/FrequentlyAskedPage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import UserProfilePage from './pages/UserProfilePage.tsx';
import NewGlossary from './pages/NewGlossary';
import LinguistApplicationPage from './pages/LinguistApplicationPage.tsx';
import { TermDetailPage } from './pages/TermDetailPage.tsx';
import FeedbackHub from './pages/FeedbackHub';
import SettingsPage from './pages/SettingsPage';
import ContributorPage from './pages/ContributorPage';
import LinguistPage from './pages/LinguistPage';
import AdminTermPage from './pages/AdminTermPage.tsx';
import LearningPathPage from './pages/LearningPathPage.tsx';
import GamificationPage from './pages/GamificationPage';
import './App.css';
import './styles/Global.scss';
import {
  orchestrateCommentSync,
  orchestrateTermSync,
  orchestrateXPSync,
} from './utils/syncManager';
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
import SettingsHelp from './pages/help/settings-help.tsx';
import GlossaryHelp from './pages/help/GlossaryHelp.tsx';
import WorkspaceHelp from './pages/help/WorkspaceHelp.tsx';
import FeedbackHelp from './pages/help/FeedbackHelp.tsx';
import DashboardHelp from './pages/help/DashboardHelp.tsx';
import HomeHelp from './pages/help/HomeHelp.tsx';
import LearningPathHelp from './pages/help/LearningPathHelp.tsx';

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
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      // Handle comment sync requests
      if (event.data?.type === 'SYNC_REQUEST') {
        console.log('Client: Received comment sync request.');
        orchestrateCommentSync().then((synced) => {
          if (synced) window.location.reload();
        });
      }

      // Handle term action sync requests
      if (event.data?.type === 'TERM_SYNC_REQUEST') {
        console.log('Client: Received term action sync request.');
        orchestrateTermSync().then((synced) => {
          if (synced) window.location.reload();
        });
      }

      // Handle XP sync requests
      if (event.data?.type === 'XP_SYNC_REQUEST') {
        console.log('Client: Received XP sync request.');
        orchestrateXPSync().then((synced) => {
          if (synced) {
            console.log('Client: XP awards synced successfully.');
          }
        });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    // Run sync checks when the app loads
    orchestrateCommentSync();
    orchestrateTermSync();
    orchestrateXPSync();

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);
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
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/help/getting-started" element={<GettingStarted />} />
        <Route path="/help/settings-help" element={<SettingsHelp />} />
        <Route path="/help/glossary-help" element={<GlossaryHelp />} />
        <Route path="/help/workspace-help" element={<WorkspaceHelp />} />
        <Route path="/help/feedback-help" element={<FeedbackHelp />} />
        <Route path="/help/dashboard-help" element={<DashboardHelp />} />
        <Route path="/help/home-help" element={<HomeHelp />} />
        <Route path="/help/community-feature" element={<CommunityHelpPage />} />
        <Route path="/help/learning-path-help" element={<LearningPathHelp />} />
        <Route path="/help/terms" element={<TermHelpPage />} />
        <Route path="/help/faqs" element={<FrequentlyAskedPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/glossary" element={<NewGlossary />} />
        <Route path="/glossary/:category" element={<NewGlossary />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/term/:language/:name/:id" element={<TermDetailPage />} />
        <Route
          path="/linguist-application"
          element={<LinguistApplicationPage />}
        />
        <Route path="/feedbackhub" element={<FeedbackHub />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/contributor" element={<ContributorPage />} />
        <Route path="/linguist" element={<LinguistPage />} />
        <Route path="/learning-path" element={<LearningPathPage />} />
        <Route path="/achievements" element={<GamificationPage />} />
        <Route path="/admin/terms" element={<AdminTermPage />} />
      </Routes>
    </div>
  );
}

export default App;
