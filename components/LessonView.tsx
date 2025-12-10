import React from 'react';
import { LessonContent, DifficultyLevel } from '../types';

interface LessonViewProps {
  lesson: LessonContent;
  difficulty: DifficultyLevel;
  setDifficulty: (d: DifficultyLevel) => void;
  onGenerateQuiz: () => void;
  onGenerateVideo: (topic: string) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ 
  lesson, 
  difficulty, 
  setDifficulty, 
  onGenerateQuiz,
  onGenerateVideo 
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4 sticky top-0 z-10 bg-white/90 backdrop-blur-sm py-4 border-b border-academic-100">
         <div className="flex bg-academic-100 rounded-lg p-1">
            {Object.values(DifficultyLevel).map((level) => (
               <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                     difficulty === level 
                     ? 'bg-white text-primary shadow-sm' 
                     : 'text-academic-500 hover:text-academic-700'
                  }`}
               >
                  {level.replace('_', ' ')}
               </button>
            ))}
         </div>
         
         <div className="flex gap-2">
            <button onClick={() => onGenerateVideo(lesson.title)} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-2">
               <span>🎥</span> Generate Video
            </button>
            <button onClick={onGenerateQuiz} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-2">
               <span>📝</span> Take Quiz
            </button>
         </div>
      </div>

      <article className="prose prose-slate prose-lg max-w-none">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-academic-900 mb-6">{lesson.title}</h1>
        
        <div className="bg-academic-50 border-l-4 border-primary p-6 rounded-r-xl mb-10">
           <h3 className="text-academic-800 font-bold uppercase tracking-widest text-xs mb-2">Executive Summary</h3>
           <p className="text-academic-700 m-0 italic leading-relaxed">{lesson.summary}</p>
        </div>

        <div className="space-y-12">
           {lesson.sections.map((section, idx) => (
              <section key={idx} className="group">
                 <h2 className="text-2xl font-serif font-bold text-academic-800 mb-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-academic-100 text-academic-600 text-sm font-bold">
                       {idx + 1}
                    </span>
                    {section.heading}
                 </h2>
                 <div className="text-gray-700 leading-relaxed space-y-4 mb-6">
                    {section.content.split('\n').map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                 </div>
                 
                 <div className="bg-white border border-academic-200 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-academic-900 text-sm mb-3 uppercase flex items-center gap-2">
                       <span className="text-yellow-500">💡</span> Key Takeaways
                    </h4>
                    <ul className="grid md:grid-cols-2 gap-3">
                       {section.keyPoints.map((point, kpIdx) => (
                          <li key={kpIdx} className="flex items-start gap-2 text-sm text-academic-600">
                             <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-academic-400 flex-shrink-0"></span>
                             {point}
                          </li>
                       ))}
                    </ul>
                 </div>
              </section>
           ))}
        </div>
      </article>
    </div>
  );
};