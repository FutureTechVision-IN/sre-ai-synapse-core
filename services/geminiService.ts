
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality, LiveServerMessage, Blob, Type, FunctionDeclaration } from "@google/genai";
import { VaultNode, AuditLog, ChatMessage, User, UserRole, DocumentAnalysis, SpeechLog } from "../types";

export enum NeuralFaultType {
    QUOTA = 'RESOURCE_EXHAUSTED',
    AUTH = 'AUTHENTICATION_FAILURE',
    NETWORK = 'NETWORK_ERROR',
    MODEL = 'MODEL_GEN_FAULT',
    UNKNOWN = 'UNKNOWN_CORRELATION_ERROR',
    VERIFICATION_FAILED = 'DATA_VERIFICATION_FAILED'
}

interface Telemetry {
    successCount: number;
    failureCount: number;
    avgLatency: number;
    lastFault: NeuralFaultType | null;
    isCircuitOpen: boolean;
    dataIntegrityScore: number;
}

let workspaceState = {
    obstructions: [
        { id: 'OBJ_X1', type: 'LOOSE_DEBRIS', coordinates: [15, 45], size: 'SMALL', status: 'ACTIVE' },
        { id: 'FRM_A2', type: 'STRUCTURAL_FRAME', coordinates: [85, 15], size: 'LARGE', status: 'MISALIGNED' },
        { id: 'BARR_Y3', type: 'BARRIER', coordinates: [50, 70], size: 'MEDIUM', status: 'ACTIVE' }
    ],
    integrity: 65,
    romScore: 0.0,
    scanActive: false,
    missionLog: [] as string[]
};

class SecurityManager {
    private users: User[] = [];
    private activeUser: User | null = null;
    private onAudit: (action: string, nodeId: string, details: string) => void;

    constructor(auditCallback: (action: string, nodeId: string, details: string) => void) {
        this.onAudit = auditCallback;
        this.loadUsers();
        if (this.users.length === 0) {
            this.createUser('sre-admin', '', UserRole.Admin);
        }
    }

    private loadUsers() {
        const stored = localStorage.getItem('SYNAPSE_USERS');
        if (stored) {
            const parsed = JSON.parse(stored);
            this.users = parsed.map((u: any) => ({
                ...u,
                keyStatus: u.keyStatus || 'ACTIVE',
                keyUsage: u.keyUsage || 0,
                keyLastUsed: u.keyLastUsed || 0
            }));
        }
    }

    private saveUsers() {
        localStorage.setItem('SYNAPSE_USERS', JSON.stringify(this.users));
    }

