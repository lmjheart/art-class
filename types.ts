export interface Theme {
  id: string;
  name: string;
  background: string; // CSS background property (can be color or gradient)
  textColor: string;  // Hex color
  accentColor: string; // Hex color for buttons/highlights
  cardBg: string; // Hex color for card background
}

export interface PortfolioItem {
  id: string;
  type: 'image' | 'link';
  imageUrl: string;
  linkUrl?: string; // Optional: only for link type
  prompt: string;
  description: string;
  timestamp: number;
  themeId?: string; // Legacy support
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}