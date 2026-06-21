import React from 'react';
import { Modal } from './Modal';
import type { ChatMessage } from '../types';
import { SparklesIcon } from './icons';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
}

const BULLET_PATTERN = /^[*-]\s+(.*)/;
const NUMBERED_PATTERN = /^(\d+)\.\s+(.*)/;
const BOLD_PATTERN = /(\*\*.*?\*\*)/g;

const renderInlineMarkdown = (text: string): React.ReactNode[] =>
  text.split(BOLD_PATTERN).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-slate-900 drop-shadow-sm">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });

const MiniMarkdown: React.FC<{ text: string }> = ({ text }) => (
  <div className="space-y-1.5 text-base tracking-wide sm:text-lg">
    {text.split('\n').map((line, lineIndex) => {
      const bulletMatch = BULLET_PATTERN.exec(line);
      if (bulletMatch) {
        return (
          <div key={lineIndex} className="flex items-start gap-2 pl-2">
            <span aria-hidden="true" className="shrink-0 font-bold text-teal-500">•</span>
            <span>{renderInlineMarkdown(bulletMatch[1])}</span>
          </div>
        );
      }

      const numberedMatch = NUMBERED_PATTERN.exec(line);
      if (numberedMatch) {
        return (
          <div key={lineIndex} className="flex items-start gap-2 pl-2">
            <span className="shrink-0 font-semibold text-teal-600">{numberedMatch[1]}.</span>
            <span>{renderInlineMarkdown(numberedMatch[2])}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={lineIndex} aria-hidden="true" className="h-2" />;
      }

      return <p key={lineIndex}>{renderInlineMarkdown(line)}</p>;
    })}
  </div>
);

export const AiChatModal: React.FC<AiChatModalProps> = ({ isOpen, onClose, messages }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hearth Assistant">
      <div className="flex h-full max-h-[70vh] flex-col">
        <div className="min-h-0 flex-grow space-y-4 overflow-y-auto p-2">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'rounded-br-none bg-teal-600 text-white' : 'rounded-bl-none border border-slate-300/50 bg-slate-200/90 text-slate-800'}`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-base font-medium sm:text-lg">{msg.content}</p>
                ) : (
                  <MiniMarkdown text={msg.content} />
                )}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
              <div className="pt-16 text-center text-slate-400">
                  <SparklesIcon className="mx-auto mb-4 h-14 w-14 animate-pulse text-teal-400"/>
                  <p className="text-xl font-medium">Ask me anything!</p>
              </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
