import { useState, useEffect, useMemo } from 'react';
import LeftNav from '../components/ui/LeftNav.tsx';
import Navbar from '../components/ui/Navbar.tsx';
import '../styles/DashboardPage.scss';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';

interface Letter {
  id: number;
  char: string;
  color: string;
  left: number;
  top: number;
  speed: number;
}

const DashboardPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [letters, setLetters] = useState<Letter[]>([]);

  const colors = useMemo(() => ['#00CEAF', '#212431', '#F7074D', '#F2D001'], []);
  const alphabet = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), []);

  useEffect(() => {
    const createLetter = () => {
      return {
        id: Math.random(),
        char: alphabet[Math.floor(Math.random() * alphabet.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100, // Using full width of the container
        top: -100,
        speed: Math.random() * 2 + 1
      };
    };

    // Initialize with some letters
    const initialLetters = Array.from({ length: 15 }, createLetter);
    setLetters(initialLetters);

    // Animation loop
    const animate = () => {
      setLetters(prevLetters => {
        const newLetters = prevLetters.map(letter => ({
          ...letter,
          top: letter.top + letter.speed
        })).filter(letter => letter.top < window.innerHeight + 100);

        // Add new letters randomly
        if (Math.random() < 0.3 && newLetters.length < 20) {
          newLetters.push(createLetter());
        }

        return newLetters;
      });
    };

    const interval = setInterval(animate, 50);
    return () => { clearInterval(interval); };
  }, [alphabet, colors]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className={`dashboard-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div className="abstract-bg">
        {letters.map(letter => (
          <div
            key={letter.id}
            className="falling-letter"
            style={{
              left: `${String(letter.left)}%`,
              top: `${String(letter.top)}px`,
              color: letter.color,
              transform: `rotate(${String(letter.top)}deg)`
            }}
          >
            {letter.char}
          </div>
        ))}
      </div>
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}
      <div className="main-content">
        <div className="content-wrapper">
          <div className="text-content">
            <div style={{ marginBottom: '2px' }}>
              <h1 className="logo">Unite Through Words</h1>
            </div>
            <div className="intro-text">
              <p>The term 'Marito' originates from Xitsonga, translating to 'words' or 'names'. This is a progressive web application that bridges the gap between South Africa's rich linguistic heritage and modern digital accessibility. Language enthusiasts, NLP researchers, and linguists can use Marito as a unified platform to explore, contribute to, and preserve multilingual glossaries, dictionaries, and terminology banks across 11 of South Africa's official languages.</p>

              <br />
              
              <p>Marito works seamlessly both offline and online, empowering communities to access comprehensive language resources, submit feedback, and collaborate on robust lexicons for low-resource languages. This platform is part of an ongoing initiative by DSFSI (Data Science for Social Impact) at the University of Pretoria to democratize linguistic resources and advance natural language processing research for African languages.</p>
              
              <p className="team-credit">Proudly developed by Velox</p>
            </div>

            <div className="cta-section">
              <a href="https://www.dsfsi.co.za/" className="cta-button primary-cta" target="_blank" rel="noopener noreferrer">Learn more about DSFSI</a>
            </div>
          </div>

          <div className="voice-assistant">
            <h2 className="assistant-title">Meet Mari - Your Voice Assistant.</h2>
            <p className="assistant-subtitle">Navigate pages, lookup terms and search glossaries using voice commands.</p>
            
            <div className="microphone-container">
              <div className="ripple ripple1"></div>
              <div className="ripple ripple2"></div>
              <div className="ripple ripple3"></div>
              
              <button type="button" className="microphone-button">
                <svg className="microphone-icon" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
