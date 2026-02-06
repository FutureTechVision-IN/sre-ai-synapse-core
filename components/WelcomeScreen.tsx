
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import HolographicFace from './HolographicFace';
import ProgressBar from './ProgressBar';

interface WelcomeScreenProps {
    onUpload: () => Promise<void>;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    isUploading?: boolean;
    uploadProgress?: number;
    onAdminClick: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUpload, files, setFiles, isUploading, uploadProgress, onAdminClick }) => {
    const [isDragging, setIsDragging] = useState(false);

    // Updated supported types to match the robust ingestion logic (removed unsupported binary docs like .docx/.xlsx)
    const supportedTypes = "image/*,audio/*,video/*,.pdf,.txt,.md,.csv,.json,.log,.xml,.yaml,.py,.js,.ts,.cpp,.h,.go,.rs,.sh,.sql,.html,.css";

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };
    
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            setFiles(prev => [...prev, ...Array.from(event.dataTransfer.files)]);
        }
    }, [setFiles]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);
    
    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleRemoveFile = (indexToRemove: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    if (isUploading) {
        return (
            <div className="h-screen w-full bg-gem-onyx flex flex-col items-center justify-center p-20 animate-in fade-in zoom-in duration-500">
                <ProgressBar 
                    progress={uploadProgress || 0} 
                    total={100} 
                    message="INGESTING_TECHNICAL_DATA" 
                    fileName={files.map(f => f.name).join(', ')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gem-onyx relative overflow-hidden font-sans">
            {/* HUD Header - Dominant Top Center */}
            <div className="absolute top-12 left-0 w-full flex flex-col items-center justify-center z-50 pointer-events-none">
                <h1 className="text-8xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_30_rgba(0,240,255,0.4)] leading-none text-center">
                    SRE SYNAPSE
                </h1>
                <div className="flex items-center space-x-6 mt-4">
                     <div className="h-[1px] w-32 bg-gradient-to-r from-transparent to-gem-blue"></div>
                     <p className="text-gem-blue/80 font-mono-data text-[10px] tracking-[0.6em] uppercase">System Yield // Neural Agentic Core</p>
                     <div className="h-[1px] w-32 bg-gradient-to-l from-transparent to-gem-blue"></div>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="flex flex-grow h-full items-center pt-32">
                
                {/* Left Flank: Operations */}
                <div className="w-1/2 flex flex-col justify-center px-16 lg:px-32 relative z-20 space-y-12">
                    
                    {/* Directive 01: Cognition */}
                    <div className="space-y-4">
                         <div className="flex items-center space-x-4 opacity-40">
                             <span className="font-mono-data text-gem-teal text-xs">01</span>
                             <h3 className="text-white font-bold tracking-[0.3em] uppercase text-[10px]">Initialize Cognition Protocol</h3>
                        </div>
                        <div className="w-full px-8 py-5 border border-gem-teal/20 bg-gem-teal/5 text-gem-teal font-mono-data text-xs rounded-sm uppercase tracking-[0.3em] flex items-center shadow-[0_0_15px_rgba(0,255,148,0.05)]">
                            <span className="w-2 h-2 bg-gem-teal rounded-full animate-ping mr-4"></span>
                            NEURAL_CORE_ONLINE // AUTH_VERIFIED
                        </div>
                    </div>

                    {/* Directive 02: Ingestion */}
                    <div className="space-y-6">
                         <div className="flex items-center space-x-4 opacity-40">
                             <span className="font-mono-data text-gem-teal text-xs">02</span>
                             <h3 className="text-white font-bold tracking-[0.3em] uppercase text-[10px]">Initiate Data Stream Ingestion</h3>
                        </div>
                        
                        <div 
                            className={`relative border border-dashed border-gem-blue/20 bg-gem-blue/5 hover:border-gem-blue/60 rounded-sm p-10 transition-all cursor-pointer group ${isDragging ? 'bg-gem-blue/10 border-gem-blue scale-[1.02]' : ''}`}
                            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                        >
                            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept={supportedTypes}/>
                            <label 
                                htmlFor="file-upload" 
                                className="cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex flex-col">
                                    <span className="font-mono-data text-sm text-white/80 group-hover:text-gem-blue tracking-[0.2em] uppercase transition-colors">Select_Schematics</span>
                                    <span className="text-[8px] text-white/20 uppercase mt-1 tracking-widest">Docs, Logs, Financial Statements, Tax Forms</span>
                                </div>
                                <div className="w-10 h-10 rounded-full border border-gem-blue/30 flex items-center justify-center text-gem-blue group-hover:bg-gem-blue group-hover:text-gem-onyx transition-all">
                                    <span className="text-2xl mt-[-2px]">+</span>
                                </div>
                            </label>

                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gem-blue/40 group-hover:border-gem-blue"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gem-blue/40 group-hover:border-gem-blue"></div>
                        </div>

                         {/* File Load Status */}
                        {files.length > 0 && (
                            <div className="animate-in slide-in-from-left-4">
                                <ul className="mb-6 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-4">
                                    {files.map((file, index) => (
                                        <li key={index} className="flex justify-between items-center text-[10px] font-mono-data text-gem-blue/60 py-2 border-b border-gem-blue/5 group">
                                            <span className="truncate max-w-[200px]">{file.name}</span>
                                            <button onClick={() => handleRemoveFile(index)} className="text-red-500/50 hover:text-red-500 transition-colors uppercase">[PURGE]</button>
                                        </li>
                                    ))}
                                </ul>
                                <button 
                                    onClick={onUpload}
                                    className="w-full py-5 bg-gem-blue text-gem-onyx font-black text-sm uppercase tracking-[0.4em] hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98]"
                                >
                                    EXECUTE_SYNAPSE_LOAD
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: The 3D Neural Face */}
                <div className="w-1/2 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gem-onyx via-transparent to-transparent z-10 pointer-events-none"></div>
                    
                    <div className="transform scale-[1.6] opacity-90 relative z-0">
                         <HolographicFace state="idle" />
                    </div>

                    {/* Operational Telemetry Overlays */}
                    <div className="absolute bottom-12 right-24 text-right space-y-2 font-mono-data opacity-30 pointer-events-none">
                        <div className="text-[10px] text-gem-teal tracking-widest uppercase animate-pulse">Neural_Sync: Verified</div>
                        <div className="text-[9px] text-gem-blue tracking-[0.2em] uppercase">Mem_Load: {files.length * 4}.2%</div>
                        <div className="text-[8px] text-white/40 tracking-tighter">SIG_UUID: {Math.random().toString(16).substring(2, 10).toUpperCase()}</div>
                    </div>
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="absolute bottom-0 left-0 w-full p-6 border-t border-gem-blue/5 bg-gem-onyx/80 backdrop-blur-md flex justify-between items-center text-[8px] font-mono-data tracking-[0.4em] text-gem-blue/30">
                 <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                        <div className="w-1 h-1 bg-gem-teal rounded-full mr-3 animate-ping"></div>
                        STABLE_BUILD // V_3.12.0
                    </div>
                    <button 
                        onClick={onAdminClick}
                        className="hover:text-gem-blue transition-colors border-l border-white/5 pl-6"
                    >
                        SEC_GATEWAY_UPLINK
                    </button>
                 </div>
                 <div className="flex space-x-8 uppercase">
                    <span>latency: 0.8ms</span>
                    <span>uplink: direct_neural</span>
                    <span>encryption: aes_256_synapse</span>
                 </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
