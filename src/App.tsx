import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Buyers from './components/Buyers';
import Shops from './components/Shops';
import Products from './components/Products';
import Reports from './components/Reports';
import Settings from './components/Settings';
import LoadingScreen from './components/LoadingScreen';
import LoginPage from './components/LoginPage';
import Reviews from './components/Reviews';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handlePageChange = (page: string) => {
    if (page === 'logout') {
      handleLogout();
    } else {
      setCurrentPage(page);
    }
  };

  const handleLogout = () => {
    // Clear any stored user data/tokens here
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  const handleLogin = () => {
    // Implement login logic here
    setIsAuthenticated(true);
  };

  const handleSidebarCollapse = (isCollapsed: boolean) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={handlePageChange} 
        onCollapse={handleSidebarCollapse}
      />
      <div className={`${isSidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        <Header onLogout={handleLogout} />
        <main className="p-6 mt-16">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'buyers' && <Buyers />}
          {currentPage === 'shops' && <Shops />}
          {currentPage === 'products' && <Products />}
          {currentPage === 'reviews' && <Reviews />}
          {currentPage === 'reports' && <Reports />}
          {currentPage === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
};

export default App;