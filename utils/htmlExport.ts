import { PortfolioItem, Theme } from '../types';

export const exportPortfolioToHtml = (studentName: string, items: PortfolioItem[], theme: Theme): string => {
  const date = new Date().toLocaleDateString();
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${studentName}의 AI 포트폴리오</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans KR', sans-serif; }
        .masonry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
        .custom-bg { background: ${theme.background}; }
        .custom-text { color: ${theme.textColor}; }
        .custom-card { background-color: ${theme.cardBg}; }
        .custom-accent { background-color: ${theme.accentColor}; color: white; }
    </style>
</head>
<body class="custom-bg custom-text min-h-screen transition-colors duration-500">
    <header class="py-12 px-6 backdrop-blur-sm border-b border-white/10 shadow-sm">
        <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl md:text-5xl font-bold mb-4 font-['Comic_Neue'] tracking-wide drop-shadow-sm">MY AI PORTFOLIO</h1>
            <p class="text-xl opacity-90">${studentName} 작가님의 갤러리</p>
            <p class="text-sm mt-4 opacity-75">생성일: ${date}</p>
        </div>
    </header>

    <main class="max-w-6xl mx-auto p-8">
        <div class="mb-12 text-center">
            <span class="inline-block px-4 py-1 rounded-full custom-card border border-white/20 text-sm font-medium shadow-sm opacity-80">
                테마: ${theme.name}
            </span>
        </div>

        ${items.length === 0 ? `
            <div class="text-center py-20 opacity-50">
                <p>아직 전시된 작품이 없습니다.</p>
            </div>
        ` : `
            <div class="masonry-grid">
                ${items.map(item => {
                    const imageBlock = `
                        <div class="aspect-square bg-slate-100 overflow-hidden relative group">
                            <img src="${item.imageUrl}" alt="AI Artwork" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                            ${item.type === 'link' ? `
                                <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                </div>
                                <div class="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">LINK</div>
                            ` : ''}
                        </div>
                    `;

                    // If it's a link, wrap image in anchor
                    const mediaContent = item.type === 'link' && item.linkUrl
                        ? `<a href="${item.linkUrl}" target="_blank" rel="noopener noreferrer" class="block h-full">${imageBlock}</a>`
                        : imageBlock;

                    return `
                    <article class="custom-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col border border-white/20">
                        ${mediaContent}
                        <div class="p-6 flex-1 flex flex-col">
                            <h3 class="text-xs font-bold opacity-50 uppercase tracking-wider mb-2">
                                ${item.type === 'link' ? '설명 (Description)' : '프롬프트 (Prompt)'}
                            </h3>
                            <p class="bg-black/5 p-3 rounded-lg text-sm italic mb-4 flex-1 break-words opacity-90">
                                "${item.prompt || '내용 없음'}"
                            </p>
                            <div class="text-right text-xs opacity-50">
                                ${new Date(item.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    </article>
                `}).join('')}
            </div>
        `}
    </main>

    <footer class="py-8 text-center text-sm opacity-60">
        <p>Created with AI Portfolio Builder</p>
    </footer>
</body>
</html>
  `;
};