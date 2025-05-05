import React, { useState, useEffect } from 'react';
import { Scissors } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { setSession, getSession } from '../lib/session';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Check for existing session
    const session = getSession();
    if (session) {
      onLogin();
    }

    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting('Good Morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good Afternoon');
      } else if (hour >= 17 && hour < 22) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Good Night');
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, [onLogin]);

  const createAuditLog = async (
    adminId: string | null,
    action: string,
    targetTable: string,
    targetId: string | null,
    details: string,
    status: 'success' | 'failed'
  ) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          admin_id: adminId,
          action,
          target_table: targetTable,
          target_id: targetId,
          details,
          status,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check admin credentials
      const { data: admin, error } = await supabase
        .from('admin')
        .select('*')
        .eq('email', username)
        .single();

      if (error) throw error;

      if (admin && admin.password === password) {
        // Set session
        setSession(admin.admin_id, admin.name, admin.email);

        // Create success audit log for login
        await createAuditLog(
          admin.admin_id,
          'LOGIN',
          'admin',
          admin.admin_id,
          `Admin ${admin.name} logged in successfully`,
          'success'
        );

        onLogin();
      } else {
        // Create failed login audit log
        await createAuditLog(
          null,
          'LOGIN_ATTEMPT',
          'admin',
          null,
          `Failed login attempt with email: ${username}`,
          'failed'
        );
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Create error audit log
      await createAuditLog(
        null,
        'LOGIN_ERROR',
        'admin',
        null,
        `Login error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'failed'
      );
      setError('An error occurred during login');
    }
  };

  return (
    <div className="flex h-screen w-screen">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src="src\assets\images\img.png" 
          alt="Login Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-10 left-10 text-white">
          <h1 className="text-5xl font-bold tracking-wider">FitOnManager</h1>
          <p className="text-xl mt-2 tracking-wide">Your Fashion Business Command Center</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-purple-900 to-red-800 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Scissors className="h-10 w-10 text-white transform rotate-45" />
              <span className="text-3xl font-bold text-white ml-3 tracking-wider">FitOnManager</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">{greeting}!</h2>
            <p className="text-white/90 text-lg">Welcome to your fashion dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>

            {error && (
              <div className="text-red-300 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-[1.02]"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;