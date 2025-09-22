import React, { useState } from 'react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import '../styles/Global.scss';

const GamificationPage: React.FC = () => {
  const [isMobile] = useState(window.innerWidth <= 768);
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav activeItem="achievements" setActiveItem={() => {}} />
      )}
    </div>
  );
};

export default GamificationPage;
