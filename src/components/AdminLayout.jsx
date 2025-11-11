import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Footer from './Footer';
import { FaUserCircle, FaSun, FaMoon, FaBars, FaSignOutAlt } from 'react-icons/fa';
import logoUrl from '../assets/KLOGO.png';

export default function AdminLayout({ children, isDarkMode, $isDarkMode, onThemeToggle }) {
  const dark = $isDarkMode ?? isDarkMode ?? false;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    setIsAuthenticated(true);
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      setAdmin(adminData);
    } catch {
      setAdmin(null);
    }
  }, [navigate]);

  const toggleTheme = () => {
    if (typeof onThemeToggle === 'function') { onThemeToggle(); return; }
    try {
      const currentlyDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
      if (currentlyDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    } catch { /* no-op */ }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    } catch { /* ignore */ }
    navigate('/admin-login', { replace: true });
  };

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
        <div className="text-sm opacity-75">Redirecting to admin login…</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      {/* Header */}
      <header className={`${dark ? 'bg-gray-800' : 'bg-white'} shadow-md sticky top-0 z-50`}>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button aria-label="Open menu" className={`mr-2 p-2 rounded md:hidden ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => setDrawerOpen(true)}>
                <FaBars className="text-xl" />
              </button>
              <div className="p-1.5 mr-3">
                <img src={logoUrl} alt="kGamify Logo" className="h-10 w-10" />
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-[#ff8200]">kGamify</h1>
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Admin</span>
                </div>
                <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Admin Control Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={toggleTheme} className="px-3.5 py-2 rounded-full border text-base flex items-center bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {dark ? <FaSun className="text-yellow-400 text-xl" /> : <FaMoon className="text-blue-500 text-xl" />}
                <span className="hidden md:inline ml-2">{dark ? 'Light' : 'Dark'}</span>
              </button>
              {admin && (
                <div className="hidden md:flex items-center mr-2 bg-gray-100 dark:bg-gray-700 rounded-full pl-1 pr-3 py-1">
                  <div className="w-7 h-7 rounded-full bg-[#ff8200] flex items-center justify-center mr-2">
                    <FaUserCircle className="text-lg text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{admin.firstName || admin.email}</p>
                    <p className="text-xs text-[#ff8200]">{admin?.role === 'super_admin' ? 'Super Admin' : admin?.role === 'moderator' ? 'Moderator' : 'Admin'}</p>
                  </div>
                </div>
              )}
              <button onClick={handleLogout} className="px-3.5 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center text-sm">
                <FaSignOutAlt className="mr-1.5 text-lg" /> <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Sidebar (mobile) */}
      <div className={`fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`}>
        {/* Scrim */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setDrawerOpen(false)} aria-hidden />
        {/* Panel */}
        <div className={`absolute top-0 left-0 h-full w-72 transform transition-transform ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className={`${dark ? 'bg-gray-900' : 'bg-white'} h-full shadow-xl relative`}>
            <button aria-label="Close menu" className={`absolute top-3 right-3 p-2 rounded ${dark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} onClick={() => setDrawerOpen(false)}>✕</button>
            <AdminSidebar isDarkMode={dark} variant="drawer" onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (sticky) */}
      <div className="hidden md:block fixed left-0 top-16 z-40">
        <AdminSidebar isDarkMode={dark} variant="panel" />
      </div>

      {/* Main content */}
      <main className="flex-1 w-full md:pl-64">
        {children}
      </main>

      <Footer isDarkMode={dark} $isDarkMode={dark} />
    </div>
  );
}

AdminLayout.propTypes = {
  children: PropTypes.node,
  isDarkMode: PropTypes.bool,
  $isDarkMode: PropTypes.bool,
  onThemeToggle: PropTypes.func,
};
