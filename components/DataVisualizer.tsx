
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import { 
    ComposedChart, 
    Line, 
    Area, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Scatter,
    Brush,
    Legend,
    ReferenceLine
} from 'recharts';

interface DataPoint {
    index: number;
    value: number;
    label?: string;
    confidenceHigh?: number;
    confidenceLow?: number;
}

export interface VisualData {
    visualType: 'lotteryPattern' | 'trend' | 'distribution' | 'prediction';
    chartTitle: string;
    points: DataPoint[];
    sentiment?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-gem-onyx/95 border border-gem-blue/40 p-3 font-mono-data text-[10px] shadow-2xl rounded-sm backdrop-blur-sm z-50">
                <p className="text-white mb-1 uppercase tracking-widest">{data.label || `Index ${data.index}`}</p>
                <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-gem-blue rounded-full"></span>
                    <p className="text-gem-blue font-bold">Value: {data.value}</p>
                </div>
                {data.confidenceHigh !== undefined && data.confidenceLow !== undefined && (
                    <div className="mt-1 pt-1 border-t border-white/10">
                        <p className="text-gem-teal opacity-80 font-bold">Confidence Range:</p>
                        <p className="text-white/60">Low: {data.confidenceLow}</p>
                        <p className="text-white/60">High: {data.confidenceHigh}</p>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const DataVisualizer: React.FC<{ data: VisualData }> = ({ data }) => {
    const isLottery = data.visualType === 'lotteryPattern';
    const isPrediction = data.visualType === 'prediction';
    const isDistribution = data.visualType === 'distribution';
    
    // Smart default: Lottery/Distribution -> Bar, Trend/Prediction -> Composed
    const [chartMode, setChartMode] = useState<'composed' | 'bar' | 'area'>(
        (isLottery || isDistribution) ? 'bar' : 'composed'
    );
    
    // Safety check for empty data
    if (!data || !data.points || data.points.length === 0) {
        return (
            <div className="w-full p-6 border border-red-500/20 bg-red-500/5 rounded-sm flex items-center justify-center text-red-500 font-mono-data text-xs">
                DATA_VISUALIZATION_ERROR: EMPTY_DATASET
            </div>
        );
    }

    const chartData = useMemo(() => data.points.map(p => ({
        ...p,
        // Calculate range for Area chart if confidence intervals exist, otherwise approximate for effect if needed
        range: (p.confidenceLow !== undefined && p.confidenceHigh !== undefined) 
            ? [p.confidenceLow, p.confidenceHigh] 
            : [p.value * 0.9, p.value * 1.1]
    })), [data.points]);

    const primaryColor = isLottery ? '#00FF94' : '#00F0FF';
    const rangeColor = isPrediction ? '#00F0FF' : '#ffffff';

    const handleDownloadCSV = () => {
        const headers = ['Index', 'Label', 'Value', 'Confidence Low', 'Confidence High'];
        const rows = data.points.map(p => [
            p.index, 
            p.label || '', 
            p.value, 
            p.confidenceLow || '', 
            p.confidenceHigh || ''
        ].join(','));
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SYNAPSE_DATA_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    
    return (
        <div className="w-full my-6 p-6 border border-gem-blue/20 bg-gem-blue/5 rounded-sm animate-in fade-in zoom-in duration-500 relative overflow-hidden group">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" 
                style={{ backgroundImage: `linear-gradient(${primaryColor} 1px, transparent 1px), linear-gradient(90deg, ${primaryColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
            </div>

            {/* Header Toolbar */}
            <div className="flex flex-wrap justify-between items-center mb-6 relative z-10">
                <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 ${isLottery ? 'bg-gem-teal' : 'bg-gem-blue'} animate-pulse`}></div>
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                            {data.chartTitle || (isLottery ? 'NEURAL_PATTERN_PROJECTION' : 'DATA_ANALYSIS')}
                        </h4>
                        <div className="text-[8px] text-white/40 uppercase tracking-widest font-mono-data mt-1">
                            {data.visualType.toUpperCase()} // SIG: {(data.sentiment || 0).toFixed(2)}
                        </div>
                    </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                    <button 
                        onClick={handleDownloadCSV}
                        className="text-[9px] uppercase tracking-widest text-white/40 hover:text-gem-teal transition-colors"
                    >
                        [Export_CSV]
                    </button>
                    <div className="flex space-x-1">
                        {['composed', 'bar', 'area'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setChartMode(mode as any)}
                                className={`px-3 py-1 text-[9px] uppercase tracking-widest border transition-all ${
                                    chartMode === mode 
                                    ? `border-${isLottery ? 'gem-teal' : 'gem-blue'} bg-${isLottery ? 'gem-teal' : 'gem-blue'}/20 text-white` 
                                    : 'border-white/10 text-white/40 hover:border-white/30'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[300px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={rangeColor} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={rangeColor} stopOpacity={0.05}/>
                            </linearGradient>
                            <pattern id="patternStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <rect width="4" height="8" transform="translate(0,0)" fill={primaryColor} fillOpacity="0.1" />
                            </pattern>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis 
                            dataKey="label" 
                            stroke="#ffffff40" 
                            fontSize={9} 
                            tickLine={false} 
                            axisLine={false}
                            fontFamily="JetBrains Mono"
                            interval="preserveStartEnd"
                        />
                        <YAxis 
                            stroke="#ffffff40" 
                            fontSize={9} 
                            tickLine={false} 
                            axisLine={false}
                            fontFamily="JetBrains Mono"
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 1 }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }} />
                        
                        {/* Brushing for Zoom */}
                        <Brush 
                            dataKey="index" 
                            height={20} 
                            stroke={primaryColor} 
                            fill="#111111" 
                            tickFormatter={() => ''}
                            travellerWidth={10}
                        />

                        {/* Chart Layers */}
                        {(chartMode === 'composed' || chartMode === 'area') && (
                            <Area 
                                type="monotone" 
                                dataKey="range" 
                                stroke="none" 
                                fill={isPrediction ? "url(#colorRange)" : "#ffffff"} 
                                fillOpacity={1} 
                                connectNulls
                                name="Confidence Interval"
                            />
                        )}
                        
                        {(chartMode === 'bar' || (chartMode === 'composed' && isLottery)) && (
                            <Bar 
                                dataKey="value" 
                                fill={`url(#colorValue)`} 
                                barSize={isLottery ? 12 : 20}
                                stroke={primaryColor}
                                strokeOpacity={0.5}
                                name={isLottery ? "Frequency" : "Value"}
                            />
                        )}

                        {chartMode === 'composed' && (
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke={primaryColor} 
                                strokeWidth={2} 
                                dot={!isLottery ? { fill: primaryColor, r: 3, strokeWidth: 0 } : false} 
                                activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1 }}
                                animationDuration={1000}
                                name={isPrediction ? "Forecasted Value" : "Trend Line"}
                            />
                        )}
                        
                        {/* Explicit Scatter points for key markers if needed, or overlay */}
                        {chartMode === 'composed' && isLottery && (
                            <Scatter 
                                dataKey="value" 
                                fill="#ffffff" 
                                line={false}
                                shape="cross" 
                                name="Hit Marker"
                            />
                        )}
                        
                        {/* Reference Line for Mean (Optional enhancement) */}
                        {isLottery && (
                            <ReferenceLine 
                                y={data.points.reduce((a,b) => a + b.value, 0) / data.points.length} 
                                stroke="#ffffff40" 
                                strokeDasharray="3 3" 
                                label={{ position: 'right', value: 'AVG', fill: '#ffffff40', fontSize: 8 }}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            
            {/* Footer Stats */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center space-x-2">
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono-data">Points</span>
                    <span className="text-xs font-bold text-white font-mono-data">{data.points.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono-data">Max</span>
                    <span className="text-xs font-bold text-gem-teal font-mono-data">
                        {Math.max(...data.points.map(p => p.value))}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono-data">Mean</span>
                    <span className="text-xs font-bold text-gem-blue font-mono-data">
                        {(data.points.reduce((a, b) => a + b.value, 0) / data.points.length).toFixed(1)}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono-data">Mode</span>
                    <span className="text-xs font-bold text-white font-mono-data">
                        {isLottery ? 'DISCRETE' : (isPrediction ? 'PREDICTIVE' : 'CONTINUOUS')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DataVisualizer;
