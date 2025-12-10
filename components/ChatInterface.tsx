import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { LessonContent } from '../types';
import { createChatSession } from '../services/geminiService';

interface ChatInterfaceProps {
  lesson: LessonContent | null;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ lesson }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lesson) {
      const newChat = createChatSession(lesson);
      setChat(newChat);
      setMessages([{ role: 'model', text: `Hello! I'm ready to discuss "${lesson.title}". What would you like to know?` }]);
    }
  }, [lesson]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chat) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      let fullResponse = "";
      const resultStream = await chat.sendMessageStream({ message: userMsg });
      
      // Temporary placeholder for streaming
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullResponse += c.text;
          setMessages(prev => {
            const newArr = [...prev];
            newArr[newArr.length - 1] = { role: 'model', text: fullResponse };
            return newArr;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!lesson) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-academic-500">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl font-bold text-academic-900">No Active Lesson</h2>
        <p>Please upload a document in the Dashboard to start chatting with the Professor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen max-w-4xl mx-auto bg-white border-x border-academic-100 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-academic-100 bg-white/95 backdrop-blur z-10 sticky top-0 flex items-center gap-3">
         <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-serif font-bold text-lg">P</div>
         <div>
            <h2 className="font-bold text-academic-900">Professor AI</h2>
            <p className="text-xs text-academic-500 truncate max-w-xs">{lesson.title}</p>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-academic-50 text-academic-800 border border-academic-100 rounded-tl-sm'
              }`}
            >
               <div className="prose prose-sm max-w-none text-inherit">
                 {msg.role === 'model' ? (
                   msg.text.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)
                 ) : (
                   msg.text
                 )}
               </div>
            </div>
          </div>
        ))}
        {isTyping && messages.length % 2 === 0 && ( // Simple check to show typing indicator if needed before stream starts
           <div className="flex justify-start">
             <div className="bg-academic-50 px-4 py-3 rounded-2xl rounded-tl-sm border border-academic-100">
                <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-academic-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-academic-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-academic-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-academic-100 bg-white">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the text..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-academic-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-14"
            disabled={isTyping}
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 top-2 p-2 bg-primary text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <p className="text-center text-xs text-academic-300 mt-2">AI can make mistakes. Verify important information.</p>
      </div>
    </div>
  );
};