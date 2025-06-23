import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Book, Globe, Search } from 'lucide-react';
import LeftNav from '../components/ui/LeftNav.tsx';
import LanguageSwitcher from '../components/LanguageSwitcher.tsx';
import '../styles/GlossaryPage.scss';

// Mock API service - replace with actual API service later
const dictionaryAPI = {
  getCategories: async () => {
    // Simulating API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(['Medical', 'Legal', 'Technical', 'Financial', 'Scientific']);
      }, 500);
    });
  },
  getTermsByCategory: async (category: string) => {
    // Simulating API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          [
            {
              id: 1,
              term: 'Abrasion',
              definition: 'An area damaged by scraping or wearing away.',
            },
            {
              id: 2,
              term: 'Acetaminophen',
              definition: 'A medication used to treat pain and fever.',
            },
            {
              id: 3,
              term: 'Acute',
              definition:
                'A condition that develops suddenly and is usually severe.',
            },
            {
              id: 4,
              term: 'Analgesic',
              definition: 'A drug that relieves pain.',
            },
            {
              id: 5,
              term: 'Biopsy',
              definition:
                'The removal of a small piece of tissue for diagnostic examination.',
            },
          ].filter(() => category === 'Medical'),
        );
      }, 500);
    });
  },
  getTranslations: async (termId: number) => {
    // Simulating API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: termId,
          translations: {
            Spanish: 'Abrasión',
            French: 'Abrasion',
            German: 'Abschürfung',
            Chinese: '擦伤',
            Arabic: 'كشط',
          },
        });
      }, 500);
    });
  },
};

// Define types for terms and translations
interface Term {
  id: number;
  term: string;
  definition: string;
}
interface Translations {
  id: number;
  translations: Record<string, string>;
}
interface UserData {
  uuid: string;
  firstName: string;
  lastName: string;
}