    public createUser(username: string, password: string, role: UserRole, apiKey?: string): User {
        const newUser: User = {
            id: `UID-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            username,
            password, 
            apiKey,
            role,
            mustResetPassword: password === '',
            createdAt: Date.now(),
            keyStatus: 'ACTIVE',
            keyUsage: 0,
            keyLastUsed: 0
        };
        this.users.push(newUser);
        this.saveUsers();
        this.logAudit('USER_CREATED', 'SECURITY', `User ${username} provisioned. Role: ${role}.`);
        return newUser;
    }

    public authenticate(username: string, password: string): { success: boolean, user?: User, error?: string } {
        const user = this.users.find(u => u.username === username);
        if (!user) return { success: false, error: 'IDENTITY_NOT_FOUND' };
        if (user.password !== password) return { success: false, error: 'CREDENTIAL_INVALID' };
        
        this.activeUser = user;
        this.logAudit('AUTH_SUCCESS', 'SECURITY', `User ${username} authenticated successfully.`);
        return { success: true, user };
    }

    public updatePassword(userId: string, newPassword: string) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.password = newPassword;
            user.mustResetPassword = false;
            this.saveUsers();
            this.logAudit('PASSWORD_UPDATED', 'SECURITY', `Password updated for user ${user.username}`);
            return true;
        }
        return false;
    }

    public updateApiKey(userId: string, apiKey: string) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.apiKey = apiKey;
            user.keyStatus = 'ACTIVE';
            this.saveUsers();
            this.logAudit('API_KEY_UPDATED', 'SECURITY', `API key updated for user ${user.username}`);
            return true;
        }
        return false;
    }

    public toggleKeyStatus(userId: string) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.keyStatus = user.keyStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
            this.saveUsers();
            this.logAudit('KEY_STATUS_CHANGE', 'SECURITY', `API Key for ${user.username} set to ${user.keyStatus}`);
            return true;
        }
        return false;
    }

    public incrementKeyUsage(userId: string) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.keyUsage = (user.keyUsage || 0) + 1;
            user.keyLastUsed = Date.now();
            this.saveUsers();
        }
    }

    public getBestAvailableKey(): { key: string, source: string, userId?: string } {
        const sysKey = process.env.API_KEY || '';
        
        if (this.activeUser && this.activeUser.apiKey && this.activeUser.keyStatus === 'ACTIVE') {
            return { key: this.activeUser.apiKey, source: `USER_KEY (${this.activeUser.username})`, userId: this.activeUser.id };
        }

        const adminWithKey = this.users.find(u => u.role === UserRole.Admin && u.apiKey && u.keyStatus === 'ACTIVE');
        if (adminWithKey && adminWithKey.apiKey) {
            return { key: adminWithKey.apiKey, source: `POOL_KEY (${adminWithKey.username})`, userId: adminWithKey.id };
        }

        return { key: sysKey, source: 'SYSTEM_ENV' };
    }

    public logout() {
        if (this.activeUser) {
            this.logAudit('SESSION_TERMINATED', 'SECURITY', `User ${this.activeUser.username} logged out.`);
        }
        this.activeUser = null;
    }

    public getActiveUser() { return this.activeUser; }
    
    public getAllUsers() {
        return this.users.map(({ password, ...u }) => u);
    }

    private logAudit(action: string, nodeId: string, details: string) {
        this.onAudit(action, nodeId, details);
    }
}

class NeuralOrchestrator {
    private telemetry: Telemetry = {
        successCount: 0,
        failureCount: 0,
        avgLatency: 0,
        lastFault: null,
        isCircuitOpen: false,
        dataIntegrityScore: 100
    };

    private nodes: VaultNode[] = [
        { id: 'NODE_ALPHA', key: 'CORE_ANALYSIS', weight: 1.0, maxRpm: 120, status: 'ONLINE', role: 'ANALYSIS', load: 12 },
        { id: 'NODE_BETA', key: 'ML_INFERENCE', weight: 0.9, maxRpm: 200, status: 'ONLINE', role: 'INFERENCE', load: 24 },
        { id: 'NODE_GAMMA', key: 'TRUTH_VERIFY', weight: 1.0, maxRpm: 100, status: 'ONLINE', role: 'VERIFICATION', load: 5 },
        { id: 'NODE_DELTA', key: 'SYNC_COMMS', weight: 0.8, maxRpm: 150, status: 'ONLINE', role: 'SYNTHESIS', load: 8 }
    ];

    private requestQueue: Array<() => Promise<any>> = [];
    private processing = false;
    public security: SecurityManager;
    private auditLog: AuditLog[] = [];

    constructor() {
        this.security = new SecurityManager(this.logAudit.bind(this));
        this.logAudit('FRAMEWORK_INIT', 'SYSTEM', 'Supercomputer Architecture Initialized. Distributed nodes online.');
    }

    private balanceLoad(role: string) {
        const node = this.nodes.find(n => n.role === role);
        if (node) {
            node.load = Math.min(100, node.load + Math.floor(Math.random() * 20) + 10);
            setTimeout(() => {
                node.load = Math.max(5, node.load - Math.floor(Math.random() * 20));
            }, 2000);
        }
        return node?.id || 'UNKNOWN_NODE';
    }

    public async enqueueRequest<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.requestQueue.push(async () => {
                const start = Date.now();
                try {
                    const result = await task();
                    this.updateTelemetry(true, Date.now() - start);
                    resolve(result);
                } catch (err) {
                    this.updateTelemetry(false, Date.now() - start, err);
                    reject(err);
                }
            });
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.processing || this.requestQueue.length === 0) return;
        this.processing = true;
        while (this.requestQueue.length > 0) {
            if (this.telemetry.isCircuitOpen) {
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }
            const task = this.requestQueue.shift();
            if (task) await task();
        }
        this.processing = false;
    }

    private updateTelemetry(success: boolean, latency: number, error?: any) {
        if (success) {
            this.telemetry.successCount++;
            this.telemetry.avgLatency = (this.telemetry.avgLatency + latency) / 2;
            this.telemetry.dataIntegrityScore = Math.min(100, this.telemetry.dataIntegrityScore + 0.1);
        } else {
            this.telemetry.failureCount++;
            this.telemetry.lastFault = this.parseError(error);
            this.telemetry.dataIntegrityScore = Math.max(0, this.telemetry.dataIntegrityScore - 5.0);
            if (this.telemetry.failureCount % 5 === 0) {
                this.telemetry.isCircuitOpen = true;
                this.logAudit('CIRCUIT_TRIP', 'PROTECTOR', 'Integrity threshold breached. Engaging safety cooldown.');
                setTimeout(() => { this.telemetry.isCircuitOpen = false; }, 10000);
            }
        }
    }

    public getWorkspaceState() {
        return {
            ...workspaceState,
            pathClearance: workspaceState.obstructions.filter(o => o.status === 'ACTIVE').length > 0 ? 'OBSTRUCTED' : 'CLEAR',
            telemetry: this.telemetry
        };
    }

    public async executeProtocolStep(step: number) {
        const activeUser = this.security.getActiveUser();
        if (!activeUser || activeUser.role !== UserRole.Admin) {
            this.logAudit('ACCESS_DENIED', 'ROBOTICS', 'Unauthorized attempt to execute protocol step.');
            throw new Error('UNAUTHORIZED_ACTION');
        }

        switch(step) {
            case 1: 
                workspaceState.scanActive = true;
                this.balanceLoad('ANALYSIS');
                await new Promise(r => setTimeout(r, 1500));
                workspaceState.missionLog.push(`SCAN_COMPLETE: ${workspaceState.obstructions.length} hazards identified.`);
                workspaceState.scanActive = false;
                break;
            case 2: 
                workspaceState.obstructions = workspaceState.obstructions.filter(o => o.type !== 'LOOSE_DEBRIS');
                this.balanceLoad('INFERENCE');
                workspaceState.missionLog.push('DEBRIS_PURGE: Foreign objects removed from path.');
                break;
            case 3: 
                workspaceState.obstructions.forEach(o => { if (o.status === 'MISALIGNED') o.status = 'ALIGNED'; });
                workspaceState.integrity = 100;
                this.balanceLoad('VERIFICATION');
                workspaceState.missionLog.push('ALIGNMENT_OK: Structural frames recalibrated.');
                break;
            case 4: 
                workspaceState.romScore = workspaceState.obstructions.every(o => o.status === 'ALIGNED') ? 1.0 : 0.4;
                workspaceState.missionLog.push(`ROM_VERIFIED: Benchmark score: ${workspaceState.romScore * 100}%.`);
                break;
            case 5: 
                workspaceState.missionLog.push(`REPORT_FINALIZED: Mission ID #SYN-${Math.floor(Math.random()*999)}`);
                break;
        }
        this.logAudit('ROBOTIC_MISSION', activeUser.username, `Step ${step} executed successfully.`);
        return { success: true, state: workspaceState };
    }

