
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum UserRole {
    Admin = 'ADMIN',
    Viewer = 'VIEWER'
}

export interface User {
    id: string;
    username: string;
    password?: string;
    apiKey?: string;
    role: UserRole;
    mustResetPassword: boolean;
    createdAt: number;
    // API Key Metadata
    keyStatus: 'ACTIVE' | 'REVOKED';
    keyUsage: number;
    keyLastUsed: number;
}

export interface RagStore {
    name: string;
    displayName: string;
}

export interface CustomMetadata {
  key?: string;
  stringValue?: string;
  stringListValue?: string[];
  numericValue?: number;
}

export interface Document {
    name: string;
    displayName: string;
    customMetadata?: CustomMetadata[];
}

export interface GroundingChunk {
    retrievedContext?: {
        text?: string;
    };
}

export interface QueryResult {
    text: string;
    groundingChunks: GroundingChunk[];
}

export enum AppStatus {
    Initializing,
    Welcome,
    Uploading,
    Chatting,
    Error,
    AdminLogin,
    PasswordReset,
    AdminDashboard
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    groundingChunks?: GroundingChunk[];
    // Supercomputer Metadata
    verificationStatus?: 'PENDING' | 'VERIFIED' | 'FAILED';
    confidenceScore?: number;
    processingNode?: string;
}

export interface VaultNode {
    id: string;
    key: string;
    weight: number;
    maxRpm: number;
    status: 'ONLINE' | 'THROTTLED' | 'QUARANTINE';
    role: 'ANALYSIS' | 'INFERENCE' | 'VERIFICATION' | 'SYNTHESIS';
    load: number;
}

export interface AuditLog {
    timestamp: number;
    action: string;
    user: string;
    nodeId: string;
    details: string;
}

export interface SpeechLog extends AuditLog {
    textHash: string;
    durationMs: number;
    verbosity: 'CONCISE' | 'DETAILED';
}

export interface LiveServerMessage {
    serverContent?: {
        modelTurn?: {
            parts: Array<{
                text?: string;
                inlineData?: {
                    data: string;
                    mimeType: string;
                };
            }>;
        };
        inputAudioTranscription?: {
            text: string;
            isFinal: boolean;
        };
        outputAudioTranscription?: {
            text: string;
        };
        interrupted?: boolean;
        turnComplete?: boolean;
    };
    toolCall?: {
        functionCalls: Array<{
            name: string;
            args: any;
            id: string;
        }>;
    };
}

export interface DocumentAnalysis {
    category: 'INCOME_TAX' | 'FINANCIAL_MARKET' | 'TECHNICAL_SRE' | 'LOTTERY' | 'OTHER';
    questions: string[];
    metadata: {
        jurisdiction?: string; // For Tax
        entities?: string[];   // For Stocks (Tickers)
        confidence: number;
    };
}
