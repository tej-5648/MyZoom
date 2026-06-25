'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const [meetingId, setMeetingId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!meetingId || !displayName) {
      setError("Please fill all fields.");
      return;
    }

    try {
      // Validate meeting
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/meetings/${meetingId}`);
      if (!res.ok) {
        setError("Meeting not found.");
        return;
      }
      
      // Join meeting
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/meetings/${meetingId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName })
      });

      onClose();
      router.push(`/meeting/${meetingId}?name=${encodeURIComponent(displayName)}`);
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Join Meeting</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleJoin} className="p-6">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID</label>
              <input 
                type="text" 
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-zoom-blue focus:border-transparent outline-none transition"
                placeholder="Enter meeting ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-zoom-blue focus:border-transparent outline-none transition"
                placeholder="Enter your name"
              />
            </div>
          </div>
          <div className="mt-8 flex space-x-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-zoom-blue hover:bg-zoom-blue-hover text-white text-sm font-medium rounded-lg transition"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
