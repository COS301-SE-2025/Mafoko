import React, { useState, useEffect } from 'react';
import '../../styles/AnimatedGreeting.css';

// UPDATED: All messages now use the same consistent object shape.
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
];

const languages = Object.keys(conversations);

const AnimatedGreeting: React.FC = () => {
  const [langIndex, setLangIndex] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setVisibleMessages((currentCount) => {
        const currentConversation = conversations[langIndex].messages;
        if (currentCount < currentConversation.length) {
          return currentCount + 1;
        }
        return currentCount;
      });
    }, 1500);

    const conversationTimer = setInterval(() => {
      setVisibleMessages(0);
      setLangIndex((prev) => (prev + 1) % languages.length);
    }, 8000);

    return () => {
      clearInterval(messageTimer);
      clearInterval(conversationTimer);
    };
  }, [langIndex]);

  const currentConversation = conversations[langIndex].messages;

  return (
    <div className="conversation-container">
      {currentConversation.map((message, index) => (
        <div
          key={index}
          className={`message-bubble ${message.side} ${index < visibleMessages ? 'visible' : ''}`}
        >
          {message.text}
        </div>
      ))}
    </div>
  );
};

export default AnimatedGreeting;
