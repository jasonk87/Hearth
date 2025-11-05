import React from 'react';
import { Modal } from './Modal';
import type { ChatMessage } from '../types';
import { SparklesIcon } from './icons';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
}

export const AiChatModal: React.FC<AiChatModalProps> = ({ isOpen, onClose, messages }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hearth Assistant">
      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-4 overflow-y-auto p-2">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
              <div className="text-center text-slate-400 pt-10">
                  <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-teal-400"/>
                  <p>Ask me anything!</p>
              </div>
          )}
        </div>
      </div>
    </Modal>
  );
};