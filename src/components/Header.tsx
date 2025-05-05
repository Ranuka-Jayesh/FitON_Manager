import React, { useState } from 'react';
import { Bell, MessageSquare, Moon, Search, Maximize2, ChevronDown, User, Settings, LogOut, Scissors } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'notification' | 'message' | 'system';
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Sample notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "New Order",
      message: "You have received a new order from John Doe",
      time: "5 min ago",
      isRead: false,
      type: "notification"
    },
    {
      id: 2,
      title: "Payment Success",
      message: "Payment received for Order #12345",
      time: "10 min ago",
      isRead: false,
      type: "notification"
    },
    {
      id: 3,
      title: "System Update",
      message: "System maintenance scheduled for tonight",
      time: "1 hour ago",
      isRead: true,
      type: "notification"
    }
  ]);

  // Sample messages data
  const [messages, setMessages] = useState<Notification[]>([
    {
      id: 1,
      title: "Sarah Wilson",
      message: "When will my order be shipped?",
      time: "2 min ago",
      isRead: false,
      type: "message"
    },
    {
      id: 2,
      title: "Mike Johnson",
      message: "Thanks for the quick response!",
      time: "15 min ago",
      isRead: false,
      type: "message"
    },
    {
      id: 3,
      title: "Emma Davis",
      message: "Is this item still available?",
      time: "30 min ago",
      isRead: false,
      type: "message"
    },
    {
      id: 4,
      title: "Tom Smith",
      message: "Order status update needed",
      time: "1 hour ago",
      isRead: true,
      type: "message"
    },
    {
      id: 5,
      title: "Lisa Brown",
      message: "Product inquiry",
      time: "2 hours ago",
      isRead: true,
      type: "message"
    }
  ]);

  const markAsRead = (id: number, type: 'notification' | 'message') => {
    if (type === 'notification') {
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
    } else {
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, isRead: true } : msg
      ));
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const unreadMessages = messages.filter(m => !m.isRead).length;

  const NotificationDropdown = () => (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50">
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          <button className="text-sm text-purple-600 hover:text-purple-800">
            Mark all as read
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
              !notification.isRead ? 'bg-purple-50' : ''
            }`}
            onClick={() => markAsRead(notification.id, 'notification')}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-gray-100">
        <button className="text-sm text-center w-full text-purple-600 hover:text-purple-800">
          View all notifications
        </button>
      </div>
    </div>
  );

  const MessageDropdown = () => (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50">
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Messages</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Mark all as read
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
              !message.isRead ? 'bg-blue-50' : ''
            }`}
            onClick={() => markAsRead(message.id, 'message')}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <p className="font-medium text-sm">{message.title}</p>
                <p className="text-sm text-gray-600">{message.message}</p>
                <p className="text-xs text-gray-500 mt-1">{message.time}</p>
              </div>
              {!message.isRead && (
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-gray-100">
        <button className="text-sm text-center w-full text-blue-600 hover:text-blue-800">
          View all messages
        </button>
      </div>
    </div>
  );

  return (
    <header className="bg-white h-16 flex items-center justify-between px-6 border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center">
        <Scissors size={28} className="text-purple-600 transform rotate-45" />
        <span className="text-xl font-bold text-gray-800 tracking-wider ml-2">
          FitOnManager
        </span>
      </div>

      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="text-gray-400 w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products, orders, or customers..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button 
            className="p-2 hover:bg-gray-100 rounded-full relative"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowMessages(false);
              setShowProfileMenu(false);
            }}
          >
            {unreadNotifications > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {unreadNotifications}
              </div>
            )}
            <Bell size={20} className="text-gray-600" />
          </button>
          {showNotifications && <NotificationDropdown />}
        </div>

        <div className="relative">
          <button 
            className="p-2 hover:bg-gray-100 rounded-full relative"
            onClick={() => {
              setShowMessages(!showMessages);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
          >
            {unreadMessages > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
                {unreadMessages}
              </div>
            )}
            <MessageSquare size={20} className="text-gray-600" />
          </button>
          {showMessages && <MessageDropdown />}
        </div>

        <button 
          className="p-2 hover:bg-gray-100 rounded-full"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          <Moon size={20} className="text-gray-600" />
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Maximize2 size={20} className="text-gray-600" />
        </button>
        
        <div className="relative">
          <button 
            className="flex items-center space-x-3 ml-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowMessages(false);
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-gray-700">Admin User</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                <User size={16} className="mr-2" />
                Profile
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                <Settings size={16} className="mr-2" />
                Settings
              </button>
              <hr className="my-1" />
              <button 
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center"
                onClick={onLogout}
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;