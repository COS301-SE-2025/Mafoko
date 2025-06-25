import React, { useState, useEffect } from 'react';
import '../../styles/AnimatedGreeting.css';

const conversations = [
  {
    lang: 'English',
    messages: [
      { side: 'left', text: 'For students, linguists, and researchers...' },
      {
        side: 'right',
        text: '...an easy-to-use platform for African languages.',
      },
      { side: 'left', text: 'With vital resources available anywhere,' },
      { side: 'right', text: 'online and offline.' },
    ],
  },
  {
    lang: 'Afrikaans',
    messages: [
      { side: 'left', text: "'n Platform vir alle gebruikers..." },
      { side: 'right', text: '...van studente tot taalkundiges.' },
      { side: 'left', text: 'Toegang tot noodsaaklike taalbronne...' },
      { side: 'right', text: '...aanlyn en vanlyn.' },
    ],
  },
  {
    lang: 'isiZulu',
    messages: [
      { side: 'left', text: 'Inkundla yabo bonke abasebenzisi...' },
      { side: 'right', text: '...kusukela kubafundi kuya kochwepheshe.' },
      { side: 'left', text: 'Finyelela imithombo yolimi ebalulekile...' },
      {
        side: 'right',
        text: '...ku-inthanethi nokungaxhunyiwe ku-inthanethi.',
      },
    ],
  },
] as const;

const languages = conversations.map((c) => c.lang);

const AnimatedGreeting: React.FC = () => {
  const [langIndex, setLangIndex] = useState(0);
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);
  // NEW: State to control the final fade-out animation
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const currentMessages = conversations[langIndex].messages;
    const timers: NodeJS.Timeout[] = [];

    // Timer to reveal messages one by one
    const messageTimer = setInterval(() => {
      setVisibleMessageCount((prevCount) => {
        if (prevCount < currentMessages.length) {
          return prevCount + 1;
        }
        clearInterval(messageTimer);
        return prevCount;
      });
    }, 1800); // Slightly longer delay between messages
    timers.push(messageTimer);

    // Timer to handle the end-of-conversation sequence
    const conversationCycle = setTimeout(() => {
      // 1. Trigger the fade-out animation in the CSS
      setIsFadingOut(true);

      // 2. After the fade-out is complete, reset everything for the next language
      const switchLangTimer = setTimeout(() => {
        setLangIndex((prev) => (prev + 1) % languages.length);
        setVisibleMessageCount(0); // Reset message count
        setIsFadingOut(false); // End the fade-out state
      }, 800); // This delay must match the transition duration in the CSS
      timers.push(switchLangTimer);
    }, 9000); // Total duration of one conversation cycle
    timers.push(conversationCycle);

    // Cleanup function to clear all scheduled timers
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [langIndex]);

  return (
    // The 'fading-out' class will be added at the end of the cycle
    <div
      className={`conversation-container ${isFadingOut ? 'fading-out' : ''}`}
    >
      {conversations[langIndex].messages.map((message, index) => (
        <div
          key={`${conversations[langIndex].lang}-${message.side}-${message.text}`}
          className={`message-bubble ${message.side} ${index < visibleMessageCount ? 'visible' : ''}`}
        >
          {message.text}
        </div>
      ))}
    </div>
  );
};

export default AnimatedGreeting;
