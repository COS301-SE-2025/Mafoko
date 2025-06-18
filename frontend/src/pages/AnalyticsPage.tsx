import React, { useState, useEffect } from 'react';
import HorizontalBarChart from '../components/data/HorizontalBarChart';
import type { TermData } from '../components/data/HorizontalBarChart';
import { FaCheckCircle, FaBookmark, FaComments, FaGlobe } from 'react-icons/fa';
import StatCard from '../components/data/StatCard';
import PieChart from '../components/data/PieChart';
import Navbar from '../components/ui/Navbar';
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
  const [categoryData, setCategoryData] = useState<TermData[]>([]);

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

  return (
    <div className="analytics-root">
      <Navbar />
      <div className="p-2 md:p-4 analytics">
        <div className="pt-16 md:pt-18 min-h-screen w-full p-2 md:p-4 flex flex-col">
          {/* Top Section */}
          <div className="h-auto md:h-1/2 w-full p-2 md:p-4 flex flex-col md:flex-row gap-4">
            {/* Pie Chart Section */}
            <div className="w-full md:w-3/8 h-64 md:h-full rounded-lg shadow-inner p-4 flex flex-col bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                Unique Term Counts
              </h2>
              <div className="flex-1 overflow-hidden">
                <PieChart
                  data={mockPieData}
                  formatValue={(value) => `${String(value)}%`}
                />
              </div>
            </div>

            {/* Stat Cards Section */}
            <div className="w-full md:w-5/8 h-auto grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[160px]">
              <StatCard
                title="Feedback Submissions Made"
                value={12}
                icon={<FaComments className="text-xl md:text-2xl" />}
              />
              <StatCard
                title="Approved Submissions"
                value={12}
                icon={<FaCheckCircle className="text-xl md:text-2xl" />}
              />
              <StatCard
                title="Your Total Saved Terms:"
                value={12}
                icon={<FaBookmark className="text-xl md:text-2xl" />}
              />
              <StatCard
                title="Your Top Language:"
                value="English"
                icon={<FaGlobe className="text-xl md:text-2xl" />}
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="h-auto md:h-1/2 w-full flex flex-col md:flex-row gap-4 mt-4 p-2 md:p-4">
            <div className="w-full md:w-1/2 h-64 md:h-full p-4 rounded-lg shadow bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
              <HorizontalBarChart
                data={mockData}
                title="Term Frequency"
                isDarkMode={document.documentElement.classList.contains(
                  'theme-dark',
                )}
              />
            </div>
            <div className="w-full md:w-1/2 h-64 md:h-full p-4 rounded-lg shadow bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
              <HorizontalBarChart
                data={categoryData}
                title="Term Category Frequency"
                isDarkMode={document.documentElement.classList.contains(
                  'theme-dark',
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
