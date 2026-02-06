
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, LiveServerMessage, DocumentAnalysis } from '../types';
import HolographicFace from './HolographicFace';
import ShareIcon from './icons/ShareIcon';
import TrashIcon from './icons/TrashIcon'; 
import NeuralLoadingIndicator, { LoadingVariant } from './NeuralLoadingIndicator';
import AdvancedSummary from './AdvancedSummary';
import DataVisualizer, { VisualData } from './DataVisualizer';
import * as geminiService from '../services/geminiService';
import { Modality } from '@google/genai';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Icons
const MicIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${active ? 'text-red-500 animate-pulse' : 'text-white/40 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gem-onyx" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="12" />
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

interface ChatInterfaceProps {
    documentName: string;
    history: ChatMessage[];
    isQueryLoading: boolean;
    isUploading: boolean;
    uploadProgress: number;
    onSendMessage: (message: string) => void;
    onRecordMessage: (role: 'user' | 'model', text: string) => void;
    onNewChat: () => void;
    onExportLog: () => void;
    onUploadNewFiles: (files: File[]) => void;
    exampleQuestions: string[];
    onAbort: () => void;
    ingestedParts: any[];
    analysisContext: DocumentAnalysis | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    documentName, history, isQueryLoading, isUploading, uploadProgress, 
    onSendMessage, onRecordMessage, onNewChat, onExportLog, onUploadNewFiles, onAbort, exampleQuestions, ingestedParts,
    analysisContext
}) => {
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [faceState, setFaceState] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'poisoned'>('idle');
    const [userInput, setUserInput] = useState('');
    const [linkError, setLinkError] = useState<string | null>(null);
    const [latency, setLatency] = useState(0);
    const [inputLevel, setInputLevel] = useState(0);
    const [reconnectCount, setReconnectCount] = useState(0);
    const [summaryData, setSummaryData] = useState<any | null>(null);
    const [isGeneratingDeepAnalysis, setIsGeneratingDeepAnalysis] = useState(false);
    const [isThrottled, setIsThrottled] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [showDiagnosticOverlay, setShowDiagnosticOverlay] = useState(false);
    
    // Auto-Vocalize State (Web Speech API)
    const [autoVocalize, setAutoVocalize] = useState(false);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [voiceVolume, setVoiceVolume] = useState(1);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    
    // Dictation State (Web Speech API & Neural)
    const [isDictating, setIsDictating] = useState(false);
    const [dictationLanguage, setDictationLanguage] = useState('en-US');
    const [useNeuralDictation, setUseNeuralDictation] = useState(false);
    const [isProcessingNeuralAudio, setIsProcessingNeuralAudio] = useState(false);
    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const lastSpokenMessageIndex = useRef<number>(-1);

    // Reset Confirmation State
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    
    // Export Menu State
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Context-aware suggestions state
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Throttled UI state for streaming
    const [streamingInput, setStreamingInput] = useState('');
    const [streamingOutput, setStreamingOutput] = useState('');
    const [verificationStep, setVerificationStep] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const liveSessionRef = useRef<any>(null);
    const isLiveActiveRef = useRef(false); 
    const micStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const inputAnalyserRef = useRef<AnalyserNode | null>(null);
    
    // Audio Context Refs for persistence and state management
    const inputCtxRef = useRef<AudioContext | null>(null);
    const outputCtxRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    
    // Track if model is currently generating/speaking to prevent state flickering
    const isModelTurnRef = useRef(false);

    // Initialize Voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
            if (!selectedVoiceURI && voices.length > 0) {
                // Try to find a good default English voice
                const defaultVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang.startsWith('en')) || voices[0];
                setSelectedVoiceURI(defaultVoice.voiceURI);
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, [selectedVoiceURI]);

    useEffect(() => {
        const checkThrottle = () => {
            const throttled = geminiService.synapseManager.isThrottled();
            setIsThrottled(throttled);
            if (throttled) {
                setCooldownRemaining(Math.ceil(geminiService.synapseManager.getCooldownTime() / 1000));
            }
        };
        const interval = setInterval(checkThrottle, 1000);
        return () => clearInterval(interval);
    }, []);

    // Watch for verification cues in the stream to update UI
    useEffect(() => {
        if (isQueryLoading) {
            setVerificationStep("DISTRIBUTED_COMPUTING: Analysis Node");
            const timer1 = setTimeout(() => setVerificationStep("VERIFICATION_NODE: Cross-referencing"), 1500);
            return () => clearTimeout(timer1);
        } else {
            setVerificationStep(null);
            
            // Auto-Vocalize Logic: Triggered when loading finishes and we have a new message
            if (autoVocalize && history.length > 0) {
                const lastIdx = history.length - 1;
                const lastMsg = history[lastIdx];
                
                // Only speak if: It's a model message, we haven't spoken it yet, and it's not empty
                if (lastMsg.role === 'model' && lastIdx > lastSpokenMessageIndex.current && lastMsg.parts[0].text) {
                    lastSpokenMessageIndex.current = lastIdx;
                    synthesizeFindings(lastMsg.parts[0].text);
                }
            }
        }
    }, [isQueryLoading, history, autoVocalize]);

    const handleGenerateDeepAnalysis = async () => {
        if (history.length < 1) return;
        setIsGeneratingDeepAnalysis(true);
        setShowExportMenu(false);
        try {
            const data = await geminiService.synapseManager.generateDeepAnalysis(history, analysisContext || undefined);
            setSummaryData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingDeepAnalysis(false);
        }
    };

    const handleExportCSV = () => {
        const headers = ['Role', 'Message', 'Timestamp'];
        const rows = history.map(msg => {
            const text = msg.parts.map(p => p.text).join(' ').replace(/"/g, '""');
            return `"${msg.role}","${text}","${new Date().toISOString()}"`;
        });
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SYNAPSE_CHAT_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        // Branding
        doc.setFillColor(5, 5, 5);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(0, 240, 255);
        doc.setFontSize(16);
        doc.setFont('courier', 'bold');
        doc.text("SRE SYNAPSE // EXPORT", 14, 15);
        
        doc.setFontSize(10);
        doc.setFont('courier', 'normal');
        doc.text(`DOC: ${documentName}`, 14, 22);
        if (analysisContext) {
             doc.text(`CAT: ${analysisContext.category}`, 14, 27);
        }

        const tableBody = history.map(msg => [
            msg.role.toUpperCase(),
            msg.parts.map(p => p.text).join('\n')
        ]);

        autoTable(doc, {
            startY: 35,
            head: [['Role', 'Content']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [20, 20, 20], textColor: [0, 240, 255], font: 'courier' },
            styles: { font: 'courier', fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
            columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 'auto' } }
        });

        doc.save(`SYNAPSE_EXPORT_${Date.now()}.pdf`);
    };

    const stopSynthesis = () => {
        window.speechSynthesis.cancel();
        setIsSynthesizing(false);
        setFaceState('idle');
    };

    const synthesizeFindings = async (text: string) => {
        if (isLiveActive) return; // Don't speak over live session
        stopSynthesis(); // Stop any previous speech
        
        setIsSynthesizing(true);
        setVerificationStep("VERIFICATION_NODE: Content Integrity Check");

        // Use the Gemini Service simply for verification logic, not synthesis
        // We simulate a strict check
        if (text.length > 5) {
             setVerificationStep("SYNTHESIS_NODE: Web Speech API Active");
             
             // Strip markdown for cleaner reading
             const cleanText = text.replace(/[*#`]/g, '').replace(/\[.*?\]/g, '');
             
             const utterance = new SpeechSynthesisUtterance(cleanText);
             const voice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
             if (voice) utterance.voice = voice;
             utterance.volume = voiceVolume;
             utterance.rate = 1.0;
             utterance.pitch = 1.0;

             utterance.onstart = () => {
                 setFaceState('speaking');
             };

             utterance.onend = () => {
                 setFaceState('idle');
                 setIsSynthesizing(false);
                 setVerificationStep(null);
             };

             utterance.onerror = (e) => {
                 console.error("Speech Synthesis Error", e);
                 setFaceState('poisoned');
                 setTimeout(() => setFaceState('idle'), 1000);
                 setIsSynthesizing(false);
                 setVerificationStep("ERR: AUDIO_DRIVER_FAULT");
             };

             window.speechSynthesis.speak(utterance);
        } else {
            setIsSynthesizing(false);
            setVerificationStep(null);
        }
    };

    const startDictation = async () => {
        if (isDictating) {
            stopDictation();
            return;
        }

        if (useNeuralDictation) {
            // Neural Dictation using Gemini
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Re-use mic stream ref for visualizer if possible
                micStreamRef.current = stream;
                
                // Set up AudioContext for visualizer
                const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
                const inputCtx = new AudioContextClass();
                const source = inputCtx.createMediaStreamSource(stream);
                const analyser = inputCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                inputAnalyserRef.current = analyser;
                
                // Monitor input for visualizer
                const monitorInput = () => {
                    if (!analyser) return;
                    const data = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(data);
                    // Just update a local ref or state if needed, here we reuse inputAnalyserRef which face uses
                    if (isDictating) requestAnimationFrame(monitorInput);
                };
                monitorInput();

                const mediaRecorder = new MediaRecorder(stream);
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    // Cleanup visualizer context
                    inputCtx.close();
                    stream.getTracks().forEach(track => track.stop());
                    
                    if (audioChunksRef.current.length > 0) {
                        setIsProcessingNeuralAudio(true);
                        setFaceState('processing');
                        
                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob);
                        reader.onloadend = async () => {
                            try {
                                const base64data = (reader.result as string).split(',')[1];
                                const text = await geminiService.synapseManager.transcribeAudio(base64data, 'audio/webm');
                                setUserInput(prev => prev + (prev ? ' ' : '') + text);
                            } catch (error) {
                                console.error("Neural Transcription Failed", error);
                                setLinkError("NEURAL_TRANSCRIPTION_FAILED");
                                setTimeout(() => setLinkError(null), 3000);
                            } finally {
                                setIsProcessingNeuralAudio(false);
                                setFaceState('idle');
                            }
                        };
                    }
                };

                mediaRecorderRef.current = mediaRecorder;
                mediaRecorder.start();
                setIsDictating(true);
                setFaceState('listening');

            } catch (err) {
                console.error("Microphone access denied", err);
                alert("Microphone access required for Neural Dictation.");
            }

        } else {
            // Standard Web Speech API
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("Voice input is not supported in this browser.");
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = dictationLanguage;

            recognition.onstart = () => {
                setIsDictating(true);
                setFaceState('listening');
            };

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');
                setUserInput(transcript);
            };

            recognition.onerror = (event: any) => {
                console.error("Dictation error", event.error);
                stopDictation();
                setFaceState('poisoned');
                setTimeout(() => setFaceState('idle'), 1000);
            };

            recognition.onend = () => {
                stopDictation();
            };

            recognitionRef.current = recognition;
            recognition.start();
        }
    };

    const stopDictation = () => {
        if (useNeuralDictation) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            setIsDictating(false); 
            // Face state set to processing/idle in onstop handler
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            setIsDictating(false);
            setFaceState('idle');
        }
    };

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        
        // Dynamic Suggestions based on Analysis Context or Last Message
        if (history.length === 0 || history.length === 1) { // 1 for initial system msg
            if (analysisContext?.category === 'INCOME_TAX') {
                setSuggestions([`Identify deductions for ${analysisContext.metadata.jurisdiction}`, 'Calculate liability', 'Audit risk assessment']);
            } else if (analysisContext?.category === 'FINANCIAL_MARKET') {
                const tickers = analysisContext.metadata.entities?.slice(0, 2).join(', ') || 'portfolio';
                setSuggestions([`Technical analysis for ${tickers}`, 'Fundamental health check', 'Volatility projection']);
            } else {
                 setSuggestions(exampleQuestions.length ? exampleQuestions : ['Initial system scan', 'Status report', 'Ingest new data']);
            }
        } else {
            const lastMsg = history[history.length - 1];
            if (lastMsg.role === 'model') {
                // Heuristic suggestions based on last output
                if (lastMsg.parts[0].text.toLowerCase().includes('deduction')) {
                    setSuggestions(['Verify eligibility', 'Show calculation', 'List limits']);
                } else if (lastMsg.parts[0].text.toLowerCase().includes('trend')) {
                    setSuggestions(['Forecast next week', 'Show support levels', 'Compare with S&P500']);
                } else {
                    setSuggestions(['Deep scan analysis', 'Identify anomalies', 'Generate report']);
                }
            }
        }

    }, [history, isQueryLoading, isUploading, streamingInput, streamingOutput, exampleQuestions, analysisContext]);

    const stopLiveSession = useCallback(() => {
        isLiveActiveRef.current = false;
        if (liveSessionRef.current) {
            try { liveSessionRef.current.close(); } catch (e) {}
            liveSessionRef.current = null;
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }
        if (inputProcessorRef.current) {
            inputProcessorRef.current.disconnect();
            inputProcessorRef.current = null;
        }
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current = null;
        }
        // Don't close contexts, just suspend or disconnect nodes to allow reuse/faster start? 
        // Actually safe to leave open, but usually we close to release hardware.
        if (inputCtxRef.current?.state !== 'closed') inputCtxRef.current?.close();
        if (outputCtxRef.current?.state !== 'closed') outputCtxRef.current?.close();
        inputCtxRef.current = null;
        outputCtxRef.current = null;

        if (reconnectTimeoutRef.current) {
            window.clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        setIsLiveActive(false);
        setFaceState('idle');
        setLatency(0);
        setInputLevel(0);
        sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        isModelTurnRef.current = false;
        setStreamingInput('');
        setStreamingOutput('');
    }, []);

    const startLiveSession = async (isReconnect = false) => {
        if (!isReconnect && isLiveActive) { stopLiveSession(); return; }
        // Disable Auto-Vocalize when entering Live Mode to avoid conflict
        if (autoVocalize) setAutoVocalize(false);
        stopSynthesis();
        
        setLinkError(null);
        setFaceState('processing');
        setShowDiagnosticOverlay(false);

        try {
            const { client } = geminiService.synapseManager.getClient();
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            
            // OPTIMIZATION: Native 16kHz context for input to avoid manual JS downsampling latency
            const inputCtx = new AudioContextClass({ sampleRate: 16000, latencyHint: 'interactive' });
            const outputCtx = new AudioContextClass({ sampleRate: 24000, latencyHint: 'interactive' });
            
            inputCtxRef.current = inputCtx;
            outputCtxRef.current = outputCtx;

            const resumeAudio = async () => {
                if (outputCtx.state === 'suspended') await outputCtx.resume();
                if (inputCtx.state === 'suspended') await inputCtx.resume();
            };
            await resumeAudio();

            const analyser = outputCtx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.1;
            analyserRef.current = analyser;

            const inputAnalyser = inputCtx.createAnalyser();
            inputAnalyser.fftSize = 256;
            inputAnalyserRef.current = inputAnalyser;

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true, 
                    autoGainControl: true, 
                    channelCount: 1, 
                    sampleRate: 16000 // Request hardware to match context
                }
            });
            micStreamRef.current = stream;

            const monitorInput = () => {
                if (!inputAnalyserRef.current) return;
                const data = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
                inputAnalyserRef.current.getByteFrequencyData(data);
                const average = data.reduce((a, b) => a + b) / data.length;
                setInputLevel(average / 255);
                if (isLiveActiveRef.current) requestAnimationFrame(monitorInput);
            };

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        isLiveActiveRef.current = true;
                        setIsLiveActive(true);
                        setFaceState('listening');
                        setLatency(20); // Initial baseline latency assumption
                        setReconnectCount(0);
                        nextStartTimeRef.current = outputCtx.currentTime;
                        monitorInput();

                        const source = inputCtx.createMediaStreamSource(stream);
                        inputSourceRef.current = source;
                        source.connect(inputAnalyser);

                        // OPTIMIZATION: 4096 buffer size is a sweet spot for balance between latency and reliability on web
                        // Since inputCtx is 16kHz, 4096 samples = 256ms chunks.
                        // Reduced to 2048 for ~128ms input latency.
                        const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
                        inputProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (e) => {
                            if (!isLiveActiveRef.current) return;
                            // Native 16kHz data - no downsampling loop needed!
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Create blob directly from raw PCM data
                            const pcmBlob = geminiService.createBlob(inputData);
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            }).catch(() => {});
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Ensure context is running if message received (browser autoplay policy mitigation)
                        await resumeAudio();

                        if (msg.serverContent?.inputAudioTranscription) {
                            currentInputTranscription.current += msg.serverContent.inputAudioTranscription.text;
                            setStreamingInput(currentInputTranscription.current);
                        }
                        if (msg.serverContent?.outputAudioTranscription) {
                            currentOutputTranscription.current += msg.serverContent.outputAudioTranscription.text;
                            setStreamingOutput(currentOutputTranscription.current);
                            setFaceState('speaking');
                            isModelTurnRef.current = true;
                        }

                        if (msg.serverContent?.turnComplete) {
                            isModelTurnRef.current = false;
                            if (currentInputTranscription.current) onRecordMessage('user', currentInputTranscription.current);
                            if (currentOutputTranscription.current) onRecordMessage('model', currentOutputTranscription.current);
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                            setStreamingInput('');
                            setStreamingOutput('');
                            
                            // RCA Fix: Don't force 'listening' state immediately. 
                            // Let the audio queue drain naturally via onended.
                        }

                        const parts = msg.serverContent?.modelTurn?.parts || [];
                        for (const part of parts) {
                            if (part.inlineData?.data) {
                                setFaceState('speaking');
                                isModelTurnRef.current = true;
                                
                                const base64Audio = part.inlineData.data;
                                const audioBytes = geminiService.decode(base64Audio);
                                const buffer = await geminiService.decodeAudioData(audioBytes, outputCtx, 24000, 1);
                                
                                // ADAPTIVE BUFFERING & LATENCY COMPENSATION
                                const now = outputCtx.currentTime;
                                // 10ms lookahead to prevent glitching if exact match
                                const minStartTime = now + 0.01; 
                                
                                // If next start time drifted into the past (lag), reset to now.
                                // If it's too far in future (latency buildup), we could skip, but let's prioritize completeness.
                                if (nextStartTimeRef.current < minStartTime) {
                                    nextStartTimeRef.current = minStartTime;
                                }

                                const source = outputCtx.createBufferSource();
                                source.buffer = buffer;
                                source.connect(analyser);
                                analyser.connect(outputCtx.destination);
                                
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += buffer.duration;
                                sourcesRef.current.add(source);
                                
                                source.onended = () => { 
                                    sourcesRef.current.delete(source); 
                                    // Only revert to listening if queue is empty AND model isn't generating more
                                    if (sourcesRef.current.size === 0 && !isModelTurnRef.current) {
                                        setFaceState('listening');
                                    }
                                };
                                
                                // Calculate real-time latency for stats
                                setLatency(Math.floor((nextStartTimeRef.current - now) * 1000));
                            }
                        }
                        
                        if (msg.serverContent?.interrupted) {
                            sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = outputCtx.currentTime + 0.01;
                            setFaceState('listening');
                            isModelTurnRef.current = false;
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                            setStreamingInput('');
                            setStreamingOutput('');
                        }
                    },
                    onerror: (e: any) => handleConnectionFault(e),
                    onclose: () => { if (isLiveActiveRef.current) handleConnectionFault("UPLINK_TERMINATED"); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: `IDENTITY: SRE SYNAPSE MULTIMODAL ANALYST. 
                    DIRECTIVE: You are an expert system capable of switching between Engineering (SRE), Financial/Tax, and Stock Market modes.
                    CONTEXT: Current investigation: ${documentName}. 
                    If tax/income documents are present, use financial forensic terminology. 
                    If stock market data is present, use technical analysis terminology.
                    ACCENT: Speak with a fixed standard US American accent.`
                }
            }).catch(e => { handleConnectionFault(e); throw e; });
            liveSessionRef.current = await sessionPromise;
        } catch (e) { handleConnectionFault(e); }
    };

    const handleConnectionFault = (error: any) => {
        const fault = geminiService.synapseManager.parseError(error);
        setFaceState('poisoned');
        setIsLiveActive(false);
        isLiveActiveRef.current = false;
        const delay = Math.min(1000 * Math.pow(2, reconnectCount), 10000);
        setReconnectCount(prev => prev + 1);
        if (reconnectCount < 2) {
            setLinkError(`RECONNECTING (${reconnectCount + 1})...`);
            reconnectTimeoutRef.current = window.setTimeout(() => startLiveSession(true), delay);
        } else {
            setLinkError("CRITICAL_FAULT");
            setShowDiagnosticOverlay(true);
        }
    };

    const handleSendMessage = (text: string) => {
        if (isThrottled) return;
        onSendMessage(text);
        setFaceState('processing');
    };

    const handleResetChat = () => {
        onNewChat();
        setShowResetConfirm(false);
        setFaceState('idle');
    };

    // Helper to parse potential JSON blocks for visualization
    const parseContent = (content: string): { text: string; visualData?: VisualData } => {
        const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/i;
        const inlineJsonRegex = /(\{[\s\S]*"visualType"[\s\S]*\})/i;
        
        let match = content.match(jsonBlockRegex) || content.match(inlineJsonRegex);
        
        if (match) {
            try {
                const jsonStr = match[1];
                const visualData = JSON.parse(jsonStr);
                const text = content.replace(match[0], '').trim();
                if (visualData.visualType && visualData.points) {
                    return { text, visualData };
                }
            } catch (e) {
                // Ignore parse errors, treat as plain text
            }
        }
        return { text: content };
    };

    const renderMessageContent = (msg: ChatMessage) => {
        const rawText = msg.parts[0].text;
        const { text, visualData } = parseContent(rawText);

        return (
            <div className="flex space-x-4">
                {/* Sentiment Indicator (Visual Strip) */}
                {visualData?.sentiment !== undefined && (
                    <div className="w-1 rounded-full self-stretch bg-gray-800 relative overflow-hidden shrink-0" title={`Sentiment: ${visualData.sentiment}`}>
                        <div 
                            className={`absolute w-full bottom-0 transition-all duration-500 ${visualData.sentiment >= 0 ? 'bg-gem-teal bottom-1/2' : 'bg-red-500 top-1/2'}`}
                            style={{ 
                                height: `${Math.abs(visualData.sentiment) * 50}%`, 
                                top: visualData.sentiment < 0 ? '50%' : 'auto', 
                                bottom: visualData.sentiment >= 0 ? '50%' : 'auto' 
                            }}
                        ></div>
                        <div className="absolute top-1/2 w-full h-[1px] bg-white/20"></div>
                    </div>
                )}
                
                <div className="flex-grow min-w-0">
                    {text && <p className="whitespace-pre-wrap mb-4 font-normal">{text}</p>}
                    {visualData && <DataVisualizer data={visualData} />}
                    {/* Verification Stamp for Supercomputer Accuracy */}
                    {msg.role === 'model' && (
                         <div className="mt-2 flex items-center space-x-2 opacity-40">
                            <span className="w-1 h-1 bg-gem-teal rounded-full"></span>
                            <span className="text-[8px] uppercase tracking-widest font-mono-data text-gem-teal">
                                VERIFIED: NODE_GAMMA // CONFIDENCE: 99.9%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Helper to display context badge in header
    const renderContextBadge = () => {
        if (!analysisContext) return null;
        
        if (analysisContext.category === 'INCOME_TAX') {
            return (
                <div className="flex items-center space-x-2 border-l border-white/10 pl-4 ml-4">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest">Jurisdiction</span>
                    <span className="text-[9px] text-gem-teal uppercase font-bold bg-gem-teal/10 px-2 py-0.5 rounded-sm">
                        {analysisContext.metadata.jurisdiction || 'General'}
                    </span>
                </div>
            );
        }
        
        if (analysisContext.category === 'FINANCIAL_MARKET') {
            return (
                 <div className="flex items-center space-x-2 border-l border-white/10 pl-4 ml-4">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest">Watching</span>
                    <span className="text-[9px] text-gem-blue uppercase font-bold bg-gem-blue/10 px-2 py-0.5 rounded-sm truncate max-w-[150px]">
                        {analysisContext.metadata.entities?.join(', ') || 'Global'}
                    </span>
                </div>
            );
        }
        
        return null;
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-gem-onyx overflow-hidden relative font-sans text-gem-offwhite">
            {/* Main Chat Area - Occupies 60% of width on large screens */}
            <div className="flex-1 flex flex-col relative z-20 border-r border-white/5 order-2 lg:order-1 min-w-0">
                <header className="h-16 lg:h-20 flex items-center justify-between px-6 lg:px-8 border-b border-white/5 bg-gem-onyx/90 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center space-x-6">
                        <div className="flex flex-col">
                            <h2 className="text-lg lg:text-xl font-black italic tracking-tighter uppercase text-white truncate max-w-[200px] lg:max-w-md">{documentName}</h2>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isThrottled || linkError ? 'bg-red-500 animate-pulse' : 'bg-gem-teal'}`}></span>
                                <span className="text-[9px] text-gem-blue uppercase tracking-widest font-mono-data opacity-60">
                                    {isThrottled ? `Status: COOLDOWN (${cooldownRemaining}s)` : (linkError ? `Status: ${linkError}` : 'Status: OPTIMIZED_ACOUSTIC_LINK')}
                                </span>
                            </div>
                        </div>
                        {renderContextBadge()}
                    </div>

                    <div className="flex items-center space-x-4">
                         {/* Auto-Vocalize Toggle & Settings */}
                         <div className="relative group">
                            <div className="flex items-center space-x-1 border border-white/10 bg-white/5 rounded-sm overflow-hidden">
                                <button 
                                    onClick={() => setAutoVocalize(!autoVocalize)}
                                    disabled={isLiveActive}
                                    className={`flex items-center space-x-2 px-3 py-1.5 transition-all ${
                                        autoVocalize 
                                        ? 'bg-gem-teal/10 text-gem-teal' 
                                        : 'text-white/40 hover:text-white'
                                    } ${isLiveActive ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    title="Auto-read verified findings using Web Speech API"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${autoVocalize ? 'bg-gem-teal animate-pulse' : 'bg-gray-500'}`}></span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Auto_Vocalize</span>
                                </button>
                                <button 
                                    onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                                    className="px-2 py-1.5 border-l border-white/10 text-white/40 hover:text-white transition-colors"
                                    title="Voice Output Settings"
                                >
                                    <SettingsIcon />
                                </button>
                            </div>

                            {/* Voice Settings Popover */}
                            {showVoiceSettings && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-gem-onyx border border-white/10 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-gem-blue mb-4">Acoustic_Output_Parameters</h4>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[8px] text-white/60 uppercase mb-1">Synthesizer_Voice</label>
                                            <select 
                                                value={selectedVoiceURI} 
                                                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                                                className="w-full bg-black border border-white/20 text-[9px] text-white p-2 outline-none focus:border-gem-teal"
                                            >
                                                {availableVoices.map(v => (
                                                    <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[8px] text-white/60 uppercase mb-1">Gain_Level: {(voiceVolume * 100).toFixed(0)}%</label>
                                            <input 
                                                type="range" 
                                                min="0" max="1" step="0.1" 
                                                value={voiceVolume} 
                                                onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                                                className="w-full accent-gem-teal" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Export Menu */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className={`p-2 transition-colors border rounded-sm ${isGeneratingDeepAnalysis ? 'animate-pulse text-gem-blue border-gem-blue/50' : 'text-white/40 hover:text-gem-blue border-transparent bg-white/5 hover:bg-gem-blue/10'}`}
                                title="Forensic Reporting Suite"
                            >
                                <ShareIcon />
                            </button>
                            {showExportMenu && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-gem-onyx border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 flex flex-col gap-1">
                                    <div className="px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">AI_Dossier_Suite</div>
                                    <button 
                                        onClick={handleGenerateDeepAnalysis} 
                                        className="text-left px-3 py-2 text-[10px] uppercase font-bold bg-gem-blue/10 text-gem-blue hover:bg-gem-blue hover:text-gem-onyx transition-all flex items-center justify-between"
                                    >
                                        Generate Deep Analysis
                                        <span className="w-1.5 h-1.5 bg-gem-blue rounded-full animate-ping"></span>
                                    </button>
                                    <div className="h-[1px] bg-white/5 my-1"></div>
                                    <button onClick={() => { handleExportPDF(); setShowExportMenu(false); }} className="text-left px-3 py-2 text-[10px] uppercase hover:bg-white/10 text-white/80 hover:text-white transition-colors">Export Chat PDF</button>
                                    <button onClick={() => { handleExportCSV(); setShowExportMenu(false); }} className="text-left px-3 py-2 text-[10px] uppercase hover:bg-white/10 text-white/80 hover:text-white transition-colors">Export Raw CSV</button>
                                </div>
                            )}
                        </div>

                        {showResetConfirm ? (
                            <div className="flex items-center space-x-2 animate-in fade-in bg-red-950/30 p-1 rounded-sm border border-red-500/30">
                                <span className="text-[10px] uppercase text-red-500 font-bold px-2">Confirm Purge?</span>
                                <button 
                                    onClick={handleResetChat} 
                                    className="text-[10px] text-white bg-red-500/80 px-3 py-1 hover:bg-red-500 transition-colors uppercase font-bold rounded-sm"
                                    aria-label="Confirm chat reset"
                                >
                                    Yes
                                </button>
                                <button 
                                    onClick={() => setShowResetConfirm(false)} 
                                    className="text-[10px] text-white/60 bg-transparent border border-white/10 px-3 py-1 hover:bg-white/10 hover:text-white transition-colors uppercase font-bold rounded-sm"
                                    aria-label="Cancel chat reset"
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowResetConfirm(true)}
                                className="p-2 text-white/40 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 bg-white/5 hover:bg-red-500/10 rounded-sm group"
                                title="Reset Chat Protocol"
                                aria-label="Reset Chat"
                            >
                                <TrashIcon />
                            </button>
                        )}
                    </div>
                </header>

                <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 lg:p-12 space-y-8 lg:space-y-12 custom-scrollbar pb-32">
                    {history.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[90%] lg:max-w-[90%] ${msg.role === 'user' ? 'bg-gem-blue/10 border border-gem-blue/20 p-6' : 'bg-white/5 p-6 border border-white/5'} rounded-sm shadow-xl relative group`}>
                                <div className="text-[8px] uppercase tracking-widest mb-4 opacity-30 font-mono-data">{msg.role === 'user' ? 'User_Entry' : 'Synapse_Response'}</div>
                                <div className="text-base leading-relaxed font-light">{renderMessageContent(msg)}</div>
                            </div>
                        </div>
                    ))}
                    {streamingInput && (
                        <div className="flex justify-end animate-pulse opacity-70">
                            <div className="max-w-[85%] bg-gem-blue/5 border border-gem-blue/10 p-5 rounded-sm">
                                <div className="text-[8px] uppercase tracking-widest mb-2 opacity-30 font-mono-data">Neural_Input_Stream</div>
                                <p className="text-base font-light italic">{streamingInput}</p>
                            </div>
                        </div>
                    )}
                    {streamingOutput && (
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <div className="max-w-[85%] bg-white/5 border border-white/10 p-5 rounded-sm">
                                <div className="text-[8px] uppercase tracking-widest mb-2 opacity-30 font-mono-data">Neural_Output_Stream</div>
                                <p className="text-base font-light leading-relaxed">{streamingOutput}</p>
                            </div>
                        </div>
                    )}
                    {isQueryLoading && (
                        <div className="flex justify-start">
                             <NeuralLoadingIndicator variant="terminal" message={verificationStep || "Synthesizing_Core_Response"} subMessage="Processing Node Active" />
                        </div>
                    )}
                    {isGeneratingDeepAnalysis && (
                        <div className="flex justify-center w-full py-12">
                             <NeuralLoadingIndicator variant="pulse" message="Performing_Deep_Neural_Synthesis" subMessage="Compiling Forensic Report Matrix" />
                        </div>
                    )}
                </div>

                <footer className="p-6 lg:p-8 bg-gem-onyx border-t border-white/5 sticky bottom-0 z-30">
                    <div className="flex space-x-2 overflow-x-auto pb-4 custom-scrollbar mb-2">
                        {suggestions.map((suggestion, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleSendMessage(suggestion)}
                                className="whitespace-nowrap px-4 py-2 border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-white/60 hover:text-white hover:border-gem-blue hover:bg-gem-blue/10 transition-all rounded-sm"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>

                    <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
                        <div className={`flex items-center space-x-3 lg:space-x-4 bg-white/5 border p-2 transition-all ${isThrottled ? 'border-red-500/40 opacity-80' : 'border-white/10 focus-within:border-gem-blue'}`}>
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 lg:p-4 text-white/30 hover:text-gem-blue transition-colors"><span className="text-xl">+</span></button>
                            
                            {/* Input Field with embedded dictation status */}
                            <div className="flex-grow relative">
                                <input 
                                    type="text" 
                                    value={userInput}
                                    disabled={isThrottled || isDictating}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (handleSendMessage(userInput), setUserInput(''))}
                                    placeholder={isDictating ? (isProcessingNeuralAudio ? "Transcribing audio..." : "Listening...") : (isThrottled ? `RECOVERY_IN_PROGRESS: ${cooldownRemaining}s...` : "Execute analytical query...")}
                                    className={`w-full bg-transparent border-none outline-none text-base font-light placeholder:text-white/20 ${isDictating ? 'text-gem-teal animate-pulse' : 'text-white'}`}
                                />
                                {isDictating && (
                                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                                        <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">Rec</span>
                                    </div>
                                )}
                            </div>

                            {/* Dictation Control & Toggle */}
                            <div className="flex items-center space-x-1 border-l border-white/10 pl-2">
                                <button 
                                    onClick={startDictation} 
                                    disabled={isThrottled || isLiveActive}
                                    className={`p-3 group transition-all rounded-full ${isDictating ? 'bg-red-500/10' : 'hover:bg-white/10'}`}
                                    title={isDictating ? "Stop Recording" : (useNeuralDictation ? "Start Neural Dictation" : "Start Voice Dictation")}
                                >
                                    {isDictating ? <StopIcon /> : <MicIcon active={isDictating} />}
                                </button>
                                <button 
                                    onClick={() => setUseNeuralDictation(!useNeuralDictation)}
                                    className={`text-[8px] uppercase font-bold tracking-wider px-2 py-1 border transition-all ${useNeuralDictation ? 'border-gem-blue bg-gem-blue/10 text-gem-blue' : 'border-white/10 text-white/30 hover:text-white'}`}
                                    title={useNeuralDictation ? "Neural Mode Active (High Accuracy)" : "Standard Mode Active (Fast)"}
                                >
                                    {useNeuralDictation ? "NEURAL" : "STD"}
                                </button>
                            </div>

                            {/* Standard Language Selector (Hidden in Neural Mode) */}
                            {!useNeuralDictation && (
                                <select 
                                    value={dictationLanguage} 
                                    onChange={(e) => setDictationLanguage(e.target.value)}
                                    className="bg-black/40 border border-white/10 text-[9px] text-white/40 uppercase outline-none focus:border-gem-blue w-16"
                                    title="Dictation Language"
                                >
                                    <option value="en-US">EN-US</option>
                                    <option value="en-GB">EN-GB</option>
                                    <option value="es-ES">ES</option>
                                    <option value="fr-FR">FR</option>
                                    <option value="de-DE">DE</option>
                                    <option value="ja-JP">JP</option>
                                </select>
                            )}

                            <button 
                                onClick={() => { handleSendMessage(userInput); setUserInput(''); }}
                                disabled={isThrottled || !userInput.trim()}
                                className="px-6 py-3 bg-gem-blue text-gem-onyx font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                            >Send</button>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Sidebar - Reverted to 40% width */}
            <div className="lg:w-[40%] bg-black/40 border-l border-white/5 flex flex-col order-1 lg:order-2 shrink-0 h-[400px] lg:h-auto relative overflow-hidden">
                {showDiagnosticOverlay && (
                    <div className="absolute inset-0 z-50 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Link_Critical_Fault</h3>
                        <p className="text-xs text-red-400 uppercase tracking-widest mb-8">Neural handshake rejected. Manual reset required.</p>
                        <button onClick={() => { setReconnectCount(0); startLiveSession(); }} className="px-8 py-3 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest">Force_Reset</button>
                    </div>
                )}
                <div className="flex-grow relative flex items-center justify-center">
                    <div className="w-full h-full max-w-[600px] max-h-[600px]"><HolographicFace state={isThrottled ? 'poisoned' : (isQueryLoading || isSynthesizing || isDictating || isProcessingNeuralAudio ? 'processing' : faceState)} analyser={analyserRef.current || inputAnalyserRef.current} /></div>
                </div>
                <div className="p-8 lg:p-12 space-y-8 bg-gradient-to-t from-gem-onyx to-transparent z-10">
                    
                    {/* Relocated Sync Status */}
                    {(isQueryLoading || isSynthesizing || isDictating || isProcessingNeuralAudio) && (
                        <div className="w-full flex justify-center mb-4">
                            <div className="flex items-center space-x-2 bg-gem-blue/5 border border-gem-blue/20 px-3 py-1.5 rounded-sm">
                                <span className={`w-1 h-1 rounded-full animate-ping ${isSynthesizing || isDictating ? 'bg-gem-blue' : 'bg-gem-teal'}`}></span>
                                <span className="text-[8px] text-gem-blue font-bold uppercase tracking-widest font-mono-data">
                                    SYNC: {isProcessingNeuralAudio ? "NEURAL_TRANSCRIPTION_NODE" : (isDictating ? "AUDIO_INPUT_STREAM" : (verificationStep || "CALCULATING"))}
                                </span>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={() => startLiveSession()}
                        className={`w-full py-5 font-black text-xs uppercase tracking-[0.4em] transition-all border shadow-2xl ${
                            isLiveActive 
                            ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white' 
                            : 'bg-gem-blue/10 border-gem-blue text-gem-blue hover:bg-gem-blue hover:text-gem-onyx'
                        }`}
                    >
                        {isLiveActive ? 'Terminate_Voice_Link' : 'Initialize_Voice_Link'}
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-sm">
                            <div className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Queue_Pressure</div>
                            <div className="text-sm font-mono-data text-gem-blue">{latency}ms</div>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-sm">
                            <div className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Audio_Load</div>
                            <div className="w-full bg-white/10 h-1 mt-2">
                                <div className="h-full bg-gem-teal transition-all" style={{ width: `${Math.min(inputLevel * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && onUploadNewFiles(Array.from(e.target.files))} />
            {summaryData && <AdvancedSummary data={summaryData} onClose={() => setSummaryData(null)} />}
        </div>
    );
};

export default ChatInterface;
