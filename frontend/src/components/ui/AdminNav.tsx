import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useDarkMode } from './DarkModeComponent.tsx';
import '../../styles/AdminNav.scss';

const AdminNav = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isDarkMode } = useDarkMode();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <div
      className={`admin-nav ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      ref={dropdownRef}
    >
      <button
        className="admin-nav-toggle"
        onClick={toggleDropdown}
        aria-label="Admin menu"
        type="button"
      >
        <span className="admin-nav-label">Admin</span>
      </button>

      {isDropdownOpen && (
        <div className="admin-dropdown">
          <NavLink
            to="/admin"
            className="admin-dropdown-item"
            onClick={closeDropdown}
          >
            <span>User Management</span>
          </NavLink>

          <NavLink
            to="/feedbackhub"
            className="admin-dropdown-item"
            onClick={closeDropdown}
          >
            <span>Feedback Hub</span>
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default AdminNav;
