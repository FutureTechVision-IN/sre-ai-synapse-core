/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { telemetry } from '../services/telemetryService';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        telemetry.critical('Uncaught exception in React tree', { error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
            <div className="w-full h-screen bg-gem-onyx flex items-center justify-center text-gem-offwhite font-mono-data">
                <div className="max-w-2xl w-full p-8 border border-red-500/30 bg-red-900/10 rounded-lg backdrop-blur">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">system.critical_fault</h1>
                    <p className="font-outfit mb-6">
                        The neural interface has encountered an unrecoverable error. Telemetry has been logged.
                    </p>
                    <div className="p-4 bg-black/50 rounded mb-6 overflow-auto text-sm">
                        <code>{this.state.error?.message}</code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-gem-teal/20 hover:bg-gem-teal/30 text-gem-teal border border-gem-teal/50 rounded transition-colors"
                    >
                        system.reboot()
                    </button>
                </div>
            </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
