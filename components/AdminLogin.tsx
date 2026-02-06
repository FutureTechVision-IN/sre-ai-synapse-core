
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { synapseManager } from '../services/geminiService';
import { User } from '../types';

interface AdminLoginProps {
    onSuccess: (user: User) => void;
    onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = synapseManager.security.authenticate(username, password);
        
        if (result.success && result.user) {
            onSuccess(result.user);
        } else {
            setError(result.error || 'AUTH_REJECTED');
            setTimeout(() => setError(null), 2000);
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gem-onyx font-mono-data overflow-hidden relative">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(#00F0FF_1px,transparent_1px)] [background-size:32px_32px]"></div>
            </div>
            
            <div className={`w-full max-w-md p-10 border transition-all duration-500 ${error ? 'border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.3)]' : 'border-gem-blue/20 bg-gem-blue/5 backdrop-blur-md shadow-2xl'}`}>
                <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-gem-blue'} animate-pulse`}></div>
                    <span className="text-[10px] text-white/40 uppercase tracking-[0.5em]">Neural_Security_Gateway</span>
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter mb-10 uppercase leading-none">Access_Control</h2>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[9px] text-gem-blue uppercase tracking-widest font-black">Identity_Identifier</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username@synapse"
                            className="w-full bg-black/40 border border-white/10 p-5 text-white text-sm outline-none focus:border-gem-blue focus:bg-gem-blue/5 transition-all rounded-sm placeholder:opacity-20"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] text-gem-blue uppercase tracking-widest font-black">Command_Key_Phrase</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-black/40 border border-white/10 p-5 text-white text-sm outline-none focus:border-gem-blue focus:bg-gem-blue/5 transition-all rounded-sm placeholder:opacity-20"
                        />
                        {password === '' && (
                            <p className="text-[8px] text-gem-teal uppercase tracking-widest opacity-60">
                                Hint: Leave blank if initiating first-time handshake.
                            </p>
                        )}
                    </div>
                    
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 animate-in shake duration-500">
                            <p className="text-[10px] text-red-500 uppercase font-black text-center tracking-widest">
                                ERROR_CODE: {error}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col space-y-4 pt-4">
                        <button 
                            type="submit"
                            className="w-full py-5 bg-gem-blue text-gem-onyx font-black text-xs uppercase tracking-[0.4em] hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                        >
                            Establish_Link
                        </button>
                        <button 
                            type="button"
                            onClick={onCancel}
                            className="w-full py-4 border border-white/5 text-white/30 text-[9px] uppercase tracking-[0.4em] hover:text-white hover:border-white/20 transition-all"
                        >
                            Abort_Sequence
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="absolute bottom-10 left-10 text-[8px] text-white/10 font-mono-data tracking-widest uppercase pointer-events-none">
                Encryption_Standard: AES-256-SYNAPSE // Node_ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
        </div>
    );
};

export default AdminLogin;
