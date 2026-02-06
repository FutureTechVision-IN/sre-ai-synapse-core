/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback } from 'react';
import UploadCloudIcon from './icons/UploadCloudIcon';
import CarIcon from './icons/CarIcon';
import WashingMachineIcon from './icons/WashingMachineIcon';
import Spinner from './Spinner';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => void;
}

const sampleDocuments = [
    {
        name: 'Hyundai i10 Manual',
        url: 'https://www.hyundai.com/content/dam/hyundai/in/en/data/connect-to-service/owners-manual/2025/i20&i20nlineFromOct2023-Present.pdf',
        icon: <CarIcon />,
        fileName: 'hyundai-i10-manual.pdf'
    },
    {
        name: 'LG Washer Manual',
        url: 'https://www.lg.com/us/support/products/documents/WM2077CW.pdf',
        icon: <WashingMachineIcon />,
        fileName: 'lg-washer-manual.pdf'
    }
];

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [loadingSample, setLoadingSample] = useState<string | null>(null);

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
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    }, []);
    
    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleSelectSample = async (name: string, url: string, fileName: string) => {
        if (loadingSample) return;
        setLoadingSample(name);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${name}: ${response.statusText}`);
            }
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: blob.type });
            setFiles(prev => [...prev, file]);
        } catch (error) {
            console.error("Error fetching sample file:", error);
            alert(`Could not fetch the sample document. This might be due to CORS policy. Please try uploading a local file.`);
        } finally {
            setLoadingSample(null);
        }
    };

    const handleConfirmUpload = () => {
        onUpload(files);
        handleClose();
    };

    const handleClose = () => {
        setFiles([]);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="upload-title">
            <div className="bg-gem-slate p-8 rounded-xl shadow-2xl border border-gem-cyan/20 w-[600px] max-w-[90vw] relative animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 id="upload-title" className="text-2xl font-bold bg-gradient-to-r from-gem-cyan to-gem-blue bg-clip-text text-transparent mb-6 flex items-center gap-3">
                    <UploadCloudIcon className="w-6 h-6 text-gem-cyan" />
                    Upload Documents
                </h2>
                
                <div 
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                        border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 mb-6
                        ${isDragging ? 'border-gem-cyan bg-gem-cyan/10' : 'border-slate-600 hover:border-slate-500'}
                    `}
                >
                    <input 
                        type="file" 
                        id="file-upload" 
                        multiple 
                        className="hidden" 
                        onChange={handleFileChange}
                    />
                    <label 
                        htmlFor="file-upload" 
                        className="cursor-pointer flex flex-col items-center gap-4 group"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                            <UploadCloudIcon className="w-8 h-8 text-gem-cyan" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-medium text-white">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-sm text-slate-400">
                                PDF, JPG, PNG, TXT (Max 10MB)
                            </p>
                        </div>
                    </label>
                </div>

                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Quick Samples</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {sampleDocuments.map((sample) => (
                            <button
                                key={sample.name}
                                onClick={() => handleSelectSample(sample.name, sample.url, sample.fileName)}
                                disabled={!!loadingSample}
                                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-gem-cyan/50 transition-all text-left group"
                            >
                                <div className="text-gem-cyan opacity-70 group-hover:opacity-100">
                                    {loadingSample === sample.name ? <Spinner className="w-5 h-5" /> : sample.icon}
                                </div>
                                <span className="text-sm text-slate-300 group-hover:text-white truncate">
                                    {sample.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2">Selected Files ({files.length})</h3>
                        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                            {files.map((file, idx) => (
                                <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gem-cyan/10 border border-gem-cyan/20 text-xs text-gem-cyan-light">
                                    {file.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                    <button 
                        onClick={handleClose}
                        className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmUpload}
                        disabled={files.length === 0}
                        className="px-6 py-2 bg-gradient-to-r from-gem-cyan to-gem-blue text-white rounded-lg font-medium 
                                 shadow-lg shadow-gem-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed
                                 hover:shadow-gem-cyan/40 transition-all transform active:scale-95"
                    >
                        Process Files
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;