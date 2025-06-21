import React, { useState, useEffect } from 'react';
import HorizontalBarChart from '../components/data/HorizontalBarChart';
import type { TermData } from '../components/data/HorizontalBarChart';
import { FaCheckCircle, FaBookmark, FaComments, FaGlobe } from 'react-icons/fa';
import StatCard from '../components/data/StatCard';
import PieChart from '../components/data/PieChart';
import LeftPane from '../components/dashboard/LeftPane';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../styles/AnalyticsPage.css';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

const mockData: TermData[] = [
  { term: 'word 1', frequency: 40 },
  { term: 'word 2', frequency: 32 },
  { term: 'word 3', frequency: 25 },
  { term: 'word 4', frequency: 18 },
  { term: 'word 5', frequency: 12 },
  { term: 'word 6', frequency: 40 },
  { term: 'word 7', frequency: 32 },
  { term: 'word 8', frequency: 25 },
  { term: 'word 9', frequency: 18 },
  { term: 'word 10', frequency: 12 },
];

const mockPieData = [
  {
    label: 'Afrikaans',
    value: 9.2,
    backgroundColor: '#26D7B9',
    borderColor: '#1BA997',
  },
  {
    label: 'isiNdebele',
    value: 9.1,
    backgroundColor: '#FAE56B',
    borderColor: '#E5CE00',
  },
  {
    label: 'isiXhosa',
    value: 8.8,
    backgroundColor: '#F87171',
    borderColor: '#E04343',
  },
  {
    label: 'isiZulu',
    value: 9.2,
    backgroundColor: '#6C63FF',
    borderColor: '#544DD4',
  },
  {
    label: 'Sepedi',
    value: 9.1,
    backgroundColor: '#FFA69E',
    borderColor: '#CC837A',
  },
  {
    label: 'Sesotho',
    value: 9.0,
    backgroundColor: '#4DD599',
    borderColor: '#3DAE7F',
  },
  {
    label: 'Setswana',
    value: 9.0,
    backgroundColor: '#3AB0FF',
    borderColor: '#2D90D0',
  },
  {
    label: 'siSwati',
    value: 8.9,
    backgroundColor: '#FFB703',
    borderColor: '#D58F00',
  },
  {
    label: 'Tshivenda',
    value: 9.0,
    backgroundColor: '#B388EB',
    borderColor: '#8B6AB3',
  },
  {
    label: 'Xitsonga',
    value: 9.1,
    backgroundColor: '#FF9F68',
    borderColor: '#D97F4A',
  },
];

const mockData2: TermData[] = [
  { term: 'Statistical Processes/Methodology/Metadata', frequency: 120 },
  { term: 'System of Business Registers', frequency: 117 },
  { term: 'National Accounts', frequency: 105 },
  { term: 'Labour', frequency: 98 },
  { term: 'Tourism and Migration', frequency: 84 },
  { term: 'National, Provincial and Local Government', frequency: 72 },
  { term: 'Geography', frequency: 64 },
  { term: 'Housing and Services', frequency: 50 },
  { term: 'Industry and Trade', frequency: 47 },
  { term: 'Education', frequency: 47 },
  { term: 'Public Finance', frequency: 43 },
  { term: 'Agriculture', frequency: 41 },
  { term: 'Population Census', frequency: 40 },
  { term: 'Health and Vital Statistics', frequency: 37 },
  { term: 'General Demography', frequency: 36 },
  { term: 'Social conditions/Personal services', frequency: 32 },
  { term: 'Prices', frequency: 21 },
  { term: 'Tourism', frequency: 16 },
  { term: 'Private Sector', frequency: 16 },
  { term: 'Poverty', frequency: 13 },
  { term: 'Construction', frequency: 10 },
  { term: 'Household Income and Expenditure', frequency: 9 },
  { term: 'Trade', frequency: 7 },
  { term: 'Business Enterprises', frequency: 7 },
  { term: 'Demography', frequency: 5 },
  { term: 'Law/Justice', frequency: 5 },
  { term: 'Environment', frequency: 5 },
  { term: 'Science and Technology', frequency: 4 },
  { term: 'Transport and Communication', frequency: 3 },
  { term: 'Income, Pensions, Spending and Wealth', frequency: 3 },
  { term: 'Energy', frequency: 2 },
  { term: 'Manufacturing', frequency: 1 },
];

interface CategoryFrequencyData {
  category_frequency: Record<string, number>;
}

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [categoryData, setCategoryData] = useState<TermData[]>([]);
  const [activeMenuItem, setActiveMenuItem] = useState('analytics');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch(API_ENDPOINTS.descriptiveAnalytics)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics data');
        return res.json();
      })
      .then((data: CategoryFrequencyData) => {
        const transformed: TermData[] = Object.entries(
          data.category_frequency,
        ).map(([term, frequency]) => ({
          term,
          frequency: frequency,
        }));
        setCategoryData(transformed);
      })
      .catch((err: unknown) => {
        console.warn('API unavailable, using fallback mock data.', err);
        setCategoryData(mockData2); // fallback to mock data
      });
  }, []);

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item);
    if (window.innerWidth <= 768) {
      setIsMobileMenuOpen(false);
    }
    if (item === 'dashboard') {
      void navigate('/dashboard');
    } else if (item === 'search') {
      void navigate('/search');
    } else if (item === 'saved') {
      void navigate('/saved-terms');
    } else if (item === 'analytics') {
      void navigate('/analytics');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div
      className={`dashboard-container ${isMobileMenuOpen ? 'mobile-menu-is-open' : ''}`}
    >
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={toggleMobileMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              toggleMobileMenu();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}
      <LeftPane activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />

      <div className="main-content">
        {/* Mobile hamburger menu for consistency */}
        <div className="top-bar analytics-top-bar">
          <button
            className="hamburger-icon"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            type="button"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className="analytics-content">
          {/* Stats Overview Section */}
          <div className="stats-overview-section">
            <div className="stat-cards-grid">
              <StatCard
                title="Feedback Submissions Made"
                value={12}
                icon={<FaComments className="stat-icon" />}
                isDarkMode={false}
              />
              <StatCard
                title="Approved Submissions"
                value={12}
                icon={<FaCheckCircle className="stat-icon" />}
                isDarkMode={false}
              />
              <StatCard
                title="Your Total Saved Terms"
                value={12}
                icon={<FaBookmark className="stat-icon" />}
                isDarkMode={false}
              />
              <StatCard
                title="Your Top Language"
                value="English"
                icon={<FaGlobe className="stat-icon" />}
                isDarkMode={false}
              />
            </div>
          </div>

          <div className="main-charts-section">
            <div className="charts-left-column">
              <div className="chart-card">
                <div className="mt-4 px-2">
                  <HorizontalBarChart
                    data={mockData}
                    title="Term Frequency"
                    isDarkMode={false}
                  />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h2 className="text-gray-800 text-xl font-semibold m-0">
                    Category Distribution
                  </h2>
                </div>
                <div className="mt-4 px-2">
                  <HorizontalBarChart data={categoryData} isDarkMode={false} />
                </div>
              </div>
            </div>

            <div className="charts-right-column">
              <div className="chart-card pie-chart-card">
                <div className="chart-header">
                  <h2 className="text-gray-800 text-xl font-semibold m-0">
                    Unique Language Terms
                  </h2>
                </div>
                <div className="pie-chart-wrapper">
                  <PieChart
                    data={mockPieData}
                    formatValue={(value) => `${String(value)}%`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
