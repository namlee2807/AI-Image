
import React, { useState, useRef, useEffect } from 'react';
import { generateDesignContent, getActiveKeyInfo } from './services/geminiService';
import { GeneratedContent, AspectRatio, GenerationMode, Resolution, OutputFormat, DesignTask } from './types';
import { Button } from './components/Button';
import { HistorySidebar } from './components/HistorySidebar';
// import { PromptAssistant } from './components/PromptAssistant'; // Tạm thời ẩn để dùng Tab riêng
import { Login } from './components/Login';

type Tab = 'studio' | 'brainstorm' | 'gallery';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // App Navigation State
  const [activeTab, setActiveTab] = useState<Tab>('studio');

  // Design State
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Content State
  const [currentContent, setCurrentContent] = useState<GeneratedContent | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0); 
  
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [mode, setMode] = useState<GenerationMode>('CREATE');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.R1_1);
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [task, setTask] = useState<DesignTask>(DesignTask.DESIGN);
  
  // Customization State
  const [bgColor, setBgColor] = useState<string>('#FFFFFF'); 
  const [useSolidBackground, setUseSolidBackground] = useState<boolean>(true); 

  // Modal / Sidebar State
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [activeKeyInfo, setActiveKeyInfo] = useState(getActiveKeyInfo());

  // Download Option State
  const [removeBg, setRemoveBg] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  
  // Reference Images State (Array)
  const [refImages, setRefImages] = useState<string[]>([]);
  const [refMimes, setRefMimes] = useState<string[]>([]);
  
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Constants for Colors
  const PRESET_COLORS = [
    { name: 'White', value: '#FFFFFF', class: 'bg-white border-slate-200' },
    { name: 'Black', value: '#000000', class: 'bg-black border-slate-700' },
    { name: 'Green (Key)', value: '#00FF00', class: 'bg-[#00FF00] border-slate-200' },
    { name: 'Honda Red', value: '#CC0000', class: 'bg-[#CC0000] border-slate-200' },
    { name: 'Blue (Key)', value: '#0000FF', class: 'bg-[#0000FF] border-slate-200' },
  ];

  // Auth Initialization
  useEffect(() => {
    const savedUser = localStorage.getItem('phattien_ai_user');
    const authExpiry = localStorage.getItem('phattien_ai_expiry');
    
    if (savedUser && authExpiry) {
      if (Date.now() < parseInt(authExpiry)) {
        setIsAuthenticated(true);
        setCurrentUser(savedUser);
      } else {
        localStorage.removeItem('phattien_ai_user');
        localStorage.removeItem('phattien_ai_expiry');
      }
    }
    setIsAuthChecking(false);
  }, []);

  // Update active key info periodically
  useEffect(() => {
    const interval = setInterval(() => setActiveKeyInfo(getActiveKeyInfo()), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (username: string, remember: boolean) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
    if (remember) {
      localStorage.setItem('phattien_ai_user', username);
      // Ghi nhớ trong 7 ngày
      localStorage.setItem('phattien_ai_expiry', (Date.now() + 7 * 24 * 60 * 60 * 1000).toString());
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('phattien_ai_user');
    localStorage.removeItem('phattien_ai_expiry');
  };

  // Helper: Process File Object
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Một số ảnh quá lớn (>5MB) đã bị bỏ qua.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setRefImages(prev => [...prev, result]);
      setRefMimes(prev => [...prev, file.type]);
      setMode('EDIT'); 
    };
    reader.readAsDataURL(file);
  };

  // Handlers for File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      Array.from(event.target.files).forEach(processFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (activeTab !== 'studio') return; // Only allow paste in Studio mode
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) processFile(file);
      }
    }
  };

  const removeRefImage = (index: number) => {
    setRefImages(prev => prev.filter((_, i) => i !== index));
    setRefMimes(prev => prev.filter((_, i) => i !== index));
    if (refImages.length <= 1) {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Vui lòng nhập mô tả ý tưởng.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateDesignContent({
        prompt,
        aspectRatio,
        resolution,
        task,
        referenceImages: refImages,
        referenceImageMimeTypes: refMimes,
        backgroundColor: bgColor,
        useSolidBackground: task === DesignTask.HEADLINE_STICKER ? useSolidBackground : false,
      });

      const newContent: GeneratedContent = {
        id: crypto.randomUUID(),
        type: result.type,
        contents: result.contents,
        prompt,
        timestamp: Date.now(),
        task
      };

      setCurrentContent(newContent);
      setSelectedImageIndex(0); 
      setHistory(prev => [newContent, ...prev]);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi hệ thống.");
    } finally {
      setIsGenerating(false);
      setActiveKeyInfo(getActiveKeyInfo());
    }
  };

  const processTransparentImage = (imgSrc: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = imgSrc;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(imgSrc); return; }
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const bgR = data[0]; const bgG = data[1]; const bgB = data[2];
            const threshold = 45; 
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
                const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
                if (dist < threshold) data[i + 3] = 0; 
            }
            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(imgSrc); 
    });
  };

  const handleDownload = async () => {
    if (!currentContent) return;
    const activeImageSrc = currentContent.contents[selectedImageIndex];
    const link = document.createElement('a');
    if (outputFormat === 'png') {
        let finalUrl = activeImageSrc;
        if (removeBg && task === DesignTask.HEADLINE_STICKER) {
            finalUrl = await processTransparentImage(activeImageSrc);
        }
        link.href = finalUrl;
        link.download = `phat-tien-design-${currentContent.id}.png`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } else {
        const img = new Image(); img.src = activeImageSrc; img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.download = `phat-tien-design-${currentContent.id}.jpg`;
                document.body.appendChild(link); link.click(); document.body.removeChild(link);
            }
        };
    }
  };

  const getTaskIcon = (t: DesignTask) => {
    switch(t) {
        case DesignTask.DESIGN: return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
        case DesignTask.HEADLINE_STICKER: return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
        default: return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m14.31 8 5.74 9.94"/><path d="M9.69 8h11.48"/></svg>;
    }
  }

  const getTaskLabel = (t: DesignTask) => {
    switch(t) {
        case DesignTask.DESIGN: return "Thiết kế";
        case DesignTask.HEADLINE_STICKER: return "Sticker & Logo";
        default: return "Chung";
    }
  }

  // --- UI Components for Layout ---

  const NavItem = ({ id, label, icon }: { id: Tab, label: string, icon: React.ReactNode }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex flex-col items-center justify-center py-4 gap-1 transition-all relative ${activeTab === id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <div className={`p-2 rounded-xl transition-all ${activeTab === id ? 'bg-red-600 shadow-lg shadow-red-900/50' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
      {activeTab === id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-600 rounded-r-full"></div>}
    </button>
  );

  const PlaceholderTab = ({ title, desc }: { title: string, desc: string }) => (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md p-8">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
            <p className="text-slate-500 mb-6">{desc}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                Coming Soon
            </div>
        </div>
    </div>
  );

  if (isAuthChecking) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden" onPaste={handlePaste}>
      
      {/* 1. LEFT NAVIGATION RAIL */}
      <nav className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 z-30 flex-shrink-0">
         <div className="w-10 h-10 rounded-lg bg-red-600 text-white font-black text-xl flex items-center justify-center shadow-md mb-8">
            H
         </div>
         
         <div className="flex flex-col w-full gap-2">
            <NavItem 
                id="studio" 
                label="Studio" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>} 
            />
            <NavItem 
                id="brainstorm" 
                label="Brainstorm" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} 
            />
            <NavItem 
                id="gallery" 
                label="Gallery" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>} 
            />
         </div>

         <div className="mt-auto flex flex-col gap-4">
             <button onClick={handleLogout} className="p-3 text-slate-600 hover:text-red-500 transition-colors" title="Đăng xuất">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
             </button>
         </div>
      </nav>

      {/* 2. MAIN APP CONTENT */}
      <div className="flex-1 flex flex-col bg-slate-50 text-slate-800 overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 z-20 shadow-sm flex-shrink-0">
            <div>
              <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 {activeTab === 'studio' && 'Creative Studio'}
                 {activeTab === 'brainstorm' && 'AI Brainstorm'}
                 {activeTab === 'gallery' && 'Template Gallery'}
                 <span className="text-[10px] font-normal text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full uppercase">Enterprise</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
                <p className="text-xs text-slate-500 text-right hidden md:block">
                   <span className="block font-bold text-slate-700">{currentUser}</span>
                   <span className="text-[10px]">Kênh {activeKeyInfo.index + 1}/{activeKeyInfo.total}</span>
                </p>
                <button 
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={`p-2 rounded-lg transition-colors border border-transparent ${showSidebar ? 'bg-red-50 text-red-600 border-red-100' : 'hover:bg-slate-100 text-slate-500'}`}
                    title="Lịch sử"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                </button>
            </div>
        </header>

        {/* TAB CONTENT AREA */}
        
        {/* === TAB 1: STUDIO (Main Image Gen) === */}
        {activeTab === 'studio' && (
             <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
             {/* LEFT SIDEBAR CONTROLS */}
             <div className="w-full lg:w-[400px] border-r border-slate-200 bg-white overflow-y-auto p-5 flex flex-col gap-6 z-10 custom-scrollbar">
               {/* Task Selector */}
               <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại thiết kế</label>
                   <div className="grid grid-cols-2 gap-2">
                       {Object.values(DesignTask).map(t => (
                           <button key={t} onClick={() => setTask(t)} className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium transition-all text-left ${task === t ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                               <span className={`p-2 rounded-md ${task === t ? 'bg-white text-red-600 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>{getTaskIcon(t)}</span>
                               {getTaskLabel(t)}
                           </button>
                       ))}
                   </div>
               </div>
   
               {/* Prompt Input */}
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mô tả ý tưởng</label>
                 </div>
                 <textarea
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   placeholder="Mô tả chi tiết: Chủ thể, màu sắc, ánh sáng, bối cảnh..."
                   className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none shadow-inner transition-all resize-none"
                 />
               </div>
   
               {/* Color Removal Option (Specific to Sticker) */}
               {task === DesignTask.HEADLINE_STICKER && (
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                       <div className="flex items-center justify-between">
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Tách nền màu</label>
                           <button onClick={() => setUseSolidBackground(!useSolidBackground)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useSolidBackground ? 'bg-red-500' : 'bg-slate-300'}`}>
                               <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useSolidBackground ? 'translate-x-5' : 'translate-x-1'}`} />
                           </button>
                       </div>
                       {useSolidBackground && (
                           <div className="flex flex-wrap gap-2 pt-1">
                           {PRESET_COLORS.map((c) => (
                               <button key={c.value} onClick={() => setBgColor(c.value)} className={`w-6 h-6 rounded-full border ${c.class} ${bgColor === c.value ? 'ring-2 ring-red-500 ring-offset-1' : ''}`} />
                           ))}
                           </div>
                       )}
                   </div>
               )}
   
               {/* Reference Images */}
               <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ảnh tham khảo (Optional)</label>
                   <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center min-h-[80px] transition-all ${isDragging ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}>
                       {refImages.length === 0 ? <span className="text-xs text-slate-400">Click hoặc thả ảnh vào đây</span> : (
                           <div className="grid grid-cols-3 gap-2 w-full">
                               {refImages.map((img, idx) => (
                                   <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                                       <img src={img} className="w-full h-full object-cover" />
                                       <button onClick={(e) => {e.stopPropagation(); removeRefImage(idx)}} className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl">×</button>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
               </div>
   
               {/* Settings (Resolution & Ratio) */}
               <div className="space-y-4 mt-auto pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Chất lượng</label>
                            <div className="flex gap-1">
                                {(['1K', '2K', '4K'] as Resolution[]).map((res) => (
                                    <button key={res} onClick={() => setResolution(res)} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all border ${resolution === res ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-500 border-slate-200'}`}>{res}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Format</label>
                            <div className="flex gap-1">
                                {(['png', 'jpg'] as OutputFormat[]).map((f) => (
                                    <button key={f} onClick={() => setOutputFormat(f)} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all border uppercase ${outputFormat === f ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-500 border-slate-200'}`}>{f}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Tỷ lệ khung hình</label>
                       <div className="grid grid-cols-4 gap-1.5">
                           {Object.entries(AspectRatio).map(([key, value]) => (
                           <button key={key} onClick={() => setAspectRatio(value)} className={`py-1.5 rounded border text-[10px] font-bold transition-all ${aspectRatio === value ? 'border-red-500 bg-red-50 text-red-600 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                               {value}
                               {value === '16:5' && <span className="block text-[8px] font-normal opacity-70">Banner</span>}
                           </button>
                           ))}
                       </div>
                   </div>
               </div>
   
               {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs">{error}</div>}
   
               <Button onClick={handleGenerate} isLoading={isGenerating} className="w-full h-12 text-lg shadow-red-600/30">
                  {isGenerating ? 'Đang sáng tạo...' : 'Tạo 4 Phương Án'}
               </Button>
             </div>
   
             {/* RIGHT PREVIEW AREA */}
             <div className="flex-1 bg-slate-100 relative flex flex-col items-center p-4 lg:p-8 overflow-hidden">
                {isGenerating ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                     <div className="w-16 h-16 rounded-xl bg-red-600 animate-spin flex items-center justify-center shadow-lg"><svg className="text-white w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>
                     <div className="mt-8 text-center">
                       <h3 className="text-lg font-bold text-slate-700">AI đang vẽ...</h3>
                       <p className="text-sm text-slate-500">Kênh xử lý #{activeKeyInfo.index + 1} đang hoạt động</p>
                     </div>
                  </div>
                ) : currentContent ? (
                  <div className="flex flex-col items-center w-full h-full max-w-6xl gap-4">
                       <div className="flex-1 w-full flex flex-col min-h-0 gap-4">
                           <div className="flex-1 relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                               <img src={currentContent.contents[selectedImageIndex]} className="max-w-full max-h-full object-contain shadow-2xl" />
                           </div>
                           <div className="h-24 w-full flex justify-center gap-3">
                               {currentContent.contents.map((imgSrc, idx) => (
                                   <div key={idx} onClick={() => setSelectedImageIndex(idx)} className={`h-full aspect-square bg-white rounded-lg border-2 cursor-pointer overflow-hidden transition-all transform hover:scale-105 ${selectedImageIndex === idx ? 'border-red-600 shadow-md ring-2 ring-red-100' : 'border-slate-200'}`}>
                                       <img src={imgSrc} className="w-full h-full object-cover" />
                                   </div>
                               ))}
                           </div>
                       </div>
                    <div className="flex-shrink-0 flex gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200 items-center">
                       {outputFormat === 'png' && currentContent.task === DesignTask.HEADLINE_STICKER && (
                           <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors mr-2">
                               <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="accent-red-600 w-4 h-4" /> 
                               Xóa nền trắng (Alpha)
                           </label>
                       )}
                       <Button variant="primary" onClick={handleDownload} className="text-sm px-8 h-10">Tải ảnh chất lượng cao</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 m-auto max-w-sm">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200 text-red-600 font-black text-3xl rotate-3">H</div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Phát Tiến Design Studio</h3>
                    <p className="text-sm leading-relaxed text-slate-500">
                      Chào mừng bạn đến với hệ thống thiết kế doanh nghiệp. 
                      <br/>Chọn công cụ bên trái để bắt đầu sáng tạo.
                    </p>
                  </div>
                )}
             </div>
           </main>
        )}

        {/* === TAB 2: BRAINSTORM (Chat) === */}
        {activeTab === 'brainstorm' && (
            <PlaceholderTab 
                title="AI Brainstorm Assistant" 
                desc="Tính năng trò chuyện chuyên sâu với AI để lên ý tưởng Concept, viết slogan và định hướng nghệ thuật đang được phát triển." 
            />
        )}

        {/* === TAB 3: GALLERY (Templates) === */}
        {activeTab === 'gallery' && (
            <PlaceholderTab 
                title="Template Gallery" 
                desc="Kho thư viện mẫu thiết kế doanh nghiệp (Banner, Social Post, Standee) chuẩn Brand Identity sẽ sớm ra mắt." 
            />
        )}

      </div>

      <HistorySidebar history={history} onSelect={(item) => { setCurrentContent(item); setSelectedImageIndex(0); setActiveTab('studio'); }} isOpen={showSidebar} />
      
      {/* Ẩn PromptAssistant cũ vì sẽ chuyển sang Tab Brainstorm */}
      {/* <PromptAssistant /> */}
    </div>
  );
};

export default App;
