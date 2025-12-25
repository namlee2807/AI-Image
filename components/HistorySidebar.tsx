import React from 'react';
import { GeneratedContent } from '../types';

interface HistorySidebarProps {
  history: GeneratedContent[];
  onSelect: (item: GeneratedContent) => void;
  isOpen: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 h-full border-l border-slate-200 bg-white flex flex-col overflow-hidden transition-all shadow-xl z-30">
      <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>
          Lịch sử thiết kế
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {history.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">
            <p>Chưa có lịch sử.</p>
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelect(item)}
              className="group cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-red-500 transition-all bg-white shadow-sm hover:shadow-md"
            >
              {item.type === 'image' ? (
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  <img 
                    src={item.contents[0]} // Display the first image as thumbnail
                    alt={item.prompt} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                   {item.contents.length > 1 && (
                      <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 rounded">
                        +{item.contents.length - 1}
                      </div>
                   )}
                </div>
              ) : (
                <div className="aspect-video relative overflow-hidden bg-slate-100 p-3 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              )}
              <div className="p-3">
                <p className="text-xs text-slate-600 font-medium line-clamp-2">{item.prompt}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                    {item.task}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};