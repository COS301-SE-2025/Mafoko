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
        onClick={() => {
          onPageChange(currentPage - 1);
        }}
        disabled={currentPage === 1}
        aria-label="Previous Page"
      >
        &#8592;
      </button>
      {pageNumbers.map((num) => (
        <button
          key={num}
          className={`page-number${num === currentPage ? ' active' : ''}`}
          onClick={() => {
            onPageChange(num);
          }}
        >
          {num}
        </button>
      ))}
      <button
        className="arrow"
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

const GlossaryPage: React.FC = () => {
  // Set the default active item to 'glossary' for this page
  const [activeMenuItem, setActiveMenuItem] = useState('glossary');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5; // Replace with actual total pages if dynamic

  return (
    <div className="flex">
      <LeftNav activeItem={activeMenuItem} setActiveItem={setActiveMenuItem} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Glossary</h1>
        {/* Add glossary content here */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default GlossaryPage;
