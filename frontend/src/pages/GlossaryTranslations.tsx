import React, { useState } from 'react';
import LeftNav from '../components/ui/LeftNav';
import '../styles/GlossaryTranslations.scss';

const GlossaryTranslations = () => {
  const [activeItem, setActiveItem] = useState('');

  return (
    <>
      <LeftNav activeItem={activeItem} setActiveItem={setActiveItem} />
      <div
        className="pt-20 px-4"
        style={{ marginLeft: '260px', maxWidth: 'calc(100vw - 280px)' }}
      >
        <h1 className="text-2xl font-bold mb-4">Glossary Translations</h1>
        <p>This is the Glossary Translations page.</p>
        <div
          style={{
            overflowX: 'auto',
            background: 'transparent',
            borderRadius: '0.5rem',
            position: 'relative',
          }}
        >
          <table
            className="glossary-table"
            style={{ minWidth: '900px', width: '100%' }}
          >
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
          <div className="download-icon-btn-wrapper">
            <button className="download-icon-btn" aria-label="Download">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="16" cy="16" r="15" fill="#00CEAF" />
                <path
                  d="M16 10V20"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 16L16 20L20 16"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="12" y="22" width="8" height="2" rx="1" fill="#fff" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlossaryTranslations;
