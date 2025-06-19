import React from 'react';
/*import { useNavigate } from 'react-router-dom';*/
import '../../styles/TermCard.scss';
import { ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
//#import ReactTooltip from 'react-tooltip';

interface TermCardProps {
  id: string;
  term: string;
  language: string;
  domain: string;
  upvotes: number;
  downvotes: number;
  definition: string;
  onView?: () => void;
}

const langColorMap: Record<string, string> = {
  Afrikaans: 'blue',
  English: 'yellow',
  isiNdebele: 'pink',
  isiXhosa: 'green',
  isiZulu: 'green',
  Sesotho: 'yellow',
  Setswana: 'orange',
  siSwati: 'teal',
  Tshivenda: 'indigo',
  Xitsonga: 'lime',
  Sepedi: 'cyan',
};

const TermCard: React.FC<TermCardProps> = ({
  term,
  language,
  domain,
  upvotes,
  downvotes,
  definition,
  onView,
}) => {
  return (
    <div className="term-card">
      <div className="term-header">
        <div className="term-left">
          <h3
            className="text-left font-bold text-lg truncate w-full term-title"
            title={term}
          >
            {term.length > 40 ? `${term.slice(0, 40)}...` : term}
          </h3>
          <div className="pills">
            <span className={`pill ${langColorMap[language] || 'gray'}`}>
              {language}
            </span>
            <span className="pill gray">
              {domain.length > 11 ? `${domain.slice(0, 11)}...` : domain}
            </span>
          </div>
        </div>
        <div className="term-socials">
          <div className="social">
            <ThumbsUp size={20} className="icon" />
            <span className="count up">{upvotes}</span>
          </div>
          <div className="social">
            <ThumbsDown size={20} className="icon" />
            <span className="count down">{downvotes}</span>
          </div>
          <Share2 size={20} className="icon share" />
        </div>
      </div>

      <p className="term-description" title={definition}>
        {definition.length > 80 ? `${definition.slice(0, 80)}...` : definition}
      </p>

      <button className="view-button" onClick={() => onView?.()} type="button">
        View
      </button>
    </div>
  );
};

export default TermCard;
