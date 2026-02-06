
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

interface Obstruction {
    id: string;
    type: string;
    coordinates: number[];
    size: string;
    status: string;
}

interface WorkspaceMonitorProps {
    obstructions: Obstruction[];
}

const WorkspaceMonitor: React.FC<WorkspaceMonitorProps> = ({ obstructions }) => {
    const [scanY, setScanY] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setScanY(prev => (prev >= 100 ? 0 : prev + 1));
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full relative overflow-hidden bg-[#050505]">
            {/* HUD Grid */}
            <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'linear-gradient(#00F0FF 1px, transparent 1px), linear-gradient(90deg, #00F0FF 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}></div>
            
            {/* Scanner Sweep */}
            <div 
                className="absolute top-0 w-full h-[2px] bg-gem-blue shadow-[0_0_20px_#00F0FF] z-10 opacity-40 transition-all duration-75"
                style={{ top: `${scanY}%` }}
            ></div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Robot Path Line */}
                <path 
                    d="M 50 450 Q 250 250 450 450 T 850 450" 
                    fill="none" 
                    stroke="#00F0FF" 
                    strokeWidth="1" 
                    strokeDasharray="10 10"
                    className="opacity-20"
                />
                
                {/* Robot Unit */}
                <g className="animate-pulse">
                    <circle cx="50" cy="450" r="12" fill="#00FF94" opacity="0.2" />
                    <circle cx="50" cy="450" r="4" fill="#00FF94" />
                </g>
                
                {/* Obstruction Mapping */}
                {obstructions.map((o) => (
                    <g key={o.id} transform={`translate(${o.coordinates[0] * 8}, ${o.coordinates[1] * 8})`} className="animate-in zoom-in duration-500">
                        <circle r="25" fill={o.status === 'MISALIGNED' ? '#FF3E00' : '#00F0FF'} opacity="0.1" />
                        <rect 
                            x="-15" y="-15" width="30" height="30" 
                            fill={o.status === 'MISALIGNED' ? '#FF3E00' : '#00F0FF'} 
                            fillOpacity="0.3"
                            stroke={o.status === 'MISALIGNED' ? '#FF3E00' : '#00F0FF'}
                            strokeWidth="1"
                            transform={o.status === 'MISALIGNED' ? 'rotate(45)' : ''}
                        />
                        <text y="40" textAnchor="middle" className="text-[8px] fill-white opacity-40 uppercase tracking-widest font-mono">
                            {o.id} // {o.status}
                        </text>
                        {o.status === 'MISALIGNED' && (
                            <line x1="-20" y1="-20" x2="20" y2="20" stroke="#FF3E00" strokeWidth="2" strokeDasharray="3 3" />
                        )}
                    </g>
                ))}
            </svg>

            {/* Telemetry HUD */}
            <div className="absolute top-6 left-6 space-y-1">
                <div className="text-[8px] text-white/20 uppercase tracking-[0.4em]">Optic_Drive: Scanning...</div>
                <div className="text-[10px] text-gem-blue font-bold uppercase tracking-widest">Workspace_Sentinel_V5</div>
            </div>
            
            <div className="absolute bottom-6 right-6 text-right">
                <div className="text-[8px] text-white/20 uppercase tracking-[0.4em]">Integrity_Rating</div>
                <div className="text-xl font-black text-gem-teal">Stable_Build</div>
            </div>
        </div>
    );
};

export default WorkspaceMonitor;
