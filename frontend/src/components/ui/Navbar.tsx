import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from './DarkModeComponent';
import { useAppMenu } from './AppMenu';
import '../../styles/Navbar.scss';

const Navbar = () => {
  const { isDarkMode } = useDarkMode();
  const { t, ready } = useTranslation();
  const [isMainNavbarOpen, setIsMainNavbarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [userRole] = useState('contributor');

  const menuGroups = useAppMenu(userRole);

  console.log(menuGroups);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Don’t render until i18n has loaded
  if (!ready) return null;

  return (
    <>
      <div
        className={`fixed-outer-navbar-toggle ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <button
          onClick={() => setIsMainNavbarOpen(!isMainNavbarOpen)}
          type="button"
        >
          {isMainNavbarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <nav
        className={`main-navbar-dropdown ${isMainNavbarOpen ? 'is-open' : 'is-closed'} ${
          isDarkMode ? 'theme-dark' : 'theme-light'
        }`}
      >
        <div
          className={`mobile-nav-dropdown md:hidden p-4 ${
            isMainNavbarOpen ? 'is-open' : ''
          }`}
        >
          {menuGroups.map((group) => (
            <div key={group.id} className="mobile-nav-group mb-3">
              <div
                className="flex justify-between items-center py-2 cursor-pointer"
                onClick={() => toggleGroup(group.id)}
              >
                <span className="font-semibold text-base">{group.label}</span>
                <ChevronDown
                  size={16}
                  className={`${expandedGroups.has(group.id) ? 'rotate-180' : ''} transition-transform`}
                />
              </div>

              {expandedGroups.has(group.id) && group.items?.length > 0 && (
                <div className="pl-3 border-l border-gray-300 dark:border-gray-700">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 py-2 text-sm ${
                          isActive
                            ? 'text-[#f00a50] font-semibold'
                            : 'text-theme' + ' hover:text-[#f00a50]'
                        }`
                      }
                      onClick={() => setIsMainNavbarOpen(false)}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
