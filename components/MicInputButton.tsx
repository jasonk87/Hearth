import React, { useCallback, useEffect, useState, useRef } from 'react';
import { MicIcon, RefreshCwIcon } from './icons';
import { transcribeAudio } from '../services/geminiService';
import { useToast } from './Toast';

interface MicInputButtonProps {
  onTranscription: (text: string) => void;
  className?: string;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read blob as base64 string."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const MicInputButton: React.FC<MicInputButtonProps> = ({ onTranscription, className }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { showToast } = useToast();

  const handleStopRecording = useCallback(() => {
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showToast('This browser does not support microphone recording.', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsRecording(true);
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const base64Audio = await blobToBase64(audioBlob);
          const transcribedText = await transcribeAudio(base64Audio, audioBlob.type);
          onTranscription(transcribedText);
          showToast('Transcription complete!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Transcription failed.', 'error');
        } finally {
            setIsTranscribing(false);
            mediaRecorderRef.current = null;
        }
      };

      recorder.start();
      recordingTimeoutRef.current = window.setTimeout(handleStopRecording, 20_000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      showToast('Could not access microphone.', 'error');
      setIsRecording(false);
    }
  };

  useEffect(() => () => {
    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);
  
  const handleClick = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTranscribing}
      className={`flex-shrink-0 flex items-center justify-center p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-600 hover:bg-slate-500 text-white'
      } ${className}`}
      aria-label={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing recording' : 'Start recording'}
    >
      {isTranscribing ? (
        <RefreshCwIcon className="w-5 h-5 animate-spin" />
      ) : (
        <MicIcon className="w-5 h-5" />
      )}
    </button>
  );
};
