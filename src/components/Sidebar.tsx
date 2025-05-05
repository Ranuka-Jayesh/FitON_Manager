import React, { useState } from 'react';
import { 
  LayoutDashboard,
  Users,
  Store,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Package,
  BarChart3,
  SettingsIcon,
  MessageSquare
} from 'lucide-react';
import { clearSession } from '../lib/session';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onCollapse?: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, onCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'buyers', label: 'Buyers', icon: Users },
    { id: 'shops', label: 'Shops', icon: Store },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
  ];

  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapse?.(newState);
  };

  const handleLogout = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('adminSession') || '{}');
      
      // Create audit log for logout
      await supabase
        .from('audit_logs')
        .insert({
          admin_id: session.adminId,
          action: 'LOGOUT',
          target_table: 'admin',
          target_id: session.adminId,
          details: `Admin ${session.name} logged out`,
          status: 'success',
          created_at: new Date().toISOString()
        });

      // Clear session
      clearSession();
      
      // Redirect to login
      onPageChange('logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <div 
        className={`bg-white min-h-screen border-r border-gray-200 transition-all duration-300 fixed left-0 top-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center space-x-2 overflow-hidden">
            <Scissors size={28} className="text-purple-600 transform rotate-45 flex-shrink-0" />
            <span className={`text-xl font-bold text-gray-800 tracking-wider transition-opacity duration-300 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            }`}>
              FitOnManager
            </span>
          </div>
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
            onClick={handleCollapse}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>
        
        <nav className="p-4 flex flex-col h-[calc(100vh-5rem)] justify-between">
          <div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg mb-1 transition-colors ${
                    currentPage === item.id
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className={`font-medium transition-opacity duration-300 ${
                    isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          
          <div>
            <button
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg mb-1 text-red-600 hover:bg-red-50`}
              onClick={() => setShowLogoutConfirm(true)}
              title={isCollapsed ? 'Log Out' : ''}
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span className={`font-medium transition-opacity duration-300 ${
                isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'
              }`}>
                Log Out
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowLogoutConfirm(false)}
          />

          {/* Modal panel */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-red-100 rounded-full">
                    <LogOut className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Logout
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Are you sure you want to log out? Any unsaved changes will be lost.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;