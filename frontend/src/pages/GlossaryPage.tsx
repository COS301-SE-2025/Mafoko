import React, { useState } from 'react';
import LeftNav from '../components/ui/LeftNav';
import '../styles/GlossaryPage.scss';

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="pagination">
      <button
        className="arrow"
        type="button"
        onClick={() => {
          onPageChange(currentPage - 1);
        }}
        disabled={currentPage === 1}
        aria-label="Previous Page"
      >
        &#8592;
      </button>
      <div className="numbers-group">
        {pageNumbers.map((num) => (
          <button
            key={num}
            type="button"
            className={`page-number${num === currentPage ? ' active' : ''}`}
            onClick={() => {
              onPageChange(num);
            }}
          >
            {num}
          </button>
        ))}
      </div>
      <button
        className="arrow"
        type="button"
        onClick={() => {
          onPageChange(currentPage + 1);
        }}
        disabled={currentPage === totalPages}
        aria-label="Next Page"
      >
        &#8594;
      </button>
    </div>
  );
};

const DownloadBoxes: React.FC = () => (
  <>
    <div className="glossaries-header-row">
      <span className="glossaries-title">Glossaries</span>
    </div>
    <hr className="glossaries-divider" />
    <div className="download-boxes">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div className="download-box" key={`glossary-box-${String(item)}`}>
          <div className="download-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 3V14M10 14L5 9M10 14L15 9"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="arrow-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 5L13 10L8 15"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  </>
);

const GlossaryPage: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('glossary');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12;

  return (
    <div className="flex">
      <LeftNav activeItem={activeMenuItem} setActiveItem={setActiveMenuItem} />
      <div className="flex-1 p-6">
        <DownloadBoxes />
        <div style={{ marginTop: '5rem' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage;
