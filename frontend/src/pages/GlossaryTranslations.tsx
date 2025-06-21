import React, { useState } from 'react';
import LeftNav from '../components/ui/LeftNav';

const GlossaryTranslations = () => {
  const [activeItem, setActiveItem] = useState('');

  return (
    <>
      <LeftNav activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="pt-20 px-4">
        {/* Content for GlossaryTranslations page goes here */}
        <h1 className="text-2xl font-bold mb-4">Glossary Translations</h1>
        <p>This is the Glossary Translations page.</p>
      </div>
    </>
  );
};

export default GlossaryTranslations;