const GlossaryPage = () => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showTranslations, setShowTranslations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryTerms, setCategoryTerms] = useState<Term[]>([]);
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState('search');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [avatarInitials, setAvatarInitials] = useState<string>('U');
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  // Load categories on component mount
  useEffect(() => {
    void loadCategories();
    // Profile logic
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const fetchAndSetUserData = () => {
      setIsLoadingUserData(true);
      const storedUserDataString = localStorage.getItem('userData');
      if (storedUserDataString) {
        try {
          const parsedData = JSON.parse(storedUserDataString) as UserData;
          setUserData(parsedData);
          if (parsedData.firstName && parsedData.lastName) {
            setAvatarInitials(
              `${parsedData.firstName.charAt(0)}${parsedData.lastName.charAt(0)}`.toUpperCase(),
            );
          } else if (parsedData.firstName) {
            setAvatarInitials(parsedData.firstName.charAt(0).toUpperCase());
          }
          setIsLoadingUserData(false);
          return;
        } catch {
          localStorage.removeItem('userData');
        }
      }
      setIsLoadingUserData(false);
    };
    fetchAndSetUserData();
  }, []);

  const loadCategories = async (): Promise<void> => {
    setLoading(true);
    try {
      const cats = await dictionaryAPI.getCategories();
      setCategories(cats as string[]);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category: string): Promise<void> => {
    setSelectedCategory(category);
    setSelectedTerm(null);
    setShowTranslations(false);
    setTranslations(null);
    setLoading(true);
    try {
      const terms = await dictionaryAPI.getTermsByCategory(category);
      setCategoryTerms(terms as Term[]);
    } catch (error) {
      console.error('Error loading terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTermSelect = (term: Term): void => {
    setSelectedTerm(term);
    setShowTranslations(false);
    setTranslations(null);
  };

  const handleShowTranslations = async (): Promise<void> => {
    if (!selectedTerm) return;
    setLoading(true);
    setShowTranslations(true);
    try {
      const termTranslations = await dictionaryAPI.getTranslations(
        selectedTerm.id,
      );
      setTranslations(termTranslations as Translations);
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTerms = categoryTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className="glossary-root"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}
    >
      {/* Left Navigation */}
      <div className="glossary-leftnav" style={{ minWidth: 220 }}>
        <LeftNav activeItem={activeNav} setActiveItem={setActiveNav} />
      </div>
      {/* Main Content with Profile at Top Right */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Profile Section absolutely positioned top right of main content */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '1.5rem 2.5rem 0 2.5rem',
            zIndex: 2,
          }}
        >
          {isLoadingUserData ? (
            <div className="profile-section">Loading profile...</div>
          ) : userData ? (
            <div
              className="profile-section"
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div
                className="profile-info"
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div className="profile-avatar">{avatarInitials}</div>
                <div className="profile-details">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <LanguageSwitcher />
                    <h3 style={{ margin: 0 }}>
                      {userData.firstName} {userData.lastName}
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                    User ID: {userData.uuid}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {/* Main Centered Content */}
        <div style={{ width: '100%', maxWidth: 900, marginTop: '5.5rem' }}>
          {/* Multilingual Dictionary section restored */}
          <div
            className="glossary-header"
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <h1 className="glossary-title">
              <Book className="text-blue-600" size={40} />
              Multilingual Dictionary
            </h1>
            <p className="glossary-subtitle">
              Browse categories, explore terms, and discover translations
            </p>
          </div>
          <div className="glossary-grid">
            {/* Categories Panel */}
            <div className="glossary-panel">
              <h2 className="glossary-panel-title">
                <Book size={20} />
                Categories
              </h2>
              {loading && !categories.length ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="glossary-categories-list">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        void handleCategorySelect(category);
                      }}
                      className={`glossary-category-btn${
                        selectedCategory === category ? ' selected' : ''
                      }`}
                    >
                      <span>{category}</span>
                      {selectedCategory === category ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Terms Panel */}
            <div className="glossary-panel">
              <h2 className="glossary-panel-title">
                {selectedCategory
                  ? `Terms in ${selectedCategory}`
                  : 'Select a Category'}
              </h2>
              {selectedCategory && (
                <div className="glossary-search">
                  <Search className="glossary-search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search terms..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    className="glossary-search-input"
                  />
                </div>
              )}
              {loading && selectedCategory ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="glossary-terms-list">
                  {filteredTerms.map((term) => (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => {
                        handleTermSelect(term);
                      }}
                      className={`glossary-term-btn${
                        selectedTerm?.id === term.id ? ' selected' : ''
                      }`}
                    >
                      <div className="glossary-term-title">{term.term}</div>
                      <div className="glossary-term-def">{term.definition}</div>
                    </button>
                  ))}
                </div>
              )}
              {selectedCategory && filteredTerms.length === 0 && !loading && (
                <div className="glossary-empty">
                  No terms found matching your search.
                </div>
              )}
            </div>

            {/* Details Panel */}
            <div className="glossary-panel">
              <h2 className="glossary-panel-title">
                <Globe size={20} />
                Term Details
              </h2>
              {selectedTerm ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="glossary-details-title">
                      {selectedTerm.term}
                    </h3>
                    <p className="glossary-details-def">
                      {selectedTerm.definition}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void handleShowTranslations();
                      }}
                      className="glossary-translate-btn"
                    >
                      <Globe size={16} />
                      Show Translations
                    </button>
                  </div>
                  {showTranslations && (
                    <div className="glossary-translation-list">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Translations
                      </h4>
                      {loading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      ) : translations ? (
                        Object.entries(translations.translations).map(
                          ([language, translation]) => (
                            <div
                              key={language}
                              className="glossary-translation-item"
                            >
                              <div className="glossary-translation-lang">
                                {language}
                              </div>
                              <div className="glossary-translation-text">
                                {String(translation)}
                              </div>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="glossary-empty">
                          No translations available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="glossary-empty">
                  Select a term to view details and translations
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage;

// RENAME: GlossaryPage.tsx (was Glossary.tsx)
