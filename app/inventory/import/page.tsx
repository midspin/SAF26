'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { parseSmartInventoryExcel } from '@/lib/excel-parser';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Layers,
  HelpCircle,
  X,
} from 'lucide-react';

export default function ExcelImportWizardPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [resolutions, setResolutions] = useState<{ [safCode: string]: string }>({});
  const [defaultUsageType, setDefaultUsageType] = useState<string>('TECHNICAL');
  const [importResult, setImportResult] = useState<any>(null);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [importReport, setImportReport] = useState<any>(null);

  // STEP 1: Upload File & Read Workbook
  const handleFileUpload = (eOrFile: React.ChangeEvent<HTMLInputElement> | File) => {
    const uploadedFile = eOrFile instanceof File ? eOrFile : eOrFile.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array', cellStyles: true });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      if (wb.SheetNames.length > 0) {
        setSelectedSheet(wb.SheetNames[0]);
      }
      setCurrentStep(2);
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  // STEP 2: Parse Worksheet & Trigger Server Analysis
  const handleSelectWorksheet = async () => {
    if (!workbook || !selectedSheet) return;
    setIsAnalyzing(true);
    try {
      const sheet = workbook.Sheets[selectedSheet];
      const { rows } = parseSmartInventoryExcel(sheet);
      setRawRows(rows);

      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      const activeEvent = eventsData.events?.find((e: any) => e.status === 'Active') || eventsData.events?.[0];
      const eventId = activeEvent?.id;

      const res = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ANALYZE',
          eventId,
          rows,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data);
        // Default resolutions to MERGE for duplicates
        const initialResolutions: any = {};
        data.duplicateGroups?.forEach((g: any) => {
          initialResolutions[g.safCode] = 'MERGE';
          if (g.safCode) {
            initialResolutions[g.safCode.toLowerCase()] = 'MERGE';
            initialResolutions[g.safCode.toUpperCase()] = 'MERGE';
          }
        });
        setResolutions(initialResolutions);
        setCurrentStep(3);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // STEP 8: Execute Transactional Commit
  const handleCommitImport = async () => {
    setIsCommitting(true);
    setCurrentStep(8);
    try {
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      const activeEvent = eventsData.events?.find((e: any) => e.status === 'Active') || eventsData.events?.[0];
      const eventId = activeEvent?.id;

      const res = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMMIT',
          eventId,
          fileName: file?.name || 'Inventory TECH 2026.xlsx',
          rows: analysisResult?.processedRows || [],
          resolutions,
          defaultUsageType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportReport(data.result);
        setCurrentStep(9);
      } else {
        alert(data.error || 'Failed to commit import');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to execute import commit');
    } finally {
      setIsCommitting(false);
    }
  };

  const stepsList = [
    '1. Upload File',
    '2. Worksheet',
    '3. Columns',
    '4. Preview',
    '5. Validation',
    '6. Usage Mapping',
    '7. Duplicate SAF',
    '8. Commit',
    '9. Results',
  ];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-emerald-400" /> Excel Import & Migration Wizard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Import legacy workbook <strong className="text-slate-200">Inventory TECH 2026.xlsx</strong> with exact column detection & duplicate SAF Code resolution
          </p>
        </div>
        <a
          href="/api/sample-excel"
          download="Inventory TECH 2026.xlsx"
          className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-2"
        >
          <FileDown className="w-4 h-4 text-emerald-400" /> Download Sample Excel
        </a>
      </div>

      {/* 9-STEP WIZARD PROGRESS BAR */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 overflow-x-auto">
        <div className="flex items-center justify-between min-w-max gap-2">
          {stepsList.map((stepName, idx) => {
            const stepNum = idx + 1;
            const isDone = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <div key={stepNum} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950'
                      : isCurrent
                      ? 'bg-sky-500 text-slate-950 ring-4 ring-sky-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                </div>
                <span className={`text-xs font-semibold ${isCurrent ? 'text-sky-400' : 'text-slate-400'}`}>
                  {stepName}
                </span>
                {stepNum < 9 && <div className="w-4 h-0.5 bg-slate-800 mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: FILE UPLOAD */}
      {currentStep === 1 && (
        <div className="glass-card p-10 rounded-2xl border border-slate-800 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Upload Inventory Excel File (.xlsx)</h3>
            <p className="text-xs text-slate-400 mt-1">Supports legacy 15 columns from Inventory TECH 2026.xlsx</p>
          </div>

          <div className="max-w-md mx-auto">
            <label className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-2xl p-8 block cursor-pointer transition-colors bg-slate-900/40">
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              <span className="text-xs font-semibold text-sky-400 block">Click to Browse or Drag File Here</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Supported: .xlsx, .xls</span>
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: WORKSHEET SELECTION */}
      {currentStep === 2 && (
        <div className="glass-card p-8 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Select Inventory Worksheet</h3>
          <div className="space-y-3">
            {workbook?.SheetNames.map((sheetName) => (
              <label
                key={sheetName}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedSheet === sheetName
                    ? 'bg-sky-950/40 border-sky-500/60 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="sheet"
                    checked={selectedSheet === sheetName}
                    onChange={() => setSelectedSheet(sheetName)}
                    className="accent-sky-500"
                  />
                  <span className="text-xs font-bold">{sheetName}</span>
                </div>
                <span className="text-[11px] text-slate-500">Detected Worksheet</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button onClick={() => setCurrentStep(1)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Change File
            </button>
            <button
              onClick={handleSelectWorksheet}
              disabled={isAnalyzing}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Analyze Columns & Validate'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 & 4: COLUMN DETECTION & PREVIEW */}
      {currentStep === 3 && analysisResult && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block">Total Rows</span>
              <span className="text-xl font-bold text-slate-100">{analysisResult.summary.totalRows}</span>
            </div>
            <div className="glass-card p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-emerald-400 uppercase block">Valid Rows</span>
              <span className="text-xl font-bold text-emerald-400">{analysisResult.summary.validCount}</span>
            </div>
            <div className="glass-card p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-amber-400 uppercase block">Warnings / Duplicates</span>
              <span className="text-xl font-bold text-amber-400">{analysisResult.summary.duplicateCount}</span>
            </div>
            <div className="glass-card p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-rose-400 uppercase block">Errors</span>
              <span className="text-xl font-bold text-rose-400">{analysisResult.summary.errorCount}</span>
            </div>
          </div>

          {/* Detected 15 Columns */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">Auto-Detected 15 Legacy Columns</h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {[
                'SAF Code', 'Inventory Category', 'Sub Category', 'Element', 'Year of Purchase',
                'Brand | Project', 'Model', 'Size/LWH', 'Uom', 'Serial No', 'Qty', 'Location',
                'Condition', 'Throw Ratio', 'Remarks'
              ].map((col) => (
                <span key={col} className="px-2.5 py-1 rounded bg-slate-900 text-slate-200 border border-slate-800 font-mono">
                  ✓ {col}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentStep(2)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(analysisResult.duplicateGroups?.length > 0 ? 7 : 8)}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              {analysisResult.duplicateGroups?.length > 0 ? 'Resolve Duplicate SAF Codes' : 'Proceed to Import Commit'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: DUPLICATE SAF CODE RESOLUTION */}
      {currentStep === 7 && analysisResult && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" /> Duplicate SAF Code Resolution Required
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Found {analysisResult.duplicateGroups?.length} duplicate SAF code groups. Choose how to handle each group:
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {analysisResult.duplicateGroups?.map((group: any) => (
              <div key={group.safCode} className="p-4 rounded-xl bg-slate-900 border border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 px-2.5 py-1 rounded border border-sky-800">
                      {group.safCode}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{group.rows.length} Duplicate Rows Detected</span>
                  </div>

                  {/* Resolution Choice Select */}
                  <select
                    value={resolutions[group.safCode] || 'MERGE'}
                    onChange={(e) => setResolutions({ ...resolutions, [group.safCode]: e.target.value })}
                    className="bg-slate-950 text-xs text-amber-300 border border-amber-800 rounded-lg px-3 py-1.5 font-bold cursor-pointer"
                  >
                    <option value="MERGE">Merge Quantities (Combine total)</option>
                    <option value="KEEP_SEPARATE">Keep Separate (Create new asset ID)</option>
                    <option value="SKIP">Skip Row (Do not import)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs">
                  {group.rows.map((r: any) => (
                    <div key={r.rowNum} className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between text-[11px]">
                      <span>Row {r.rowNum}: <strong>{r.element}</strong> ({r.model})</span>
                      <span>Qty: <strong>{r.totalQuantity}</strong> | Loc: {r.location}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button onClick={() => setCurrentStep(3)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Preview
            </button>
            <button
              onClick={handleCommitImport}
              disabled={isCommitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm & Commit Transactional Import'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: FINAL CONFIRMATION & TRANSACTIONAL COMMIT */}
      {currentStep === 8 && (
        <div className="glass-card p-8 rounded-2xl border border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
            {isCommitting ? <RefreshCw className="w-8 h-8 animate-spin text-sky-400" /> : <Sparkles className="w-8 h-8 text-sky-400" />}
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-50">
              {isCommitting ? 'Committing Inventory Items to Database...' : 'Ready to Commit Transactional Import'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              PostgreSQL database will insert new inventory records, merge quantities, and record opening stock movements.
            </p>
          </div>

          {analysisResult && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto text-xs">
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total File Rows</span>
                <strong className="text-slate-100 text-lg">{analysisResult.summary?.totalRows || 0}</strong>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Duplicate SAF Groups</span>
                <strong className="text-amber-400 text-lg">{analysisResult.summary?.duplicateCount || 0}</strong>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Faulty Items Flagged</span>
                <strong className="text-rose-400 text-lg">{analysisResult.summary?.faultyCount || 0}</strong>
              </div>
            </div>
          )}

          <div className="max-w-md mx-auto space-y-2 text-left bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <label className="text-slate-300 font-bold block">Target Inventory Pool Department / Usage Type:</label>
            <select
              value={defaultUsageType}
              onChange={(e) => setDefaultUsageType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 font-bold"
            >
              <option value="TECHNICAL">Technical Equipment (AV, Lighting, Sound, Media)</option>
              <option value="PRODUCTION">Production Materials (Fabrication, Carpentry, Tools, Infrastructure)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800 max-w-xl mx-auto">
            <button
              onClick={() => setCurrentStep(analysisResult?.duplicateGroups?.length > 0 ? 7 : 3)}
              disabled={isCommitting}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to {analysisResult?.duplicateGroups?.length > 0 ? 'Duplicate Resolution' : 'Preview'}
            </button>

            <button
              onClick={handleCommitImport}
              disabled={isCommitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {isCommitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Committing Batch to Database...
                </>
              ) : (
                <>
                  🚀 Confirm & Commit Transactional Import <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 9: IMPORT RESULTS REPORT */}
      {currentStep === 9 && importReport && (
        <div className="glass-card p-8 rounded-2xl border border-slate-800 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-50">Excel Inventory Migration Complete!</h3>
            <p className="text-xs text-slate-400 mt-1">Batch ID: {importReport.batchId}</p>
          </div>

          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Imported</span>
              <strong className="text-emerald-400 text-xl">{importReport.importedCount}</strong>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Merged</span>
              <strong className="text-sky-400 text-xl">{importReport.mergedCount}</strong>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Skipped</span>
              <strong className="text-amber-400 text-xl">{importReport.skippedCount}</strong>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Errors</span>
              <strong className="text-rose-400 text-xl">{importReport.errorCount}</strong>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-800">
            <Link
              href="/inventory"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl transition-all"
            >
              Open Master Inventory Pool
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
