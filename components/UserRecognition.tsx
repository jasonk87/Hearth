
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { recognizeUser } from '../services/geminiService';
import type { User } from '../types';

interface UserRecognitionProps {
  isActive: boolean;
  enrolledUsers: User[];
  onUserRecognized: (userId: string) => void;
}

const CAPTURE_INTERVAL = 5000; // 5 seconds
const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;

export const UserRecognition: React.FC<UserRecognitionProps> = ({ isActive, enrolledUsers, onUserRecognized }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const stopRecognition = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startRecognition = useCallback(async () => {
    stopRecognition(); // Ensure any previous streams are stopped
    if (enrolledUsers.length === 0) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      intervalRef.current = window.setInterval(async () => {
        if (isProcessing || !videoRef.current || !canvasRef.current) return;
        
        setIsProcessing(true);
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (context) {
          context.drawImage(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
          const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          
          try {
            const userId = await recognizeUser(base64Image, enrolledUsers);
            if (userId) {
              onUserRecognized(userId);
              stopRecognition();
            }
          } catch (error) {
            console.error("User recognition API call failed:", error);
          }
        }
        setIsProcessing(false);

      }, CAPTURE_INTERVAL);

    } catch (err) {
      console.error("Error accessing camera for user recognition:", err);
      // Don't show a toast here to avoid spamming the user if permissions are denied.
      // The lack of the "scanning" icon is sufficient feedback.
    }
  }, [stopRecognition, isProcessing, enrolledUsers, onUserRecognized]);

  useEffect(() => {
    if (isActive) {
      startRecognition();
    } else {
      stopRecognition();
    }

    return () => {
      stopRecognition();
    };
  }, [isActive, startRecognition, stopRecognition]);

  return (
    <>
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} className="hidden" />
    </>
  );
};
