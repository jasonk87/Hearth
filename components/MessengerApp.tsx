

import React, { useState, useEffect, useRef } from 'react';
import type { FamilyMessage, User } from '../types';
import { MicInputButton } from './MicInputButton';

interface MessengerAppProps {
  messages: FamilyMessage[];
  users: User[];
  currentUser: User;
  onAddMessage: (text: string, authorId: string) => void;
  onNewMessageFocus: () => void;
  activeInputKey?: string;
  newMessageText: string;
  setNewMessageText: (text: string) => void;
}

export const MessengerApp: React.FC<MessengerAppProps> = ({ 
    messages, users, currentUser, onAddMessage, 
    onNewMessageFocus, activeInputKey, newMessageText, setNewMessageText
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getAuthor = (authorId: string) => {
        return users.find(u => u.id === authorId) || { name: 'Unknown', avatar: '?' };
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessageText.trim()) {
            onAddMessage(newMessageText, currentUser.id);
        }
    };
    
    const handleTranscription = (text: string) => {
        setNewMessageText(prev => prev ? `${prev} ${text}` : text);
    };
    
    return (
        <div className="flex flex-col h-full text-slate-200">
            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                {messages.map((message, index) => {
                    const author = getAuthor(message.authorId);
                    const isCurrentUser = message.authorId === currentUser.id;
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showAuthor = !prevMessage || prevMessage.authorId !== message.authorId;

                    return (
                        <div key={message.id} className={`flex items-end gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <div className="w-10 h-10 text-3xl flex-shrink-0">
                                {showAuthor && !isCurrentUser && <span>{author.avatar}</span>}
                            </div>
                            <div className="w-full max-w-xl">
                                {showAuthor && !isCurrentUser && <p className="text-sm text-slate-400 mb-1 ml-2">{author.name}</p>}
                                <div className={`p-3 rounded-2xl text-lg ${isCurrentUser ? 'bg-teal-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                    <p className="whitespace-pre-wrap">{message.text}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 flex gap-3">
                 <div className="relative flex-grow">
                    <textarea
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        onFocus={onNewMessageFocus}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder={currentUser.id === 'family' ? 'Select a profile to send messages' : `Message as ${currentUser.name}...`}
                        className={`w-full h-14 bg-slate-900/50 text-slate-200 p-3 pr-14 rounded-lg focus:outline-none transition-shadow resize-none ${activeInputKey === 'new-message' ? 'ring-2 ring-teal-500' : 'focus:ring-2 focus:ring-teal-500'}`}
                        rows={1}
                        disabled={currentUser.id === 'family'}
                    />
                     <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <MicInputButton onTranscription={handleTranscription} />
                     </div>
                 </div>
                 <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50" disabled={currentUser.id === 'family'}>
                    Send
                </button>
            </form>
        </div>
    );
};