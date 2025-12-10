import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LessonContent } from '../types';

interface DashboardProps {
  currentLesson: LessonContent | null;
  completedQuizzes: number;
  avgScore: number;
  onStartLesson: () => void;
  onStartLiveSession: () => void;
}

const data = [
  { name: 'Mon', hours: 2 },
  { name: 'Tue', hours: 3.5 },
  { name: 'Wed', hours: 1.5 },
  { name: 'Thu', hours: 4 },
  { name: 'Fri', hours: 3 },
  { name: 'Sat', hours: 5 },
  { name: 'Sun', hours: 2 },
];

export const Dashboard: React.FC<DashboardProps> = ({ currentLesson, completedQuizzes, avgScore, onStartLesson, onStartLiveSession }) => {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-academic-900">Welcome back, Scholar.</h1>
        <p className="text-academic-500 mt-2">Your AI Professor is ready to help you master new topics today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-academic-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-academic-400 uppercase tracking-wider">Lessons Mastered</p>
            <h3 className="text-4xl font-bold text-academic-800 mt-2">{currentLesson ? '1' : '0'}</h3>
          </div>
          <div className="mt-4 w-full bg-academic-100 rounded-full h-2">
            <div className="bg-academic-600 h-2 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-academic-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-academic-400 uppercase tracking-wider">Quiz Average</p>
            <h3 className="text-4xl font-bold text-academic-800 mt-2">{avgScore}%</h3>
          </div>
          <p className="text-green-600 text-sm font-medium flex items-center mt-2">
            <span className="mr-1">↑</span> 12% from last week
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-academic-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-academic-400 uppercase tracking-wider">Study Time</p>
            <h3 className="text-4xl font-bold text-academic-800 mt-2">12.5h</h3>
          </div>
           <div className="h-16 mt-2">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 5 ? '#4f46e5' : '#cbd5e1'} />
                    ))}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Current Lesson */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-academic-100 p-6">
          <h2 className="text-xl font-bold text-academic-900 mb-4 font-serif">Current Focus</h2>
          {currentLesson ? (
             <div className="flex items-start justify-between bg-academic-50 p-4 rounded-xl border border-academic-200">
                <div>
                   <h3 className="font-semibold text-lg text-academic-800">{currentLesson.title}</h3>
                   <p className="text-academic-500 text-sm mt-1 line-clamp-2">{currentLesson.summary}</p>
                   <button onClick={onStartLesson} className="mt-4 text-primary font-medium hover:underline">Continue Reading &rarr;</button>
                </div>
                <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm">
                  📚
                </div>
             </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
               <p className="text-academic-400">No active lessons. Upload a document to get started.</p>
            </div>
          )}
          
          <h2 className="text-xl font-bold text-academic-900 mt-8 mb-4 font-serif">Recommended for You</h2>
          <div className="space-y-3">
             <div className="flex items-center gap-4 p-3 hover:bg-academic-50 rounded-lg transition-colors cursor-pointer">
                <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">Q</div>
                <div>
                   <h4 className="text-sm font-semibold text-gray-800">Quick Quiz: Calculus I</h4>
                   <p className="text-xs text-gray-500">5 mins • 10 Questions</p>
                </div>
             </div>
             <div className="flex items-center gap-4 p-3 hover:bg-academic-50 rounded-lg transition-colors cursor-pointer">
                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">V</div>
                <div>
                   <h4 className="text-sm font-semibold text-gray-800">Video: Thermodynamics</h4>
                   <p className="text-xs text-gray-500">12 mins • Visual Explanation</p>
                </div>
             </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-academic-800 to-academic-900 rounded-2xl p-6 text-white flex flex-col justify-center items-center text-center">
            <h3 className="text-2xl font-serif font-bold mb-2">Have a question?</h3>
            <p className="text-academic-200 mb-6 text-sm">Ask your AI Professor instantly in a live voice session.</p>
            <button onClick={onStartLiveSession} className="bg-white text-academic-900 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-academic-50 transition-all transform hover:scale-105 active:scale-95">
               Start Live Session
            </button>
        </div>
      </div>
    </div>
  );
};