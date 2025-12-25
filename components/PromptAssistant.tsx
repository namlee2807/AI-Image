import React, { useState, useRef, useEffect } from 'react';
import { optimizeDesignPrompt } from '../services/geminiService';
import { Button } from './Button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const PromptAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'form'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Chào bạn! Tôi là trợ lý AI. Bạn có thể chat ý tưởng sơ bộ hoặc dùng Form để tạo prompt chuyên nghiệp nhé.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    context: '',
    style: '',
    mood: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, activeTab]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const handleChatSubmit = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsProcessing(true);

    try {
        const optimizedPrompt = await optimizeDesignPrompt(userMsg);
        setMessages(prev => [...prev, { role: 'assistant', content: optimizedPrompt }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Xin lỗi, tôi gặp lỗi khi xử lý." }]);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.subject.trim()) return;
    
    // Construct a user-friendly display message for the chat history
    const displayMsg = `[Form Yêu cầu]\n- Chủ thể: ${formData.subject}\n- Bối cảnh: ${formData.context}\n- Phong cách: ${formData.style}\n- Màu/Ánh sáng: ${formData.mood}`;
    
    setMessages(prev => [...prev, { role: 'user', content: displayMsg }]);
    setActiveTab('chat'); // Switch to chat to see result
    setIsProcessing(true);

    try {
        const optimizedPrompt = await optimizeDesignPrompt("", formData); // Pass empty string + object
        setMessages(prev => [...prev, { role: 'assistant', content: optimizedPrompt }]);
        // Reset form? Optional. Let's keep it for easy edits.
    } catch (error) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Xin lỗi, tôi gặp lỗi khi xử lý form." }]);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50 group"
          title="Trợ lý Prompt"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </button>
      )}

      {/* Main Window */}
      <div 
        className={`fixed bottom-6 right-6 w-[360px] md:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
                <h3 className="font-bold text-sm">Trợ lý Prompt</h3>
                <p className="text-[10px] text-slate-300">Hỗ trợ viết tiếng Anh chuyên nghiệp</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 shrink-0">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'chat' ? 'text-red-600 border-b-2 border-red-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Trò chuyện
          </button>
          <button 
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'form' ? 'text-red-600 border-b-2 border-red-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Điền mẫu (Form)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-50">
            
            {/* --- Chat View --- */}
            <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${activeTab === 'chat' ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                                {msg.content}
                                {msg.role === 'assistant' && idx !== 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                                        <button 
                                            onClick={() => handleCopy(msg.content)}
                                            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                            Copy
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                         <div className="flex justify-start">
                             <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm">
                                 <div className="flex space-x-1">
                                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                 </div>
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Input Area */}
                <div className="p-3 bg-white border-t border-slate-200">
                    <div className="relative">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleChatSubmit();
                                }
                            }}
                            placeholder="Nhập ý tưởng (Ví dụ: Xe SH trên đồi thông...)"
                            className="w-full bg-slate-100 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none max-h-24 scrollbar-hide text-slate-800"
                            rows={1}
                        />
                        <button 
                            onClick={handleChatSubmit}
                            disabled={isProcessing || !inputValue.trim()}
                            className="absolute right-2 top-2 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Form View --- */}
            <div className={`absolute inset-0 flex flex-col p-5 overflow-y-auto transition-transform duration-300 space-y-4 bg-white ${activeTab === 'form' ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Chủ thể (Subject)</label>
                    <input 
                        type="text" 
                        value={formData.subject}
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                        placeholder="VD: Xe máy Honda Vision, Hộp quà Tết..."
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-slate-800"
                    />
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Bối cảnh (Context)</label>
                    <textarea 
                        value={formData.context}
                        onChange={e => setFormData({...formData, context: e.target.value})}
                        placeholder="VD: Đang chạy trên đường phố Sài Gòn lúc hoàng hôn..."
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none h-20 text-slate-800"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phong cách (Art Style)</label>
                    <select 
                        value={formData.style}
                        onChange={e => setFormData({...formData, style: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-800 bg-white"
                    >
                        <option value="">-- Chọn phong cách --</option>
                        <option value="Photorealistic, 8k, highly detailed">Ảnh chụp thật (Photorealistic)</option>
                        <option value="Cinematic, dramatic lighting, movie still">Điện ảnh (Cinematic)</option>
                        <option value="3D render, blender, unreal engine 5, c4d">3D Render (Quảng cáo)</option>
                        <option value="Vector art, flat design, illustrator, clean lines">Vector / Sticker (Phẳng)</option>
                        <option value="Anime style, makoto shinkai vibe">Anime / Hoạt hình</option>
                        <option value="Cyberpunk, neon lights, futuristic">Cyberpunk / Tương lai</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Màu sắc / Ánh sáng (Mood)</label>
                    <input 
                        type="text" 
                        value={formData.mood}
                        onChange={e => setFormData({...formData, mood: e.target.value})}
                        placeholder="VD: Ánh sáng studio mềm mại, tông đỏ chủ đạo..."
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-800"
                    />
                </div>

                <div className="pt-2">
                    <Button 
                        onClick={handleFormSubmit}
                        isLoading={isProcessing}
                        disabled={!formData.subject.trim()}
                        className="w-full"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 11-6-6"/><path d="M21 11v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 11-9 9"/><path d="M9 21v-6a2 2 0 0 1 2-2h2c1 0 2-1 2-2"/></svg>}
                    >
                        Tối ưu & Tạo Prompt
                    </Button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                        Kết quả sẽ hiển thị bên tab "Trò chuyện" để bạn sao chép.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};