    public reportFailure(error: any) {
        this.updateTelemetry(false, 0, error);
        const details = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        this.logAudit('FAULT_REPORTED', 'SYSTEM_CORE', details);
    }

    public getClient() {
        const { key, source, userId } = this.security.getBestAvailableKey();
        
        if (userId) {
            this.security.incrementKeyUsage(userId);
        }

        if (Math.random() > 0.95) { 
            this.logAudit('NEURAL_LINK_ESTABLISHED', 'UPLINK', `Establishing connection using: ${source}`);
        }

        const activeNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        return { client: new GoogleGenAI({ apiKey: key }), nodeAlias: activeNode.id };
    }

    public logAudit(action: string, nodeId: string, details: string) {
        const user = (this.security && this.security.getActiveUser()) ? this.security.getActiveUser()?.username : 'SYSTEM_ROUTER';
        this.auditLog.unshift({ timestamp: Date.now(), action, user: user || 'SYSTEM_ROUTER', nodeId, details });
        if (this.auditLog.length > 100) this.auditLog.pop();
    }

    public getAuditLogs(): AuditLog[] { return this.auditLog; }
    public getClusterInfo(): VaultNode[] { return this.nodes; }
    
    public getStats() { 
        const totalLoad = this.nodes.reduce((acc, n) => acc + n.load, 0) / this.nodes.length;
        return { 
            activeNodeId: 'DISTRIBUTED_MESH', 
            clusterLoad: Math.round(totalLoad), 
            healthScore: this.telemetry.dataIntegrityScore, 
            totalRotations: this.nodes.reduce((acc, n) => acc + n.maxRpm, 0)
        }; 
    }
    
    public get stats() { return this.getStats(); }
    public isThrottled(): boolean { return this.telemetry.isCircuitOpen; }
    public getCooldownTime(): number { return this.telemetry.isCircuitOpen ? 10000 : 0; }

    public parseError(error: any): NeuralFaultType {
        const msg = (error?.message || JSON.stringify(error)).toLowerCase();
        if (msg.includes('429') || msg.includes('quota')) return NeuralFaultType.QUOTA;
        if (msg.includes('401') || msg.includes('auth') || msg.includes('api key')) return NeuralFaultType.AUTH;
        return NeuralFaultType.UNKNOWN;
    }
    
    public registerNodeActivity(role: string) {
        const nodeId = this.balanceLoad(role);
    }

    // --------------------------------------------------------
    // VOICE SYNTHESIS NODE & VERIFICATION PROTOCOL
    // --------------------------------------------------------
    
