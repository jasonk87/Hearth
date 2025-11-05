import React from 'react';

interface OnScreenKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
}

const Key: React.FC<{
  value: string;
  onClick: (value: string) => void;
  className?: string;
}> = ({ value, onClick, className = '' }) => (
  <button
    onClick={() => onClick(value)}
    className={`h-12 rounded-lg bg-white/80 hover:bg-white text-slate-800 font-semibold flex items-center justify-center text-lg transition-colors shadow-sm ${className}`}
  >
    {value}
  </button>
);

const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({ onKeyPress, onClose }) => {
  const keysRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-100/90 backdrop-blur-lg p-2 z-50">
      <div className="max-w-3xl mx-auto space-y-1.5">
        <div className="flex justify-end mb-1">
            <button onClick={onClose} className="text-slate-600 hover:text-slate-900 px-3 py-1 text-sm">Close</button>
        </div>
        {keysRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {row.map((key) => (
              <Key key={key} value={key} onClick={onKeyPress} className="flex-1" />
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-1.5">
          <Key value="Space" onClick={onKeyPress} className="flex-grow-[4]" />
        </div>
      </div>
    </div>
  );
};

export default OnScreenKeyboard;