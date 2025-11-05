import React from 'react';
import { Widget } from './Widget';
import type { StoryPage } from '../types';
import { BookOpenTextIcon } from './icons';

interface StoryboardWidgetProps {
  story: StoryPage[];
  onClick?: () => void;
  className?: string;
}

export const StoryboardWidget: React.FC<StoryboardWidgetProps> = ({ story, onClick, className }) => {
  const latestPage = story.length > 0 ? story[story.length - 1] : null;

  return (
    <Widget title="Storyboard" onClick={onClick} titleAction={<BookOpenTextIcon className="text-teal-700" />} className={className}>
      <div className="h-full min-h-[150px] md:min-h-[200px] flex items-center justify-center rounded-lg overflow-hidden relative text-white">
        {latestPage ? (
          <>
            <img src={latestPage.imageUrl} alt="Latest story page" className="w-full h-full object-cover absolute inset-0" />
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative p-2 text-center">
              <h3 className="font-bold text-lg">Continue the Story!</h3>
              <p className="text-sm opacity-90 line-clamp-2">{latestPage.text}</p>
            </div>
          </>
        ) : (
          <div className="text-center text-stone-700">
            <h3 className="font-semibold text-lg">Let's create a story!</h3>
            <p className="text-stone-500 text-sm">Tap here to begin a new adventure.</p>
          </div>
        )}
      </div>
       <style>{`
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        `}</style>
    </Widget>
  );
};
