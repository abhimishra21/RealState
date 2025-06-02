import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiPlus, FiDollarSign, FiHome, FiTrendingUp } from 'react-icons/fi';
import Container from './Container';
import Button from './Button';
import NotificationCenter from './NotificationCenter';
import { useSnackbar } from 'notistack';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleSignOut = async () => {
    try {
      await signout();
    } catch (error) {
      console.error('Sign out error:', error);
      enqueueSnackbar('Error signing out', { variant: 'error' });
    }
  };

  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'Marketplace', path: '/marketplace' },
    { title: 'About', path: '/about' },
    { title: 'Contact', path: '/contact' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-md' 
          : 'bg-secondary'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-white">
              TopReal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path
                    ? 'text-primary'
                    : 'text-white'
                }`}
              >
                {link.title}
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/marketplace?sort=trending"
                  className="flex items-center space-x-2 text-sm font-medium text-white hover:text-primary"
                >
                  <FiTrendingUp className="w-5 h-5" />
                  <span>Trending</span>
                </Link>
                <Link
                  to="/create-listing"
                  className="flex items-center space-x-2 text-sm font-medium text-white hover:text-primary"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Create Listing</span>
                </Link>
                <Link
                  to="/property-valuation"
                  className="flex items-center space-x-2 text-sm font-medium text-white hover:text-primary"
                >
                  <FiDollarSign className="w-5 h-5" />
                  <span>Property Valuation</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-sm font-medium text-white hover:text-primary"
                >
                  <FiUser className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <NotificationCenter />
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="flex items-center space-x-2 border-white text-white hover:bg-white hover:text-secondary"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary-dark">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:text-primary"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? 'max-h-[500px] opacity-100'
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <nav className="py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path
                    ? 'text-primary'
                    : 'text-white'
                }`}
              >
                {link.title}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/marketplace?sort=trending"
                  className="flex items-center space-x-2 text-sm font-medium text-white hover:text-primary"
                >
                  <FiTrendingUp className="w-5 h-5" />
                  <span>Trending</span>
                </Link>
                <Link
                  to="/create-listing"
                  className="flex items-center space-x-2 text-sm font-medium text-white hover:text-primary"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Create Listing</span>
                </Link>
                <Link
                  to="/property-valuation"
                  className="flex items-center space-x-2 text-sm font-medium text-white hover:text-primary"
                >
                  <FiDollarSign className="w-5 h-5" />
                  <span>Property Valuation</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-sm font-medium text-white hover:text-primary"
                >
                  <FiUser className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <div className="py-2">
                  <NotificationCenter />
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-sm font-medium text-white hover:text-primary"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link to="/auth" className="block">
                <Button className="w-full bg-primary hover:bg-primary-dark">Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </Container>
    </header>
  );
};

export default Header;
