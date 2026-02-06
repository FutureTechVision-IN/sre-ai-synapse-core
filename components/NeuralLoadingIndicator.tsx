
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

export type LoadingVariant = 'pulse' | 'progress' | 'spinner' | 'terminal';

interface NeuralLoadingIndicatorProps {
    variant: LoadingVariant;
    message?: string;
    subMessage?: string;
    progress?: number;
    isError?: boolean;
}

const NeuralLoadingIndicator: React.FC<NeuralLoadingIndicatorProps> = ({ 
    variant, 
    message = "Processing_Neural_Stream", 
    subMessage,
    progress = 0,
    isError = false
}) => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const colorClass = isError ? 'text-red-500' : 'text-gem-blue';
    const borderColorClass = isError ? 'border-red-500/40' : 'border-gem-blue/40';
    const bgClass = isError ? 'bg-red-500/5' : 'bg-gem-blue/5';
    const accentClass = isError ? 'bg-red-500' : 'bg-gem-blue';

    const renderPulse = () => (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="relative w-20 h-20">
                <div className={`absolute inset-0 rounded-full border-4 ${borderColorClass} animate-ping opacity-20`}></div>
                <div className={`absolute inset-4 rounded-full border-2 ${borderColorClass} animate-pulse`}></div>
                <div className={`absolute inset-0 flex items-center justify-center`}>
                    <div className={`w-4 h-4 rounded-full ${accentClass} shadow-[0_0_15px_rgba(0,240,255,0.8)]`}></div>
                </div>
            </div>
            <div className="text-center">
                <p className={`text-[10px] font-mono-data font-bold uppercase tracking-[0.4em] ${colorClass}`}>{message}{dots}</p>
                {subMessage && <p className="text-[9px] text-white/20 uppercase tracking-widest mt-2">{subMessage}</p>}
            </div>
        </div>
    );

    const renderProgress = () => (
        <div className={`w-full max-w-md p-6 border ${borderColorClass} ${bgClass} glass-card relative overflow-hidden animate-in slide-in-from-left-4`}>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gem-blue/40 to-transparent animate-scan"></div>
            <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] font-mono-data uppercase tracking-widest ${colorClass}`}>{message}</span>
                <span className={`text-[10px] font-mono-data ${colorClass}`}>{Math.floor(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div 
                    className={`h-full transition-all duration-300 ease-out ${accentClass} shadow-[0_0_10px_rgba(0,240,255,0.5)]`} 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="mt-4 flex justify-between text-[8px] text-white/20 uppercase font-mono-data tracking-tighter">
                <span>BUFFER_SATURATION: {((progress / 100) * 8).toFixed(1)}MB</span>
                <span>PACKET_LOSS: 0.00%</span>
            </div>
        </div>
    );

    const renderSpinner = () => (
        <div className="flex items-center space-x-6 p-4 border border-white/5 bg-white/[0.02] rounded-sm">
            <div className="relative w-10 h-10 shrink-0">
                <div className={`absolute inset-0 border-2 border-t-transparent ${borderColorClass} rounded-full animate-spin`}></div>
                <div className={`absolute inset-2 border-2 border-b-transparent ${borderColorClass} rounded-full animate-spin-slow opacity-40`}></div>
                <div className={`absolute inset-[14px] w-1.5 h-1.5 ${accentClass} rounded-full animate-pulse`}></div>
            </div>
            <div className="flex flex-col">
                <p className={`text-[10px] font-mono-data uppercase tracking-[0.3em] font-black ${colorClass}`}>{message}</p>
                {subMessage && <p className="text-[8px] text-white/20 uppercase tracking-widest mt-0.5">{subMessage}</p>}
            </div>
        </div>
    );

    const renderTerminal = () => (
        <div className={`w-full max-w-2xl p-5 border ${borderColorClass} ${bgClass} glass-card font-mono-data overflow-hidden`}>
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${accentClass} animate-pulse`}></div>
                    <span className={`text-[9px] uppercase tracking-[0.2em] ${colorClass}`}>Diagnostic_Kernel_v4.2</span>
                </div>
                <span className="text-[8px] text-white/10">SYS_TIME: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-hidden">
                <div className="flex space-x-3 text-[9px]">
                    <span className="text-white/20">[0.002s]</span>
                    <span className="text-white/60 uppercase">Init_Handshake: OK</span>
                </div>
                <div className="flex space-x-3 text-[9px]">
                    <span className="text-white/20">[0.415s]</span>
                    <span className="text-white/60 uppercase">Ingest_Context: {subMessage?.substring(0, 30)}...</span>
                </div>
                <div className="flex space-x-3 text-[9px] animate-pulse">
                    <span className="text-white/20">[{ (progress/100).toFixed(3) }s]</span>
                    <span className={colorClass}>&gt; {message.toUpperCase()}_STREAM_READING</span>
                </div>
                <div className="flex space-x-3 text-[8px] opacity-20 mt-4 italic">
                    <span>NEURAL_DRIFT: {(Math.random() * 0.05).toFixed(5)}</span>
                </div>
            </div>
        </div>
    );

    const content = () => {
        switch(variant) {
            case 'pulse': return renderPulse();
            case 'progress': return renderProgress();
            case 'spinner': return renderSpinner();
            case 'terminal': return renderTerminal();
            default: return renderSpinner();
        }
    }

    return (
        <div 
            role="status" 
            aria-live="polite" 
            className="w-full flex justify-center py-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
            {content()}
        </div>
    );
};

export default NeuralLoadingIndicator;
