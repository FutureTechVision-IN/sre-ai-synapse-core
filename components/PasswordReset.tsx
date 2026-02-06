
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { synapseManager } from '../services/geminiService';
import { User } from '../types';

interface PasswordResetProps {
    user: User;
    onSuccess: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ user, onSuccess }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            setError('PASSWORD_TOO_SHORT_MIN_8');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('CONFIRMATION_MISMATCH');
            return;
        }

        const success = synapseManager.security.updatePassword(user.id, newPassword);
        if (success) {
            onSuccess();
        } else {
            setError('KERNEL_REWRITE_FAILED');
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gem-onyx font-mono-data overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="w-full h-full border-[1px] border-gem-teal/5 bg-[linear-gradient(rgba(0,255,148,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,148,0.02)_1px,transparent_1px)] [background-size:100px_100px]"></div>
            </div>
            
            <div className="w-full max-w-lg p-12 border border-gem-teal/20 bg-gem-teal/5 backdrop-blur-xl shadow-[0_0_100px_rgba(0,255,148,0.1)]">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-3 h-3 bg-gem-teal animate-ping"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gem-teal font-black uppercase tracking-[0.6em]">Security_Alert</span>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Password_Update_Required</h2>
                    </div>
                </div>

                <div className="p-5 border border-gem-teal/30 bg-gem-teal/10 mb-10">
                    <p className="text-[11px] text-white/80 leading-relaxed uppercase tracking-wider">
                        Account detected with default credentials. Mandatory synaptic key rotation in progress. New credentials must exceed 8 characters for structural integrity.
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] text-gem-teal uppercase tracking-widest font-black">Define_New_Keyphrase</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter robust password"
                            className="w-full bg-black/40 border border-white/10 p-5 text-white text-sm outline-none focus:border-gem-teal transition-all rounded-sm placeholder:opacity-10"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] text-gem-teal uppercase tracking-widest font-black">Confirm_Neural_Key</label>
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat keyphrase"
                            className="w-full bg-black/40 border border-white/10 p-5 text-white text-sm outline-none focus:border-gem-teal transition-all rounded-sm placeholder:opacity-10"
                        />
                    </div>
                    
                    {error && (
                        <p className="text-[10px] text-red-500 uppercase font-black tracking-widest animate-pulse border-l-2 border-red-500 pl-4">
                            FAULT_DETECTED: {error}
                        </p>
                    )}

                    <button 
                        type="submit"
                        className="w-full py-6 bg-gem-teal text-gem-onyx font-black text-sm uppercase tracking-[0.5em] hover:bg-white transition-all shadow-[0_0_30px_rgba(0,255,148,0.3)]"
                    >
                        Commit_Key_Change
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordReset;
