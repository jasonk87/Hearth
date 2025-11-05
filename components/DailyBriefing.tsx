
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '../types';
import { getBriefingAudio, decode, decodeAudioData } from '../services/geminiService';
import { XIcon, SparklesIcon, PlayIcon, PauseIcon, RefreshCwIcon } from './icons';

interface DailyBriefingProps {
  user: User;
  briefingText: string;
  onClose: () => void;
}

export const DailyBriefing: React.FC<DailyBriefingProps> = ({ user, briefingText, onClose }) => {
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudio = useCallback(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    
    // Stop any existing source
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    
    audioSourceRef.current = source;
    setIsPlaying(true);
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const togglePlayback = () => {
    if (isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
  }

  useEffect(() => {
    let isCancelled = false;
    
    const setupAudio = async () => {
        try {
            const base64Audio = await getBriefingAudio(briefingText);
            if (isCancelled) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
            
            if (isCancelled) return;

            audioBufferRef.current = audioBuffer;
            setIsLoadingAudio(false);
            playAudio();
        } catch (err) {
            console.error("Failed to load briefing audio:", err);
            setError("Couldn't load audio for the briefing.");
            setIsLoadingAudio(false);
        }
    };

    setupAudio();

    return () => {
        isCancelled = true;
        pauseAudio();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
            audioContextRef.current = null;
        }
    };
  }, [briefingText, playAudio, pauseAudio]);


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] flex items-center justify-center p-4">
      <div 
        className="bg-slate-50/95 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up-fast flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200/80 flex-shrink-0">
            <div className="flex items-center gap-3">
                <SparklesIcon className="w-6 h-6 text-yellow-400"/>
                <h3 className="text-xl font-bold text-teal-600">A Morning Briefing for {user.name}</h3>
            </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <XIcon className="w-6 h-6 text-slate-500" />
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto text-slate-600">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{briefingText}</p>
        </main>

        <footer className="p-4 border-t border-slate-200/80 bg-slate-100/50 rounded-b-2xl flex justify-between items-center">
             <div className="flex items-center gap-4">
                <button 
                    onClick={togglePlayback}
                    className="w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                    disabled={isLoadingAudio || !!error}
                >
                    {isLoadingAudio ? <RefreshCwIcon className="w-6 h-6 animate-spin"/> : (isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>)}
                </button>
                {error && <span className="text-red-400 text-sm">{error}</span>}
            </div>
            <button
                onClick={onClose}
                className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Dismiss
            </button>
        </footer>
      </div>
    </div>
  );
};