
import React from 'react';
import { Widget } from './Widget';
import type { FamilyMessage, User } from '../types';
import { MessageSquareIcon } from './icons';

interface MessengerWidgetProps {
  messages: FamilyMessage[];
  users: User[];
  onClick?: () => void;
  className?: string;
}

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
}

export const MessengerWidget: React.FC<MessengerWidgetProps> = ({ messages, users, onClick, className }) => {
    const getAuthor = (authorId: string) => users.find(u => u.id === authorId) || { name: 'Unknown', avatar: '?' };

    return (
        <Widget title="Family Messenger" onClick={onClick} className={className} titleAction={<MessageSquareIcon className="text-teal-700" />}>
            <div className="space-y-3 h-full overflow-y-auto max-h-[150px] md:max-h-[200px] pr-2">
                {messages.length === 0 ? (
                    <p className="text-stone-500 text-center pt-8">No messages yet.</p>
                ) : (
                    messages.slice(0, 3).map(message => {
                        const author = getAuthor(message.authorId);
                        return (
                            <div key={message.id} className="flex items-start gap-3">
                                <span className="text-3xl mt-1">{author.avatar}</span>
                                <div className="flex-grow bg-stone-100/70 p-2 rounded-lg">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-semibold text-stone-800 text-sm">{author.name}</p>
                                        <p className="text-xs text-stone-500">{timeSince(new Date(message.timestamp))}</p>
                                    </div>
                                    <p className="text-stone-700">{message.text}</p>
                                </div>
                            </div>
                        )
                    })
                )}
                 {messages.length > 3 && <p className="text-slate-500 text-center text-sm pt-2">...and {messages.length - 3} more</p>}
            </div>
        </Widget>
    );
};
