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
              <th>Afrikaans</th>
              <th>Zulu</th>
              <th>Xhosa</th>
              <th>Nothern Sotho</th>
              <th>Southern Sotho</th>
              <th>Setswana</th>
              <th>Tsonga</th>
              <th>Swati</th>
              <th>Venda</th>
              <th>Ndebele</th>
              <th>Xitsonga</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GlossaryTranslations;
