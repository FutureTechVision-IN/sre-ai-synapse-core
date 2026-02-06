
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { synapseManager } from '../services/geminiService';
import { VaultNode, AuditLog, User, UserRole } from '../types';
import WorkspaceMonitor from './WorkspaceMonitor';

interface AdminPortalProps {
    adminUser: User;
    onLogout: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ adminUser, onLogout }) => {
    const [stats, setStats] = useState(synapseManager.stats);
    const [nodes, setNodes] = useState<VaultNode[]>(synapseManager.getClusterInfo());
    const [logs, setLogs] = useState<AuditLog[]>(synapseManager.getAuditLogs());
    const [activeTab, setActiveTab] = useState<'telemetry' | 'api_vault' | 'robotics' | 'security' | 'diagnostics'>('telemetry');
    const [wsState, setWsState] = useState(synapseManager.getWorkspaceState());
    const [missionStep, setMissionStep] = useState(0);
    
    // User management state
    const [users, setUsers] = useState<User[]>(synapseManager.security.getAllUsers());
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newRole, setNewRole] = useState<UserRole>(UserRole.Viewer);
    const [newApiKey, setNewApiKey] = useState('');

    // API Vault state
    const [apiSearch, setApiSearch] = useState('');

    // Profile editing state
    const [editingApiKey, setEditingApiKey] = useState<string | null>(null);
    const [apiKeyInput, setApiKeyInput] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setStats(synapseManager.stats);
            setNodes(synapseManager.getClusterInfo());
            setLogs(synapseManager.getAuditLogs());
            setWsState(synapseManager.getWorkspaceState());
            setUsers(synapseManager.security.getAllUsers());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const runFullProtocol = async () => {
        if (adminUser.role !== UserRole.Admin) return;
        for(let i=1; i<=5; i++) {
            setMissionStep(i);
            await synapseManager.executeProtocolStep(i).catch(() => {});
            await new Promise(r => setTimeout(r, 1500));
        }
        setMissionStep(0);
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUsername.trim()) {
            // New accounts are created with blank passwords for mandatory first login reset
            synapseManager.security.createUser(newUsername.trim(), '', newRole, newApiKey.trim());
            setNewUsername('');
            setNewApiKey('');
            setShowCreateUser(false);
            setUsers(synapseManager.security.getAllUsers());
        }
    };

    const handleUpdateApiKey = (userId: string) => {
        synapseManager.security.updateApiKey(userId, apiKeyInput.trim());
        setEditingApiKey(null);
        setApiKeyInput('');
        setUsers(synapseManager.security.getAllUsers());
    };

    const toggleKeyStatus = (userId: string) => {
        synapseManager.security.toggleKeyStatus(userId);
        setUsers(synapseManager.security.getAllUsers());
    };

    // Filter users with keys for the API Vault
    const usersWithKeys = users.filter(u => u.apiKey && u.apiKey.length > 0 && u.username.toLowerCase().includes(apiSearch.toLowerCase()));

    return (
        <div className="h-screen w-full bg-gem-onyx text-gem-offwhite font-mono-data flex flex-col overflow-hidden">
            <div className="border-b border-gem-blue/20 bg-gem-blue/5 p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-6">
                    <h1 className="text-xl font-black italic tracking-tighter uppercase text-gem-blue">Synapse_Admin_Console</h1>
                    <div className="text-[10px] uppercase tracking-widest text-gem-blue/60">
                        Operator: <span className="text-white">{adminUser.username}</span> // Role: <span className="text-gem-teal">{adminUser.role}</span>
                    </div>
                </div>
                <button onClick={onLogout} className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] uppercase tracking-widest">Terminate_Session</button>
            </div>

            <div className="flex flex-grow overflow-hidden">
                <div className="w-64 border-r border-white/5 bg-black/40 p-6 flex flex-col space-y-2 shrink-0">
                    <button onClick={() => setActiveTab('telemetry')} className={`text-left px-4 py-3 text-[10px] uppercase tracking-widest transition-all border ${activeTab === 'telemetry' ? 'border-gem-blue bg-gem-blue/10 text-gem-blue' : 'border-transparent text-white/40 hover:text-white'}`}>Cluster_Stats</button>
                    <button onClick={() => setActiveTab('api_vault')} className={`text-left px-4 py-3 text-[10px] uppercase tracking-widest transition-all border ${activeTab === 'api_vault' ? 'border-gem-teal bg-gem-teal/10 text-gem-teal' : 'border-transparent text-white/40 hover:text-white'}`}>API_Vault</button>
                    <button onClick={() => setActiveTab('robotics')} className={`text-left px-4 py-3 text-[10px] uppercase tracking-widest transition-all border ${activeTab === 'robotics' ? 'border-gem-blue bg-gem-blue/10 text-gem-blue' : 'border-transparent text-white/40 hover:text-white'}`}>Robotic_Ops</button>
                    <button onClick={() => setActiveTab('security')} className={`text-left px-4 py-3 text-[10px] uppercase tracking-widest transition-all border ${activeTab === 'security' ? 'border-gem-teal bg-gem-teal/10 text-gem-teal' : 'border-transparent text-white/40 hover:text-white'}`}>User_Mgmt</button>
                    <button onClick={() => setActiveTab('diagnostics')} className={`text-left px-4 py-3 text-[10px] uppercase tracking-widest transition-all border ${activeTab === 'diagnostics' ? 'border-gem-teal bg-gem-teal/10 text-gem-teal' : 'border-transparent text-white/40 hover:text-white'}`}>Uplink_Diag</button>
                </div>

                <div className="flex-grow overflow-y-auto p-10 custom-scrollbar">
                    {activeTab === 'telemetry' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-6 border border-white/10 bg-white/5">
                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Load</div>
                                    <div className="text-3xl font-black text-gem-blue">{stats.clusterLoad}%</div>
                                </div>
                                <div className="p-6 border border-white/10 bg-white/5">
                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Health</div>
                                    <div className="text-3xl font-black text-gem-teal">{stats.healthScore}%</div>
                                </div>
                                <div className="p-6 border border-white/10 bg-white/5">
                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Latency</div>
                                    <div className="text-3xl font-black text-white">{wsState.telemetry.avgLatency.toFixed(1)}ms</div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Audit_Feed</h3>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                                    {logs.map((log, i) => (
                                        <div key={i} className="text-[9px] border-b border-white/5 pb-2 py-2 flex justify-between items-center group">
                                            <div>
                                                <span className="text-gem-blue/60 mr-4">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                                <span className="text-white font-bold uppercase">{log.action}:</span>
                                                <span className="ml-2 text-white/40 group-hover:text-white transition-colors">{log.details}</span>
                                            </div>
                                            <div className="text-[8px] opacity-20 group-hover:opacity-100 transition-opacity">
                                                User: {log.user}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'api_vault' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                             <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Secure_API_Vault</h2>
                                    <p className="text-[10px] text-gem-teal uppercase tracking-widest mt-1">Management of Encrypted Neural Links</p>
                                </div>
                                <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-2 rounded-sm">
                                    <span className="text-[10px] text-white/40 uppercase">Search_Owner:</span>
                                    <input 
                                        type="text" 
                                        value={apiSearch}
                                        onChange={(e) => setApiSearch(e.target.value)}
                                        className="bg-transparent text-white outline-none text-xs w-48"
                                        placeholder="Enter identifier..."
                                    />
                                </div>
                            </div>

                            <div className="border border-white/10 bg-black/40 overflow-hidden rounded-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-[9px] text-white/40 uppercase tracking-widest font-black border-b border-white/10">
                                        <tr>
                                            <th className="p-4">Owner_Identity</th>
                                            <th className="p-4">Encrypted_Sequence</th>
                                            <th className="p-4 text-center">Neural_Status</th>
                                            <th className="p-4 text-right">Usage_Metrics</th>
                                            <th className="p-4 text-center">Control_Override</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs">
                                        {usersWithKeys.map((u) => (
                                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{u.username}</div>
                                                    <div className="text-[8px] text-white/30">{u.role}</div>
                                                </td>
                                                <td className="p-4 font-mono text-white/60">
                                                    {u.apiKey ? `${u.apiKey.substring(0, 8)}...${u.apiKey.substring(u.apiKey.length - 6)}` : 'N/A'}
                                                </td>
                                                <td className="p-4 text-center">
                                                     <div className={`inline-flex items-center px-3 py-1 rounded-sm border ${u.keyStatus === 'ACTIVE' ? 'border-gem-teal/30 bg-gem-teal/10 text-gem-teal' : 'border-red-500/30 bg-red-500/10 text-red-500'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${u.keyStatus === 'ACTIVE' ? 'bg-gem-teal animate-pulse' : 'bg-red-500'}`}></span>
                                                        <span className="text-[9px] font-black uppercase">{u.keyStatus}</span>
                                                     </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-gem-blue font-bold">{u.keyUsage || 0} Req</div>
                                                    <div className="text-[8px] text-white/30 mt-1">
                                                        Last: {u.keyLastUsed ? new Date(u.keyLastUsed).toLocaleDateString() : 'NEVER'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => toggleKeyStatus(u.id)}
                                                        className={`text-[9px] uppercase font-bold tracking-wider px-4 py-2 border transition-all ${
                                                            u.keyStatus === 'ACTIVE' 
                                                            ? 'border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white' 
                                                            : 'border-gem-teal/50 text-gem-teal hover:bg-gem-teal hover:text-gem-onyx'
                                                        }`}
                                                    >
                                                        {u.keyStatus === 'ACTIVE' ? 'REVOKE_LINK' : 'ENABLE_LINK'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {usersWithKeys.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-white/20 uppercase tracking-widest text-[10px]">
                                                    No API Keys found matching query.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Account_Security_Matrix</h2>
                                    <p className="text-[10px] text-gem-teal uppercase tracking-widest mt-1">Status: SECURE // {users.length} Active Profiles</p>
                                </div>
                                <button 
                                    onClick={() => setShowCreateUser(true)}
                                    className="px-6 py-3 bg-gem-teal text-gem-onyx font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                                >
                                    Provision_New_Identity
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {users.map((u) => (
                                    <div key={u.id} className="p-6 border border-white/10 bg-white/5 flex flex-col space-y-4 group">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-6">
                                                <div className="w-10 h-10 border border-gem-blue/30 flex items-center justify-center bg-gem-blue/5">
                                                    <span className="text-xs text-gem-blue">{u.username.substring(0, 2).toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white uppercase tracking-wider">{u.username}</div>
                                                    <div className="text-[8px] text-white/30 uppercase tracking-widest mt-1">ID: {u.id} // Role: {u.role}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-10 text-right">
                                                <div>
                                                    <div className="text-[8px] text-white/20 uppercase mb-1">Status</div>
                                                    <div className={`text-[10px] font-bold ${u.mustResetPassword ? 'text-orange-500' : 'text-gem-teal'}`}>
                                                        {u.mustResetPassword ? 'PENDING_INITIAL_SYNC' : 'ACTIVE_VERIFIED'}
                                                    </div>
                                                </div>
                                                <div className="w-24">
                                                    <div className="text-[8px] text-white/20 uppercase mb-1">Privileges</div>
                                                    <div className="text-[10px] text-white/60">{u.role === UserRole.Admin ? 'FULL_KERNEL' : 'VIEWONLY'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-white/20 uppercase mb-1">Neural_Key (API)</span>
                                                {editingApiKey === u.id ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="password"
                                                            value={apiKeyInput}
                                                            onChange={(e) => setApiKeyInput(e.target.value)}
                                                            className="bg-black/40 border border-gem-blue/30 px-3 py-1 text-[10px] text-white outline-none w-64"
                                                            placeholder="Paste valid API key..."
                                                            autoFocus
                                                        />
                                                        <button 
                                                            onClick={() => handleUpdateApiKey(u.id)}
                                                            className="text-[9px] text-gem-teal uppercase hover:text-white"
                                                        >
                                                            [Commit]
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingApiKey(null)}
                                                            className="text-[9px] text-red-500 uppercase hover:text-white"
                                                        >
                                                            [Abort]
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-[10px] text-white/40 font-mono">
                                                            {u.apiKey ? `${u.apiKey.substring(0, 4)}••••••••${u.apiKey.substring(u.apiKey.length - 4)}` : 'NULL_UNSET (SYSTEM_DEFAULT)'}
                                                        </span>
                                                        <button 
                                                            onClick={() => { setEditingApiKey(u.id); setApiKeyInput(u.apiKey || ''); }}
                                                            className="text-[9px] text-gem-blue uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            [Update_Key]
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {showCreateUser && (
                                <div className="fixed inset-0 z-[100] bg-gem-onyx/90 backdrop-blur-md flex items-center justify-center p-6">
                                    <form onSubmit={handleCreateUser} className="w-full max-w-md p-10 border border-gem-teal/30 bg-black/80 space-y-8 animate-in zoom-in duration-300">
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Provision_Identity</h3>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-gem-teal uppercase tracking-widest">Username</label>
                                                <input 
                                                    type="text" 
                                                    value={newUsername}
                                                    onChange={(e) => setNewUsername(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 p-4 text-white outline-none focus:border-gem-teal transition-all"
                                                    autoFocus
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-gem-teal uppercase tracking-widest">Neural_Role (RBAC)</label>
                                                <select 
                                                    value={newRole}
                                                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                                                    className="w-full bg-white/5 border border-white/10 p-4 text-white outline-none focus:border-gem-teal transition-all uppercase"
                                                >
                                                    <option value={UserRole.Viewer}>Viewer (RESTRICTED)</option>
                                                    <option value={UserRole.Admin}>Admin (FULL_PRIVILEGE)</option>
                                                </select>
                                                <p className="text-[8px] text-white/30 uppercase">Admins possess full access to diagnostics and user management.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-gem-teal uppercase tracking-widest">Initial_API_Key (Optional)</label>
                                                <input 
                                                    type="password" 
                                                    value={newApiKey}
                                                    onChange={(e) => setNewApiKey(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 p-4 text-white outline-none focus:border-gem-teal transition-all"
                                                    placeholder="Leave blank to use System Default"
                                                />
                                            </div>
                                            <div className="p-4 bg-gem-teal/10 border border-gem-teal/20">
                                                <p className="text-[9px] text-gem-teal uppercase font-bold tracking-widest">Initialization Policy:</p>
                                                <p className="text-[8px] text-white/60 uppercase mt-1">
                                                    New accounts are provisioned with BLANK passwords.
                                                    The user will be required to set a secure password upon their first login attempt.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-4 pt-6">
                                            <button type="submit" className="flex-grow py-4 bg-gem-teal text-gem-onyx font-black text-xs uppercase tracking-widest hover:bg-white transition-all">Establish</button>
                                            <button type="button" onClick={() => setShowCreateUser(false)} className="px-6 py-4 border border-white/10 text-white/40 text-xs uppercase tracking-widest hover:text-white">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'diagnostics' && (
                        <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Neural_Uplink_Diagnostics</h2>
                            <div className="p-8 border border-white/10 bg-white/5 space-y-6">
                                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                    <div>
                                        <div className="text-[10px] text-white/40 uppercase mb-1">Synapse_Key_Status</div>
                                        <div className="text-xl font-bold text-gem-teal">
                                            {adminUser.apiKey ? 'VERIFIED // USER_MANAGED' : 'SYSTEM_DEFAULT // ENV_ACTIVE'}
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 border ${stats.healthScore > 50 ? 'border-gem-teal text-gem-teal' : 'border-red-500 text-red-500'} text-[10px] font-bold`}>
                                        {stats.healthScore > 50 ? 'UPLINK_STABLE' : 'LINK_DEGRADED'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <div className="text-[10px] text-white/40 uppercase mb-1">Throughput_Ratio</div>
                                        <div className="text-lg font-mono text-white">{wsState.telemetry.successCount} / {wsState.telemetry.successCount + wsState.telemetry.failureCount}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-white/40 uppercase mb-1">Encryption_Protocol</div>
                                        <div className="text-lg font-mono text-white">AES-256-SYNAPSE</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'robotics' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Robotic_Clearance</h2>
                                    <p className="text-[10px] text-gem-blue uppercase tracking-widest mt-1">Status: {wsState.pathClearance}</p>
                                </div>
                                {adminUser.role === UserRole.Admin ? (
                                    <div className="flex space-x-4">
                                        <button 
                                            onClick={runFullProtocol}
                                            disabled={missionStep > 0}
                                            className={`px-8 py-4 font-black uppercase tracking-[0.4em] text-xs transition-all ${missionStep > 0 ? 'bg-gem-teal/20 text-gem-teal animate-pulse' : 'bg-gem-blue text-gem-onyx hover:bg-white'}`}
                                        >
                                            {missionStep > 0 ? `EXECUTING_STEP_0${missionStep}` : 'INIT_FULL_PROTOCOL'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] uppercase tracking-widest font-black">
                                        ACCESS_DENIED: INSUFFICIENT_PRIVILEGES
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-12 gap-8 h-[500px]">
                                <div className="col-span-8 border border-white/10 bg-black/40">
                                    <WorkspaceMonitor obstructions={wsState.obstructions} />
                                </div>
                                <div className="col-span-4 p-6 border border-white/10 bg-white/5 space-y-4 overflow-y-auto custom-scrollbar">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Clearance_Logs</h3>
                                    {wsState.missionLog.map((log, i) => (
                                        <div key={i} className="text-[9px] font-mono p-2 border border-white/5 bg-black/20 text-gem-teal">
                                            &gt; {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPortal;
