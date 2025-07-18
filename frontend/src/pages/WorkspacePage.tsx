import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Folder, File, Edit, Share, Plus } from 'lucide-react';
import LeftNav from '../components/ui/LeftNav.tsx';
import Navbar from '../components/ui/Navbar.tsx';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';

import '../styles/WorkspacePage.scss';

// Interface for workspace items
interface WorkspaceItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  lastModified: string;
  owner: string;
  shared: boolean;
}

// Mock data for initial development
const mockWorkspaceItems: WorkspaceItem[] = [
  {
    id: '1',
    name: 'Statistical Terms',
    type: 'folder',
    lastModified: '2023-10-15',
    owner: 'Me',
    shared: true,
  },
  {
    id: '2',
    name: 'Medical Terminology',
    type: 'folder',
    lastModified: '2023-10-12',
    owner: 'Me',
    shared: false,
  },
  {
    id: '3',
    name: 'Linguistics Project',
    type: 'file',
    lastModified: '2023-10-10',
    owner: 'John Doe',
    shared: true,
  },
  {
    id: '4',
    name: 'South African Terms',
    type: 'folder',
    lastModified: '2023-10-08',
    owner: 'Me',
    shared: true,
  },
  {
    id: '5',
    name: 'Legal Terminology',
    type: 'file',
    lastModified: '2023-10-05',
    owner: 'Jane Smith',
    shared: true,
  },
];

const WorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [workspaceItems] = useState<WorkspaceItem[]>(mockWorkspaceItems);
  const [activeMenuItem, setActiveMenuItem] = useState('workspace');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'all' | 'mine' | 'shared'>(
    'all',
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Simulate loading data
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
    };

    void loadData();
  }, []);

  // Filter items based on selected view
  const filteredItems = workspaceItems.filter((item) => {
    if (selectedView === 'all') return true;
    if (selectedView === 'mine') return item.owner === 'Me';
    return item.shared;
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div
      className={`workspace-container ${isMobileMenuOpen ? 'mobile-menu-is-open' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={toggleMobileMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              toggleMobileMenu();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}

      <div className="main-content">
        {!isMobile && (
          <div className="top-bar workspace-top-bar">
            <button
              className="hamburger-icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}

        <div className={`workspace-content ${isMobile ? 'pt-16' : ''}`}>
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <>
              <div className="workspace-header">
                <h1>{t('workspace.title')}</h1>
                <p className="workspace-description">
                  {t('workspace.description')}
                </p>

                <div className="workspace-actions">
                  <div className="view-filters">
                    <button
                      type="button"
                      className={`filter-btn ${selectedView === 'all' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedView('all');
                      }}
                    >
                      {t('workspace.filters.all')}
                    </button>
                    <button
                      type="button"
                      className={`filter-btn ${selectedView === 'mine' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedView('mine');
                      }}
                    >
                      {t('workspace.filters.mine')}
                    </button>
                    <button
                      type="button"
                      className={`filter-btn ${selectedView === 'shared' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedView('shared');
                      }}
                    >
                      {t('workspace.filters.shared')}
                    </button>
                  </div>

                  <button type="button" className="create-new-btn">
                    <Plus size={16} />
                    {t('workspace.createNew')}
                  </button>
                </div>
              </div>

              <div className="workspace-list">
                <div className="workspace-list-header">
                  <div className="col-name">{t('workspace.columns.name')}</div>
                  <div className="col-modified">
                    {t('workspace.columns.lastModified')}
                  </div>
                  <div className="col-owner">
                    {t('workspace.columns.owner')}
                  </div>
                  <div className="col-actions">
                    {t('workspace.columns.actions')}
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="empty-state">
                    <p>{t('workspace.emptyState')}</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div key={item.id} className="workspace-item">
                      <div className="col-name">
                        {item.type === 'folder' ? (
                          <Folder size={20} className="item-icon folder-icon" />
                        ) : (
                          <File size={20} className="item-icon file-icon" />
                        )}
                        <span className="item-name">{item.name}</span>
                      </div>
                      <div className="col-modified">{item.lastModified}</div>
                      <div className="col-owner">{item.owner}</div>
                      <div className="col-actions">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Share"
                        >
                          <Share size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