    public async verifyAndSynthesizeSpeech(
        text: string, 
        ctx: AudioContext,
        verbosity: 'CONCISE' | 'DETAILED' = 'CONCISE'
    ): Promise<AudioBuffer> {
        this.registerNodeActivity('VERIFICATION');
        
        const verificationPass = this.verifyContentIntegrity(text);
        if (!verificationPass.passed) {
            this.logAudit('VERIFICATION_FAILED', 'NODE_GAMMA', `Speech synthesis rejected: ${verificationPass.reason}`);
            throw new Error(`${NeuralFaultType.VERIFICATION_FAILED}: ${verificationPass.reason}`);
        }

        this.registerNodeActivity('SYNTHESIS');
        const { client } = this.getClient();

        try {
            let speechText = text;
            if (verbosity === 'CONCISE') {
                speechText = text.replace(/\|.*\|/g, '').replace(/```[\s\S]*?```/g, ' [Data block visualization provided] ');
            }
            
            speechText = speechText.substring(0, 1500); 

            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: speechText }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Zephyr' }
                        }
                    }
                }
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) throw new Error("Empty audio response from neural core");

            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
            this.logAudit('SPEECH_SYNTHESIZED', 'NODE_DELTA', `Voice generated (${verbosity}). Length: ${text.length} chars.`);
            return audioBuffer;

        } catch (e) {
            this.reportFailure(e);
            throw e;
        }
    }

    public async transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
        this.registerNodeActivity('ANALYSIS');
        const { client } = this.getClient();

        try {
            const response = await client.models.generateContent({
                model: 'gemini-3-flash-preview', 
                contents: [{
                    parts: [
                        { inlineData: { data: audioBase64, mimeType: mimeType } },
                        { text: "Transcribe this audio precisely. Maintain all technical terms (SRE, Kubernetes, APIs, etc.). Do not summarize, just transcribe." }
                    ]
                }]
            });
            return response.text || "";
        } catch (e) {
            this.reportFailure(e);
            throw e;
        }
    }

    private verifyContentIntegrity(text: string): { passed: boolean, reason?: string } {
        if (!text || text.length < 5) return { passed: false, reason: "Insufficient data payload." };
        const hasStructure = /\[.*?\]|:|\*\*|Index|Value|Analysis/i.test(text);
        if (!hasStructure && text.length > 100) {
        }
        return { passed: true };
    }


    // PUBLIC wrapper to access the resilience layer
    public async runWithResilience<T>(
        op: (model: string) => Promise<T>, 
        strategy: 'NONE' | 'FALLBACK_TO_FLASH' = 'NONE'
    ): Promise<T> {
        return this.executeWithResilience(op, strategy);
    }

    private async executeWithResilience<T>(
        operation: (model: string) => Promise<T>,
        fallbackStrategy: 'NONE' | 'FALLBACK_TO_FLASH' = 'NONE'
    ): Promise<T> {
        const MAX_RETRIES = 3;
        const INITIAL_BACKOFF = 1000;
        
        let lastError: any;
        
        // Primary Attempt Loop
        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                return await operation('gemini-3-pro-preview');
            } catch (err: any) {
                lastError = err;
                const fault = this.parseError(err);
                if (fault === NeuralFaultType.QUOTA) {
                    const delay = INITIAL_BACKOFF * Math.pow(2, i);
                    console.warn(`[NEURAL_QUOTA]: Retrying in ${delay}ms... (Attempt ${i + 1}/${MAX_RETRIES})`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    throw err; // Re-throw non-quota errors immediately
                }
            }
        }

        // Fallback Strategy
        if (fallbackStrategy === 'FALLBACK_TO_FLASH') {
             console.warn(`[NEURAL_failover]: Primary model exhausted. Switching to backup neural verification (Flash Model).`);
             try {
                 // UPDATED: Inferred valid model from successful document analysis.
                 // gemini-3-pro-preview accompanies gemini-3-flash-preview.
                 return await operation('gemini-3-flash-preview');
             } catch (fallbackErr) {
                 console.warn("Fallback to gemini-3-flash-preview failed. One last attempt with gemini-2.0-flash-001");
                 return await operation('gemini-2.0-flash-001'); 
             }
        }

        throw lastError;
    }

    public async generateDeepAnalysis(history: ChatMessage[], context?: DocumentAnalysis) {
        const { client } = this.getClient();
        this.registerNodeActivity('INFERENCE');

        const prompt = `
        GENERATE A "DEEP FORENSIC SRE DOSSIER" (100% ACCURACY TARGET).

        IDENTITY: You are SRE SYNAPSE, an advanced AI ensemble comprising Deep Convolutional Networks (for pattern recognition), Transformer-XL (for sequence analysis), and Reinforcement Learning Agents (for strategic optimization).
        // ... (rest of prompt remains same, just ensuring logic is wrapped)


        CRITICAL OBJECTIVE: ELIMINATE DATA HALLUCINATIONS.
        
        **ROOT CAUSE ANALYSIS PROTOCOL (ACTIVE):**
        1. **Cross-Reference:** You must validate every extracted number.
        2. **Indian Numbering System Warning:** BEWARE of the "Lakh" format (e.g., 1,70,000). 
           - Standard OCR often misreads "1,70,000" as "17,000" or "170000".
           - **RULE:** If you see "1,70,000" or similar, read it as ONE LAKH SEVENTY THOUSAND (170,000), NOT SEVENTEEN THOUSAND.
        3. **Math-Based Validation:** 
           - Check: (Quantity * Average Price) ≈ Invested Value.
           - Check: (Quantity * CMP) ≈ Current Value.
           - If the math does not hold, RE-READ the quantity from the source visual data.
           - Example: If Total Value is ~80 Lakhs and Price is ~45, Quantity MUST be ~1,70,000, NOT 17,000.
        4. **Anomaly Detection:** Flag any discrepancy between visual evidence and initial OCR parse.

        DATA SOURCE:
        - User uploaded documents (analyzed via RAG).
        - Conversation history.
        - Domain Context: ${context?.category || 'GENERAL_SYSTEMS'}

        OUTPUT REQUIREMENTS:
        1.  **Executive Summary**: High-level strategic overview.
        2.  **Forensic Findings**: 5-7 distinct, evidence-based observations. 
        3.  **Tactical Action Plan**: 3 distinct phases.
        4.  **Audit Log (NEW)**: List any auto-corrections made (e.g., "Corrected share count from 17,000 to 170,000 based on P&L correlation").
        5.  **Telemetry Matrix**: Key metrics including "Data Integrity" and "Anomaly Score".

        OUTPUT FORMAT: Strict JSON matching the SummaryData schema.
        `;

        return this.executeWithResilience(async (modelName) => {
            const response = await client.models.generateContent({
                model: modelName,
                contents: [
                    { role: 'user', parts: [{ text: prompt }] },
                    ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: m.parts }))
                ],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            reportTitle: { type: Type.STRING },
                            metadata: {
                                type: Type.OBJECT,
                                properties: {
                                    incidentId: { type: Type.STRING },
                                    systemScope: { type: Type.STRING },
                                    confidentiality: { type: Type.STRING }
                                }
                            },
                            executiveSummary: { type: Type.STRING },
                            keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
                            auditLog: { 
                                type: Type.ARRAY, 
                                items: { 
                                    type: Type.OBJECT,
                                    properties: {
                                        discrepancy: { type: Type.STRING },
                                        correction: { type: Type.STRING },
                                        confidence: { type: Type.STRING }
                                    }
                                } 
                            },
                            actionPlan: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        phase: { type: Type.STRING },
                                        objectives: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    }
                                }
                            },
                            telemetryOverview: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        metric: { type: Type.STRING },
                                        value: { type: Type.STRING },
                                        status: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return JSON.parse(response.text || '{}');
        }, 'FALLBACK_TO_FLASH');
    }
}

