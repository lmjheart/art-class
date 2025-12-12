import React, { useState, useEffect } from 'react';
import { Layout, Palette, Download, Upload, BarChart2, Link as LinkIcon, Wand2, X, Settings } from 'lucide-react';
import { ChatWindow } from './components/ChatWindow';
import { Gallery } from './components/Gallery';
import { StatsModal } from './components/StatsModal';
import { exportPortfolioToHtml } from './utils/htmlExport';
import { PortfolioItem, Message, Theme } from './types';
import { analyzeImageWithGemini, generateThemeFromDescription } from './services/ai';

const DEFAULT_THEME: Theme = { 
  id: 'default', 
  name: '기본 스튜디오', 
  background: '#f8fafc', // slate-50 equivalent
  textColor: '#1e293b', // slate-800
  accentColor: '#4f46e5', // indigo-600
  cardBg: '#ffffff'
};

export default function App() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme>(DEFAULT_THEME);
  const [studentName, setStudentName] = useState<string>('학생');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '안녕! 우리 함께 멋진 AI 제작자가 되어보자. 너의 작품을 올리고 포트폴리오를 만들어봐. 원하는 분위기를 말하면 테마도 바꿔줄게!',
      timestamp: Date.now()
    }
  ]);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Settings / API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Upload State
  const [pendingUpload, setPendingUpload] = useState<{file: File, preview: string} | null>(null);
  const [pendingUrl, setPendingUrl] = useState('');

  // Theme Generator State
  const [themePrompt, setThemePrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  useEffect(() => {
    // Load saved key on mount
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKeyInput(savedKey);
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKeyInput);
    setIsSettingsOpen(false);
    alert('API 키가 저장되었습니다!');
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingUpload({
        file,
        preview: reader.result as string
      });
      setPendingUrl(''); // Reset URL input
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again if cancelled
    event.target.value = '';
  };

  const cancelUpload = () => {
    setPendingUpload(null);
    setPendingUrl('');
  };

  const confirmUpload = async () => {
    if (!pendingUpload) return;
    
    // Close modal immediately
    const uploadData = { ...pendingUpload };
    const url = pendingUrl.trim();
    setPendingUpload(null);
    setPendingUrl('');
    
    setIsUploading(true);

    const isLink = url.length > 0;
    
    const newItem: PortfolioItem = {
        id: Date.now().toString(),
        type: isLink ? 'link' : 'image',
        imageUrl: uploadData.preview,
        linkUrl: isLink ? url : undefined,
        prompt: '', 
        description: isLink ? '링크된 작품' : '업로드된 작품',
        timestamp: Date.now()
    };

    const aiPrompt = isLink 
        ? "이 작품(링크)을 칭찬해주고, 어떤 사이트나 도구로 만들었는지 물어봐줘."
        : "이 그림을 초등학생 수준에서 칭찬해주고, 어떤 점이 멋진지 2문장으로 설명해줘. 그리고 프롬프트를 물어봐줘.";
    
    await finalizeItemUpload(newItem, uploadData.preview, aiPrompt);
  };

  const finalizeItemUpload = async (item: PortfolioItem, base64ForAi: string, aiSystemPrompt: string) => {
      setItems(prev => [...prev, item]);

      const uploadMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: item.type === 'link' ? `작품 링크를 올렸어! (${item.linkUrl})` : '작품을 하나 올렸어! 어때?',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, uploadMsg]);

      try {
        const aiResponseText = await analyzeImageWithGemini(base64ForAi, aiSystemPrompt);
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: aiResponseText,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (error) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: 'API 키가 없거나 오류가 발생했어. 설정(⚙️)에서 키를 확인해줘!',
            timestamp: Date.now()
        }]);
      } finally {
        setIsUploading(false);
      }
  };

  const generateAiTheme = async () => {
    if (!themePrompt.trim()) return;
    setIsGeneratingTheme(true);
    try {
      const newTheme = await generateThemeFromDescription(themePrompt);
      if (newTheme.id === 'default' && newTheme.name !== themePrompt) {
         // Fallback detection logic if needed, but the service handles default return
      }
      setCurrentTheme(newTheme);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `짠! '${themePrompt}' 분위기로 테마를 바꿔봤어. 배경이랑 색깔이 어때? 마음에 들면 좋겠다!`,
        timestamp: Date.now()
      }]);
    } catch (e) {
      alert("테마 생성 실패. API 키를 확인해주세요.");
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const updateItemPrompt = (id: string, prompt: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, prompt } : item));
  };

  const handleExport = () => {
    const htmlContent = exportPortfolioToHtml(studentName, items, currentTheme);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentName}_AI_포트폴리오.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-500"
         style={{ background: currentTheme.background }}>
      
      {/* Sidebar */}
      <aside className="w-full md:w-96 bg-white/90 backdrop-blur border-r border-slate-200 flex flex-col h-[50vh] md:h-screen fixed md:relative z-10 shadow-xl md:shadow-none">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg text-white" style={{ backgroundColor: currentTheme.accentColor }}>
                <Palette size={24} />
              </div>
              <h1 className="text-xl font-bold text-slate-800">AI 아트 스튜디오</h1>
            </div>
            {/* Settings Button */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="설정 (API 키 입력)"
            >
              <Settings size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">작가 이름</label>
              <input 
                type="text" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 outline-none text-sm"
                style={{ '--tw-ring-color': currentTheme.accentColor } as React.CSSProperties}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-2">
                <Wand2 size={12} /> AI 테마 메이커
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={themePrompt}
                  onChange={(e) => setThemePrompt(e.target.value)}
                  placeholder="예: 신비한 우주, 민트초코 세상"
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && generateAiTheme()}
                />
                <button 
                  onClick={generateAiTheme}
                  disabled={isGeneratingTheme}
                  className="px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-transform active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: currentTheme.accentColor }}
                >
                  {isGeneratingTheme ? '...' : '변신!'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <ChatWindow 
            messages={messages} 
            setMessages={setMessages} 
            currentTheme={currentTheme}
          />
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 h-[50vh] md:h-screen overflow-y-auto relative scroll-smooth">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: currentTheme.textColor }}>
            <Layout size={20} />
            나의 갤러리 
            <span className="text-sm font-normal bg-black/5 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </h2>
          
          <div className="flex gap-2 md:gap-3">
             <button 
              onClick={() => setIsStatsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/80 border border-slate-200 rounded-lg hover:bg-white transition-colors shadow-sm text-sm font-medium text-slate-600"
            >
              <BarChart2 size={16} />
              <span className="hidden sm:inline">통계</span>
            </button>

            {/* Combined Upload Button */}
            <label className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-all shadow-md cursor-pointer text-sm font-bold"
                   style={{ backgroundColor: currentTheme.accentColor }}>
              <Upload size={16} />
              <span className="hidden sm:inline">작품 올리기</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageSelect}
                disabled={isUploading}
              />
            </label>

            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-md text-sm font-bold"
            >
              <Download size={16} />
              <span className="hidden sm:inline">저장</span>
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto pb-32">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300/50 rounded-xl bg-white/50 backdrop-blur-sm"
                 style={{ color: currentTheme.textColor }}>
              <Upload size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium opacity-80">작품을 올려서 갤러리를 채워보세요!</p>
              <p className="text-sm opacity-60">이미지 파일이나 링크를 추가할 수 있어요.</p>
            </div>
          ) : (
            <Gallery 
              items={items} 
              onUpdatePrompt={updateItemPrompt} 
              theme={currentTheme}
            />
          )}
        </div>
      </main>

      {/* Confirmation & Link Input Modal */}
      {pendingUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Upload size={20} className="text-blue-500"/> 작품 등록 확인
              </h3>
              <button onClick={cancelUpload} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="aspect-video w-full rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                <img src={pendingUpload.preview} alt="Preview" className="w-full h-full object-contain" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  이 작품이 연결된 웹사이트가 있나요? (선택사항)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon size={16} />
                  </div>
                  <input 
                    type="url" 
                    value={pendingUrl}
                    onChange={(e) => setPendingUrl(e.target.value)}
                    placeholder="링크 주소 (예: https://...)"
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * 링크를 입력하면 갤러리에서 클릭했을 때 해당 페이지로 이동합니다. 입력하지 않으면 일반 이미지로 등록됩니다.
                </p>
              </div>

              <div className="flex gap-2 mt-4 pt-2">
                <button 
                  onClick={cancelUpload}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={confirmUpload}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {isStatsOpen && (
        <StatsModal 
          items={items} 
          onClose={() => setIsStatsOpen(false)} 
        />
      )}

      {/* Settings Modal (API Key) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings size={20} className="text-slate-500"/> 설정
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Gemini API 키 입력
                </label>
                <input 
                  type="password" 
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AI Studio에서 발급받은 키를 입력하세요"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                />
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  * 입력한 키는 이 컴퓨터(브라우저)에만 저장되며 서버로 전송되지 않습니다.
                  <br />
                  * 배포 시 'Environment Variables'에 설정했다면 입력하지 않아도 됩니다.
                </p>
              </div>
              <button 
                onClick={saveApiKey}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(isUploading || isGeneratingTheme) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce">
            <Wand2 className={`text-indigo-500 mb-2 animate-spin`} size={32} />
            <p className="font-bold text-slate-700">
              {isGeneratingTheme ? '마법을 부리는 중...' : '작품을 전시하는 중...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}