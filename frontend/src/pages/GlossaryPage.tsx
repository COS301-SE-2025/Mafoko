import React, { useState } from 'react';
import LeftNav from '../components/ui/LeftNav';

const GlossaryPage: React.FC = () => {
  // Set the default active item to 'glossary' for this page
  const [activeMenuItem, setActiveMenuItem] = useState('glossary');

  return (
    <div className="flex">
      <LeftNav activeItem={activeMenuItem} setActiveItem={setActiveMenuItem} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Glossary</h1>
        {/* Add glossary content here */}
      </div>
    </div>
  );
};

export default GlossaryPage;
