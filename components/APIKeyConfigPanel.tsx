
import React, { useState } from 'react';
import { synapseManager } from '../services/geminiService';
import { UserRole } from '../types';

interface Props {
    onConfigComplete: () => void;
}

const APIKeyConfigPanel: React.FC<Props> = ({ onConfigComplete }) => {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        if (!apiKey.trim()) {
            setError('API Key cannot be empty.');
            return;
        }

        try {
            // Provision a temporary Admin user with this key to persist it in localStorage
            // In a real app, this might just update a context or a specific secure storage
            const existingUsers = synapseManager.security.getAllUsers();
            let admin = existingUsers.find(u => u.role === UserRole.Admin);
            
            if (admin) {
                synapseManager.security.updateApiKey(admin.id, apiKey);
            } else {
                synapseManager.security.createUser('sre-admin-recovered', 'temporal-recovery', UserRole.Admin, apiKey);
            }
            
            // Force reload users in the manager
            onConfigComplete();
        } catch (e) {
            setError('Failed to save configuration.');
        }
    };

    return (
        <div className="bg-gem-offwhite/5 border border-gem-teal/30 p-6 rounded-lg backdrop-blur-md">
            <h3 className="text-gem-teal font-bold mb-4 uppercase tracking-wider text-sm">Vital System Component Missing</h3>
            <p className="text-xs text-white/60 mb-4">
                The Neural Core requires a valid Google Gemini API Key to function. 
                Please input your key below to restore system uplink.
            </p>
            
            <div className="flex flex-col space-y-4">
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter Gemini API Key (AIza...)"
                    className="bg-black/40 border border-white/10 p-3 text-gem-offwhite rounded focus:border-gem-teal focus:outline-none font-mono text-sm"
                />
                
                {error && <p className="text-red-400 text-xs">{error}</p>}
                
                <button 
                    onClick={handleSave}
                    className="bg-gem-teal text-black font-bold py-2 rounded uppercase tracking-wider hover:bg-gem-teal/80 transition-colors"
                >
                    Initialize Uplink
                </button>
            </div>
        </div>
    );
};

export default APIKeyConfigPanel;
