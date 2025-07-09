import { useMemo, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import '../../styles/Navbar.scss';
import { useDarkMode } from './DarkModeComponent.tsx';

// This should ideally be in a shared config file or environment variable
const NGROK_BASE_URL = 'https://7ecc-197-185-168-28.ngrok-free.app'; // Ensure this is your correct NGROK URL
const USER_API_ENDPOINT = `${NGROK_BASE_URL}/api/v1/auth/me`; // Or your correct /me endpoint

interface UserProfileApiResponse {
  // Based on the example: /api/v1/me response
  id: string; // This will be our UUID
  first_name: string;
  last_name: string;
  email?: string;
}
interface UserData {
  // For component state and localStorage
  uuid: string;
  firstName: string;
  lastName: string;
}

const Navbar = () => {
  const location = useLocation();
  /*const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });*/
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('');
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const navItems = useMemo(
    () => [
      'Home',
      'Dictionary',
      'Glossary',
      'Saved Terms',
      'Dashboard',
      'Help',
    ],
    [],
  );

  // Custom route mapping for navigation items
  const getRouteForItem = (item: string): string => {
    switch (item) {
      case 'Home':
        return '/dashboard';
      case 'Dictionary':
        return '/search';
      case 'Glossary':
        return '/glossary';
      case 'Dashboard':
        return '/analytics';
      default:
        return `/${item.toLowerCase().replace(/\s/g, '-')}`;
    }
  };

  // const [userData, setUserData] = useState<UserData | null>(null);
  const [avatarInitials, setAvatarInitials] = useState<string>(''); // Default to empty or a placeholder
  // const [isLoadingUserData, setIsLoadingUserData] = useState(true); // Optional: if you want a loading state for avatar

  useEffect(() => {
    const currentPath = location.pathname.replace('/', '').replace(/-/g, ' ');
    const match = navItems.find(
      (item) => item.toLowerCase() === currentPath.toLowerCase(),
    );
    if (match) setActive(match);
    else setActive('');
    // Fetch user data logic
    const fetchAndSetUserData = async () => {
      // setIsLoadingUserData(true); // Uncomment if using loading state
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // setIsLoadingUserData(false); // Uncomment if using loading state
        setAvatarInitials(''); // Or a guest icon/initials
        // setUserData(null);
        return;
      }

      const storedUserDataString = localStorage.getItem('userData');
      if (storedUserDataString) {
        try {
          const parsedData = JSON.parse(storedUserDataString) as UserData;
          // setUserData(parsedData);
          if (parsedData.firstName && parsedData.lastName) {
            setAvatarInitials(
              `${parsedData.firstName.charAt(0)}${parsedData.lastName.charAt(0)}`.toUpperCase(),
            );
          } else if (parsedData.firstName) {
            setAvatarInitials(parsedData.firstName.charAt(0).toUpperCase());
          } else {
            setAvatarInitials('U'); // Fallback
          }
          // setIsLoadingUserData(false); // Uncomment if using loading state
          return;
        } catch (error) {
          console.error(
            'Navbar: Failed to parse user data from localStorage, fetching from API.',
            error,
          );
          localStorage.removeItem('userData');
        }
      }

      try {
        const response = await fetch(USER_API_ENDPOINT, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (response.ok) {
          const apiData = (await response.json()) as UserProfileApiResponse;
          const newUserData: UserData = {
            uuid: apiData.id,
            firstName: apiData.first_name,
            lastName: apiData.last_name,
          };
          // setUserData(newUserData);
          localStorage.setItem('userData', JSON.stringify(newUserData));
          setAvatarInitials(
            `${newUserData.firstName.charAt(0)}${newUserData.lastName.charAt(0)}`.toUpperCase(),
          );
        } else {
          console.error(
            'Navbar: Failed to fetch user data from API:',
            response.status,
            await response.text(),
          );
          setAvatarInitials(''); // Or guest icon
        }
      } catch (error) {
        console.error(
          'Navbar: Network or other error fetching user data:',
          error,
        );
        setAvatarInitials(''); // Or guest icon
      } finally {
        // setIsLoadingUserData(false); // Uncomment if using loading state
      }
    };

    void fetchAndSetUserData();
  }, [/*darkMode, */ location.pathname, navItems]); // location.pathname ensures data might refetch if relevant

  return (
    <nav
      className={`w-full fixed top-0 left-0 bg-theme text-theme px-6 py-3 shadow-md z-50 ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <img
            src="public/DFSI_Logo.png"
            alt="Marito Logo"
            className="w-10 h-10 rounded-full"
          />
          <span className="text-xl font-semibold">Marito</span>
        </div>

        {/* Nav Links (desktop) */}
        <div className="hidden md:flex space-x-8 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item}
              to={getRouteForItem(item)}
              className={`relative pb-1 ${
                active === item
                  ? 'font-medium text-white'
                  : 'text-white/70 hover:text-white visited:text-white/70'
              }`}
              onClick={() => {
                setActive(item);
              }}
            >
              {item}
              {active === item && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] rounded bg-[#F00A50] drop-shadow-[0_0_6px_#F00A50]" />
              )}
            </NavLink>
          ))}
        </div>

        {/* Avatar, Theme Toggle & Hamburger */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="text-theme bg-theme hover:text-accent-pink transition outline-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none"
            type="button"
            aria-label="Toggle dark mode"
          >
            {/*{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}*/}
            {isDarkMode ? 'Light' : 'Dark'}
          </button>

          {/* Avatar Display */}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {/* Optional: {isLoadingUserData ? '...' : avatarInitials || 'G'} */}
            {
              avatarInitials ||
                '' /* Show initials or empty/guest icon if not loaded */
            }
          </div>
          <button
            className="md:hidden text-theme bg-theme hover:text-accent-pink transition"
            onClick={() => {
              setMenuOpen(!menuOpen);
            }}
            aria-label="Toggle menu"
            type="button"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`
          md:hidden overflow-hidden transition-all duration-300 ease-in-out
          px-6 bg-theme shadow-md
          ${menuOpen ? 'max-h-64 opacity-100 pt-3 pb-2' : 'max-h-0 opacity-0 pt-0 pb-0'}
        `}
      >
        {navItems.map((item) => (
          <NavLink
            key={item}
            to={getRouteForItem(item)}
            className={`block ${
              active === item ? 'text-theme font-semibold' : 'text-gray-300'
            }`}
            onClick={() => {
              setActive(item);
              setMenuOpen(false);
            }}
          >
            {item}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
export default Navbar;
