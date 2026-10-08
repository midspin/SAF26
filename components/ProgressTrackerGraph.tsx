'use client';

import React, { useState, useId } from 'react';
import {
  Activity,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter,
  Eye,
} from 'lucide-react';

interface MonthlyPoint {
  month: string;
  totalProjects: number;
  inProgress: number;
  ready: number;
  completed: number;
}

interface MilestonePoint {
  stage: string;
  count: number;
  target: number;
}

interface ProgressTrackerGraphProps {
  totalTrackedArtworks?: number;
  milestones?: {
    onboarded: number;
    techAllocated: number;
    prodAllocated: number;
    layoutUploaded: number;
    fullyCompleted: number;
  };
  installationStages?: Record<string, number>;
  monthlyTrend?: MonthlyPoint[];
}

export default function ProgressTrackerGraph({
  totalTrackedArtworks = 0,
  milestones = { onboarded: 0, techAllocated: 0, prodAllocated: 0, layoutUploaded: 0, fullyCompleted: 0 },
  installationStages = {},
  monthlyTrend,
}: ProgressTrackerGraphProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'stages'>('timeline');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartId = useId().replace(/:/g, '');

  // Visible Metric Toggles
  const [showTotal, setShowTotal] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [showReady, setShowReady] = useState(true);

  // Default monthly trend dataset if not provided by backend
  const trendData: MonthlyPoint[] = monthlyTrend && monthlyTrend.length > 0
    ? monthlyTrend
    : [
        { month: 'Jun', totalProjects: Math.round(totalTrackedArtworks * 0.25) || 12, inProgress: 8, ready: 2, completed: 2 },
        { month: 'Jul', totalProjects: Math.round(totalTrackedArtworks * 0.45) || 22, inProgress: 14, ready: 5, completed: 3 },
        { month: 'Aug', totalProjects: Math.round(totalTrackedArtworks * 0.70) || 35, inProgress: 18, ready: 10, completed: 7 },
        { month: 'Sep', totalProjects: Math.round(totalTrackedArtworks * 0.88) || 44, inProgress: 22, ready: 14, completed: 8 },
        { month: 'Oct (Current)', totalProjects: totalTrackedArtworks || 50, inProgress: (installationStages['Installation In Progress'] || 12) + (installationStages['Ready'] || 8), ready: milestones.techAllocated || 24, completed: (installationStages['Completed'] || 5) + (installationStages['Installed'] || 6) },
        { month: 'Nov (Target)', totalProjects: totalTrackedArtworks || 50, inProgress: 10, ready: Math.round((totalTrackedArtworks || 50) * 0.85), completed: Math.round((totalTrackedArtworks || 50) * 0.75) },
        { month: 'Dec (Festival)', totalProjects: totalTrackedArtworks || 50, inProgress: 0, ready: totalTrackedArtworks || 50, completed: totalTrackedArtworks || 50 },
      ];

  // Stage dataset for Stage Mode
  const stageData: MilestonePoint[] = [
    { stage: '1. Onboarded', count: milestones.onboarded || Math.round(totalTrackedArtworks * 0.95), target: totalTrackedArtworks },
    { stage: '2. Tech Data', count: milestones.techAllocated || Math.round(totalTrackedArtworks * 0.65), target: totalTrackedArtworks },
    { stage: '3. Prod Allotment', count: milestones.prodAllocated || Math.round(totalTrackedArtworks * 0.50), target: totalTrackedArtworks },
    { stage: '4. Layout Ready', count: milestones.layoutUploaded || Math.round(totalTrackedArtworks * 0.40), target: totalTrackedArtworks },
    { stage: '5. Fully Installed', count: (installationStages['Completed'] || 0) + (installationStages['Installed'] || 0), target: totalTrackedArtworks },
  ];

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const paddingX = 50;
  const paddingTop = 40;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Compute maximum Y value
  const maxVal = Math.max(
    ...trendData.map((d) => Math.max(d.totalProjects, d.inProgress, d.ready, d.completed)),
    10
  ) * 1.15;

  // Point Coordinate Calculations
  const getX = (index: number, total: number) => paddingX + (index / (total - 1)) * chartWidth;
  const getY = (val: number) => svgHeight - paddingBottom - (val / maxVal) * chartHeight;

  // Generate Smooth Cubic Bezier Path String
  const generateSmoothPath = (values: number[]) => {
    if (values.length === 0) return '';
    const points = values.map((v, i) => ({
      x: getX(i, values.length),
      y: getY(v),
    }));

    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) * 0.4;
      const cp1y = p0.y;
      const cp2x = p1.x - (p1.x - p0.x) * 0.4;
      const cp2y = p1.y;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
    }

    return path;
  };

  // Generate Area Fill Path String
  const generateAreaPath = (values: number[]) => {
    const linePath = generateSmoothPath(values);
    if (!linePath) return '';
    const firstX = getX(0, values.length);
    const lastX = getX(values.length - 1, values.length);
    const baselineY = svgHeight - paddingBottom;

    return `${linePath} L ${lastX},${baselineY} L ${firstX},${baselineY} Z`;
  };

  // Series values arrays
  const totalSeries = trendData.map((d) => d.totalProjects);
  const completedSeries = trendData.map((d) => d.completed);
  const inProgressSeries = trendData.map((d) => d.inProgress);
  const readySeries = trendData.map((d) => d.ready);

  // Active hover point calculations
  const activeHoverData = hoverIndex !== null ? trendData[hoverIndex] : null;

  // Completion percentage calculation
  const currentCompleted = (installationStages['Completed'] || 0) + (installationStages['Installed'] || 0);
  const completionPercentage = totalTrackedArtworks > 0 ? Math.round((currentCompleted / totalTrackedArtworks) * 100) : 0;

  return (
    <div className="p-6 rounded-3xl bg-[#181826] border border-white/10 shadow-2xl space-y-6">
      {/* Top Header & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/50">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                Project Progress & Milestone Tracking Graph
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                Live Dynamic
              </span>
            </div>
            <p className="text-xs text-[#8a8d9b] mt-0.5">
              Multi-curve trend analysis & milestone completion trajectory across all venues
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-[#11111c] border border-white/10">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Timeline Trend</span>
            </button>
            <button
              onClick={() => setActiveTab('stages')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'stages'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Milestone Breakdown</span>
            </button>
          </div>

          <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              {completionPercentage}% Completed
            </span>
          </div>
        </div>
      </div>

      {/* Metric Line Toggles Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-400 font-bold text-[11px] flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-purple-400" /> Filter Curves:
          </span>
          {/* Total Projects Toggle */}
          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border ${
              showTotal
                ? 'bg-purple-950/60 border-purple-500/60 text-purple-300 shadow-sm shadow-purple-900/30'
                : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-400/30" />
            <span>Total Projects</span>
          </button>

          {/* Completed Toggle */}
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border ${
              showCompleted
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-sm shadow-cyan-900/30'
                : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/30" />
            <span>Completed / Installed</span>
          </button>

          {/* In Progress Toggle */}
          <button
            onClick={() => setShowInProgress(!showInProgress)}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border ${
              showInProgress
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-900/30'
                : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
            <span>In Progress</span>
          </button>

          {/* Tech/Prod Ready Toggle */}
          <button
            onClick={() => setShowReady(!showReady)}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border ${
              showReady
                ? 'bg-pink-950/60 border-pink-500/60 text-pink-300 shadow-sm shadow-pink-900/30'
                : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400 ring-2 ring-pink-400/30" />
            <span>Tech & Production Ready</span>
          </button>
        </div>

        <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Hover over graph nodes to view monthly metrics</span>
        </div>
      </div>

      {/* Main SVG Graph Container */}
      {activeTab === 'timeline' ? (
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[650px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none drop-shadow-xl"
            >
              <defs>
                {/* Linear Gradients matching reference images */}
                <linearGradient id={`${chartId}-purpleGradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id={`${chartId}-cyanGradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id={`${chartId}-amberGradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id={`${chartId}-pinkGradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#d946ef" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#d946ef" stopOpacity="0.0" />
                </linearGradient>

                {/* Glowing Drop Shadows */}
                <filter id={`${chartId}-glowPurple`} x1="-20%" y1="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id={`${chartId}-glowCyan`} x1="-20%" y1="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const yPos = svgHeight - paddingBottom - ratio * chartHeight;
                const valLabel = Math.round(ratio * maxVal);
                return (
                  <g key={`grid-${idx}`}>
                    <line
                      x1={paddingX}
                      y1={yPos}
                      x2={svgWidth - paddingX}
                      y2={yPos}
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 12}
                      y={yPos + 4}
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="end"
                      className="font-mono"
                    >
                      {valLabel}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Guide Lines for Data Points */}
              {trendData.map((d, idx) => {
                const xPos = getX(idx, trendData.length);
                const isHovered = hoverIndex === idx;
                return (
                  <g key={`v-line-${idx}`}>
                    <line
                      x1={xPos}
                      y1={paddingTop}
                      x2={xPos}
                      y2={svgHeight - paddingBottom}
                      stroke={isHovered ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.04)'}
                      strokeDasharray={isHovered ? 'none' : '3 3'}
                      strokeWidth={isHovered ? 2 : 1}
                    />
                    {isHovered && (
                      <rect
                        x={xPos - 20}
                        y={paddingTop}
                        width={40}
                        height={chartHeight}
                        fill="rgba(168, 85, 247, 0.05)"
                      />
                    )}
                  </g>
                );
              })}

              {/* 1. Total Projects Curve & Gradient Area */}
              {showTotal && (
                <g>
                  <path
                    d={generateAreaPath(totalSeries)}
                    fill={`url(#${chartId}-purpleGradient)`}
                  />
                  <path
                    d={generateSmoothPath(totalSeries)}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter={`url(#${chartId}-glowPurple)`}
                  />
                </g>
              )}

              {/* 2. Tech & Prod Ready Curve & Gradient Area */}
              {showReady && (
                <g>
                  <path
                    d={generateAreaPath(readySeries)}
                    fill={`url(#${chartId}-pinkGradient)`}
                  />
                  <path
                    d={generateSmoothPath(readySeries)}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                </g>
              )}

              {/* 3. In Progress Curve & Gradient Area */}
              {showInProgress && (
                <g>
                  <path
                    d={generateAreaPath(inProgressSeries)}
                    fill={`url(#${chartId}-amberGradient)`}
                  />
                  <path
                    d={generateSmoothPath(inProgressSeries)}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>
              )}

              {/* 4. Completed Curve & Gradient Area */}
              {showCompleted && (
                <g>
                  <path
                    d={generateAreaPath(completedSeries)}
                    fill={`url(#${chartId}-cyanGradient)`}
                  />
                  <path
                    d={generateSmoothPath(completedSeries)}
                    fill="none"
                    stroke="#00f2fe"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter={`url(#${chartId}-glowCyan)`}
                  />
                </g>
              )}

              {/* Floating Data Badges on Nodes (Reference Image 2 Style!) */}
              {trendData.map((d, idx) => {
                const xPos = getX(idx, trendData.length);

                // Show data badge on Total Projects curve
                if (showTotal && (idx % 2 === 0 || idx === trendData.length - 1)) {
                  const yPosTotal = getY(d.totalProjects);
                  return (
                    <g key={`badge-${idx}`} transform={`translate(${xPos}, ${yPosTotal - 18})`}>
                      <rect
                        x="-16"
                        y="-12"
                        width="32"
                        height="18"
                        rx="9"
                        fill="#ffffff"
                        className="shadow-lg drop-shadow-md"
                      />
                      <text
                        x="0"
                        y="1"
                        fill="#0f172a"
                        fontSize="10"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        {d.totalProjects}
                      </text>
                    </g>
                  );
                }
                return null;
              })}

              {/* Node Dots & Interactive Hover Triggers */}
              {trendData.map((d, idx) => {
                const xPos = getX(idx, trendData.length);
                const yTotal = getY(d.totalProjects);
                const yCompleted = getY(d.completed);
                const yInProgress = getY(d.inProgress);
                const isHovered = hoverIndex === idx;

                return (
                  <g
                    key={`dots-${idx}`}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover Hit Target Area */}
                    <rect
                      x={xPos - 25}
                      y={paddingTop}
                      width={50}
                      height={chartHeight + 30}
                      fill="transparent"
                    />

                    {/* Total Projects Dot */}
                    {showTotal && (
                      <g>
                        <circle
                          cx={xPos}
                          cy={yTotal}
                          r={isHovered ? 7 : 4}
                          fill="#a855f7"
                          stroke="#ffffff"
                          strokeWidth={isHovered ? 2.5 : 1.5}
                          className="transition-all duration-300"
                        />
                        {isHovered && (
                          <circle cx={xPos} cy={yTotal} r="12" fill="rgba(168, 85, 247, 0.3)" />
                        )}
                      </g>
                    )}

                    {/* In Progress Dot */}
                    {showInProgress && (
                      <circle
                        cx={xPos}
                        cy={yInProgress}
                        r={isHovered ? 6 : 3.5}
                        fill="#fbbf24"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="transition-all duration-300"
                      />
                    )}

                    {/* Completed Dot */}
                    {showCompleted && (
                      <g>
                        <circle
                          cx={xPos}
                          cy={yCompleted}
                          r={isHovered ? 7 : 4}
                          fill="#00f2fe"
                          stroke="#ffffff"
                          strokeWidth={isHovered ? 2.5 : 1.5}
                          className="transition-all duration-300"
                        />
                        {isHovered && (
                          <circle cx={xPos} cy={yCompleted} r="12" fill="rgba(0, 242, 254, 0.3)" />
                        )}
                      </g>
                    )}

                    {/* X-Axis Labels */}
                    <text
                      x={xPos}
                      y={svgHeight - 10}
                      fill={isHovered ? '#ffffff' : '#94a3b8'}
                      fontSize={isHovered ? '11' : '10'}
                      fontWeight={isHovered ? '900' : '700'}
                      textAnchor="middle"
                      className="transition-all duration-200 font-sans"
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* Stage Milestone Progression View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
          {stageData.map((stg, idx) => {
            const pct = stg.target > 0 ? Math.round((stg.count / stg.target) * 100) : 0;
            return (
              <div
                key={`stg-${idx}`}
                className="p-4 rounded-2xl bg-[#131320] border border-white/10 hover:border-purple-500/40 transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-300 group-hover:text-purple-300 transition-colors">
                    {stg.stage}
                  </span>
                  <span className="font-mono text-white text-sm bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                    {stg.count}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-3 rounded-full bg-slate-900 border border-white/5 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-700 shadow-sm shadow-purple-500/50"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span>Target: {stg.target}</span>
                    <span className="text-purple-400 font-bold">{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Active Hover Tooltip Panel */}
      {activeHoverData && activeTab === 'timeline' && (
        <div className="p-4 rounded-2xl bg-[#0f0f1a] border border-cyan-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
              {activeHoverData.month.substring(0, 3)}
            </div>
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                Timeline Metrics: <span className="text-cyan-300">{activeHoverData.month}</span>
              </h4>
              <p className="text-[11px] text-gray-400">
                Detailed snapshot of artworks across technical & installation phases
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-xl">
              <span className="text-gray-400 text-[10px] block font-medium">Total Projects</span>
              <span className="text-purple-300 font-black font-mono text-sm">{activeHoverData.totalProjects}</span>
            </div>

            <div className="bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-xl">
              <span className="text-gray-400 text-[10px] block font-medium">In Progress</span>
              <span className="text-amber-300 font-black font-mono text-sm">{activeHoverData.inProgress}</span>
            </div>

            <div className="bg-pink-950/40 border border-pink-800/40 px-3 py-1.5 rounded-xl">
              <span className="text-gray-400 text-[10px] block font-medium">Tech & Prod Ready</span>
              <span className="text-pink-300 font-black font-mono text-sm">{activeHoverData.ready}</span>
            </div>

            <div className="bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded-xl">
              <span className="text-gray-400 text-[10px] block font-medium">Completed</span>
              <span className="text-cyan-300 font-black font-mono text-sm">{activeHoverData.completed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Summary / Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-2xl bg-[#11111c] border border-white/5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-medium block">Total Tracked Artworks</span>
            <span className="text-sm font-black text-white font-mono">{totalTrackedArtworks} Artworks</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#11111c] border border-white/5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-medium block">Active In Progress</span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {(installationStages['Installation In Progress'] || 0) + (installationStages['Ready'] || 0)} Projects
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#11111c] border border-white/5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-medium block">Tech & Layout Ready</span>
            <span className="text-sm font-black text-pink-300 font-mono">{milestones.techAllocated} Artworks</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#11111c] border border-white/5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-medium block">Fully Installed & Live</span>
            <span className="text-sm font-black text-cyan-300 font-mono">
              {(installationStages['Completed'] || 0) + (installationStages['Installed'] || 0)} Projects
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
