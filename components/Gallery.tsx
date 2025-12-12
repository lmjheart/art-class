import React from 'react';
import { PortfolioItem, Theme } from '../types';
import { Edit2, ExternalLink } from 'lucide-react';

interface GalleryProps {
  items: PortfolioItem[];
  onUpdatePrompt: (id: string, prompt: string) => void;
  theme: Theme;
}

export const Gallery: React.FC<GalleryProps> = ({ items, onUpdatePrompt, theme }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="group rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col relative"
          style={{ backgroundColor: theme.cardBg }}
        >
          {/* Image Area */}
          <div className="relative aspect-square overflow-hidden bg-slate-100">
            {item.type === 'link' ? (
                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer relative">
                    <img 
                    src={item.imageUrl} 
                    alt={item.description} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                    </div>
                    <div className="absolute top-3 left-3">
                         <span className="px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wide rounded bg-blue-600/90 shadow-sm">LINK</span>
                    </div>
                </a>
            ) : (
                <img 
                src={item.imageUrl} 
                alt={item.description} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
            )}
            
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="px-2 py-1 text-xs font-bold text-white rounded-full bg-black/50 backdrop-blur-sm">
                 {new Date(item.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="p-5 flex flex-col flex-1">
            <div className="mb-3">
               <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1 block" style={{ color: theme.textColor }}>
                 {item.type === 'link' ? '작품 설명 / 프롬프트' : '사용된 프롬프트'}
               </label>
               <div className="relative">
                 <textarea 
                    className="w-full text-sm bg-black/5 border border-transparent focus:bg-white focus:border-indigo-300 rounded-lg p-2 outline-none resize-none transition-all placeholder:opacity-40"
                    style={{ color: theme.textColor }}
                    rows={2}
                    placeholder="여기에 설명을 적어보세요!"
                    value={item.prompt}
                    onChange={(e) => onUpdatePrompt(item.id, e.target.value)}
                 />
                 <Edit2 size={12} className="absolute right-2 top-2 opacity-30 pointer-events-none" style={{ color: theme.textColor }} />
               </div>
            </div>
            
            <div className="mt-auto pt-2 border-t border-black/5">
               <p className="text-xs font-medium flex items-center justify-end gap-1 opacity-60" style={{ color: theme.textColor }}>
                 AI Art Portfolio
               </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};