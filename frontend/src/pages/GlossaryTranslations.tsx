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
        <div className="translation-bank-header">
          <span className="translation-bank-title">Translation Bank</span>
          <span className="translation-bank-icons">
            <span className="favourite-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="14" cy="14" r="14" fill="#FFBB4F" />
                <path
                  d="M14 19.5L8.5 22.5L9.5 16L5 11.5L11.25 10.75L14 5L16.75 10.75L23 11.5L18.5 16L19.5 22.5L14 19.5Z"
                  stroke="#fff"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </span>
            <span className="share-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="14" cy="14" r="14" fill="#F7074D" />
                <path
                  d="M18 12.5L14 9V19"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M9 19H19"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </span>
        </div>
        <hr className="translation-bank-divider" />
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
        </div>
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
    </>
  );
};

export default GlossaryTranslations;
