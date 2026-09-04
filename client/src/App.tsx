import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-borderLine bg-surface/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">ReachInbox</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-borderLine" />
              <div className="text-sm">
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-textMuted text-xs">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm text-textMuted hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Dashboard user={user} />
      </main>
    </div>
  );
}

export default App;
