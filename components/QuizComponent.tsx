import React, { useState } from 'react';
import { Quiz } from '../types';

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({ quiz, onComplete }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    setShowResult(true);
    if (idx === quiz.questions[currentQ].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const next = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      onComplete(score);
    }
  };

  const question = quiz.questions[currentQ];

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-[calc(100vh-100px)] justify-center">
      <div className="mb-6 flex justify-between items-center text-sm font-medium text-academic-500">
         <span>Question {currentQ + 1} of {quiz.questions.length}</span>
         <span>Score: {score}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-academic-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
           <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%`}}
           ></div>
        </div>

        <h2 className="text-xl md:text-2xl font-serif font-bold text-academic-900 mb-8 mt-2">
           {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((opt, idx) => {
             let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium ";
             if (showResult) {
                if (idx === question.correctAnswer) btnClass += "border-green-500 bg-green-50 text-green-700";
                else if (idx === selected) btnClass += "border-red-500 bg-red-50 text-red-700";
                else btnClass += "border-gray-100 opacity-50";
             } else {
                btnClass += selected === idx 
                   ? "border-primary bg-indigo-50 text-primary" 
                   : "border-gray-100 hover:border-academic-300 hover:bg-gray-50";
             }

             return (
               <button 
                 key={idx} 
                 onClick={() => !showResult && handleAnswer(idx)}
                 disabled={showResult}
                 className={btnClass}
               >
                 <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                        showResult && idx === question.correctAnswer ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                    }`}>
                        {String.fromCharCode(65 + idx)}
                    </div>
                    {opt}
                 </div>
               </button>
             );
          })}
        </div>

        {showResult && (
           <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm animate-fade-in">
              <strong>Explanation: </strong> {question.explanation}
           </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        {showResult && (
           <button 
             onClick={next}
             className="bg-academic-800 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-academic-900 transition-transform active:scale-95"
           >
             {currentQ === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
           </button>
        )}
      </div>
    </div>
  );
};