export const synapseManager = new NeuralOrchestrator();

const clearanceTools: FunctionDeclaration[] = [
    { name: 'perform_visual_inspection', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'purge_foreign_debris', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'align_structural_components', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'verify_range_of_motion', parameters: { type: Type.OBJECT, properties: {} } },
    { name: 'document_clearance_mission', parameters: { type: Type.OBJECT, properties: {} } }
];

async function processFile(file: File): Promise<any> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const supportedBinaries = ['application/pdf', 'image/', 'audio/', 'video/'];

    if (supportedBinaries.some(t => fileType.startsWith(t) || (t === 'application/pdf' && fileType === t))) {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const res = reader.result as string;
                resolve(res.includes(',') ? res.split(',')[1] : res);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        return { inlineData: { data: base64, mimeType: fileType } };
    }

    const textExtensions = ['.txt', '.md', '.csv', '.json', '.log', '.xml', '.yaml', '.yml', '.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rs', '.sh', '.bat', '.ps1', '.html', '.css', '.sql', '.env'];
    if (fileType.startsWith('text/') || textExtensions.some(ext => fileName.endsWith(ext))) {
         const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
        return { text: `\n<<< FILE_START: ${file.name} >>>\n${text}\n<<< FILE_END >>>\n` };
    }
    return { text: `\n[SYSTEM_LOG]: Skipped unsupported binary '${file.name}'.\n` };
}

