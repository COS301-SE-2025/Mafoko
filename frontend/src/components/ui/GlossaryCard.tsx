import React from 'react';
import { Book, Bookmark, Download, Eye } from 'lucide-react';

interface Glossary {
  name: string;
  description: string;
  termCount: number;
}

interface GlossaryCardProps {
  glossary: Glossary;
  onView?: (glossary: Glossary) => void;
  onExport?: (glossary: Glossary) => void;
  onBookmark?: (glossary: Glossary) => void;
}

const GlossaryCard: React.FC<GlossaryCardProps> = ({
  glossary,
  onView,
  onExport,
  onBookmark,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <Book className="w-6 h-6" color="#212431" />
          <span
            className="text-sm px-2 py-1 rounded-full"
            style={{
              color: '#00ceaf',
              backgroundColor: ' #00ceaf1c',
              border: '1.5px solid #00ceaf',
            }}
          >
            {glossary.termCount} terms
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
          {glossary.name}
        </h3>
        <p className="text-gray-600 mb-1 text-xs line-clamp-1">
          {glossary.description}
        </p>
        <div className="flex items-center text-xs text-gray-500 mb-1">
          {/* <span>{glossary.languages && glossary.languages.length > 0 ? glossary.languages.join(', ') : '—'}</span> */}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onExport) onExport(glossary);
              }}
              className="p-2 rounded-lg transition-colors"
              style={{
                color: '#f00a50',
                backgroundColor: '#f00a501a',
                border: '1.5px solid #f00a4fa0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f00a4f6d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f00a501a';
              }}
              title="Export glossary"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onBookmark) onBookmark(glossary);
              }}
              className="p-2 rounded-lg transition-colors"
              style={{
                color: '#f2d001',
                backgroundColor: '#f2d0011a',
                border: '1.5px solid #f2d001a0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f2d20158';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f2d0011a';
              }}
              title="Bookmark glossary"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onView) onView(glossary);
            }}
            className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            style={{
              backgroundColor: '#212431',
              border: '1.5px solid #212431',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#181a22';
              e.currentTarget.style.border = '1.5px solid #181a22';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#212431';
              e.currentTarget.style.border = '1.5px solid #212431';
            }}
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlossaryCard;
