import React, { useState } from 'react';
import axios from 'axios';

const Login: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleMockGoogleLogin = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await axios.post(`${API_URL}/api/auth/google`, {
        email: 'test@reachinbox.ai',
        name: 'Test User',
        avatar: 'https://ui-avatars.com/api/?name=Test+User&background=random',
        googleId: 'google-12345'
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (error) {
      console.error('Login failed', error);
      alert('Login failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-surface p-10 rounded-2xl border border-borderLine shadow-xl max-w-sm w-full text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ReachInbox</h1>
          <p className="text-textMuted">Email Job Scheduler</p>
        </div>
        
        <button 
          onClick={handleMockGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition duration-200 disabled:opacity-50"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};

export default Login;
