'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, MicOff, Video, VideoOff, Users, Share, MessageSquare, MoreHorizontal, 
  X, Send, Presentation, Shield, Sparkles, Hand, LayoutGrid, Captions, LayoutTemplate, BarChart3, Lock, UserX, Plus, Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function MeetingRoom({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{x: number, y: number} | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
  
  const displayName = user?.username || 'Guest';
  const [meetingValid, setMeetingValid] = useState<boolean | null>(null);
  const [meetingDetails, setMeetingDetails] = useState<any>(null);

  // Sidebars & Modals
  const [activeSidebar, setActiveSidebar] = useState<'participants' | 'chat' | 'ai' | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSecurityMenu, setShowSecurityMenu] = useState(false);
  const [showMeetingInfo, setShowMeetingInfo] = useState(false);

  // Chat & Participants
  const [messages, setMessages] = useState<{sender: string, text: string, time: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [participants, setParticipants] = useState<{id: string, name: string}[]>([]);

  // Features
  const [isRecording, setIsRecording] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Latest Features State
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [remoteScreenSharer, setRemoteScreenSharer] = useState<string | null>(null);
  const [remoteScreenSharerName, setRemoteScreenSharerName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'speaker' | 'gallery'>('speaker');
  const [showCaptions, setShowCaptions] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [captionText, setCaptionText] = useState("Live captions will appear here...");

  // Polls State
  const [showPolls, setShowPolls] = useState(false);
  const [pollDraft, setPollDraft] = useState({ question: '', options: ['', ''] });
  const [activePoll, setActivePoll] = useState<{id: string, question: string, options: string[]} | null>(null);
  const [pollResults, setPollResults] = useState<Record<number, number>>({});
  const [hasVoted, setHasVoted] = useState(false);

  // WebRTC & WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/meetings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Meeting not found");
        return res.json();
      })
      .then((data) => {
        setMeetingDetails(data);
        setMeetingValid(true);
      })
      .catch(() => setMeetingValid(false));
  }, [id]);

  useEffect(() => {
    if (!meetingValid || !user) return;

    // Start local media
    async function setupMedia() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(userStream);
        streamRef.current = userStream;
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        // Ensure UI represents that media is off if permission denied
        setIsMuted(true);
        setIsVideoOff(true);
      }
    }
    setupMedia();

    // Connect WebSocket
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/meeting/${id}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'join', name: displayName, userId: user.id }));
        }
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'sync-participants') {
          setParticipants(data.participants);
        } else if (data.type === 'chat-message') {
          setMessages(prev => [...prev, data.message]);
        } else if (data.type === 'reaction') {
          setCurrentReaction(data.emoji);
          setTimeout(() => setCurrentReaction(null), 4000);
        } else if (data.type === 'raise-hand') {
          setRaisedHands(prev => {
            const next = new Set(prev);
            if (data.isRaised) next.add(data.userId.toString());
            else next.delete(data.userId.toString());
            return next;
          });
        } else if (data.type === 'screen-share-start') {
          if (data.userId?.toString() !== user?.id?.toString()) {
            setRemoteScreenSharer(data.userId.toString());
            setRemoteScreenSharerName(data.name);
          }
        } else if (data.type === 'screen-share-stop') {
          if (data.userId?.toString() !== user?.id?.toString()) {
            setRemoteScreenSharer(null);
            setRemoteScreenSharerName(null);
            setRemoteScreenStream(null);
          }
        } else if (data.type === 'webrtc-offer') {
          if (data.targetId?.toString() === user?.id?.toString()) {
            const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            peerConnectionsRef.current[data.senderId?.toString()] = peerConnection;

            peerConnection.ontrack = (event) => {
              setRemoteScreenStream(event.streams[0]);
            };

            peerConnection.onicecandidate = (event) => {
              if (event.candidate && wsRef.current) {
                wsRef.current.send(JSON.stringify({ type: 'webrtc-ice-candidate', targetId: data.senderId, senderId: user?.id, candidate: event.candidate }));
              }
            };

            peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer)).then(() => {
              return peerConnection.createAnswer();
            }).then((answer) => {
              return peerConnection.setLocalDescription(answer);
            }).then(() => {
              if (wsRef.current) {
                wsRef.current.send(JSON.stringify({ type: 'webrtc-answer', targetId: data.senderId, senderId: user?.id, answer: peerConnection.localDescription }));
              }
            });
          }
        } else if (data.type === 'webrtc-answer') {
          if (data.targetId?.toString() === user?.id?.toString()) {
            const pc = peerConnectionsRef.current[data.senderId?.toString()];
            if (pc) {
              pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
          }
        } else if (data.type === 'webrtc-ice-candidate') {
          if (data.targetId?.toString() === user?.id?.toString()) {
            const pc = peerConnectionsRef.current[data.senderId?.toString()];
            if (pc) {
              pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          }
        } else if (data.type === 'whiteboard-toggle') {
          if (data.userId !== user?.id) {
            setShowWhiteboard(data.isOpen);
          }
        } else if (data.type === 'whiteboard-clear') {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        } else if (data.type === 'whiteboard-draw') {
          if (data.userId !== user?.id) {
             const canvas = canvasRef.current;
             if (canvas) {
               const ctx = canvas.getContext('2d');
               if (ctx) {
                 ctx.beginPath();
                 ctx.moveTo(data.x0, data.y0);
                 ctx.lineTo(data.x1, data.y1);
                 ctx.lineWidth = 3;
                 ctx.lineCap = 'round';
                 ctx.strokeStyle = '#222';
                 ctx.stroke();
               }
             }
          }
        } else if (data.type === 'mute-all') {
          if (meetingDetails && meetingDetails.host_id !== user.id) {
            if (streamRef.current) {
              streamRef.current.getAudioTracks().forEach(track => track.enabled = false);
            }
            setIsMuted(true);
          }
        } else if (data.type === 'remove-participant') {
          if (data.targetId?.toString() === user?.id?.toString()) {
            alert('You have been removed by the host.');
            window.location.href = '/';
          }
        } else if (data.type === 'poll-start') {
          setActivePoll(data.poll);
          setPollResults({});
          setHasVoted(false);
          setShowPolls(true);
        } else if (data.type === 'poll-vote') {
          setPollResults(prev => ({
            ...prev,
            [data.optionIndex]: (prev[data.optionIndex] || 0) + 1
          }));
        }
      };
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (ws) {
        ws.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingValid, id, user, meetingDetails]);

  useEffect(() => {
    if (activeSidebar === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSidebar]);

  useEffect(() => {
    if (showCaptions) {
      const interval = setInterval(() => {
        const phrases = ["Hello everyone, let's get started.", "Can you see my screen?", "The new features look amazing.", "We need to focus on performance.", "Great meeting everyone!"];
        setCaptionText(phrases[Math.floor(Math.random() * phrases.length)]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [showCaptions]);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const startScreenShare = async () => {
    if (isScreenSharing) {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(userStream);
        streamRef.current = userStream;
        if (videoRef.current) videoRef.current.srcObject = userStream;
        setIsScreenSharing(false);
        setIsVideoOff(false);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'screen-share-stop', userId: user?.id }));
        }
        Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        peerConnectionsRef.current = {};
      } catch (err) {}
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (stream) stream.getVideoTracks().forEach(track => track.stop());
      const audioTracks = stream ? stream.getAudioTracks() : [];
      const newStream = new MediaStream([...displayStream.getVideoTracks(), ...audioTracks]);
      
      setStream(newStream);
      streamRef.current = newStream;
      if (videoRef.current) videoRef.current.srcObject = newStream;
      setIsScreenSharing(true);
      setIsVideoOff(false);
      setShowWhiteboard(false);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'screen-share-start', userId: user?.id, name: displayName }));
        participants.forEach(p => {
          if (p.id?.toString() !== user?.id?.toString()) {
            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            peerConnectionsRef.current[p.id?.toString()] = pc;
            newStream.getTracks().forEach(track => pc.addTrack(track, newStream));
            
            pc.onicecandidate = (event) => {
              if (event.candidate && wsRef.current) {
                wsRef.current.send(JSON.stringify({ type: 'webrtc-ice-candidate', targetId: p.id, senderId: user?.id, candidate: event.candidate }));
              }
            };
            
            pc.createOffer().then(offer => pc.setLocalDescription(offer)).then(() => {
              if (wsRef.current) {
                wsRef.current.send(JSON.stringify({ type: 'webrtc-offer', targetId: p.id, senderId: user?.id, offer: pc.localDescription }));
              }
            });
          }
        });
      }
    } catch (err) {}
  };

  const leaveMeeting = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    router.push('/');
  };

  const toggleSidebar = (sidebar: 'participants' | 'chat' | 'ai') => {
    setActiveSidebar(activeSidebar === sidebar ? null : sidebar);
  };

  const sendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const newMsg = {
      sender: displayName,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    wsRef.current.send(JSON.stringify({ type: 'chat-message', message: newMsg }));
    setChatInput('');
  };

  const triggerReaction = (emoji: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reaction', emoji }));
    }
    setShowMoreMenu(false);
  };

  const toggleHand = () => {
    setIsHandRaised(!isHandRaised);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'raise-hand', userId: user?.id, isRaised: !isHandRaised }));
    }
  };

  const muteAll = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mute-all' }));
    }
    setShowMoreMenu(false);
  };

  // Polls
  const handleLaunchPoll = () => {
    if (!pollDraft.question.trim() || pollDraft.options.some(o => !o.trim())) return;
    const pollId = Date.now().toString();
    const newPoll = { id: pollId, question: pollDraft.question, options: pollDraft.options };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'poll-start', poll: newPoll }));
    }
  };

  const handleVote = (index: number) => {
    if (hasVoted) return;
    setHasVoted(true);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'poll-vote', pollId: activePoll?.id, optionIndex: index }));
    }
  };

  // Whiteboard
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    lastPosRef.current = { x, y };
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#222';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (lastPosRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'whiteboard-draw',
        userId: user?.id,
        x0: lastPosRef.current.x,
        y0: lastPosRef.current.y,
        x1: x,
        y1: y
      }));
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPosRef.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const clearWhiteboard = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'whiteboard-clear', userId: user?.id }));
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (meetingValid === null) {
    return <div className="h-screen bg-black flex items-center justify-center text-white">Connecting...</div>;
  }

  if (meetingValid === false || !user) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
        <h1 className="text-2xl font-semibold">{!user ? 'Please Log In' : 'Invalid Meeting ID'}</h1>
        <button onClick={() => router.push('/')} className="px-6 py-2 bg-zoom-blue rounded-lg">Return to Home</button>
      </div>
    );
  }

  const isHost = meetingDetails?.host_id === user.id;

  return (
    <div className="h-screen bg-[#111111] flex flex-col font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 bg-[#1a1a1a] flex items-center justify-between px-4 text-white text-sm z-40 relative border-b border-gray-800">
        <div className="relative">
          <button onClick={() => setShowMeetingInfo(!showMeetingInfo)} className="flex items-center space-x-2 hover:bg-gray-800 px-3 py-1.5 rounded transition">
            <Shield size={16} className="text-green-500" />
            <span className="font-semibold tracking-tight">Zoom Clone</span>
          </button>
          
          {showMeetingInfo && meetingDetails && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMeetingInfo(false)}></div>
              <div className="absolute top-10 left-2 bg-white text-gray-800 rounded-lg shadow-xl w-80 p-5 z-50">
                <h2 className="text-xl font-semibold mb-4 text-center">{meetingDetails.title}</h2>
                <div className="space-y-3 text-sm">
                  <p className="flex"><span className="text-gray-500 w-24 font-medium shrink-0">Meeting ID:</span> <span className="font-semibold">{id.slice(0,3)} {id.slice(3,6)} {id.slice(6)}</span></p>
                  <p className="flex"><span className="text-gray-500 w-24 font-medium shrink-0">Host:</span> <span className="font-semibold">{meetingDetails.host_name}</span></p>
                  <p className="flex"><span className="text-gray-500 w-24 font-medium shrink-0">Passcode:</span> <span className="font-mono bg-gray-100 px-1 rounded">123456</span></p>
                  <p className="flex">
                    <span className="text-gray-500 w-24 font-medium shrink-0">Invite Link:</span> 
                    <a href={typeof window !== 'undefined' ? `${window.location.origin}/meeting/${id}` : `http://localhost:3000/meeting/${id}`} className="text-zoom-blue hover:underline truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/meeting/${id}` : `http://localhost:3000/meeting/${id}`}
                    </a>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex space-x-2">
          <button onClick={() => setViewMode(viewMode === 'speaker' ? 'gallery' : 'speaker')} className="flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition">
            <LayoutGrid size={14} />
            <span>View</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {showWhiteboard ? (
          <div className={`flex-1 flex flex-col p-4 justify-center items-center relative transition-all duration-300 ${activeSidebar ? 'mr-[320px]' : ''}`}>
             <div className="w-full h-full max-w-6xl max-h-[85vh] bg-white rounded-lg overflow-hidden shadow-2xl relative flex flex-col border border-gray-800">
               <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b border-gray-300">
                 <div className="flex items-center space-x-2">
                   <div className="bg-blue-500 text-white p-1 rounded"><Presentation size={16} /></div>
                   <span className="font-semibold text-gray-700">Zoom Whiteboard</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <button onClick={clearWhiteboard} className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-1.5 rounded-lg text-gray-700 font-medium">Clear Canvas</button>
                   <button onClick={() => {
                     setShowWhiteboard(false);
                     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                       wsRef.current.send(JSON.stringify({ type: 'whiteboard-toggle', userId: user?.id, isOpen: false }));
                     }
                   }} className="text-sm bg-red-100 hover:bg-red-200 px-4 py-1.5 rounded-lg text-red-700 font-medium border border-red-200">Close</button>
                 </div>
               </div>
               <div className="flex-1 relative cursor-crosshair">
                 <canvas ref={canvasRef} width={1200} height={800} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} className="w-full h-full block" style={{ touchAction: 'none' }} />
               </div>
             </div>
             
             {!isVideoOff && stream && (
               <div className="absolute top-8 right-8 w-48 aspect-video bg-black rounded-lg shadow-2xl border-2 border-gray-800 overflow-hidden z-30">
                 <video autoPlay playsInline muted className="w-full h-full object-cover" ref={pip => { if (pip && stream) pip.srcObject = stream }} />
               </div>
             )}
          </div>
        ) : (
          <div className={`flex-1 flex p-4 justify-center items-center relative transition-all duration-300 ${activeSidebar ? 'mr-[320px]' : ''}`}>
            
            {/* Gallery vs Speaker Layout Logic */}
            {viewMode === 'gallery' ? (
               <div className="w-full h-full grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-fr">
                 {/* Local User */}
                 <div className="bg-black rounded-lg overflow-hidden shadow-xl border border-gray-800 relative w-full h-full max-h-[300px]">
                   <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`} />
                   {isVideoOff && (
                     <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                       <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</div>
                     </div>
                   )}
                   <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-white text-xs backdrop-blur-sm flex items-center">
                     <span className="font-medium truncate max-w-[150px]">{displayName}</span>
                     {isMuted && <MicOff size={12} className="ml-2 text-red-500" />}
                   </div>
                   {isHandRaised && <div className="absolute top-3 left-3 bg-blue-500 text-white p-1 rounded shadow-lg"><Hand size={16} fill="white" /></div>}
                 </div>
                 
                 {/* Fake Remote Users for Gallery Demo */}
                 {participants.filter(p => p.id !== user.id.toString()).map((p, idx) => (
                    <div key={idx} className="bg-gray-900 rounded-lg overflow-hidden shadow-xl border border-gray-800 relative w-full h-full max-h-[300px] flex items-center justify-center">
                      <div className="w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center text-2xl font-bold text-white">{p.name.charAt(0).toUpperCase()}</div>
                      <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-white text-xs backdrop-blur-sm flex items-center">
                        <span className="font-medium truncate max-w-[150px]">{p.name}</span>
                        <MicOff size={12} className="ml-2 text-red-500" />
                      </div>
                      {raisedHands.has(p.id) && <div className="absolute top-3 left-3 bg-blue-500 text-white p-1 rounded shadow-lg"><Hand size={16} fill="white" /></div>}
                    </div>
                 ))}
               </div>
            ) : (
              // Speaker View
              <div className={`relative w-full max-w-5xl ${isScreenSharing ? 'aspect-video max-w-full' : 'aspect-video'} bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800`}>
                {remoteScreenSharer ? (
                  remoteScreenStream ? (
                    <video 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-contain" 
                      ref={vid => { if (vid) vid.srcObject = remoteScreenStream; }} 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] text-white space-y-4">
                      <Presentation size={64} className="text-zoom-blue animate-pulse" />
                      <h2 className="text-2xl font-medium tracking-wide">Connecting to {remoteScreenSharerName}&apos;s Screen...</h2>
                    </div>
                  )
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`} />
                    {isVideoOff && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</div>
                      </div>
                    )}
                  </>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded text-white text-sm backdrop-blur-sm flex items-center shadow-lg">
                  <span className="font-medium truncate max-w-[200px]">{displayName}</span>
                  {isScreenSharing && <span className="ml-1 text-gray-300 italic">(Screen Sharing)</span>} 
                  {isMuted && <MicOff size={14} className="ml-2 text-red-500" />}
                </div>
                {isHandRaised && (
                  <div className="absolute top-4 left-4 bg-blue-500 text-white p-2 rounded shadow-lg animate-pulse">
                    <Hand size={24} fill="white" />
                  </div>
                )}
              </div>
            )}
            
            {/* Overlay Elements */}
            {currentReaction && (
              <div className="absolute top-1/4 right-1/4 text-[80px] animate-bounce z-20 drop-shadow-2xl pointer-events-none">{currentReaction}</div>
            )}

            {/* Captions Overlay */}
            {showCaptions && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg border border-gray-700 text-white text-lg font-medium shadow-2xl z-30 max-w-2xl text-center">
                <span className="text-zoom-blue mr-2">Speaker:</span> {captionText}
              </div>
            )}
          </div>
        )}

        {/* Unified Sidebar Area */}
        {activeSidebar && (
          <div className="absolute right-0 top-0 bottom-0 w-[320px] bg-white border-l border-gray-200 flex flex-col z-20 shadow-2xl animate-in slide-in-from-right">
            <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50 text-gray-800">
              <h3 className="font-semibold flex items-center space-x-2">
                {activeSidebar === 'participants' && <><Users size={16}/> <span>Participants ({participants.length})</span></>}
                {activeSidebar === 'chat' && <><MessageSquare size={16}/> <span>In-Meeting Chat</span></>}
                {activeSidebar === 'ai' && <><Sparkles size={16} className="text-purple-500"/> <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">AI Companion</span></>}
              </h3>
              <button onClick={() => setActiveSidebar(null)} className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition"><X size={18} /></button>
            </div>
            
            {/* Participants Panel */}
            {activeSidebar === 'participants' && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-2">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2.5 px-3 hover:bg-gray-50 rounded-lg transition group border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center font-bold text-zoom-blue text-sm border border-blue-200 shadow-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-800">
                            {p.name} 
                            {p.id === user?.id?.toString() && <span className="text-gray-400 font-normal ml-1">(Me)</span>}
                          </p>
                          {p.id === meetingDetails?.host_id?.toString() && <span className="text-green-600 font-medium text-[10px] tracking-wide uppercase">Host</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {raisedHands.has(p.id) && <Hand size={16} className="text-blue-500 fill-blue-500" />}
                        {meetingDetails?.host_id?.toString() === user?.id?.toString() && p.id !== user?.id?.toString() && (
                          <button 
                            onClick={() => {
                              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                                wsRef.current.send(JSON.stringify({ type: 'remove-participant', targetId: p.id }));
                              }
                            }}
                            className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded hidden group-hover:block transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {meetingDetails?.host_id?.toString() === user?.id?.toString() && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between">
                    <button 
                      onClick={() => {
                        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                          wsRef.current.send(JSON.stringify({ type: 'mute-all' }));
                        }
                      }}
                      className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition"
                    >
                      Mute All
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Chat Panel */}
            {activeSidebar === 'chat' && (
              <div className="flex-1 flex flex-col bg-gray-50">
                <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                      <MessageSquare size={32} opacity={0.5} />
                      <p className="text-sm">No messages yet. Start chatting!</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === displayName ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline space-x-2 mb-1">
                        <span className="font-semibold text-xs text-gray-600">{msg.sender === displayName ? 'Me' : msg.sender}</span>
                        <span className="text-[10px] text-gray-400">{msg.time}</span>
                      </div>
                      <p className={`text-sm p-2.5 rounded-lg max-w-[90%] break-words shadow-sm ${msg.sender === displayName ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                        {msg.text}
                      </p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
                  <div className="relative flex items-center">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type message here..." className="w-full border border-gray-300 rounded-full pl-4 pr-12 py-2 text-sm focus:ring-2 focus:ring-zoom-blue/50 focus:border-zoom-blue outline-none transition" />
                    <button type="submit" disabled={!chatInput.trim()} className="absolute right-1.5 p-1.5 text-white bg-zoom-blue rounded-full hover:bg-zoom-blue-hover disabled:opacity-50 transition"><Send size={14} /></button>
                  </div>
                </form>
              </div>
            )}

            {/* AI Companion Panel */}
            {activeSidebar === 'ai' && (
              <div className="flex-1 flex flex-col bg-gradient-to-b from-purple-50/50 to-white">
                <div className="p-5 border-b border-gray-200 text-sm text-gray-600 bg-white shadow-sm z-10">
                  <p>Ask AI Companion questions about the meeting or generate a summary.</p>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div className="bg-white border border-purple-100 p-4 rounded-xl shadow-sm">
                    <h4 className="font-semibold text-purple-700 flex items-center mb-2"><Sparkles size={14} className="mr-1.5"/> Meeting Summary</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">The team discussed the Zoom Clone implementation, focusing on real-time features. WebRTC setup is underway, and WebSocket syncing for chat is functional.</p>
                  </div>
                  <div className="bg-white border border-blue-100 p-4 rounded-xl shadow-sm">
                    <h4 className="font-semibold text-blue-700 flex items-center mb-2"><Sparkles size={14} className="mr-1.5"/> Action Items</h4>
                    <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                      <li>Complete AI Companion UI</li>
                      <li>Test real-time participant sync</li>
                      <li>Deploy backend services</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="relative">
                    <input type="text" placeholder="Ask AI Companion..." className="w-full border border-purple-200 rounded-full pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 outline-none transition bg-purple-50/30" />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-600 hover:bg-purple-100 rounded-full transition"><Send size={16} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 bg-[#1a1a1a] border-t border-gray-800 flex items-center justify-between px-2 sm:px-6 z-30">
        
        {/* Left Controls */}
        <div className="flex items-center space-x-1">
          <button onClick={toggleMute} className="flex flex-col items-center justify-center w-[60px] h-16 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition group">
            {isMuted ? <MicOff size={22} className="text-red-500 mb-1" /> : <Mic size={22} className="mb-1 text-white" />}
            <span className="text-[11px] font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button onClick={toggleVideo} className="flex flex-col items-center justify-center w-[60px] h-16 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition group">
            {isVideoOff ? <VideoOff size={22} className="text-red-500 mb-1" /> : <Video size={22} className="mb-1 text-white" />}
            <span className="text-[11px] font-medium">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
          </button>
          
          {/* Security Menu for Host */}
          {isHost && (
            <div className="relative">
              <button onClick={() => setShowSecurityMenu(!showSecurityMenu)} className={`flex flex-col items-center justify-center w-[60px] h-16 rounded-lg transition ${showSecurityMenu ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Shield size={22} className="mb-1 text-gray-300" />
                <span className="text-[11px] font-medium">Security</span>
              </button>
              {showSecurityMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSecurityMenu(false)}></div>
                  <div className="absolute bottom-full mb-2 left-0 w-56 bg-[#2d2d2d] border border-gray-600 rounded-lg shadow-2xl overflow-hidden text-sm text-gray-200 z-50 py-2">
                    <button className="w-full flex items-center px-4 py-2 hover:bg-zoom-blue transition-colors" onClick={() => setShowSecurityMenu(false)}><Lock size={14} className="mr-3"/> Lock Meeting</button>
                    <button className="w-full flex items-center px-4 py-2 hover:bg-zoom-blue transition-colors" onClick={() => setShowSecurityMenu(false)}><Shield size={14} className="mr-3"/> Enable Waiting Room</button>
                    <button className="w-full flex items-center px-4 py-2 hover:bg-zoom-blue transition-colors" onClick={() => setShowSecurityMenu(false)}><UserX size={14} className="mr-3"/> Hide Profile Pictures</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center Controls */}
        <div className="flex items-center space-x-1">
          <button onClick={() => toggleSidebar('participants')} className={`flex flex-col items-center justify-center w-[64px] h-16 rounded-lg transition relative ${activeSidebar === 'participants' ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Users size={22} className="mb-1" />
            <span className="text-[11px] font-medium">Participants</span>
            <span className="absolute top-1 right-2 bg-gray-600 text-white text-[9px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center border border-gray-800">{participants.length}</span>
          </button>
          
          <button onClick={() => toggleSidebar('chat')} className={`flex flex-col items-center justify-center w-[60px] h-16 rounded-lg transition ${activeSidebar === 'chat' ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <MessageSquare size={22} className="mb-1" />
            <span className="text-[11px] font-medium">Chat</span>
          </button>

          <button onClick={startScreenShare} className={`flex flex-col items-center justify-center w-[60px] h-16 rounded-lg transition ${isScreenSharing ? 'text-green-400 bg-gray-800' : 'text-green-500 hover:text-green-400 hover:bg-gray-800'}`}>
            <Share size={22} className="mb-1" />
            <span className="text-[11px] font-medium">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
          </button>

          {/* AI Companion */}
          <button onClick={() => toggleSidebar('ai')} className={`flex flex-col items-center justify-center w-[64px] h-16 rounded-lg transition ${activeSidebar === 'ai' ? 'text-white bg-gray-800' : 'text-purple-400 hover:text-purple-300 hover:bg-gray-800'}`}>
            <Sparkles size={22} className="mb-1" />
            <span className="text-[11px] font-medium">AI Companion</span>
          </button>

          {/* Show Captions */}
          <button onClick={() => setShowCaptions(!showCaptions)} className={`flex flex-col items-center justify-center w-[60px] h-16 rounded-lg transition ${showCaptions ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Captions size={22} className="mb-1" />
            <span className="text-[11px] font-medium">Show Captions</span>
          </button>
          
          {/* More Menu */}
          <div className="relative flex items-center justify-center">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center justify-center w-[60px] h-16 rounded-lg transition ${showMoreMenu ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              <MoreHorizontal size={22} className="mb-1" />
              <span className="text-[11px] font-medium">More</span>
            </button>

            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)}></div>
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 bg-[#2d2d2d] border border-gray-600 rounded-lg shadow-2xl overflow-hidden text-sm text-gray-200 z-50">
                  {/* Reactions */}
                  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700 bg-[#222]">
                    <span className="font-semibold text-gray-300 text-[10px] uppercase tracking-wider">Reactions</span>
                  </div>
                  <div className="flex justify-around px-3 py-3 border-b border-gray-700 bg-[#2a2a2a]">
                    {['👍', '👏', '😂', '😮', '❤️', '🎉'].map(emoji => (
                      <button key={emoji} onClick={() => triggerReaction(emoji)} className="hover:bg-gray-600 hover:scale-110 p-2 rounded-full text-2xl transition-transform duration-100">
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Raise Hand & Tools */}
                  <div className="flex border-b border-gray-700">
                    <button onClick={toggleHand} className="flex-1 flex flex-col items-center py-3 hover:bg-gray-700 border-r border-gray-700 transition">
                       <Hand size={20} className={isHandRaised ? "text-blue-400" : "text-gray-300"} />
                       <span className="text-xs mt-1">{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                    </button>
                    <button onClick={() => { 
                       const nextState = !showWhiteboard;
                       setShowWhiteboard(nextState); 
                       setIsScreenSharing(false); 
                       setShowMoreMenu(false); 
                       if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                         wsRef.current.send(JSON.stringify({ type: 'whiteboard-toggle', userId: user?.id, isOpen: nextState }));
                       }
                    }} className="flex-1 flex flex-col items-center py-3 hover:bg-gray-700 transition">
                       <Presentation size={20} className="text-gray-300" />
                       <span className="text-xs mt-1">Whiteboard</span>
                    </button>
                  </div>
                  
                  {/* Apps & Polls */}
                  <button className="w-full flex items-center px-5 py-3 hover:bg-zoom-blue hover:text-white transition-colors" onClick={() => { setShowApps(true); setShowMoreMenu(false); }}>
                    <LayoutTemplate size={16} className="mr-3 text-pink-400"/> Apps
                  </button>
                  <button className="w-full flex items-center px-5 py-3 hover:bg-zoom-blue hover:text-white transition-colors border-b border-gray-700" onClick={() => { setShowPolls(true); setShowMoreMenu(false); }}>
                    <BarChart3 size={16} className="mr-3 text-yellow-400"/> Polls/Quizzes
                  </button>

                  <button className="w-full text-left px-5 py-3 hover:bg-zoom-blue hover:text-white transition-colors" onClick={() => { setIsRecording(!isRecording); setShowMoreMenu(false); }}>
                    {isRecording ? '⏹ Stop Recording' : '⏺ Record'}
                  </button>
                  {isHost && (
                     <button className="w-full text-left px-5 py-3 hover:bg-red-500 hover:text-white transition-colors border-t border-gray-700 text-red-400 font-medium" onClick={muteAll}>
                       🎙️ Mute All Participants (Host)
                     </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center ml-2">
          <button onClick={leaveMeeting} className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg px-5 py-2 shadow-md transition">
            Leave
          </button>
        </div>
      </div>
      
      {/* Dummy Apps Modal */}
      {showApps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
           <div className="bg-white rounded-xl shadow-2xl w-[600px] h-[400px] flex flex-col overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                 <h2 className="text-xl font-semibold text-gray-800">Zoom Apps</h2>
                 <button onClick={() => setShowApps(false)} className="text-gray-500 hover:bg-gray-100 p-1 rounded"><X size={20}/></button>
              </div>
              <div className="flex-1 p-6 flex items-center justify-center flex-col text-center space-y-4">
                 <LayoutTemplate size={64} className="text-pink-400 opacity-50" />
                 <div>
                   <h3 className="text-lg font-medium text-gray-800 mb-1">Discover Apps</h3>
                   <p className="text-gray-500 text-sm max-w-md">Enhance your meeting experience with third-party applications. (This is a simulated UI feature for the clone).</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Functional Polls Modal */}
      {showPolls && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-full flex flex-col overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                 <h2 className="text-xl font-semibold text-gray-800 flex items-center"><BarChart3 size={20} className="mr-2 text-zoom-blue"/> Meeting Polls</h2>
                 <button onClick={() => setShowPolls(false)} className="text-gray-500 hover:bg-gray-200 p-1 rounded transition"><X size={20}/></button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                 {!activePoll && isHost ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 mb-4">Create a New Poll</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                        <input type="text" value={pollDraft.question} onChange={e => setPollDraft({...pollDraft, question: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zoom-blue outline-none" placeholder="Type your question..." />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Options</label>
                        {pollDraft.options.map((opt, i) => (
                           <div key={i} className="flex items-center space-x-2">
                             <input type="text" value={opt} onChange={e => { const newOpts = [...pollDraft.options]; newOpts[i] = e.target.value; setPollDraft({...pollDraft, options: newOpts}); }} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zoom-blue outline-none" placeholder={`Option ${i + 1}`} />
                             {pollDraft.options.length > 2 && (
                                <button onClick={() => setPollDraft({...pollDraft, options: pollDraft.options.filter((_, idx) => idx !== i)})} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
                             )}
                           </div>
                        ))}
                        <button onClick={() => setPollDraft({...pollDraft, options: [...pollDraft.options, '']})} className="text-zoom-blue text-sm font-medium flex items-center hover:underline mt-2"><Plus size={14} className="mr-1"/> Add Option</button>
                      </div>
                    </div>
                 ) : activePoll ? (
                    <div className="space-y-5">
                      <h3 className="text-lg font-semibold text-gray-800">{activePoll.question}</h3>
                      <div className="space-y-3">
                        {activePoll.options.map((opt, i) => {
                           const totalVotes = Object.values(pollResults).reduce((a, b) => a + b, 0);
                           const votes = pollResults[i] || 0;
                           const percent = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                           
                           return (
                             <div key={i} className="relative">
                               <button 
                                 onClick={() => handleVote(i)} 
                                 disabled={hasVoted || isHost} 
                                 className={`w-full text-left px-4 py-3 border rounded-lg transition overflow-hidden relative z-10 ${(hasVoted || isHost) ? 'cursor-default border-gray-200' : 'hover:border-zoom-blue border-gray-300 bg-white'}`}
                               >
                                 <div className="flex justify-between relative z-10">
                                   <span className="font-medium text-gray-800">{opt}</span>
                                   {(hasVoted || isHost) && <span className="text-gray-500 text-sm">{votes} ({percent}%)</span>}
                                 </div>
                                 {(hasVoted || isHost) && (
                                   <div className="absolute top-0 left-0 bottom-0 bg-blue-100 -z-10 transition-all duration-500" style={{width: `${percent}%`}}></div>
                                 )}
                               </button>
                             </div>
                           );
                        })}
                      </div>
                      {(hasVoted || isHost) && (
                        <p className="text-sm text-gray-500 text-center">Total Votes: {Object.values(pollResults).reduce((a, b) => a + b, 0)}</p>
                      )}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center text-center py-10 space-y-3">
                       <BarChart3 size={48} className="text-gray-300" />
                       <h3 className="text-lg font-medium text-gray-800">No Active Polls</h3>
                       <p className="text-gray-500 text-sm">The host has not launched any polls yet.</p>
                    </div>
                 )}
              </div>
              {!activePoll && isHost && (
                 <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                   <button onClick={handleLaunchPoll} disabled={!pollDraft.question.trim() || pollDraft.options.some(o => !o.trim())} className="bg-zoom-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-zoom-blue-hover transition disabled:opacity-50">Launch Poll</button>
                 </div>
              )}
           </div>
        </div>
      )}

    </div>
  );
}
