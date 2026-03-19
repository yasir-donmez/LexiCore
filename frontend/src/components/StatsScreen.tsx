import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, Clock } from 'lucide-react';
import { getUserStats } from '../lib/api';
import type { UserStats } from '../types/index';

export const StatsScreen: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getUserStats('test-user-123');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) return <div className="p-10 text-center text-slate-400">Yükleniyor...</div>;

  const data = [
    { name: 'Toplam Deste', value: stats.total_decks, icon: BookOpen, color: '#3b82f6' },
    { name: 'Toplam Kelime', value: stats.total_flashcards, icon: Users, color: '#8b5cf6' },
    { name: 'Sıradaki Tekrar', value: stats.due_for_review, icon: Clock, color: '#f59e0b' },
    { name: 'Öğrenme Oranı', value: Math.round(stats.average_ease_factor * 40), icon: TrendingUp, color: '#10b981' },
  ];

  const chartData = [
    { name: 'Öğrenilen', value: stats.total_flashcards - stats.due_for_review },
    { name: 'Bekleyen', value: stats.due_for_review },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Performans Raporu</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {data.map((item) => (
          <div key={item.name} className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: `${item.color}15` }}>
              <item.icon className="w-6 h-6" style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.name}</p>
              <p className="text-2xl font-bold text-slate-900">{item.value}{item.name === 'Öğrenme Oranı' ? '%' : ''}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[40px]">
          <h2 className="text-xl font-bold mb-6">Öğrenme Verimliliği</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.filter(d => d.name !== 'Öğrenme Oranı')}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 rounded-[40px] flex flex-col">
          <h2 className="text-xl font-bold mb-6">Kelime Durumu</h2>
          <div className="flex-1 flex items-center justify-center h-64">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="flex flex-col gap-4 pr-10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-slate-600">Öğrenilen: {chartData[0].value}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm font-medium text-slate-600">Bekleyen: {chartData[1].value}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