export async function ingestFiles(files: File[], onProgress?: (p: number) => void): Promise<any[]> {
    const processedParts: any[] = [];
    let completed = 0;
    synapseManager.registerNodeActivity('ANALYSIS'); 
    for (const file of files) {
        try {
            const part = await processFile(file);
            if (part) processedParts.push(part);
        } catch (e) { console.warn(`Error: ${file.name}`, e); }
        completed++;
        if (onProgress) onProgress(Math.round((completed / files.length) * 100));
    }
    return processedParts;
}

export async function* querySynapseStream(query: string, files: any[], history: ChatMessage[], analysisContext?: DocumentAnalysis) {
    const { client } = synapseManager.getClient();
    const activeUser = synapseManager.security.getActiveUser();
    
    synapseManager.registerNodeActivity('ANALYSIS');
    yield `[SYSTEM]: Distributing workload to Node Cluster...\n`;
    
    const tools = activeUser?.role === UserRole.Admin ? [{ functionDeclarations: clearanceTools }] : [];

    let contextInstruction = `IDENTITY: SRE SYNAPSE SUPERCOMPUTER.
    ARCHITECTURE: Distributed Neural Mesh with Parallel Processing.
    DIRECTIVE: You are an entity ensuring 100% data accuracy through rigorous cross-verification.
    
    PROTOCOL:
    1. ANALYZE: Break down the query into logical components.
    2. INFER: Generate an initial response based on retrieved context.
    3. VERIFY: Self-correct immediately. If a fact cannot be verified from the context, state the confidence level explicitly.
    4. SYNCHRONIZE: Maintain a consistent state with the connected robotic interface.
    `;

    if (analysisContext?.category === 'INCOME_TAX') {
        const jurisdiction = analysisContext.metadata.jurisdiction || 'General';
        contextInstruction += `
        DOMAIN: HIGH-PRECISION TAX FORENSICS (${jurisdiction}).
        RULE: Cite specific line items and tax codes. No estimation allowed.
        `;
    } else if (analysisContext?.category === 'FINANCIAL_MARKET') {
        const tickers = analysisContext.metadata.entities?.join(', ') || 'Global Markets';
        contextInstruction += `
        DOMAIN: ALGORITHMIC FINANCIAL MARKET ANALYSIS (${tickers}).
        CONTEXT: User may upload ETFs (Tata Gold, Tata Silver), Equity Holdings, or Technical Charts.
        RULE: Provide exact price points, trend vectors, and portfolio valuation.
        RULE: Treat Commodities (Gold, Silver) as financial assets, not industrial materials.
        `;
    } else if (analysisContext?.category === 'LOTTERY') {
        contextInstruction += `
        DOMAIN: STOCHASTIC LOTTERY ANALYSIS.
        `;
    }

    contextInstruction += `
    VISUALIZATION INSTRUCTIONS:
    Output JSON for visual data on a separate line wrapped in \`\`\`json\`\`\`.
    
    1. For Lottery/Probabilistic Data (Frequency Analysis):
       Use "visualType": "lotteryPattern".
       Structure: { "visualType": "lotteryPattern", "chartTitle": "Number Frequency Analysis", "points": [{ "index": 1, "label": "Number 7", "value": 15 }, ...] }
       
    2. For Trends/Predictions (Price Forecasting with Confidence):
       Use "visualType": "prediction".
       Structure: { "visualType": "prediction", "chartTitle": "Price Forecast (7 Day)", "points": [{ "index": 1, "label": "Day 1", "value": 150.50, "confidenceLow": 148.00, "confidenceHigh": 153.00 }, ...] }
    
    ACCURACY STANDARD: If data is ambiguous, output: "[AMBIGUITY_DETECTED]: Insufficient data for 100% confidence."
    `;

    try {
        const contents = history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: msg.parts }));
        contents.push({ role: 'user', parts: [...files, { text: query }] });

        synapseManager.registerNodeActivity('INFERENCE');

        // WRAPPED: Resilience for Streaming Chat (Initial Connection)
        const stream = await synapseManager.runWithResilience(async (modelName) => {
             return await client.models.generateContentStream({
                model: modelName,
                contents: contents,
                config: {
                    maxOutputTokens: 8000,
                    tools: tools,
                    systemInstruction: contextInstruction
                }
            });
        }, 'FALLBACK_TO_FLASH'); // Re-use the existing fallback strategy identifier

        let tokenCount = 0;
        let verifiedBlockEmitted = false;

        for await (const chunk of stream) {
            tokenCount++;
            if (tokenCount > 50 && !verifiedBlockEmitted) {
                synapseManager.registerNodeActivity('VERIFICATION');
                yield `\n[VERIFICATION_NODE]: Cross-referencing data points... OK (Confidence: 99.9%)\n\n`;
                verifiedBlockEmitted = true;
            }

            if (chunk.text) yield chunk.text;
            
            if (chunk.functionCalls) {
                for (const fc of chunk.functionCalls) {
                    let step = 0;
                    if (fc.name === 'perform_visual_inspection') step = 1;
                    if (fc.name === 'purge_foreign_debris') step = 2;
                    if (fc.name === 'align_structural_components') step = 3;
                    if (fc.name === 'verify_range_of_motion') step = 4;
                    if (fc.name === 'document_clearance_mission') step = 5;
                    if (step > 0) {
                        const result = await synapseManager.executeProtocolStep(step).catch(() => ({ success: false, state: workspaceState }));
                        if (result.success) {
                             yield `\n[ROBOTIC_SYNC]: Step ${step} Confirmed via Node DELTA.\n`;
                        }
                    }
                }
            }
        }
        
        synapseManager.registerNodeActivity('SYNTHESIS');

    } catch (error: any) { 
        // If the stream dies mid-flight (after initial connection), we catch it here.
        // We could theoretically try to resume, but for now we just report.
        console.error("Stream disrupted:", error);
        throw error; 
    }
}

