import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Palette,
  Database,
  Shield,
  Mail,
  CreditCard,
  HelpCircle,
  Save,
  AlertCircle
} from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  const sections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: <User className="w-5 h-5" />,
      description: 'Manage your account profile and personal information'
    },
    {
      id: 'security',
      title: 'Security',
      icon: <Lock className="w-5 h-5" />,
      description: 'Configure security settings and password'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      description: 'Set up notification preferences'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <Palette className="w-5 h-5" />,
      description: 'Customize the dashboard appearance'
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: <Database className="w-5 h-5" />,
      description: 'Manage data backup and export settings'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: <Shield className="w-5 h-5" />,
      description: 'Configure privacy settings and data sharing'
    },
    {
      id: 'email',
      title: 'Email Settings',
      icon: <Mail className="w-5 h-5" />,
      description: 'Manage email preferences and templates'
    },
    {
      id: 'billing',
      title: 'Billing',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'View and manage billing information'
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: <HelpCircle className="w-5 h-5" />,
      description: 'Access help resources and support options'
    }
  ];

  const handleSave = () => {
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Save Alert */}
      {showSaveAlert && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Changes saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {section.icon}
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className="text-sm text-gray-500">{section.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Profile Settings */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Profile Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>UTC</option>
                      <option>EST</option>
                      <option>PST</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Security Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="twoFactor"
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="twoFactor" className="text-sm text-gray-700">
                      Enable Two-Factor Authentication
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">SMS Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Appearance Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Small</option>
                      <option>Medium</option>
                      <option>Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Scheme
                    </label>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-purple-600 border-2 border-purple-600"></button>
                      <button className="w-8 h-8 rounded-full bg-blue-600 border-2 border-gray-200"></button>
                      <button className="w-8 h-8 rounded-full bg-green-600 border-2 border-gray-200"></button>
                      <button className="w-8 h-8 rounded-full bg-red-600 border-2 border-gray-200"></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Management Settings */}
            {activeSection === 'data' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Data Management</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Export Data</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Download your data in various formats
                    </p>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Export as CSV
                      </button>
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Export as JSON
                      </button>
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Export as PDF
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Backup Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Automatic Backup</h4>
                          <p className="text-sm text-gray-500">Enable automatic daily backups</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Backup Frequency
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Privacy Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Data Collection</h3>
                      <p className="text-sm text-gray-500">Allow collection of usage data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Analytics</h3>
                      <p className="text-sm text-gray-500">Share analytics data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Marketing Emails</h3>
                      <p className="text-sm text-gray-500">Receive marketing communications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeSection === 'email' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Email Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Template
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Default Template</option>
                      <option>Custom Template</option>
                      <option>Minimal Template</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Signature
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={4}
                      placeholder="Enter your email signature"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reply-To Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter reply-to email address"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Billing Settings */}
            {activeSection === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Billing Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Payment Methods</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-6 h-6 text-gray-500" />
                          <div>
                            <div className="font-medium">•••• •••• •••• 4242</div>
                            <div className="text-sm text-gray-500">Expires 12/24</div>
                          </div>
                        </div>
                        <button className="text-red-600 hover:text-red-700">Remove</button>
                      </div>
                      <button className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-500">
                        Add New Payment Method
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Billing History</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">Premium Plan</div>
                          <div className="text-sm text-gray-500">Monthly Subscription</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">$99.00</div>
                          <div className="text-sm text-gray-500">Due on 1st of each month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Help & Support Settings */}
            {activeSection === 'help' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Help & Support</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Documentation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button className="p-4 border rounded-lg text-left hover:border-purple-500">
                        <div className="font-medium">Getting Started Guide</div>
                        <div className="text-sm text-gray-500">Learn the basics of using the dashboard</div>
                      </button>
                      <button className="p-4 border rounded-lg text-left hover:border-purple-500">
                        <div className="font-medium">User Manual</div>
                        <div className="text-sm text-gray-500">Detailed documentation for all features</div>
                      </button>
                      <button className="p-4 border rounded-lg text-left hover:border-purple-500">
                        <div className="font-medium">API Documentation</div>
                        <div className="text-sm text-gray-500">Technical documentation for developers</div>
                      </button>
                      <button className="p-4 border rounded-lg text-left hover:border-purple-500">
                        <div className="font-medium">FAQ</div>
                        <div className="text-sm text-gray-500">Frequently asked questions</div>
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Contact Support</h3>
                    <div className="space-y-4">
                      <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Submit a Ticket
                      </button>
                      <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:border-purple-500">
                        Live Chat Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 