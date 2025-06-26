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
  {
    lang: 'isiXhosa',
    messages: [
      { side: 'left', text: 'Iqonga labo bonke abasebenzisi...' },
      { side: 'right', text: '...ukusuka kubafundi ukuya koonjingalwazi.' },
      { side: 'left', text: 'Fikelela kwizixhobo zolwimi ezibalulekileyo...' },
      { side: 'right', text: '...kwi-intanethi nangaphandle kwayo.' },
    ],
  },
  {
    lang: 'Sepedi',
    messages: [
      { side: 'left', text: 'Setšhaba sa basebedisi bohle...' },
      {
        side: 'right',
        text: '...go tloga go baithuti go ya go ditsebi tša polelo.',
      },
      { side: 'left', text: 'Fumana didirišwa tša polelo tša bohlokwa...' },
      { side: 'right', text: '...inthaneteng le ntle le yona.' },
    ],
  },
  {
    lang: 'Sesotho',
    messages: [
      { side: 'left', text: 'Sethala sa basebelisi bohle...' },
      {
        side: 'right',
        text: '...ho tloha ho baithuti ho isa ho litsebi tsa puo.',
      },
      { side: 'left', text: 'Fumana lisebelisoa tsa puo tsa bohlokoa...' },
      { side: 'right', text: '...inthaneteng le kantle ho eona.' },
    ],
  },
  {
    lang: 'Setswana',
    messages: [
      { side: 'left', text: 'Setsha sa basebelisi botlhe...' },
      {
        side: 'right',
        text: '...go simolola ka baithuti go fitlha kwa ditsebing tsa puo.',
      },
      { side: 'left', text: 'Fumana didirisiwa tsa puo tsa botlhokwa...' },
      { side: 'right', text: '...mo inthaneteng le kwa ntle ga yone.' },
    ],
  },
  {
    lang: 'siSwati',
    messages: [
      { side: 'left', text: 'Lizinga lebonkhe basebenti...' },
      { side: 'right', text: '...kusuka kubafundzi kuya kutichwepheshe.' },
      { side: 'left', text: 'Thola tisebenti telulwimi letibalulekile...' },
      { side: 'right', text: '...ku-inthanethi nangaphandle kwayo.' },
    ],
  },
  {
    lang: 'Tshivenda',
    messages: [
      { side: 'left', text: 'Tshikolo tsha vhashumisani vhoṱhe...' },
      {
        side: 'right',
        text: '...ubva kha vhafunzi u swika kha vhahulwane vha luambo.',
      },
      { side: 'left', text: 'Wana zwishumiswa zwa luambo zwa ndeme...' },
      { side: 'right', text: '...kha inthanethe na nnḓa hayo.' },
    ],
  },
  {
    lang: 'Xitsonga',
    messages: [
      { side: 'left', text: 'Xipfuno xa hinkwavo va tirhisaka...' },
      {
        side: 'right',
        text: '...ku suka eka vadyondzi ku ya eka vatsari va ririmi.',
      },
      { side: 'left', text: 'Kuma swinawana swa ririmi swa nkoka...' },
      { side: 'right', text: '...eka inthanete na le handle ka yona.' },
    ],
  },
  {
    lang: 'isiNdebele',
    messages: [
      { side: 'left', text: 'Ipulatifomu yawo wonke abasebenzisi...' },
      {
        side: 'right',
        text: '...kusukela kubafundi kuya kochwepheshe bolimi.',
      },
      { side: 'left', text: 'Thola izinsiza zolimi ezibalulekile...' },
      { side: 'right', text: '...ku-inthanethi nangaphandle kwayo.' },
    ],
  },
] as const;

const languages = conversations.map((c) => c.lang);

type Message = {
  side: 'left' | 'right';
  text: string;
};

const AnimatedGreeting: React.FC = () => {
  const [langIndex, setLangIndex] = useState(0);
  const [visibleBubbles, setVisibleBubbles] = useState<Message[]>([]);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const currentMessages = conversations[langIndex].messages;
    const timers: NodeJS.Timeout[] = [];
    setVisibleBubbles([]); // Reset immediately for consistent sizing

    // Show each bubble only after the previous one is fully in place
    currentMessages.forEach((message, index) => {
      const timer = setTimeout(() => {
        setVisibleBubbles((prev) => [...prev, message]);
      }, index * 1800); // Slower: 1.8s per bubble, sequential
      timers.push(timer);
    });

    // Pause at the end before fade out
    const totalDuration = (currentMessages.length - 1) * 1800 + 2000;
    const endConversationTimer = setTimeout(() => {
      setIsFadingOut(true);
      const switchLangTimer = setTimeout(() => {
        setLangIndex((prev) => (prev + 1) % languages.length);
        setVisibleBubbles([]);
        setIsFadingOut(false);
      }, 800);
      timers.push(switchLangTimer);
    }, totalDuration);
    timers.push(endConversationTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [langIndex]);

  return (
    <div
      className={`conversation-container ${isFadingOut ? 'fading-out' : ''}`}
    >
      {visibleBubbles.map((message, index) => (
        <div
          key={index}
          className={`message-bubble ${message.side} visible`}
          style={{
            animationPlayState: isFadingOut ? 'paused' : 'running',
            willChange: 'transform, opacity',
          }}
        >
          {message.text}
        </div>
      ))}
    </div>
  );
};

export default AnimatedGreeting;
