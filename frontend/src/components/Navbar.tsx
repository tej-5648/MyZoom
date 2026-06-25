'use client';
import Link from 'next/link';
import { UserCircle, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-6">
        <Link href="/" className="text-zoom-blue font-bold text-2xl tracking-tight">
          ZOOM
        </Link>
        <div className="hidden md:flex space-x-4 text-gray-600 font-medium text-sm">
          <Link href="/" className="hover:text-zoom-blue transition">Meetings</Link>
          <span className="cursor-pointer hover:text-zoom-blue transition">Webinars</span>
          <span className="cursor-pointer hover:text-zoom-blue transition">Phone</span>
          <span className="cursor-pointer hover:text-zoom-blue transition">Team Chat</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <button className="text-gray-500 hover:text-gray-700 transition">
              <Settings size={20} />
            </button>
            <div className="flex items-center space-x-2 cursor-pointer group">
              <UserCircle size={32} className="text-gray-400 group-hover:text-zoom-blue transition" />
              <div className="hidden md:block">
                <p className="text-sm font-semibold">{user.username}</p>
              </div>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-500 transition ml-4 flex items-center space-x-1">
              <LogOut size={16} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm font-semibold text-zoom-blue hover:text-zoom-blue-hover">Log In</Link>
        )}
      </div>
    </nav>
  );
}
