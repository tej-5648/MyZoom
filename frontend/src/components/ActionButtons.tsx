'use client';
import { useRouter } from 'next/navigation';
import { Video, PlusSquare, Calendar } from 'lucide-react';
import { useState } from 'react';
import ScheduleModal from './ScheduleModal';
import JoinModal from './JoinModal';
import { useAuth } from '@/context/AuthContext';

export default function ActionButtons() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const startInstantMeeting = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/meetings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Instant Meeting',
          start_time: new Date().toISOString(),
          duration: 60,
          is_instant: true,
        }),
      });
      const data = await res.json();
      router.push(`/meeting/${data.id}`);
    } catch (err) {
      console.error("Failed to start meeting", err);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mb-12">
        <button 
          onClick={startInstantMeeting}
          className="flex flex-col items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-6 shadow-md transition-transform hover:scale-105"
        >
          <Video size={48} className="mb-2" />
          <span className="font-medium text-sm">New Meeting</span>
        </button>
        
        <button 
          onClick={() => setIsJoinOpen(true)}
          className="flex flex-col items-center justify-center bg-zoom-blue hover:bg-zoom-blue-hover text-white rounded-2xl p-6 shadow-md transition-transform hover:scale-105"
        >
          <PlusSquare size={48} className="mb-2" />
          <span className="font-medium text-sm">Join</span>
        </button>

        <button 
          onClick={() => setIsScheduleOpen(true)}
          className="flex flex-col items-center justify-center bg-zoom-blue hover:bg-zoom-blue-hover text-white rounded-2xl p-6 shadow-md transition-transform hover:scale-105"
        >
          <Calendar size={48} className="mb-2" />
          <span className="font-medium text-sm">Schedule</span>
        </button>
      </div>

      <ScheduleModal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} />
      <JoinModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </>
  );
}
