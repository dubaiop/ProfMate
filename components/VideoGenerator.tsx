import React, { useEffect, useState } from 'react';
import { generateEducationalVideo } from '../services/geminiService';

interface VideoGeneratorProps {
  initialTopic: string;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ initialTopic }) => {
  const [prompt, setPrompt] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setVideoUri(null);

    try {
      const uri = await generateEducationalVideo(prompt);
      setVideoUri(uri);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate video");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTopic) handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <h2 className="text-3xl font-serif font-bold text-academic-900 mb-2">Visual Learning Lab</h2>
      <p className="text-academic-500 mb-8">Generate cinematic AI explanations for complex topics.</p>

      <div className="flex gap-2 max-w-lg mx-auto mb-10">
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a topic (e.g. Quantum Entanglement)..."
          className="flex-1 border border-academic-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating...' : 'Create'}
        </button>
      </div>

      <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative flex items-center justify-center">
        {loading ? (
           <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
              <p className="text-white font-medium animate-pulse">Thinking & Rendering...</p>
              <p className="text-white/50 text-sm mt-2">This may take a minute.</p>
           </div>
        ) : videoUri ? (
          <video 
            src={videoUri} 
            controls 
            autoPlay 
            className="w-full h-full object-cover" 
          />
        ) : error ? (
           <div className="text-red-400 p-8">
              <p className="font-bold text-lg">Generation Failed</p>
              <p className="text-sm mt-2">{error}</p>
              <button onClick={handleGenerate} className="mt-4 text-white underline">Try Again</button>
           </div>
        ) : (
           <div className="text-white/30 flex flex-col items-center">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <p>Enter a topic to generate a video lesson</p>
           </div>
        )}
      </div>
      
      <p className="mt-6 text-sm text-academic-400">
        Powered by Google Veo. Requires a paid project API key.
      </p>
    </div>
  );
};