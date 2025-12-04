
import React, { useState } from 'react';
import { UserProfile, ThemeColor } from '../types';
import { Copy, Check, Users, Palette, Share2 } from 'lucide-react';

interface Props {
  userProfile: UserProfile | null;
  onThemeChange: (theme: ThemeColor) => void;
  onInviteUser: (id: string) => Promise<void>;
  theme: ThemeColor;
}

export const ProfileView: React.FC<Props> = ({ userProfile, onThemeChange, onInviteUser, theme }) => {
  const [inviteId, setInviteId] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const colors: { id: ThemeColor; bg: string; ring: string }[] = [
    { id: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-300' },
    { id: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-300' },
    { id: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-300' },
    { id: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-300' },
    { id: 'sky', bg: 'bg-sky-500', ring: 'ring-sky-300' },
    { id: 'violet', bg: 'bg-violet-500', ring: 'ring-violet-300' },
  ];

  const handleCopyId = () => {
    if (userProfile?.id) {
      navigator.clipboard.writeText(userProfile.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleInvite = async () => {
    if (!inviteId.trim()) return;
    setIsInviting(true);
    await onInviteUser(inviteId);
    setInviteId('');
    setIsInviting(false);
    alert('User has been granted access to your data!');
  };

  // Dynamic Styles based on theme
  const btnClass = {
    indigo: 'bg-indigo-600 shadow-indigo-200',
    emerald: 'bg-emerald-600 shadow-emerald-200',
    rose: 'bg-rose-600 shadow-rose-200',
    amber: 'bg-amber-600 shadow-amber-200',
    sky: 'bg-sky-600 shadow-sky-200',
    violet: 'bg-violet-600 shadow-violet-200',
  }[theme];

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Info */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
         <div className={`w-20 h-20 rounded-full mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg ${colors.find(c => c.id === theme)?.bg || 'bg-slate-500'}`}>
            {userProfile?.id.substring(0, 2).toUpperCase()}
         </div>
         <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
         <p className="text-slate-400 text-sm mb-6">Manage settings & sharing</p>

         {/* User ID Card */}
         <div className="w-full bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
             <div className="text-left overflow-hidden">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My User ID</div>
                 <div className="font-mono text-sm font-semibold text-slate-700 truncate w-48 sm:w-64">
                    {userProfile?.id || 'Loading...'}
                 </div>
             </div>
             <button 
                onClick={handleCopyId}
                className="p-2 bg-white rounded-xl text-slate-500 shadow-sm border border-slate-100 active:scale-95 transition-transform"
             >
                {isCopied ? <Check size={18} className="text-emerald-500"/> : <Copy size={18} />}
             </button>
         </div>
      </div>

      {/* Theme Customization */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><Palette size={20} /></div>
              <h3 className="font-bold text-slate-800">App Theme</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Select your primary accent color.</p>
          
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              {colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onThemeChange(c.id)}
                    className={`w-12 h-12 rounded-full ${c.bg} transition-all duration-300 flex items-center justify-center ${theme === c.id ? `ring-4 ${c.ring} scale-110` : 'hover:scale-105'}`}
                  >
                      {theme === c.id && <Check size={20} className="text-white" strokeWidth={3} />}
                  </button>
              ))}
          </div>
      </div>

      {/* Collaboration */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><Users size={20} /></div>
              <h3 className="font-bold text-slate-800">Share Data</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Enter a Partner ID to allow them to view your dashboard.</p>
          
          <div className="flex gap-2">
              <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Share2 size={16}/></span>
                  <input 
                    type="text" 
                    placeholder="Enter User ID..." 
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    value={inviteId}
                    onChange={e => setInviteId(e.target.value)}
                  />
              </div>
              <button 
                 onClick={handleInvite}
                 disabled={!inviteId || isInviting}
                 className={`px-4 py-3 text-white rounded-xl font-bold text-sm shadow-lg transition-transform active:scale-95 ${btnClass}`}
              >
                  {isInviting ? '...' : 'Invite'}
              </button>
          </div>

          {/* Viewers List */}
          {userProfile?.viewers && userProfile.viewers.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-50">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shared With</h4>
                  <div className="space-y-2">
                      {userProfile.viewers.map((vId, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                                  {vId.substring(0,2).toUpperCase()}
                              </div>
                              <span className="text-xs font-mono text-slate-600 truncate flex-1">{vId}</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Active</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

    </div>
  );
};
