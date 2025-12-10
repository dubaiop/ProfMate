import React, { useEffect, useRef, useState } from 'react';
import { LiveTutorClient } from '../services/geminiService';
import { LessonContent } from '../types';

interface LiveTutorProps {
  lesson: LessonContent | null;
}

export const LiveTutor: React.FC<LiveTutorProps> = ({ lesson }) => {
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  const clientRef = useRef<LiveTutorClient | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Visualizer loop
    let animId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    const draw = () => {
       if (!canvas || !ctx) return;
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       
       const centerX = canvas.width / 2;
       const centerY = canvas.height / 2;
       const radius = 50 + (volume * 100); // Pulse effect based on volume
       
       if (connected) {
         ctx.beginPath();
         ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
         ctx.fillStyle = `rgba(79, 70, 229, ${0.2 + volume})`; // Indigo with opacity
         ctx.fill();
         
         ctx.beginPath();
         ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
         ctx.fillStyle = '#4f46e5';
         ctx.fill();
       } else {
         ctx.beginPath();
         ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
         ctx.fillStyle = '#94a3b8'; // Gray
         ctx.fill();
       }
       
       animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [volume, connected]);

  const toggleConnection = async () => {
    if (connected) {
      await clientRef.current?.disconnect();
      setConnected(false);
      setVolume(0);
    } else {
      clientRef.current = new LiveTutorClient();
      clientRef.current.onConnect = () => setConnected(true);
      clientRef.current.onDisconnect = () => setConnected(false);
      clientRef.current.onVolumeLevel = (v) => setVolume(v);
      
      try {
        let instruction = "You are ProfMate, a friendly, encouraging, and highly intelligent university professor. Answer the student's questions clearly.";
        
        if (lesson) {
          instruction += `\n\nCONTEXT:\nThe student has uploaded a lesson titled "${lesson.title}".\n`;
          instruction += `Summary: ${lesson.summary}\n`;
          instruction += `Key Sections: ${lesson.sections.map(s => s.heading).join(', ')}.\n`;
          instruction += `Key Points: ${lesson.sections.map(s => s.keyPoints.join('; ')).join('. ')}.\n`;
          instruction += `Use this context to answer questions specific to the material, but remain helpful for general questions too.`;
        }

        await clientRef.current.connect(instruction);
      } catch (err) {
        console.error("Live connection failed", err);
        alert("Failed to connect to microphone or API.");
        setConnected(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] p-6 text-center">
       <div className="mb-8">
          <h2 className="text-4xl font-serif font-bold text-academic-900">Office Hours</h2>
          <p className="text-academic-500 mt-2">Speak directly with your AI Professor.</p>
          {lesson && (
            <div className="mt-4 inline-block bg-indigo-50 text-primary px-4 py-1 rounded-full text-sm font-medium border border-indigo-100">
               Context: {lesson.title}
            </div>
          )}
       </div>

       <div className="relative mb-12">
          <canvas ref={canvasRef} width={300} height={300} className="w-64 h-64" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-4xl">{connected ? '🎙️' : '😴'}</span>
          </div>
       </div>

       <button 
         onClick={toggleConnection}
         className={`px-8 py-4 rounded-full text-lg font-bold shadow-xl transition-transform active:scale-95 ${
           connected 
           ? 'bg-red-500 hover:bg-red-600 text-white' 
           : 'bg-academic-800 hover:bg-academic-900 text-white'
         }`}
       >
         {connected ? 'End Session' : 'Start Conversation'}
       </button>
       
       <p className="mt-8 text-sm text-academic-400 max-w-md">
         {connected 
           ? "Listening... ask about your lesson, or request a deeper explanation." 
           : "Click start to enable your microphone and begin the live voice session."}
       </p>
    </div>
  );
};