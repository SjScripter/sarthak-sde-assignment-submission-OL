import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ComposeModal from './ComposeModal';
import { Clock, Send, Plus, Search } from 'lucide-react';

const Dashboard: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([]);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        axios.get(`http://localhost:4000/api/emails/scheduled/${user.id}`),
        axios.get(`http://localhost:4000/api/emails/sent/${user.id}`)
      ]);
      setScheduledEmails(scheduledRes.data);
      setSentEmails(sentRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    
    if (q.length > 2) {
      try {
        const res = await axios.get(`http://localhost:4000/api/emails/search?q=${q}`);
        // Assuming search returns both types, we can filter them locally based on active tab
        // For simplicity here, we'll just show the concept
        console.log("Search results:", res.data);
      } catch (err) {
        console.error("Search failed", err);
      }
    } else if (q.length === 0) {
      fetchData();
    }
  };

  const currentData = activeTab === 'scheduled' ? scheduledEmails : sentEmails;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
          <p className="text-textMuted text-sm mt-1">Manage your email sequences</p>
        </div>
        <button 
          onClick={() => setIsComposeOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          Compose New Email
        </button>
      </div>

      <div className="bg-surface border border-borderLine rounded-xl overflow-hidden">
        <div className="flex border-b border-borderLine p-2 gap-2">
          <button 
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'scheduled' ? 'bg-borderLine text-white' : 'text-textMuted hover:text-white hover:bg-borderLine/50'}`}
          >
            <Clock size={16} />
            Scheduled
          </button>
          <button 
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'sent' ? 'bg-borderLine text-white' : 'text-textMuted hover:text-white hover:bg-borderLine/50'}`}
          >
            <Send size={16} />
            Sent
          </button>
          
          <div className="ml-auto relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input 
              type="text" 
              placeholder="Search emails (Elasticsearch)..." 
              value={searchQuery}
              onChange={handleSearch}
              className="bg-background border border-borderLine rounded-md py-1.5 pl-9 pr-4 text-sm text-white placeholder-textMuted focus:outline-none focus:border-primary w-64"
            />
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center text-textMuted">Loading...</div>
          ) : currentData.length === 0 ? (
             <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-borderLine/50 rounded-full flex items-center justify-center mb-4 text-textMuted">
                  {activeTab === 'scheduled' ? <Clock size={24} /> : <Send size={24} />}
                </div>
                <h3 className="text-white font-medium mb-1">No {activeTab} emails found</h3>
                <p className="text-textMuted text-sm">When you schedule emails, they will appear here.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-borderLine text-textMuted text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Recipient</th>
                  <th className="p-4 font-medium">Subject</th>
                  <th className="p-4 font-medium">{activeTab === 'scheduled' ? 'Scheduled For' : 'Sent At'}</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLine">
                {currentData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-borderLine/30 transition">
                    <td className="p-4 text-sm text-white">
                       {item.receivers || item.receiver}
                    </td>
                    <td className="p-4 text-sm text-textMuted truncate max-w-xs">{item.subject}</td>
                    <td className="p-4 text-sm text-textMuted">
                      {new Date(item.scheduledTime || item.sentTime).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'sent' || item.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        item.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isComposeOpen && (
        <ComposeModal 
          user={user} 
          onClose={() => setIsComposeOpen(false)} 
          onSuccess={() => {
            setIsComposeOpen(false);
            setActiveTab('scheduled');
            fetchData();
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;
