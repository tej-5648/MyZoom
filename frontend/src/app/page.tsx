'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { format } from 'date-fns';
import { 
  Home as HomeIcon, Video, MessageSquare, LayoutGrid, Calendar, MoreHorizontal, 
  Search, Bell, Sparkles, User, Settings, Sun, Moon, Monitor, 
  FileText, PenTool, Film, CheckSquare, File, Mail, Grid, Users, Plus, Upload, BookOpen, Clock, ChevronDown, ChevronRight, Share, FileSignature, X, Presentation
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  const [activeTab, setActiveTab] = useState<'home' | 'meetings' | 'chat' | 'hub' | 'scheduler'>('home');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Time logic for Home tab
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">Loading...</div>;
  }

  const handleCreateMeeting = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: `${user?.username || 'Guest'}'s Zoom Meeting`,
          start_time: new Date().toISOString(),
          duration: 60,
          is_instant: true
        })
      });
      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok) throw new Error('Backend failed');
      const data = await response.json();
      if (data && data.id) {
        router.push(`/meeting/${data.id}`);
      } else {
        throw new Error('No ID returned');
      }
    } catch (err) {
      console.error(err);
      // Fallback
      const randomId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      router.push(`/meeting/${randomId}`);
    }
  };

  const handleJoinMeeting = () => {
    const id = prompt('Enter Meeting ID:');
    if (id) {
      router.push(`/meeting/${id.replace(/\s/g, '')}`);
    }
  };

  // ----------------------------------------------------
  // SUBCOMPONENTS for Tabs
  // ----------------------------------------------------
  const HomeTab = () => (
    <div className="flex-1 flex bg-[#f8f9fa] dark:bg-[#121212] overflow-hidden">
      {/* Center Main Area */}
      <div className="flex-1 flex flex-col items-center pt-16 px-8 overflow-y-auto">
        <div className="text-center mb-10">
          <h1 className="text-[54px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight leading-none mb-2">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center space-x-12 mb-12">
          <button onClick={handleCreateMeeting} className="flex flex-col items-center group">
            <div className="w-[72px] h-[72px] rounded-3xl bg-[#f26d21] hover:bg-[#d95c18] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105 group-active:scale-95 mb-3">
              <Video size={36} className="ml-1" />
            </div>
            <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium flex items-center group-hover:text-[#0b5cff]">New meeting <ChevronDown size={14} className="ml-0.5 text-gray-400"/></span>
          </button>

          <button onClick={handleJoinMeeting} className="flex flex-col items-center group">
            <div className="w-[72px] h-[72px] rounded-3xl bg-[#0b5cff] hover:bg-[#0947c9] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105 group-active:scale-95 mb-3">
              <Plus size={40} />
            </div>
            <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium group-hover:text-[#0b5cff]">Join</span>
          </button>

          <button onClick={() => setActiveTab('scheduler')} className="flex flex-col items-center group">
            <div className="w-[72px] h-[72px] rounded-3xl bg-[#0b5cff] hover:bg-[#0947c9] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105 group-active:scale-95 mb-3">
              <Calendar size={32} />
            </div>
            <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium group-hover:text-[#0b5cff]">Schedule</span>
          </button>

          <button onClick={() => alert("Share screen functionality coming soon!")} className="flex flex-col items-center group">
            <div className="w-[72px] h-[72px] rounded-3xl bg-[#0b5cff] hover:bg-[#0947c9] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105 group-active:scale-95 mb-3">
              <Upload size={32} />
            </div>
            <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium group-hover:text-[#0b5cff]">Share screen</span>
          </button>

          <button onClick={() => alert("My notes feature coming soon!")} className="flex flex-col items-center relative group">
            <div className="w-[72px] h-[72px] rounded-3xl bg-[#0b5cff] hover:bg-[#0947c9] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105 group-active:scale-95 mb-3 relative">
              <div className="absolute -top-2.5 -right-2 bg-white dark:bg-gray-800 text-[#0b5cff] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm z-10">NEW</div>
              <PenTool size={32} />
            </div>
            <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium group-hover:text-[#0b5cff]">My notes</span>
          </button>
        </div>

        {/* Meetings Card */}
        <div className="w-full max-w-[600px] bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="bg-[#eef4ff] dark:bg-blue-900/20 px-4 py-3 border-b border-blue-100 dark:border-blue-900/30 flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-[#0b5cff] text-white flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold font-serif">i</span></div>
            <p className="text-[13px] text-[#0947c9] dark:text-blue-300 leading-tight">You haven't connected your calendar yet. <a href="#" className="font-semibold underline">Connect now</a> to manage all your meetings and events in one place.</p>
            <button className="text-blue-500 hover:text-blue-700 shrink-0"><X size={16}/></button>
          </div>
          
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Plus size={18}/></button>
            <button className="flex items-center space-x-1.5 text-[13px] font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition">
              <Calendar size={14} className="text-gray-500"/>
              <span>Today, {format(currentTime, 'MMM d')}</span>
              <ChevronDown size={14} className="text-gray-500"/>
            </button>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><MoreHorizontal size={18}/></button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-48 h-48 mb-4 relative opacity-50 dark:opacity-30">
               {/* Minimalist illustration placeholder */}
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-2 rounded-[100%] bg-gray-200 dark:bg-gray-700"></div>
               <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rotate-12 origin-bottom">
                 <div className="w-1 h-24 bg-gray-300 dark:bg-gray-600"></div>
                 <div className="absolute top-0 -left-12 w-24 h-6 bg-blue-200 dark:bg-blue-800 rounded-t-full -rotate-12 transform origin-bottom border-b-2 border-white dark:border-gray-800"></div>
               </div>
            </div>
            <p className="text-[15px] font-medium text-gray-700 dark:text-gray-300 mb-1">No meetings scheduled.</p>
            <button className="text-[14px] text-[#0b5cff] font-medium hover:underline flex items-center"><Plus size={16} className="mr-1"/> Schedule a meeting</button>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <button className="text-[13px] text-gray-600 dark:text-gray-400 font-medium flex items-center hover:text-gray-900 dark:hover:text-white">Open recordings <ChevronRight size={14} className="ml-1"/></button>
          </div>
        </div>
      </div>

      {/* AI Companion Right Sidebar */}
      <div className="w-[320px] bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
           <h3 className="text-[14px] font-semibold text-gray-800 dark:text-gray-200 flex items-center">
             AI Companion <span className="ml-2 bg-[#9333ea] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider">BASIC</span>
           </h3>
           <div className="flex space-x-2 text-gray-400">
             <Bell size={18} className="hover:text-gray-600 cursor-pointer"/>
             <PenTool size={18} className="hover:text-gray-600 cursor-pointer"/>
           </div>
        </div>
        
        <div className="p-4">
          <div className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-2 text-center flex justify-between items-center text-[13px] font-medium text-[#0b5cff] dark:text-blue-400 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20 transition">
            See what's included <X size={14} className="text-gray-400 hover:text-gray-600"/>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-center">
           <div className="w-16 h-16 mb-8 text-[#0b5cff] animate-pulse relative">
             <Sparkles size={64} className="opacity-80"/>
             <Sparkles size={32} className="absolute -top-2 -right-2 text-purple-400"/>
           </div>
           
           <div className="grid grid-cols-2 gap-3 w-full">
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-[12px] text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition shadow-sm leading-tight flex items-center">
               What are some tips for running a Zoom meeting
             </div>
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-[12px] text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition shadow-sm leading-tight flex items-center">
               Coordinate meetings with external contacts
             </div>
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-[12px] text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition shadow-sm leading-tight flex items-center">
               Schedule a meeting with <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 rounded ml-1">contact</span>
             </div>
             <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl p-3 text-[12px] text-gray-600 dark:text-gray-300 hover:border-purple-300 cursor-pointer transition shadow-sm leading-tight flex items-center relative overflow-hidden">
               Tell me what I can do with Zoom AI
               <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#0b5cff] to-[#9333ea]"></div>
             </div>
           </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
           <div className="text-right mb-2">
             <a href="#" className="text-[12px] text-[#0b5cff] font-medium hover:underline flex items-center justify-end">Try on the web <Share size={12} className="ml-1"/></a>
           </div>
           <div className="relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
               <FileSignature size={16}/>
             </div>
             <input type="text" placeholder="Write a message or type / for more" className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full pl-10 pr-10 py-2.5 text-[13px] outline-none focus:border-[#0b5cff] focus:ring-1 focus:ring-[#0b5cff] transition text-gray-800 dark:text-gray-200" />
             <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
               ↑
             </button>
           </div>
           <p className="text-center text-[10px] text-gray-400 mt-2">AI can make mistakes. Review for accuracy.</p>
        </div>
      </div>
    </div>
  );

  const TeamChatTab = () => (
    <div className="flex-1 flex bg-white dark:bg-[#121212] overflow-hidden">
      <div className="w-[300px] border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center text-lg">Team Chat <ChevronDown size={16} className="ml-1 text-gray-500"/></h2>
          <button className="w-7 h-7 bg-[#0b5cff] hover:bg-[#0947c9] text-white rounded-lg flex items-center justify-center transition"><Plus size={16}/></button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex space-x-2">
          <button className="px-3 py-1 bg-[#0b5cff] text-white text-[13px] font-medium rounded-full">All</button>
          <button className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-[13px] font-medium rounded-full">@</button>
          <button className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-[13px] font-medium rounded-full"><MessageSquare size={14}/></button>
          <button className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-[13px] font-medium rounded-full"><Grid size={14}/></button>
          <button className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-[13px] font-medium rounded-full"><MoreHorizontal size={14}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-[13px] text-gray-600 dark:text-gray-300">
           <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer group"><ChevronRight size={14} className="mr-1 text-gray-400"/> Starred</div>
           <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer group"><ChevronRight size={14} className="mr-1 text-gray-400"/> Chats and channels</div>
           <div className="flex items-center px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer group"><ChevronRight size={14} className="mr-1 text-gray-400"/> Apps</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-[#1a1a1a]">
        <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 relative">
          <MessageSquare size={64} className="text-[#0b5cff] dark:text-blue-400 absolute" fill="currentColor"/>
          <MessageSquare size={48} className="text-blue-300 dark:text-blue-800 absolute -bottom-2 -left-2 opacity-50" fill="currentColor"/>
        </div>
        <p className="text-[15px] font-medium text-gray-600 dark:text-gray-400">Start chatting by clicking a chat in the left panel.</p>
      </div>
    </div>
  );

  const HubTab = () => (
    <div className="flex-1 flex bg-white dark:bg-[#121212] overflow-hidden">
      <div className="w-[240px] border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Hub</h2>
          <button className="w-7 h-7 bg-[#0b5cff] hover:bg-[#0947c9] text-white rounded-lg flex items-center justify-center transition"><Plus size={16}/></button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-2 relative">
            <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="Search" className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg pl-9 pr-3 py-1.5 text-[13px] outline-none"/>
          </div>
          <div className="px-2 space-y-0.5 text-[13px] font-medium text-gray-700 dark:text-gray-300">
             <div className="flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-[#0b5cff] dark:text-blue-400 rounded-lg cursor-pointer"><HomeIcon size={16} className="mr-3"/> Home</div>
             <div className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"><Bell size={16} className="mr-3 text-gray-400"/> Notifications</div>
             <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>
             <div className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"><Grid size={16} className="mr-3 text-gray-400"/> All files</div>
             <div className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"><File size={16} className="mr-3 text-gray-400"/> My files</div>
             <div className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"><Users size={16} className="mr-3 text-gray-400"/> Shared folders</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-12 px-8">
           <h1 className="text-4xl font-semibold text-center mb-10 text-gray-900 dark:text-white tracking-tight">Slide ideas that <span className="text-pink-500">move</span> people</h1>
           
           <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm mb-12 relative flex items-center px-4 py-3">
             <span className="text-gray-400 text-sm">Create a slide deck to pitch the ideas discussed in the meetings...</span>
             <button className="absolute right-3 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition"><Upload size={16}/></button>
           </div>
           
           <div className="flex items-center space-x-4 mb-8 text-[13px]">
             <button className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"><Plus size={16}/></button>
             <button className="flex items-center text-gray-600 dark:text-gray-300 font-medium"><Grid size={16} className="mr-1.5"/> All sources</button>
             <button className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-[#0b5cff] dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium"><LayoutGrid size={14} className="mr-1.5"/> Slides <ChevronDown size={14} className="ml-1"/></button>
           </div>
           
           <div className="flex justify-center space-x-10 mb-16">
             {[
               { icon: FileText, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30', label: 'Canvas' },
               { icon: LayoutGrid, color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30', label: 'Slides', new: true },
               { icon: Grid, color: 'text-green-500 bg-green-100 dark:bg-green-900/30', label: 'Sheets', new: true },
               { icon: File, color: 'text-blue-400 bg-blue-100 dark:bg-blue-900/30', label: 'Paper', new: true },
               { icon: BookOpen, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30', label: 'Data tables' },
               { icon: Presentation, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30', label: 'Whiteboards' },
               { icon: MoreHorizontal, color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', label: 'More' },
             ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center cursor-pointer group relative">
                  {item.new && <span className="absolute -top-3 -right-2 bg-blue-100 dark:bg-blue-900 text-[#0b5cff] dark:text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-gray-900 z-10">NEW</span>}
                  <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-sm`}>
                    <item.icon size={24} />
                  </div>
                  <span className={`text-[13px] font-medium ${item.label === 'Slides' ? 'text-pink-500' : 'text-gray-700 dark:text-gray-300'}`}>{item.label}</span>
                </div>
             ))}
           </div>
           
           <div>
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recent files</h3>
               <button className="text-[13px] text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center">View all <ChevronRight size={14}/></button>
             </div>
             <div className="h-48 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-sm">
               No recent files
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  const SchedulerTab = () => (
    <div className="flex-1 flex bg-[#f8f9fa] dark:bg-[#121212] overflow-hidden justify-center py-12">
      <div className="max-w-4xl w-full px-8">
        <div className="text-center mb-8">
           <h2 className="text-[#0b5cff] font-bold text-2xl flex items-center justify-center tracking-tight mb-2">zoom <span className="text-gray-900 dark:text-white ml-2 font-semibold">Scheduler</span></h2>
           <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">Let others book time with you easily</h1>
           <p className="text-gray-500 text-[15px] max-w-lg mx-auto mb-6">Schedule meetings without back-and-forth emails. Share your booking page and let others choose a time that works for both sides.</p>
           <button className="bg-[#0b5cff] hover:bg-[#0947c9] text-white font-medium px-6 py-2.5 rounded-lg shadow-md transition">Create booking page</button>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex">
           <div className="w-[300px] border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col">
             <div className="flex items-center space-x-3 mb-6">
               <div className="w-10 h-10 bg-green-900 rounded-full flex items-center justify-center text-white font-bold">{user.username.charAt(0).toUpperCase()}</div>
               <span className="font-medium text-gray-800 dark:text-gray-200">{user.username}</span>
             </div>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">30 mins with {user.username}</h3>
             <p className="text-gray-500 text-[13px] mb-6 leading-relaxed">Schedule a 30-minute chat with {user.username} at a time that works best for you.</p>
             <div className="space-y-3 text-[13px] text-gray-600 dark:text-gray-400 font-medium">
               <div className="flex items-center"><Clock size={16} className="mr-3"/> 30 mins</div>
               <div className="flex items-center"><User size={16} className="mr-3"/> One to one</div>
               <div className="flex items-center"><Video size={16} className="mr-3"/> Zoom meeting</div>
             </div>
           </div>
           <div className="flex-1 p-8">
             <div className="grid grid-cols-4 gap-4 text-center">
                {['Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                  <div key={day}>
                    <div className="text-[13px] text-gray-500 mb-1">{day}</div>
                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-[15px] font-semibold mb-6 ${i === 0 ? 'bg-[#0b5cff] text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                      {25 + i}
                    </div>
                    <div className="space-y-2">
                       {['09:00', '09:30', '10:00', '10:30', '11:30', '12:00', '12:30'].map(time => (
                         <button key={time} className="w-full py-2 border border-blue-200 dark:border-blue-800/50 text-[#0b5cff] dark:text-blue-400 text-[13px] font-medium rounded-lg hover:border-[#0b5cff] transition">{time}</button>
                       ))}
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );


  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <div className="h-screen w-full flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      
      {/* Top Header Bar */}
      <header className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-[#f8f9fa] dark:bg-[#1a1a1a] shrink-0 z-20">
        <div className="flex items-center space-x-2">
          {/* Mac window controls mock */}
          <div className="flex space-x-2 mr-6 opacity-50">
             <div className="w-3 h-3 rounded-full bg-red-400"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
             <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
        </div>

        <div className="flex-1 flex justify-center max-w-xl">
           <div className="w-[500px] bg-gray-200/60 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-800 transition rounded-md flex items-center px-3 py-1.5 border border-transparent focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-gray-900 text-sm">
              <Search size={14} className="text-gray-500 mr-2" />
              <input type="text" placeholder="Search (Ctrl+E)" className="bg-transparent border-none outline-none w-full text-gray-700 dark:text-gray-200 text-[13px]" />
           </div>
        </div>

        <div className="flex items-center space-x-4">
           <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 relative">
             <Bell size={18} />
             <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
           </button>
           <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
             <Calendar size={18} />
           </button>
           <button className="text-[#0b5cff] hover:text-[#0947c9]">
             <Sparkles size={18} />
           </button>
           
           <div className="relative">
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm ml-2">
               {user.username.charAt(0).toUpperCase()}
               <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
             </button>
             {showProfileMenu && (
               <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 text-sm z-50">
                 <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 font-medium">{user.username}</div>
                 <button onClick={() => { setShowSettingsModal(true); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</button>
                 <button onClick={() => { logout(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">Sign Out</button>
               </div>
             )}
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Sidebar */}
        <nav className="w-[72px] bg-[#f8f9fa] dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 z-10 shrink-0">
          <div className="mb-6">
             <h2 className="text-[#0b5cff] font-bold text-lg leading-tight text-center">zoom<br/><span className="text-gray-800 dark:text-gray-200 text-[10px] uppercase font-semibold">Workplace</span></h2>
          </div>

          <div className="flex-1 w-full flex flex-col items-center space-y-2">
            {[
              { id: 'home', icon: HomeIcon, label: 'Home' },
              { id: 'meetings', icon: Video, label: 'Meetings' },
              { id: 'chat', icon: MessageSquare, label: 'Team Chat' },
              { id: 'hub', icon: LayoutGrid, label: 'Hub' },
              { id: 'scheduler', icon: Calendar, label: 'Scheduler' },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center justify-center w-14 h-[60px] rounded-xl transition ${activeTab === item.id ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-[#0b5cff]' : 'text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-300'}`}
              >
                <item.icon size={22} className="mb-1" strokeWidth={activeTab === item.id ? 2.5 : 2}/>
                <span className="text-[9px] font-medium tracking-tight">{item.label}</span>
              </button>
            ))}

            {/* More Menu Toggle */}
            <div className="relative w-full flex justify-center mt-2">
               <button 
                 onClick={() => setShowMoreMenu(!showMoreMenu)}
                 className={`flex flex-col items-center justify-center w-14 h-[60px] rounded-xl transition relative ${showMoreMenu ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-[#0b5cff]' : 'text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-300'}`}
               >
                 <span className="absolute top-0 right-1 bg-blue-100 text-[#0b5cff] border border-white text-[8px] font-bold px-1 rounded-full z-10 shadow-sm">NEW</span>
                 <MoreHorizontal size={22} className="mb-1" />
                 <span className="text-[9px] font-medium tracking-tight">More</span>
               </button>

               {/* More Menu Popup Modal anchored to sidebar */}
               {showMoreMenu && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)}></div>
                   <div className="absolute left-full ml-2 top-0 w-64 bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50">
                     <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                        {[
                          { icon: FileText, label: 'Docs', new: true },
                          { icon: Presentation, label: 'Whiteboards' },
                          { icon: Film, label: 'Clips' },
                          { icon: CheckSquare, label: 'Tasks' },
                          { icon: PenTool, label: 'Notes' },
                          { icon: Mail, label: 'Mail' },
                          { icon: LayoutGrid, label: 'Apps' },
                          { icon: Users, label: 'Contacts' },
                        ].map((mItem, idx) => (
                           <div key={idx} className="flex flex-col items-center cursor-pointer hover:opacity-80 transition relative">
                             {mItem.new && <span className="absolute -top-3 -right-1 bg-blue-100 text-[#0b5cff] text-[8px] font-bold px-1 rounded-full shadow-sm">NEW</span>}
                             <div className="w-10 h-10 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 mb-1.5 shadow-sm bg-gray-50 dark:bg-[#1a1a1a]">
                               <mItem.icon size={20} strokeWidth={1.5} />
                             </div>
                             <span className="text-[11px] text-gray-700 dark:text-gray-300">{mItem.label}</span>
                           </div>
                        ))}
                     </div>
                     <div className="mt-6 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-1">
                        <span className="text-[11px] text-gray-400">Drag to pin or remove</span>
                        <button className="text-[11px] text-[#0b5cff] font-medium">Reset</button>
                     </div>
                   </div>
                 </>
               )}
            </div>
          </div>

          <div className="mt-auto flex flex-col space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800 w-full items-center">
            <button onClick={() => setShowSettingsModal(true)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition">
              <Settings size={20} />
            </button>
          </div>
        </nav>

        {/* Dynamic Content Area */}
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'meetings' && (
          <div className="flex-1 flex bg-[#f8f9fa] dark:bg-[#121212] items-center justify-center">
            <div className="text-center">
              <Calendar size={64} className="mx-auto text-blue-200 dark:text-blue-900 mb-4" />
              <p className="text-gray-500">Meetings view under construction.</p>
            </div>
          </div>
        )}
        {activeTab === 'chat' && <TeamChatTab />}
        {activeTab === 'hub' && <HubTab />}
        {activeTab === 'scheduler' && <SchedulerTab />}

      </div>

      {/* Settings Modal (Appearance Tab) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
           <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-[800px] h-[600px] flex overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
              
              {/* Settings Sidebar */}
              <div className="w-[220px] bg-gray-50 dark:bg-[#121212] border-r border-gray-200 dark:border-gray-800 flex flex-col py-4">
                 <div className="px-4 mb-4">
                   <div className="relative">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input type="text" placeholder="Search" className="w-full bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-600 rounded-md pl-8 pr-2 py-1 text-[13px] outline-none" />
                   </div>
                 </div>
                 <div className="flex-1 overflow-y-auto px-2 space-y-0.5 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                    <div className="px-3 py-2 rounded-lg bg-[#0b5cff] text-white flex items-center shadow-sm cursor-pointer"><Settings size={16} className="mr-3"/> General</div>
                    <div className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center cursor-pointer"><Video size={16} className="mr-3 text-gray-400"/> Video & effects</div>
                    <div className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center cursor-pointer"><Monitor size={16} className="mr-3 text-gray-400"/> Audio</div>
                    <div className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center cursor-pointer"><Bell size={16} className="mr-3 text-gray-400"/> Notifications</div>
                 </div>
              </div>

              {/* Settings Content */}
              <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e]">
                 <div className="h-14 flex justify-between items-center px-6 border-b border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/10">
                    <span className="text-[13px] text-gray-600 dark:text-gray-400 font-medium">Upgrade to Zoom Workplace Pro to get unlimited meetings...</span>
                    <div className="flex items-center space-x-4">
                      <button className="bg-[#0b5cff] hover:bg-[#0947c9] text-white text-[13px] font-bold px-4 py-1.5 rounded-lg shadow-sm">Upgrade now</button>
                      <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Appearance</h2>
                    
                    {/* Color Mode */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6 bg-gray-50/30 dark:bg-transparent">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-[15px]">Color mode</h3>
                      <div className="flex space-x-6">
                        <button onClick={() => setTheme('light')} className="flex flex-col items-center group">
                          <div className={`w-32 h-20 rounded-lg border-2 flex flex-col p-2 transition ${theme === 'light' ? 'border-[#0b5cff] shadow-md shadow-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                            <div className="bg-gray-100 w-full h-full rounded flex items-start p-2"><div className="w-4 h-4 bg-white rounded-sm shadow-sm"></div></div>
                          </div>
                          <span className="text-[13px] font-medium mt-2 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">Light</span>
                        </button>
                        <button onClick={() => setTheme('dark')} className="flex flex-col items-center group">
                          <div className={`w-32 h-20 rounded-lg border-2 flex flex-col p-2 transition bg-[#2d2d2d] ${theme === 'dark' ? 'border-[#0b5cff] shadow-md shadow-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'}`}>
                            <div className="bg-[#1a1a1a] w-full h-full rounded flex items-start p-2"><div className="w-4 h-4 bg-[#3d3d3d] rounded-sm shadow-sm"></div></div>
                          </div>
                          <span className="text-[13px] font-medium mt-2 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">Dark</span>
                        </button>
                        <button onClick={() => setTheme('system')} className="flex flex-col items-center group">
                          <div className={`w-32 h-20 rounded-lg border-2 flex p-2 transition ${theme === 'system' ? 'border-[#0b5cff] shadow-md shadow-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                            <div className="bg-gray-100 w-1/2 h-full rounded-l border-r border-gray-300 flex p-1"><div className="w-3 h-3 bg-white rounded-sm"></div></div>
                            <div className="bg-[#1a1a1a] w-1/2 h-full rounded-r flex p-1"><div className="w-3 h-3 bg-[#3d3d3d] rounded-sm"></div></div>
                          </div>
                          <span className="text-[13px] font-medium mt-2 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">System setting</span>
                        </button>
                      </div>
                    </div>

                    {/* Theme Accent */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50/30 dark:bg-transparent">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-[15px]">Theme</h3>
                      <p className="text-[13px] text-gray-500 mb-4">Apply an accent color when using light mode.</p>
                      
                      <div className="flex space-x-6 mb-6">
                        {[
                          { id: 'classic', color: 'bg-gray-400', label: 'Classic' },
                          { id: 'bloom', color: 'bg-blue-800', label: 'Bloom' },
                          { id: 'agave', color: 'bg-teal-700', label: 'Agave' },
                          { id: 'rose', color: 'bg-rose-700', label: 'Rose' },
                        ].map(t => (
                          <button key={t.id} onClick={() => setAccentColor(t.id)} className="flex flex-col items-center group">
                            <div className={`w-12 h-12 rounded-xl p-1 border-2 transition ${accentColor === t.id ? 'border-[#0b5cff]' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
                               <div className={`w-full h-full rounded-lg ${t.color}`}></div>
                            </div>
                            <span className="text-[12px] font-medium mt-1 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">{t.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between items-center py-4 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-[14px] text-gray-800 dark:text-gray-200">Team Chat sidebar</span>
                        <select className="bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-[13px] outline-none">
                           <option>Light contrast</option>
                           <option>Dark contrast</option>
                        </select>
                      </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
