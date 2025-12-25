
import React, { useState } from 'react';
import { Button } from './Button';

interface LoginProps {
  onLogin: (username: string, remember: boolean) => void;
}

const VALID_USERS: Record<string, string> = {
  'phattien01': 'marketing01',
  'phattien02': 'marketing02',
  'phattien03': 'marketing03',
  'phattien04': 'marketing04',
  'phattien05': 'marketing05',
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Giả lập độ trễ xử lý để tạo cảm giác chuyên nghiệp
    setTimeout(() => {
      if (VALID_USERS[username] && VALID_USERS[username] === password) {
        onLogin(username, remember);
      } else {
        setError("Tài khoản hoặc mật khẩu không chính xác.");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8 md:p-10 transition-all">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-900/20 rotate-3 hover:rotate-0 transition-transform duration-500">
              <span className="text-white text-4xl font-black">H</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Phát Tiến AI</h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">DESIGNER ENTERPRISE PORTAL</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tài khoản ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="phattienXX"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-white/10 transition-all"
                />
                <div className="absolute right-4 top-3.5 text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-white/10 transition-all"
                />
                <div className="absolute right-4 top-3.5 text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer hidden"
                  />
                  <div className="w-5 h-5 border-2 border-slate-600 rounded peer-checked:bg-red-600 peer-checked:border-red-600 transition-all"></div>
                  <svg className="absolute w-3.5 h-3.5 text-white left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center animate-shake">
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full h-14 text-base font-bold uppercase tracking-widest shadow-2xl shadow-red-600/20"
            >
              Đăng nhập hệ thống
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-500 font-medium">© 2024 PHÁT TIẾN MOTOR. TẤT CẢ QUYỀN ĐƯỢC BẢO LƯU.</p>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};
