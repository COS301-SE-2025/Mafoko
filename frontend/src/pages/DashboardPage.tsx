import { useState, useEffect, useMemo } from 'react';
import LeftNav from '../components/ui/LeftNav.tsx';
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
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isListening, setIsListening] = useState(false);

  const colors = useMemo(() => ['#00CEAF', '#212431', '#F7074D', '#F2D001'], []);
  const alphabet = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), []);

  useEffect(() => {
    const createLetter = () => {
      return {
        id: Math.random(),
        char: alphabet[Math.floor(Math.random() * alphabet.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * (85), // Spread across entire right side (0 to 85%)
        top: -100,
        speed: Math.random() * 1.5 + 0.5 // Slower speed (0.5-2 instead of 2-5)
      };
    };

    // Initialize with more letters
    const initialLetters = Array.from({ length: 20 }, createLetter);
    setLetters(initialLetters);

    // Animation loop
    const animate = () => {
      setLetters(prevLetters => {
        const newLetters = prevLetters.map(letter => ({
          ...letter,
          top: letter.top + letter.speed
        })).filter(letter => letter.top < window.innerHeight + 100);

        // Add new letters more frequently
        if (Math.random() < 0.4 && newLetters.length < 25) { // Increased frequency and max letters
          newLetters.push(createLetter());
        }

        // Replace letters that have fallen off screen with new ones at the top
        if (newLetters.length < 20) {
          newLetters.push(...Array.from({ length: 20 - newLetters.length }, createLetter));
        }

        return newLetters;
      });
    };

    const interval = setInterval(animate, 60); // Slower update rate
    return () => { clearInterval(interval); };
  }, [alphabet, colors]);

  return (
    <div role="main" className={`dashboard-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <LeftNav activeItem={activeMenuItem} setActiveItem={setActiveMenuItem} />
      <div role="complementary" aria-label="falling-letters" className="abstract-bg">
        {letters.map(letter => (
          <div
            key={letter.id}
            className="falling-letter"
            style={{
              left: `${String(letter.left)}%`,
              top: `${String(letter.top)}px`,
              color: letter.color,
              opacity: '0.1',
              transform: `rotate(${String(letter.top)}deg)`
            }}
          >
            {letter.char}
          </div>
        ))}
      </div>
      
      <div className="main-content">
        <div className="content-wrapper">
          <div className="content-layout">
            <div className="content-side">
              <h1 className="title">Unite Through Words</h1>
              
              <br />

              <div className="intro-text">
                <p>
                  The term &apos;Marito&apos; originates from Xitsonga, translating to &apos;words&apos; or &apos;names&apos;. 
                  This is a progressive web application that bridges the gap between South Africa&apos;s rich linguistic 
                  heritage and modern digital accessibility. Language enthusiasts, NLP researchers, and linguists can 
                  use Marito as a unified platform to explore, contribute to, and preserve multilingual glossaries, 
                  dictionaries, and terminology banks across 11 of South Africa&apos;s official languages.
                </p>
                
                <p>
                  Marito works seamlessly both offline and online, empowering communities to access comprehensive 
                  language resources, submit feedback, and collaborate on robust lexicons for low-resource languages. 
                  This platform is part of an ongoing initiative by DSFSI (Data Science for Social Impact) at the 
                  University of Pretoria to democratize linguistic resources and advance natural language processing 
                  research for African languages.
                </p>
                
                <p className="team-credit">Proudly developed by Velox</p>
              </div>

              <div className="cta-section">
                <a href="https://www.dsfsi.co.za/" className="cta-button primary-cta" target="_blank" rel="noopener noreferrer">
                  Learn more about DSFSI
                </a>
              </div>
            </div>

            <div className="voice-assistant">
              <h2 className="assistant-title">Meet Mari - Your Voice Assistant</h2>
              <p className="assistant-subtitle">Navigate pages, lookup terms and search glossaries using voice commands</p>
              <div className="microphone-container">
                <div role="presentation" className="ripple ripple1"></div>
                <div role="presentation" className="ripple ripple2"></div>
                <div role="presentation" className="ripple ripple3"></div>
                <button 
                  type="button"
                  aria-label="Toggle voice assistant"
                  className={`microphone-button ${isListening ? 'listening' : ''}`}
                  onClick={() => { setIsListening(prev => !prev); }}
                >
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
    </div>
  );
};

export default DashboardPage;
