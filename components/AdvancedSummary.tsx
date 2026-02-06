
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SummaryData {
    reportTitle: string;
    metadata: {
        incidentId: string;
        systemScope: string;
        confidentiality: string;
    };
    executiveSummary: string;
    keyFindings: string[];
    actionPlan: {
        phase: string;
        objectives: string[];
    }[];
    telemetryOverview: {
        metric: string;
        value: string;
        status: string;
    }[];
    auditLog?: {
        discrepancy: string;
        correction: string;
        confidence: string;
    }[];
}

interface AdvancedSummaryProps {
    data: SummaryData;
    onClose: () => void;
}

const AdvancedSummary: React.FC<AdvancedSummaryProps> = ({ data, onClose }) => {
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [integrity, setIntegrity] = useState(0);

    useEffect(() => {
        const target = Math.floor(Math.random() * 15) + 85; // Simulating high integrity
        let current = 0;
        const interval = setInterval(() => {
            if (current < target) {
                current += 1;
                setIntegrity(current);
            } else {
                clearInterval(interval);
            }
        }, 20);
        return () => clearInterval(interval);
    }, []);

    const getMetadataHeader = () => {
        return `--- NEURAL_SUMMARY_METADATA ---
ID: ${data.metadata.incidentId}
SCOPE: ${data.metadata.systemScope}
TIMESTAMP: ${new Date().toISOString()}
CLASSIFICATION: ${data.metadata.confidentiality}
SYSTEM: SRE_SYNAPSE_CORE_V4
-------------------------------\n\n`;
    };

    const exportToMarkdown = () => {
        setIsExporting('Markdown');
        let md = getMetadataHeader();
        md += `# ${data.reportTitle}\n\n`;
        md += `## Executive Summary\n${data.executiveSummary}\n\n`;
        md += `## Key Findings\n${data.keyFindings.map(f => `- ${f}`).join('\n')}\n\n`;
        if (data.auditLog && data.auditLog.length > 0) {
            md += `## Data Integrity & Auto-Correction Log\n| Discrepancy | Correction Applied | Confidence |\n|---|---|---|\n`;
            data.auditLog.forEach(a => {
                md += `| ${a.discrepancy} | ${a.correction} | ${a.confidence} |\n`;
            });
            md += `\n`;
        }
        md += `## Action Plan\n`;
        data.actionPlan.forEach(p => {
            md += `### Phase: ${p.phase}\n${p.objectives.map(o => `- ${o}`).join('\n')}\n\n`;
        });
        md += `## Telemetry Overview\n| Metric | Value | Status |\n|---|---|---|\n`;
        data.telemetryOverview.forEach(t => {
            md += `| ${t.metric} | ${t.value} | ${t.status} |\n`;
        });

        downloadFile(md, `SYNAPSE_SUMMARY_${data.metadata.incidentId}.md`, 'text/markdown');
        setIsExporting(null);
    };

    const exportToPlainText = () => {
        setIsExporting('Text');
        let txt = getMetadataHeader();
        txt += `${data.reportTitle.toUpperCase()}\n`;
        txt += `${'='.repeat(data.reportTitle.length)}\n\n`;
        txt += `EXECUTIVE SUMMARY:\n${data.executiveSummary}\n\n`;
        txt += `KEY FINDINGS:\n${data.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n`;
        if (data.auditLog && data.auditLog.length > 0) {
            txt += `AUDIT & CORRECTION LOG:\n`;
            data.auditLog.forEach(a => {
                txt += `[FIXED]: ${a.discrepancy} -> ${a.correction} (${a.confidence})\n`;
            });
            txt += `\n`;
        }
        txt += `ACTION PLAN:\n`;
        data.actionPlan.forEach(p => {
            txt += `[ PHASE: ${p.phase} ]\n${p.objectives.map(o => `  > ${o}`).join('\n')}\n\n`;
        });
        txt += `TELEMETRY:\n`;
        data.telemetryOverview.forEach(t => {
            txt += `${t.metric.padEnd(25)}: ${t.value.padEnd(15)} [${t.status.toUpperCase()}]\n`;
        });

        downloadFile(txt, `SYNAPSE_LOG_${data.metadata.incidentId}.txt`, 'text/plain');
        setIsExporting(null);
    };

    const exportToCSV = () => {
        setIsExporting('CSV');
        let csv = `Type,Category/Phase,Metric/Objective,Value/Detail,Status\n`;
        csv += `METADATA,System,Scope,${data.metadata.systemScope},N/A\n`;
        csv += `METADATA,Security,Classification,${data.metadata.confidentiality},N/A\n`;
        
        if (data.auditLog) {
            data.auditLog.forEach(a => {
                csv += `AUDIT,Data_Correction,"${a.discrepancy}","${a.correction}","${a.confidence}"\n`;
            });
        }

        data.telemetryOverview.forEach(t => {
            csv += `TELEMETRY,N/A,"${t.metric}","${t.value}","${t.status}"\n`;
        });
        data.actionPlan.forEach(p => {
            p.objectives.forEach(o => {
                csv += `ACTION_PLAN,"${p.phase}","${o}",N/A,PENDING\n`;
            });
        });

        downloadFile(csv, `SYNAPSE_DATA_${data.metadata.incidentId}.csv`, 'text/csv');
        setIsExporting(null);
    };

    const exportToPDF = () => {
        setIsExporting('PDF');
        try {
            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString();
            
            // Background branding rect - High Contrast Dark Theme
            doc.setFillColor(15, 15, 15);
            doc.rect(0, 0, 210, 297, 'F');

            // Header Section
            doc.setFillColor(0, 240, 255);
            doc.rect(0, 0, 210, 6, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('courier', 'bold');
            doc.text("SRE SYNAPSE // EXECUTIVE DOSSIER", 15, 25);
            
            doc.setFontSize(8);
            doc.setFont('courier', 'normal');
            doc.setTextColor(0, 240, 255);
            doc.text(`ID: ${data.metadata.incidentId} | NODE: ENSEMBLE_PREVIEW_3.1 | AUTH: ENCRYPTED`, 15, 32);
            
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.1);
            doc.line(15, 38, 195, 38);

            // Report Body - Executive Summary
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(data.reportTitle.toUpperCase(), 15, 50);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 200, 200);
            const summaryLines = doc.splitTextToSize(data.executiveSummary, 180);
            doc.text(summaryLines, 15, 60);

            let currentY = 60 + (summaryLines.length * 5) + 15;

            // Key Findings Table
            doc.setTextColor(0, 255, 148);
            doc.setFontSize(11);
            doc.setFont('courier', 'bold');
            doc.text("FORENSIC_KEY_FINDINGS", 15, currentY);
            currentY += 6;

            autoTable(doc, {
                startY: currentY,
                head: [['#', 'Observation & Neural Correlation']],
                body: data.keyFindings.map((f, i) => [`0${i+1}`, f]),
                theme: 'grid',
                styles: { 
                    fontSize: 9, 
                    font: 'helvetica', 
                    fillColor: [25, 25, 25], 
                    textColor: [220, 220, 220],
                    lineColor: [50, 50, 50],
                    lineWidth: 0.1
                },
                headStyles: { 
                    fillColor: [0, 240, 255], 
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                },
                margin: { left: 15, right: 15 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;

            // Audit Log Table (If Exists)
            if (data.auditLog && data.auditLog.length > 0) {
                doc.setTextColor(255, 62, 0); // Orange-Red
                doc.setFontSize(11);
                doc.text("DATA_INTEGRITY_AUDIT_LOG", 15, currentY);
                currentY += 6;

                autoTable(doc, {
                    startY: currentY,
                    head: [['Discrepancy Detected', 'Correction Applied', 'Confidence']],
                    body: data.auditLog.map(a => [a.discrepancy, a.correction, a.confidence]),
                    theme: 'grid',
                    styles: { 
                        fontSize: 8, 
                        font: 'courier', 
                        fillColor: [40, 20, 20], 
                        textColor: [255, 200, 200],
                        lineColor: [100, 50, 50],
                        lineWidth: 0.1
                    },
                    headStyles: { 
                        fillColor: [200, 50, 50], 
                        textColor: [255, 255, 255],
                        fontStyle: 'bold'
                    }
                });
                currentY = (doc as any).lastAutoTable.finalY + 15;
            }

            // Telemetry Matrix
            doc.setTextColor(0, 255, 148);
            doc.setFontSize(11);
            doc.text("SYSTEM_TELEMETRY_MATRIX", 15, currentY);
            currentY += 6;

            autoTable(doc, {
                startY: currentY,
                head: [['Metric', 'Diagnostic Value', 'Status']],
                body: data.telemetryOverview.map(t => [t.metric.toUpperCase(), t.value, t.status]),
                theme: 'grid',
                styles: { 
                    fontSize: 9, 
                    font: 'courier', 
                    fillColor: [30, 30, 30], 
                    textColor: [0, 240, 255],
                    lineColor: [50, 50, 50],
                    lineWidth: 0.1
                },
                headStyles: { 
                    fillColor: [20, 20, 20], 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                }
            });
            
            // Action Plan
            currentY = (doc as any).lastAutoTable.finalY + 15;
            doc.setTextColor(0, 255, 148);
            doc.setFontSize(11);
            doc.text("TACTICAL_ACTION_PLAN", 15, currentY);
            currentY += 6;
            
            data.actionPlan.forEach((plan) => {
                if (currentY > 250) { doc.addPage(); currentY = 20; }
                
                doc.setTextColor(0, 240, 255);
                doc.setFontSize(10);
                doc.text(`> ${plan.phase.toUpperCase()}`, 15, currentY);
                currentY += 5;
                
                doc.setTextColor(180, 180, 180);
                doc.setFontSize(9);
                plan.objectives.forEach(obj => {
                    const lines = doc.splitTextToSize(`- ${obj}`, 170);
                    doc.text(lines, 20, currentY);
                    currentY += (lines.length * 4) + 2;
                });
                currentY += 5;
            });

            // Page Footer
            const pageCount = doc.internal.pages.length - 1;
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(100, 100, 100);
                doc.text(`CONFIDENTIALITY: ${data.metadata.confidentiality} | SYNCED: ${timestamp}`, 15, 285);
                doc.text(`PAGE ${i} OF ${pageCount}`, 195, 285, { align: 'right' });
            }

            doc.save(`SYNAPSE_DOSSIER_${data.metadata.incidentId}.pdf`);
        } catch (err) {
            console.error("PDF generation error:", err);
        } finally {
            setIsExporting(null);
        }
    };

    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-gem-onyx/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-12 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-7xl bg-black border border-white/10 p-6 lg:p-20 relative glass-card animate-in fade-in zoom-in duration-700 shadow-[0_0_120px_rgba(0,240,255,0.15)] flex flex-col lg:flex-row gap-16">
                
                {/* Close Command */}
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 z-[300] bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-[10px] uppercase font-mono-data border border-white/10 px-8 py-4 tracking-[0.3em]"
                >
                    [Exit_Protocol]
                </button>

                {/* Left Panel: Narrative Analysis */}
                <div className="flex-1 space-y-16">
                    <header>
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="w-3 h-3 bg-gem-blue rounded-full shadow-[0_0_15px_#00F0FF] animate-pulse"></div>
                            <span className="text-[10px] text-gem-blue font-mono-data tracking-[0.6em] uppercase">Intelligence Synthesis Complete</span>
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black italic tracking-tighter text-white uppercase leading-[0.95] mb-4">
                            {data.reportTitle}
                        </h1>
                        <p className="text-[10px] font-mono-data text-white/30 uppercase tracking-[0.4em]">
                            Source: Distributed Neural Nodes // Security: {data.metadata.confidentiality}
                        </p>
                    </header>

                    <section className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gem-blue/60 border-b border-gem-blue/20 pb-4">01_EXECUTIVE_SUMMARY</h3>
                        <p className="text-lg lg:text-2xl leading-relaxed text-gem-offwhite font-light opacity-90 italic">
                            "{data.executiveSummary}"
                        </p>
                    </section>

                    {data.auditLog && data.auditLog.length > 0 && (
                        <section className="space-y-6 animate-in slide-in-from-left-4 duration-700">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500/80 border-b border-red-500/20 pb-4 flex items-center">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping mr-3"></span>
                                02_DATA_INTEGRITY_AUDIT_LOG
                            </h3>
                            <div className="bg-red-500/[0.05] border-l-2 border-red-500 p-6 space-y-4">
                                {data.auditLog.map((audit, i) => (
                                    <div key={i} className="flex flex-col space-y-1">
                                        <div className="flex justify-between items-center text-xs font-mono-data">
                                            <span className="text-white/60">Discrepancy Detected:</span>
                                            <span className="text-red-400">{audit.discrepancy}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-mono-data font-bold">
                                            <span className="text-gem-teal">Correction Applied:</span>
                                            <span className="text-white">{audit.correction}</span>
                                        </div>
                                        <div className="text-[9px] text-white/20 uppercase tracking-widest mt-1 text-right">
                                            Confidence: {audit.confidence}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="space-y-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gem-blue/60 border-b border-gem-blue/20 pb-4">03_FORENSIC_OBSERVATIONS</h3>
                        <div className="grid grid-cols-1 gap-6">
                            {data.keyFindings.map((finding, i) => (
                                <div key={i} className="flex group">
                                    <span className="text-gem-blue font-mono-data text-[10px] mt-1 tabular-nums mr-8 opacity-40 group-hover:opacity-100 transition-opacity">0{i+1}</span>
                                    <div className="flex-grow p-6 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all">
                                        <p className="text-sm text-white/80 leading-relaxed font-light">{finding}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-10">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gem-teal/60 border-b border-gem-teal/20 pb-4">04_PHASED_REMEDIATION</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {data.actionPlan.map((p, i) => (
                                <div key={i} className="p-8 bg-gem-teal/[0.01] border border-gem-teal/10 relative overflow-hidden group hover:border-gem-teal/30 transition-all">
                                    <div className="absolute top-0 right-0 p-2 text-[40px] font-black text-gem-teal/5 tabular-nums pointer-events-none">0{i+1}</div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gem-teal mb-8">{p.phase}</h4>
                                    <ul className="space-y-4">
                                        {p.objectives.map((o, oi) => (
                                            <li key={oi} className="text-[10px] text-white/40 flex items-start space-x-3 group-hover:text-white/70 transition-colors">
                                                <span className="text-gem-teal mt-1">›</span>
                                                <span>{o}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                         </div>
                    </section>
                </div>

                {/* Right Panel: Data Matrix & Controls */}
                <div className="lg:w-[400px] shrink-0 space-y-12">
                    
                    {/* Integrity Meter */}
                    <div className="p-10 border border-white/10 bg-white/[0.02] flex flex-col items-center text-center">
                        <div className="relative w-40 h-40 mb-8">
                             <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * integrity) / 100} className="text-gem-teal transition-all duration-1000 ease-out" />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-white tabular-nums">{integrity}%</span>
                                <span className="text-[8px] text-white/40 uppercase tracking-widest mt-1">Structural Integrity</span>
                             </div>
                        </div>
                        <div className="text-[10px] font-mono-data text-gem-teal uppercase tracking-widest animate-pulse">Neural_Link_Verified</div>
                    </div>

                    <section className="space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Realtime_Telemetry</h3>
                        <div className="space-y-4">
                            {data.telemetryOverview?.map((t, i) => (
                                <div key={i} className="flex justify-between items-end border-b border-white/5 pb-4 group">
                                    <div>
                                        <div className="text-[8px] text-white/20 uppercase tracking-widest mb-1 group-hover:text-gem-blue transition-colors">{t.metric}</div>
                                        <div className="text-base font-mono-data text-white">{t.value}</div>
                                    </div>
                                    <div className={`text-[8px] font-black px-3 py-1 rounded-sm border ${
                                        t.status.toLowerCase() === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                        t.status.toLowerCase() === 'stable' ? 'bg-gem-teal/10 text-gem-teal border-gem-teal/20' :
                                        'bg-gem-blue/10 text-gem-blue border-gem-blue/20'
                                    }`}>
                                        {t.status.toUpperCase()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mb-6">Execution_Matrix</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                onClick={exportToPDF}
                                disabled={!!isExporting}
                                className="group relative w-full py-6 bg-gem-blue text-gem-onyx font-black text-[11px] uppercase tracking-[0.4em] hover:bg-white transition-all disabled:opacity-50 overflow-hidden"
                            >
                                <span className="relative z-10">{isExporting === 'PDF' ? 'Compiling_Forensics...' : 'Execute_PDF_Export'}</span>
                                {isExporting === 'PDF' && <div className="absolute bottom-0 left-0 h-1 bg-gem-onyx animate-progress-infinite w-full"></div>}
                            </button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={exportToMarkdown} className="py-4 border border-white/10 text-white/60 text-[9px] uppercase tracking-[0.2em] hover:text-white hover:border-white transition-all">Markdown</button>
                                <button onClick={exportToPlainText} className="py-4 border border-white/10 text-white/60 text-[9px] uppercase tracking-[0.2em] hover:text-white hover:border-white transition-all">Plain_Text</button>
                            </div>
                            <button onClick={exportToCSV} className="w-full py-4 border border-white/10 text-white/60 text-[9px] uppercase tracking-[0.2em] hover:text-gem-teal hover:border-gem-teal transition-all">Tabular_Matrix (CSV)</button>
                        </div>
                    </section>

                    <div className="pt-10 border-t border-white/5 text-center">
                         <div className="text-[8px] font-mono-data uppercase tracking-[0.4em] text-white/10">SRE_SYNAPSE_SYSTEM_STABLE_4.2.0</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSummary;
