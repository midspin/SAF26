'use client';

import React, { useState, useId } from 'react';
import {
  Activity,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Filter,
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
  const [showReady, setShowReady] = useState(false);

  // Timeline restricted from previous month (Sep) to event month (Dec)
  const trendData: MonthlyPoint[] = monthlyTrend && monthlyTrend.length > 0
    ? monthlyTrend
    : [
        { month: 'Sep', totalProjects: Math.round(totalTrackedArtworks * 0.85) || 42, inProgress: 22, ready: 14, completed: 8 },
        { month: 'Oct (Current)', totalProjects: totalTrackedArtworks || 50, inProgress: (installationStages['Installation In Progress'] || 12) + (installationStages['Ready'] || 8), ready: milestones.techAllocated || 24, completed: (installationStages['Completed'] || 5) + (installationStages['Installed'] || 6) },
        { month: 'Nov (Pre-Event)', totalProjects: totalTrackedArtworks || 50, inProgress: 10, ready: Math.round((totalTrackedArtworks || 50) * 0.85), completed: Math.round((totalTrackedArtworks || 50) * 0.75) },
        { month: 'Dec (Event)', totalProjects: totalTrackedArtworks || 50, inProgress: 0, ready: totalTrackedArtworks || 50, completed: totalTrackedArtworks || 50 },
      ];

  // Stage dataset for Stage Mode
  const stageData: MilestonePoint[] = [
    { stage: '1. Onboarded', count: milestones.onboarded || Math.round(totalTrackedArtworks * 0.95), target: totalTrackedArtworks },
    { stage: '2. Tech Data', count: milestones.techAllocated || Math.round(totalTrackedArtworks * 0.65), target: totalTrackedArtworks },
    { stage: '3. Prod Allotment', count: milestones.prodAllocated || Math.round(totalTrackedArtworks * 0.50), target: totalTrackedArtworks },
    { stage: '4. Layout Ready', count: milestones.layoutUploaded || Math.round(totalTrackedArtworks * 0.40), target: totalTrackedArtworks },
    { stage: '5. Installed', count: (installationStages['Completed'] || 0) + (installationStages['Installed'] || 0), target: totalTrackedArtworks },
  ];

  // Compact SVG Chart Dimensions (Half-size scaled)
  const svgWidth = 600;
  const svgHeight = 175;
  const paddingX = 35;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Compute maximum Y value
  const maxVal = Math.max(
    ...trendData.map((d) => Math.max(d.totalProjects, d.inProgress, d.ready, d.completed)),
    10
  ) * 1.12;

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
    <div className="p-4 sm:p-5 rounded-3xl bg-[#181826] border border-white/10 shadow-xl space-y-4">
      {/* Top Header & Compact View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md shadow-purple-950/40">
            <Activity className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-tight">
                Project Progress Graph
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                {totalTrackedArtworks} Projects
              </span>
            </div>
            <p className="text-[11px] text-[#8a8d9b]">
              Project milestone & completion trend
            </p>
          </div>
        </div>

        {/* Tab Switcher & Completion Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-xl bg-[#11111c] border border-white/10 text-[11px]">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeTab === 'timeline'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Trend</span>
            </button>
            <button
              onClick={() => setActiveTab('stages')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeTab === 'stages'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Stages</span>
            </button>
          </div>

          <span className="text-[10px] font-extrabold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2.5 py-1 rounded-xl flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* Filter Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-gray-400 font-bold text-[10px] mr-1 flex items-center gap-1">
            <Filter className="w-2.5 h-2.5 text-purple-400" /> Toggles:
          </span>
          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1.5 border ${
              showTotal
                ? 'bg-purple-950/60 border-purple-500/60 text-purple-300'
                : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Total</span>
          </button>

          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1.5 border ${
              showCompleted
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
                : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Completed</span>
          </button>

          <button
            onClick={() => setShowInProgress(!showInProgress)}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1.5 border ${
              showInProgress
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>In Progress</span>
          </button>
        </div>
      </div>

      {/* Main SVG Graph Container */}
      {activeTab === 'timeline' ? (
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[480px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none drop-shadow-md"
            >
              <defs>
                <linearGradient id={`${chartId}-purpleGradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id={`${chartId}-cyanGradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id={`${chartId}-amberGradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>

                <filter id={`${chartId}-glowPurple`} x1="-20%" y1="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id={`${chartId}-glowCyan`} x1="-20%" y1="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const yPos = svgHeight - paddingBottom - ratio * chartHeight;
                const valLabel = Math.round(ratio * maxVal);
                return (
                  <g key={`grid-${idx}`}>
                    <line
                      x1={paddingX}
                      y1={yPos}
                      x2={svgWidth - paddingX}
                      y2={yPos}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingX - 8}
                      y={yPos + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="700"
                      textAnchor="end"
                      className="font-mono"
                    >
                      {valLabel}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Guide Lines */}
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
                      strokeWidth={isHovered ? 1.5 : 1}
                    />
                  </g>
                );
              })}

              {/* 1. Total Projects Curve */}
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
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter={`url(#${chartId}-glowPurple)`}
                  />
                </g>
              )}

              {/* 2. In Progress Curve */}
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
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
              )}

              {/* 3. Completed Curve */}
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
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter={`url(#${chartId}-glowCyan)`}
                  />
                </g>
              )}

              {/* Floating Data Badges */}
              {trendData.map((d, idx) => {
                const xPos = getX(idx, trendData.length);
                if (showTotal) {
                  const yPosTotal = getY(d.totalProjects);
                  return (
                    <g key={`badge-${idx}`} transform={`translate(${xPos}, ${yPosTotal - 14})`}>
                      <rect
                        x="-13"
                        y="-10"
                        width="26"
                        height="15"
                        rx="7.5"
                        fill="#ffffff"
                        className="shadow-md"
                      />
                      <text
                        x="0"
                        y="1"
                        fill="#0f172a"
                        fontSize="9"
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

              {/* Dots & Triggers */}
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
                    <rect
                      x={xPos - 20}
                      y={paddingTop}
                      width={40}
                      height={chartHeight + 20}
                      fill="transparent"
                    />

                    {showTotal && (
                      <circle
                        cx={xPos}
                        cy={yTotal}
                        r={isHovered ? 5.5 : 3}
                        fill="#a855f7"
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2 : 1}
                      />
                    )}

                    {showInProgress && (
                      <circle
                        cx={xPos}
                        cy={yInProgress}
                        r={isHovered ? 5 : 3}
                        fill="#fbbf24"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    )}

                    {showCompleted && (
                      <circle
                        cx={xPos}
                        cy={yCompleted}
                        r={isHovered ? 5.5 : 3}
                        fill="#00f2fe"
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2 : 1}
                      />
                    )}

                    <text
                      x={xPos}
                      y={svgHeight - 8}
                      fill={isHovered ? '#ffffff' : '#94a3b8'}
                      fontSize={isHovered ? '10' : '9'}
                      fontWeight={isHovered ? '800' : '600'}
                      textAnchor="middle"
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
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
          {stageData.map((stg, idx) => {
            const pct = stg.target > 0 ? Math.round((stg.count / stg.target) * 100) : 0;
            return (
              <div
                key={`stg-${idx}`}
                className="p-2.5 rounded-xl bg-[#131320] border border-white/10 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-gray-300 truncate">{stg.stage}</span>
                  <span className="font-mono text-white text-[11px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                    {stg.count}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hover Snapshot Tooltip */}
      {activeHoverData && activeTab === 'timeline' && (
        <div className="p-2.5 rounded-xl bg-[#0f0f1a] border border-cyan-500/30 text-xs flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-white text-[11px]">
            {activeHoverData.month}:
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-purple-300 font-mono">Total: {activeHoverData.totalProjects}</span>
            <span className="text-amber-300 font-mono">Active: {activeHoverData.inProgress}</span>
            <span className="text-cyan-300 font-mono font-bold">Done: {activeHoverData.completed}</span>
          </div>
        </div>
      )}

      {/* Compact Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-2.5 rounded-xl bg-[#11111c] border border-white/5 flex items-center justify-between text-xs">
          <span className="text-[#8a8d9b] text-[11px]">Total Tracked</span>
          <span className="font-mono font-black text-white">{totalTrackedArtworks}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#11111c] border border-white/5 flex items-center justify-between text-xs">
          <span className="text-[#8a8d9b] text-[11px]">In Progress</span>
          <span className="font-mono font-black text-amber-300">
            {(installationStages['Installation In Progress'] || 0) + (installationStages['Ready'] || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
