import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { LessonView } from './components/LessonView';
import { ChatInterface } from './components/ChatInterface';
import { QuizComponent } from './components/QuizComponent';
import { VideoGenerator } from './components/VideoGenerator';
import { LiveTutor } from './components/LiveTutor';
import { AppMode, DifficultyLevel, LessonContent, Quiz } from './types';
import { generateLesson, generateQuiz } from './services/geminiService';

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col md:flex-row items-center gap-2 p-3 w-full md:w-auto md:justify-start justify-center rounded-xl transition-colors ${
      active ? 'bg-indigo-50 text-primary font-semibold' : 'text-academic-500 hover:bg-gray-50 hover:text-academic-700'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-xs md:text-sm">{label}</span>
  </button>
);

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.STANDARD);
  
  // Dashboard Stats
  const [completedQuizzes, setCompletedQuizzes] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  // File Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        try {
           const newLesson = await generateLesson(base64Data, file.type, difficulty);
           setLesson(newLesson);
           setMode(AppMode.LESSON);
        } catch (err) {
           console.error(err);
           alert("Failed to analyze document. Please ensure you have a valid API Key.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setLoading(false);
      alert("Error reading file");
    }
  };

  const handleCreateQuiz = async () => {
    if (!lesson) return;
    setLoading(true);
    try {
      // Create a context string from the lesson
      const context = `Title: ${lesson.title}\nSummary: ${lesson.summary}\n${lesson.sections.map(s => s.content).join('\n')}`;
      const newQuiz = await generateQuiz(context);
      setQuiz(newQuiz);
      setMode(AppMode.QUIZ);
    } catch (err) {
      alert("Could not generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (score: number) => {
    setCompletedQuizzes(p => p + 1);
    setTotalScore(p => p + (score * 20)); // Assuming 5 questions -> 20pts each
    alert(`Quiz Complete! Score: ${score}/5`);
    setMode(AppMode.DASHBOARD);
    setQuiz(null);
  };

  // Regeneration on difficulty change
  const handleDifficultyChange = async (newDiff: DifficultyLevel) => {
     setDifficulty(newDiff);
     // Note: In a real app, we would re-upload/re-process. 
     // For this demo, we assume the user uploads again for a new difficulty
     // or we would store the original file data. 
     // Simplification: Alert user to re-upload for now or just change state.
     alert("Difficulty setting updated for next upload/generation.");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col justify-between z-20">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-academic-900 font-serif font-bold text-xl">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">P</div>
             ProfMate
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem 
            icon="📊" 
            label="Dashboard" 
            active={mode === AppMode.DASHBOARD} 
            onClick={() => setMode(AppMode.DASHBOARD)} 
          />
          <NavItem 
            icon="📖" 
            label="Study Room" 
            active={mode === AppMode.LESSON} 
            onClick={() => setMode(AppMode.LESSON)} 
          />
          <NavItem 
            icon="💬" 
            label="Tutor Chat" 
            active={mode === AppMode.CHAT} 
            onClick={() => setMode(AppMode.CHAT)} 
          />
          <NavItem 
            icon="📝" 
            label="Quiz Arena" 
            active={mode === AppMode.QUIZ} 
            onClick={() => {
               if (quiz) setMode(AppMode.QUIZ);
               else if (lesson) handleCreateQuiz();
               else alert("Study a lesson first!");
            }} 
          />
          <NavItem 
            icon="🎥" 
            label="Media Lab" 
            active={mode === AppMode.VIDEO} 
            onClick={() => setMode(AppMode.VIDEO)} 
          />
          <NavItem 
            icon="🎙️" 
            label="Live Tutor" 
            active={mode === AppMode.LIVE_TUTOR} 
            onClick={() => setMode(AppMode.LIVE_TUTOR)} 
          />
        </nav>

        <div className="p-6 border-t border-gray-100">
           <label className="flex flex-col gap-2 cursor-pointer group">
              <span className="text-sm font-medium text-academic-600 group-hover:text-primary transition-colors">Upload Material</span>
              <div className="border-2 border-dashed border-academic-200 rounded-xl p-4 text-center hover:bg-indigo-50 hover:border-primary transition-all">
                 <span className="text-2xl block mb-1">📄</span>
                 <span className="text-xs text-academic-400">PDF, Img, or TXT</span>
              </div>
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,image/*" disabled={loading} />
           </label>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
         {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
               <div className="w-16 h-16 border-4 border-indigo-200 border-t-primary rounded-full animate-spin mb-4"></div>
               <h3 className="text-xl font-bold text-academic-800 animate-pulse">Analyzing Content...</h3>
               <p className="text-academic-500">ProfMate is reading your document.</p>
            </div>
         )}

         {mode === AppMode.DASHBOARD && (
           <Dashboard 
             currentLesson={lesson} 
             completedQuizzes={completedQuizzes} 
             avgScore={completedQuizzes > 0 ? Math.round(totalScore / completedQuizzes * 20) : 0} // visual score representation
             onStartLesson={() => setMode(AppMode.LESSON)}
             onStartLiveSession={() => setMode(AppMode.LIVE_TUTOR)}
           />
         )}

         {mode === AppMode.LESSON && (
            lesson ? (
               <LessonView 
                 lesson={lesson} 
                 difficulty={difficulty}
                 setDifficulty={handleDifficultyChange}
                 onGenerateQuiz={handleCreateQuiz}
                 onGenerateVideo={(topic) => { setMode(AppMode.VIDEO); }}
               />
            ) : (
               <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-lg">
                     <span className="text-6xl mb-6 block">📚</span>
                     <h2 className="text-2xl font-bold text-academic-900 mb-2">Library Empty</h2>
                     <p className="text-academic-500 mb-6">Upload lecture notes, a book chapter (PDF), or an image to begin your session.</p>
                     <label className="bg-primary text-white px-8 py-3 rounded-full font-bold cursor-pointer hover:bg-indigo-700 transition-colors">
                        Upload Document
                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,image/*" />
                     </label>
                  </div>
               </div>
            )
         )}
         
         {mode === AppMode.CHAT && (
            <ChatInterface lesson={lesson} />
         )}

         {mode === AppMode.QUIZ && (
            quiz ? (
               <QuizComponent quiz={quiz} onComplete={handleQuizComplete} />
            ) : (
               <div className="h-full flex items-center justify-center">
                  <p className="text-academic-400">No active quiz.</p>
               </div>
            )
         )}

         {mode === AppMode.VIDEO && (
            <VideoGenerator initialTopic={lesson?.title || ''} />
         )}

         {mode === AppMode.LIVE_TUTOR && (
            <LiveTutor lesson={lesson} />
         )}
      </main>
    </div>
  );
}