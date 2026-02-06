
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppStatus, ChatMessage, User, DocumentAnalysis } from './types';
import * as geminiService from './services/geminiService';
import WelcomeScreen from './components/WelcomeScreen';
import ProgressBar from './components/ProgressBar';
import ChatInterface from './components/ChatInterface';
import AdminLogin from './components/AdminLogin';
import APIKeyConfigPanel from './components/APIKeyConfigPanel';

const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>(AppStatus.Welcome);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showKeyConfig, setShowKeyConfig] = useState(false);
    const [ingestedParts, setIngestedParts] = useState<any[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
    const [documentName, setDocumentName] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [analysisContext, setAnalysisContext] = useState<DocumentAnalysis | null>(null);

    const queryState = useRef({
        isAborted: false,
        receivedData: false
    });

    const forceStopAnalysis = useCallback(() => {
        queryState.current.isAborted = true;
        setIsQueryLoading(false);
    }, []);

    const handleError = (message: string, err: any) => {
        console.error(message, err);
        const fault = geminiService.synapseManager.parseError(err);
        const errorBody = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));

        if (fault === geminiService.NeuralFaultType.QUOTA) {
            setChatHistory(prev => [...prev, { 
                role: 'model', 
                parts: [{ text: "[NEURAL_QUOTA_EXHAUSTED]: Saturation detected. Automatic thermal reset in progress. System is currently being throttled to protect neural core integrity." }] 
            }]);
            setIsQueryLoading(false);
        } else if (fault === geminiService.NeuralFaultType.AUTH) {
            setError(`AUTHENTICATION_FAILURE: API Key missing or invalid.`);
            setShowKeyConfig(true);
            // Non-fatal error for UI if we allow config, but for now we set error.
            // We will render the KeyConfig panel ON TOP of the error screen or as a replacement.
            setStatus(AppStatus.Error);
        } else if (fault === geminiService.NeuralFaultType.NETWORK) {
            setError(`NETWORK_DISRUPTION: Packet loss detected in neural uplink. Check local gateway connectivity.`);
            setStatus(AppStatus.Error);
        } else {
            setError(`${message}: ${errorBody.substring(0, 200)}`);
            setStatus(AppStatus.Error);
        }
        geminiService.synapseManager.reportFailure(err);
    };

    const clearError = () => {
        setError(null);
        setStatus(AppStatus.Welcome);
    }

    const handleIngestion = async (newFiles: File[] = files) => {
        if (newFiles.length === 0) return;
        try {
            setIsUploading(true);
            setUploadProgress(0);
            
            const parts = await geminiService.ingestFiles(newFiles, (p) => setUploadProgress(p));
            setIngestedParts(prev => [...prev, ...parts]);
            
            // Perform Neural Classification
            const analysis = await geminiService.analyzeDocumentStructure(parts);
            setAnalysisContext(analysis);
            
            console.log('[CLASSIFICATION_RESULT]:', analysis.category, 'Confidence:', analysis.metadata.confidence);
            
            let categoryDisplay = 'Unknown Document Type';
            let contextDetail = '';

            if (analysis.category === 'LOTTERY') categoryDisplay = 'Lottery/Stochastic Intelligence';
            else if (analysis.category === 'INCOME_TAX') {
                categoryDisplay = 'Income Tax & Liability';
                contextDetail = `Jurisdiction: ${analysis.metadata.jurisdiction || 'N/A'}`;
            }
            else if (analysis.category === 'FINANCIAL_MARKET') {
                categoryDisplay = 'Equities & Market Analysis';
                contextDetail = `Scripts: ${analysis.metadata.entities?.join(', ') || 'N/A'}`;
            }
            else if (analysis.category === 'TECHNICAL_SRE') categoryDisplay = 'Engineering & SRE Ops';
            else if (analysis.category === 'OTHER') categoryDisplay = 'General Document';
            
            if (status !== AppStatus.Chatting) {
                setExampleQuestions(analysis.questions);
                setDocumentName(newFiles.length === 1 ? newFiles[0].name : `${newFiles.length} Sources`);
                
                // Add initial confirmation message based on neural verification
                setChatHistory([{
                    role: 'model',
                    parts: [{ text: `[NEURAL_LINK_ESTABLISHED]: Data stream analyzed.
                    
**CLASSIFICATION**: ${categoryDisplay}
${contextDetail ? `**CONTEXT**: ${contextDetail}` : ''}

High-precision analysis protocols active.` }]
                }]);
                setStatus(AppStatus.Chatting);
            } else {
                setDocumentName(prev => `${prev} + ${newFiles.length} New Sources`);
                setChatHistory(prev => [...prev, { 
                    role: 'model', 
                    parts: [{ text: `[SYSTEM_UPDATE]: Successfully ingested ${newFiles.length} new data sources. Neural correlation updated for current stream: **${categoryDisplay}**.` }] 
                }]);
            }
            setFiles([]); 
        } catch (err) {
            handleError("Ingestion Fault", err);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleSendMessage = async (message: string) => {
        if (isQueryLoading) return;

        const currentHistory = [...chatHistory];
        const userMsg: ChatMessage = { role: 'user', parts: [{ text: message }] };
        setChatHistory(prev => [...prev, userMsg]);
        
        setIsQueryLoading(true);
        queryState.current = { isAborted: false, receivedData: false };

        try {
            // Pass analysisContext to the query service
            const stream = geminiService.querySynapseStream(message, ingestedParts, currentHistory, analysisContext || undefined);
            let modelResponseText = '';
            let isFirstChunk = true;
            
            for await (const chunk of stream) {
                if (queryState.current.isAborted) break;
                queryState.current.receivedData = true;
                modelResponseText += chunk;

                if (isFirstChunk) {
                    isFirstChunk = false;
                    setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: modelResponseText }] }]);
                } else {
                    setChatHistory(prev => {
                        const newHistory = [...prev];
                        const lastIdx = newHistory.length - 1;
                        if (newHistory[lastIdx].role === 'model') {
                             newHistory[lastIdx] = { ...newHistory[lastIdx], parts: [{ text: modelResponseText }] };
                        }
                        return newHistory;
                    });
                }
            }
            
            // Diagnosis: If no data received by end of stream and not aborted, it's a silent failure
            if (!queryState.current.receivedData && !queryState.current.isAborted) {
                setChatHistory(prev => [...prev, { 
                    role: 'model', 
                    parts: [{ text: "[NEURAL_LINK_DROPPED]: The uplink received an empty packet. The system is re-calibrating. Please retry your query." }] 
                }]);
            }
            
        } catch (err) {
            if (!queryState.current.isAborted) {
                handleError("Neural Correlation Fault", err);
            }
        } finally {
            setIsQueryLoading(false);
        }
    };

    const handleRecordMessage = useCallback((role: 'user' | 'model', text: string) => {
        setChatHistory(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === role && last.parts[0].text === text) return prev;
            return [...prev, { role, parts: [{ text }] }];
        });
    }, []);
    
    const handleExportLog = useCallback(() => {
        const jsonString = JSON.stringify({
            metadata: { timestamp: Date.now(), document: documentName, version: "3.12.0", context: analysisContext },
            entries: chatHistory
        }, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SYNAPSE_LOG_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [chatHistory, documentName, analysisContext]);

    const handleLogout = () => {
        geminiService.synapseManager.security.logout();
        setCurrentUser(null);
        setStatus(AppStatus.Welcome);
    };

    return (
        <main className="h-screen bg-gem-onyx text-gem-offwhite">
            {status === AppStatus.Welcome && (
                <WelcomeScreen 
                    onUpload={() => handleIngestion()} 
                    files={files} 
                    setFiles={setFiles}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    onAdminClick={() => setStatus(AppStatus.AdminLogin)}
                />
            )}
            
            {status === AppStatus.AdminLogin && (
                <AdminLogin 
                    onSuccess={(user) => { 
                        setCurrentUser(user);
                        if (user.mustResetPassword) {
                            setStatus(AppStatus.PasswordReset);
                        } else {
                            setStatus(AppStatus.AdminDashboard);
                        }
                    }} 
                    onCancel={() => setStatus(AppStatus.Welcome)} 
                />
            )}

            {status === AppStatus.PasswordReset && currentUser && (
                <PasswordReset 
                    user={currentUser} 
                    onSuccess={() => setStatus(AppStatus.AdminDashboard)} 
                />
            )}

            {status === AppStatus.AdminDashboard && currentUser && (
                <AdminPortal adminUser={currentUser} onLogout={handleLogout} />
            )}

            {status === AppStatus.Uploading && (
                <div className="h-screen w-full bg-gem-onyx flex flex-col items-center justify-center p-20">
                    <ProgressBar 
                        progress={uploadProgress} 
                        total={100} 
                        message="SYSTEM_INGESTION_IN_PROGRESS" 
                        fileName={files.map(f => f.name).join(', ')}
                    />
                </div>
            )}

            {status === AppStatus.Chatting && (
                <ChatInterface 
                    documentName={documentName} 
                    history={chatHistory} 
                    isQueryLoading={isQueryLoading} 
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    onSendMessage={handleSendMessage}
                    onRecordMessage={handleRecordMessage}
                    onNewChat={() => {
                        setIngestedParts([]);
                        setChatHistory([]);
                        setDocumentName('');
                        setFiles([]);
                        setAnalysisContext(null);
                        setStatus(AppStatus.Welcome);
                    }} 
                    onExportLog={handleExportLog} 
                    onUploadNewFiles={(f) => handleIngestion(f)}
                    exampleQuestions={exampleQuestions}
                    onAbort={forceStopAnalysis}
                    ingestedParts={ingestedParts}
                    analysisContext={analysisContext}
                />
            )}

            {status === AppStatus.Error && (
                <div className="flex flex-col items-center justify-center h-screen bg-gem-onyx text-red-400 font-mono-data p-12 text-center animate-in fade-in duration-700">
                    <div className="w-24 h-24 mb-12 border-4 border-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-5xl font-black italic">!</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">System_Critical_Fault</h1>
                    <p className="text-xs mb-12 max-w-lg opacity-60 leading-relaxed uppercase tracking-widest">{error}</p>
                    
                    {showKeyConfig && (
                        <div className="mb-12 w-full max-w-md">
                            <APIKeyConfigPanel 
                                onConfigComplete={() => {
                                    setShowKeyConfig(false);
                                    clearError();
                                }}
                            />
                        </div>
                    )}
                    
                    <div className="flex space-x-6">
                        <button onClick={clearError} className="px-12 py-5 bg-red-500 text-white font-black uppercase tracking-[0.4em] hover:bg-white hover:text-red-500 transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)]">Initiate_Reboot</button>
                        <button onClick={() => window.location.reload()} className="px-12 py-5 border border-white/20 text-white/40 font-black uppercase tracking-[0.4em] hover:border-white hover:text-white transition-all">Hard_Reset</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default App;