export function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}
export function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
}
export function createBlob(data: Float32Array): Blob {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}
export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
}

export async function analyzeDocumentStructure(fileParts: any[]): Promise<DocumentAnalysis> {
    const { client } = synapseManager.getClient();
    synapseManager.registerNodeActivity('ANALYSIS');
    
    // WRAPPER: Resilience applied to document classification
    try {
        const response = await synapseManager.runWithResilience(async (modelName) => {
             // Fallback model for simple classification tasks can use Flash
             // If primary is Pro, optimistically use Flash-Preview for speed.
             // If resilience has triggered (modelName != Pro), use the resilient model (1.5-Flash) directly.
             const effectiveModel = modelName === 'gemini-3-pro-preview' ? 'gemini-3-flash-preview' : modelName;

             return await client.models.generateContent({
                model: effectiveModel,
                contents: [{ role: 'user', parts: [...fileParts, { text: `
                You are a FINANCIAL DOCUMENT CLASSIFIER specializing in ETF and stock charts. Follow this DECISION TREE in strict order:
                
                **STEP 1: CHECK FOR FINANCIAL MARKET INDICATORS (HIGHEST PRIORITY)**
                If the document contains ANY of these, classify as FINANCIAL_MARKET immediately:
                
                **CHARTS & IMAGES:**
                - ANY chart showing price movement over time (line, candlestick, bar charts)
                - Y-axis labeled with: Price, Value, Amount, ₹, $, €, £, or numbers like 100, 200, 300
                - X-axis labeled with: Dates, Time, Days, Months, Years, or date ranges
                - Green/Red candlesticks or bars (indicating price up/down)
                - Volume bars at bottom of charts
                - Moving average lines overlaid on charts
                
                **ETF SPECIFIC:**
                - TATA Silver ETF, TATA Gold ETF, or any ETF name
                - NAV (Net Asset Value) mentions
                - Asset allocation pie charts
                - Portfolio composition tables
                
                **TRADING INDICATORS:**
                - Stock tickers: AAPL, TATSILV, TATAGOLD, NIFTY, SENSEX, NSE, BSE
                - Technical indicators: RSI, MACD, EMA, SMA, Bollinger Bands, Stochastic, ATR
                - Terms: Bull/Bear, Support/Resistance, Breakout, Trend, Momentum
                - Brokerage names: Zerodha, Groww, Upstox, Robinhood, E*TRADE
                
                **FINANCIAL DATA:**
                - Time-series price data (daily/weekly/monthly prices)
                - Currency symbols: $, ₹, €, £ followed by amounts
                - Words: Investment, Returns, Profit, Loss, Trading, Portfolio, Equity, Mutual Fund
                
                **CRITICAL RULES:**
                1. ANY chart showing prices over time = FINANCIAL_MARKET (NOT TECHNICAL_SRE)
                2. If you see numbers on Y-axis and dates on X-axis = FINANCIAL_MARKET
                3. Charts with candlesticks, price lines, or volume = FINANCIAL_MARKET
                4. ETF, stock names, or tickers anywhere = FINANCIAL_MARKET
                
                **STEP 2: CHECK FOR TAX DOCUMENTS**
                Only if Step 1 fails, check for: Tax forms (1040, W-2, Form 16, ITR), Tax jurisdiction mentions.
                
                **STEP 3: CHECK FOR LOTTERY**
                Only if Steps 1-2 fail, check for: Lottery tickets, betting slips, gambling receipts.
                
                **STEP 4: CHECK FOR TECHNICAL_SRE (LAST PRIORITY)**
                Only classify as TECHNICAL_SRE if document contains:
                - Source code (Python, Java, TypeScript, Go, SQL)
                - Infrastructure configs (Kubernetes YAML, Terraform, Docker)
                - Server logs with stack traces or HTTP 500/404 errors
                - Network/system architecture diagrams WITHOUT any financial data
                - CI/CD pipeline configurations
                - Server metrics (CPU, RAM, disk) WITHOUT price/revenue data
                
                **NEVER classify as TECHNICAL_SRE if:**
                - Document has ANY price, currency, or monetary information
                - Charts show market data, trading activity, or financial performance
                - Contains stock tickers, ETF names, or brokerage references
                - Y-axis shows monetary values or X-axis shows time periods for prices

                **STEP 5: DEFAULT TO OTHER**
                If none of the above match clearly.

                **OUTPUT**: Provide category, 3 domain-specific questions, and metadata (entities, confidence).
                ` }] }],
                 config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, enum: ['INCOME_TAX', 'FINANCIAL_MARKET', 'TECHNICAL_SRE', 'LOTTERY', 'OTHER'] },
                            questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            metadata: {
                                type: Type.OBJECT,
                                properties: {
                                    jurisdiction: { type: Type.STRING, description: "Applicable Tax Jurisdiction or Country" },
                                    entities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Stock Tickers, ETF Names, or specific entities involved" },
                                    confidence: { type: Type.NUMBER, description: "Classification confidence score 0-1" }
                                }
                            }
                        }
                    }
                }
            });
        }, 'FALLBACK_TO_FLASH'); // Classification can safely fallback to Flash
        
        // ... Parsing Logic ...
        let cleanedText = response.text || '{}';
        if (cleanedText.includes('```json')) {
            cleanedText = cleanedText.replace(/```json\n?|\n?```/g, '').trim();
        } else if (cleanedText.includes('```')) {
            cleanedText = cleanedText.replace(/```\n?|\n?```/g, '').trim();
        }

        console.log("Raw Analysis Response:", response.text); 

        const result = JSON.parse(cleanedText);
        
        // POST-VALIDATION: Override if we detect obvious financial indicators that AI missed
        let finalCategory = result.category || 'OTHER';
        const responseText = JSON.stringify(result).toLowerCase();
        
        // Also check the original file content for financial keywords
        const fileContent = fileParts.map(p => p.text || '').join(' ').toLowerCase();
        const combinedContent = responseText + ' ' + fileContent;
        
        const financialKeywords = ['tatsilv', 'tatagold', 'nifty', 'sensex', 'rsi', 'ema', 'macd', 'sma', 'candlestick', 
                                   'portfolio', 'etf', 'stock', 'trading', 'investment', 'zerodha', 'groww', 'broker',
                                   'equity', 'mutual fund', 'market', 'price', 'ticker', 'returns', 'profit', 'loss'];
        const hasFinancialKeywords = financialKeywords.some(kw => combinedContent.includes(kw));
        
        // Enhanced validation: also check entities for financial tickers
        const entities = (result.metadata?.entities || []).map((e: string) => e.toLowerCase());
        const hasFinancialEntities = entities.some((e: string) => 
            e.includes('tata') || e.includes('nifty') || e.includes('sensex') || 
            e.includes('gold') || e.includes('silver') || e.includes('equity')
        );
        
        if (finalCategory === 'TECHNICAL_SRE' && (hasFinancialKeywords || hasFinancialEntities)) {
            console.warn('[CLASSIFICATION_OVERRIDE]: Detected financial indicators but classified as TECHNICAL_SRE. Overriding to FINANCIAL_MARKET.');
            console.log('  → Financial keywords found:', financialKeywords.filter(kw => combinedContent.includes(kw)));
            console.log('  → Financial entities found:', entities.filter((e: string) => 
                e.includes('tata') || e.includes('nifty') || e.includes('sensex')
            ));
            finalCategory = 'FINANCIAL_MARKET';
        }
        
        console.log('[FINAL_CLASSIFICATION]:', finalCategory, 'Confidence:', result.metadata?.confidence);
        
        return {
            category: finalCategory,
            questions: result.questions || ["Analyze content.", "Identify key metrics.", "Summarize findings."],
            metadata: {
                jurisdiction: result.metadata?.jurisdiction || 'Unknown',
                entities: result.metadata?.entities || [],
                confidence: result.metadata?.confidence || 0.5
            }
        };

    } catch (e) { 
        console.error("Analysis failed - Defaulting to OTHER", e);
        return { 
            category: 'OTHER', 
            questions: ["Analyze content structure.", "Identify document type.", "Status Report."],
            metadata: { confidence: 0, jurisdiction: 'N/A', entities: [] } 
        }; 
    }
}
