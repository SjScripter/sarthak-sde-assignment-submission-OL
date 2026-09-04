import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { X, Upload, Send } from 'lucide-react';

const ComposeModal: React.FC<{ user: any, onClose: () => void, onSuccess: () => void }> = ({ user, onClose, onSuccess }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [receivers, setReceivers] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [delayBetween, setDelayBetween] = useState(0);
  const [hourlyLimit, setHourlyLimit] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          // Naive parsing: assume first column or any valid email pattern
          // For simplicity, just grab everything that looks like an email from any column
          const emails = new Set<string>();
          results.data.forEach((row: any) => {
            row.forEach((cell: string) => {
              if (typeof cell === 'string' && cell.includes('@') && cell.includes('.')) {
                emails.add(cell.trim());
              }
            });
          });
          setReceivers(Array.from(emails));
        }
      });
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body || receivers.length === 0 || !scheduledTime) {
      return alert("Please fill all required fields and upload leads");
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await axios.post(`${API_URL}/api/emails/schedule`, {
        userId: user.id,
        subject,
        body,
        receivers,
        scheduledTime,
        delayBetween,
        hourlyLimit
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-borderLine w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-borderLine">
          <h3 className="text-xl font-semibold text-white">Compose & Schedule</h3>
          <button onClick={onClose} className="text-textMuted hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSchedule} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">Subject</label>
            <input 
              type="text" 
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-background border border-borderLine rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition"
              placeholder="e.g., Quick question about your growth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">Body</label>
            <textarea 
              required
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full bg-background border border-borderLine rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition min-h-[120px]"
              placeholder="Hi there, ..."
            />
          </div>

          <div className="bg-background border border-borderLine border-dashed rounded-lg p-6 text-center">
            <input type="file" id="csv-upload" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="text-textMuted mb-2" size={24} />
              <span className="text-white font-medium text-sm">Upload Leads (CSV)</span>
              <span className="text-textMuted text-xs mt-1">
                {receivers.length > 0 ? `${receivers.length} valid emails found` : 'Click to browse files'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">Start Time</label>
              <input 
                type="datetime-local" 
                required
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full bg-background border border-borderLine rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">Delay Between (seconds)</label>
              <input 
                type="number" 
                min="0"
                value={delayBetween}
                onChange={e => setDelayBetween(parseInt(e.target.value))}
                className="w-full bg-background border border-borderLine rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-textMuted mb-1.5">Hourly Limit (0 for no limit)</label>
              <input 
                type="number" 
                min="0"
                value={hourlyLimit}
                onChange={e => setHourlyLimit(parseInt(e.target.value))}
                className="w-full bg-background border border-borderLine rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-borderLine bg-surface/50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-textMuted hover:text-white hover:bg-borderLine/50 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSchedule}
            disabled={loading || receivers.length === 0}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {loading ? 'Scheduling...' : 'Schedule Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
