import React from 'react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleAction?: React.ReactNode;
  onClick?: () => void;
}

export const Widget: React.FC<WidgetProps> = ({ title, children, className = '', titleAction, onClick }) => {
  return (
    <div 
      className={`bg-white/60 backdrop-blur-xl border border-slate-200/40 rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col ${className} ${onClick ? 'cursor-pointer transition-all duration-300 hover:bg-white/80 hover:border-teal-600/70' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-teal-700">{title}</h2>
        {titleAction}
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};