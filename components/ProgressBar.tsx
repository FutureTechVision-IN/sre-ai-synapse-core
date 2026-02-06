
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
  message: string;
  fileName?: string;
  icon?: React.ReactNode;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total, message, fileName, icon }) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center font-mono-data">
        {icon && <div className="mb-8">{icon}</div>}
        <h2 className="text-xs uppercase tracking-[0.6em] text-gem-blue mb-4 animate-pulse">{message}</h2>
        
        <div className="w-full max-w-md bg-gem-blue/5 border border-gem-blue/20 rounded-sm h-6 relative overflow-hidden flex items-center px-1">
            <div
                className="bg-gem-blue h-3 rounded-sm transition-all duration-300 ease-out shadow-[0_0_15px_rgba(0,240,255,0.6)]"
                style={{ width: `${percentage}%` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-scan w-20 pointer-events-none"></div>
        </div>

        <div className="flex justify-between w-full max-w-md mt-4 text-[10px] uppercase tracking-widest text-white/40">
            <p className="truncate max-w-[250px]" title={fileName}>Ingesting: {fileName || 'Scanning_Stream'}</p>
            <p className="tabular-nums">{percentage.toFixed(1)}%</p>
        </div>
        
        <div className="mt-8 flex space-x-2">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1 h-4 bg-gem-blue ${i <= Math.floor(percentage/20) ? 'opacity-100' : 'opacity-10'} animate-pulse`} style={{ animationDelay: `${i * 100}ms` }}></div>
            ))}
        </div>
    </div>
  );
};

export default ProgressBar;
