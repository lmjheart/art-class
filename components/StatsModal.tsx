import React from 'react';
import { X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioItem } from '../types';

interface StatsModalProps {
  items: PortfolioItem[];
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ items, onClose }) => {
  // Simple stats calculation: Items per day
  const dataMap = items.reduce((acc, item) => {
    const date = new Date(item.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(dataMap).map(([name, count]) => ({ name, count }));

  if (chartData.length === 0) {
      chartData.push({ name: '오늘', count: 0 });
  }

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">나의 활동 통계</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
            <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-xl text-center">
                    <p className="text-sm text-indigo-500 font-semibold mb-1">총 작품 수</p>
                    <p className="text-3xl font-bold text-indigo-700">{items.length}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl text-center">
                    <p className="text-sm text-emerald-500 font-semibold mb-1">전시 시작일</p>
                    <p className="text-lg font-bold text-emerald-700">
                        {items.length > 0 
                            ? new Date(items[0].timestamp).toLocaleDateString() 
                            : '-'}
                    </p>
                </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-500 mb-4">날짜별 작품 활동</h4>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};