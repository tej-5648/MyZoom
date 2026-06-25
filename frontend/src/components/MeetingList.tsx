'use client';
import { useEffect, useState } from 'react';
import { format, isPast, parseISO } from 'date-fns';
import { Clock, MoreHorizontal } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  description: string;
  start_time: string;
  duration: number;
}

export default function MeetingList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/meetings`)
      .then(res => res.json())
      .then(data => {
        setMeetings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-gray-500">Loading meetings...</div>;

  const upcoming = meetings.filter(m => !isPast(parseISO(m.start_time))).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const recent = meetings.filter(m => isPast(parseISO(m.start_time))).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()).slice(0, 5);

  const MeetingCard = ({ meeting, isUpcoming }: { meeting: Meeting, isUpcoming: boolean }) => {
    const dateObj = parseISO(meeting.start_time);
    const timeFormatted = format(dateObj, 'h:mm a');
    const dateFormatted = format(dateObj, 'EEE, MMM d');

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between mb-3 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
          <div className="flex items-center space-x-2 text-gray-800 w-32 shrink-0">
            <Clock size={16} className="text-gray-400" />
            <span className="font-semibold text-sm">{timeFormatted}</span>
          </div>
          <div className="mt-2 sm:mt-0">
            <h3 className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{meeting.title}</h3>
            {meeting.description && <p className="text-sm text-gray-600 line-clamp-1 max-w-[200px] sm:max-w-xs mt-0.5">{meeting.description}</p>}
            <p className="text-sm text-gray-500 mt-1">{dateFormatted} &bull; ID: {meeting.id.slice(0,3)} {meeting.id.slice(3,6)} {meeting.id.slice(6)}</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button 
            onClick={() => window.location.href = `/meeting/${meeting.id}?name=Host`}
            className="px-4 py-1.5 bg-zoom-blue text-white text-sm font-medium rounded-full hover:bg-zoom-blue-hover transition"
          >
            Start
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setActiveDropdown(activeDropdown === meeting.id ? null : meeting.id)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
            >
              <MoreHorizontal size={20} />
            </button>
            
            {activeDropdown === meeting.id && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setActiveDropdown(null)}
                ></div>
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-20 py-1 text-sm text-gray-700 animate-in fade-in zoom-in duration-100">
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      navigator.clipboard.writeText(`http://localhost:3000/meeting/${meeting.id}`);
                      alert('Invite link copied to clipboard!');
                      setActiveDropdown(null);
                    }}
                  >
                    Copy Link
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    onClick={() => {
                      alert('Delete functionality is not implemented yet.');
                      setActiveDropdown(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          Upcoming Meetings
          <span className="ml-3 bg-blue-100 text-zoom-blue text-xs font-bold px-2 py-0.5 rounded-full">{upcoming.length}</span>
        </h2>
        {upcoming.length > 0 ? (
          upcoming.map(m => <MeetingCard key={m.id} meeting={m} isUpcoming={true} />)
        ) : (
          <p className="text-gray-500 text-sm">No upcoming meetings.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-6">Recent Meetings</h2>
        {recent.length > 0 ? (
          recent.map(m => <MeetingCard key={m.id} meeting={m} isUpcoming={false} />)
        ) : (
          <p className="text-gray-500 text-sm">No recent meetings.</p>
        )}
      </div>
    </div>
  );
}
