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
  // This state now tracks the COUNT of visible messages
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);

  useEffect(() => {
    // This effect controls the entire animation sequence
    const currentMessages = conversations[langIndex].messages;

    // This timer reveals one bubble at a time by incrementing the count
    const messageTimer = setInterval(() => {
      setVisibleMessageCount((prevCount) => {
        if (prevCount < currentMessages.length) {
          return prevCount + 1;
        }
        clearInterval(messageTimer);
        return prevCount;
      });
    }, 1500);

    // This timer handles resetting the conversation for the next language
    const conversationCycle = setTimeout(() => {
      // Start the fade out by setting the count to a high number
      setVisibleMessageCount(currentMessages.length + 1);

      // After the fade-out, switch the language and reset the count
      const switchLangTimer = setTimeout(() => {
        setLangIndex((prev) => (prev + 1) % languages.length);
        setVisibleMessageCount(0);
      }, 700);

      // Add the inner timer to the cleanup array
      timers.push(switchLangTimer);
    }, 8000);

    const timers = [messageTimer, conversationCycle];

    // Cleanup function to clear all timers
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [langIndex]);

  const currentConversation = conversations[langIndex].messages;

  return (
    <div className="conversation-container">
      {currentConversation.map((message, index) => (
        <div
          key={`${conversations[langIndex].lang}-${message.side}-${message.text}`}
          // UPDATED: The 'visible' class is now applied conditionally
          className={`message-bubble ${message.side} ${index < visibleMessageCount ? 'visible' : ''}`}
        >
          {message.text}
        </div>
      ))}
    </div>
  );
};

export default AnimatedGreeting;
