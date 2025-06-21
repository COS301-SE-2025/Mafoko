import React, { useState } from 'react';
import LeftNav from '../components/ui/LeftNav';
import '../styles/GlossaryTranslations.scss';

const GlossaryTranslations = () => {
  const [activeItem, setActiveItem] = useState('');

  return (
    <>
      <LeftNav activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="pt-20 px-4">
        <h1 className="text-2xl font-bold mb-4">Glossary Translations</h1>
        <p>This is the Glossary Translations page.</p>
        <table className="glossary-table">
          <thead>
            <tr>
              <th>English term</th>
            </tr>
            <tr>
              <th>Afrikaans</th>
            </tr>
            <tr>
              <th>Zulu</th>
            </tr>
            <tr>
              <th>Xhosa</th>
            </tr>
            <tr>
              <th>Sesotho</th>
            </tr>
            <tr>
              <th>Setswana</th>
            </tr>
          </thead>
        </table>
      </div>
    </>
  );
};

export default GlossaryTranslations;
