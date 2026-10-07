'use client';

import React, { useEffect, useState } from 'react';
import { Printer, X, FileText, Sparkles, Layers, Building2, Palette, Download, ExternalLink, Maximize2 } from 'lucide-react';

interface ArtistDocketModalProps {
  artistId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialArtistData?: any;
}

export default function ArtistDocketModal({
  artistId,
  isOpen,
  onClose,
  initialArtistData,
}: ArtistDocketModalProps) {
  const [loading, setLoading] = useState(false);
  const [artistData, setArtistData] = useState<any>(initialArtistData || null);
  const [activePage, setActivePage] = useState<'all' | '1' | '2' | '3'>('all');
  const [currentUser, setCurrentUser] = useState<string>('Production User');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('saf_user_role') || 'Production Team';
      setCurrentUser(role);
    }
  }, []);

  useEffect(() => {
    if (isOpen && artistId) {
      if (initialArtistData && initialArtistData.id === artistId && initialArtistData.allocations) {
        setArtistData(initialArtistData);
      } else {
        fetchArtistDetails(artistId);
      }
    }
  }, [isOpen, artistId, initialArtistData]);

  const fetchArtistDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/artists/${id}`);
      const data = await res.json();
      if (data.success && data.artist) {
        setArtistData(data.artist);
      }
    } catch (err) {
      console.error('Error fetching artist details for Docket:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !artistId) return null;

  const handlePrint = () => {
    const container = document.getElementById('artist-docket-printable-area');
    if (!container) {
      window.print();
      return;
    }

    // Remove existing print iframe
    const existingIframe = document.getElementById('artist-docket-print-iframe');
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'artist-docket-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const stylesHtml = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    const printDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!printDoc) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Artist Docket - ${artistData?.artistName || 'Artist'}</title>
          ${stylesHtml}
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
            html, body {
              background: white !important;
              color: black !important;
              width: 100% !important;
              height: auto !important;
              font-family: ui-sans-serif, system-ui, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .docket-page-sheet {
              page-break-after: always !important;
              break-after: page !important;
              margin-bottom: 0 !important;
              box-shadow: none !important;
              border: none !important;
              padding: 15px !important;
              min-height: 190mm !important;
              max-height: 200mm !important;
              box-sizing: border-box !important;
            }
            .docket-page-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${container.innerHTML}
        </body>
      </html>
    `;

    printDoc.open();
    printDoc.write(htmlContent);
    printDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 400);
  };

  // Derive Data
  const primaryArtwork = artistData?.artworks?.[0] || null;
  const primaryInstallation = artistData?.installations?.[0] || null;
  const venueName = primaryInstallation?.venue?.venueName || primaryArtwork?.venue?.venueName || 'Primary Venue';
  const roomName = primaryInstallation?.room
    ? `Room ${primaryInstallation.room.roomNumber} - ${primaryInstallation.room.roomName}`
    : primaryArtwork?.room
    ? `Room ${primaryArtwork.room.roomNumber} - ${primaryArtwork.room.roomName}`
    : 'Gallery Space';

  const curatorName = artistData?.curatorAssignments?.[0]?.curator?.name || artistData?.curatorName || 'General Curatorial';
  const discipline = primaryArtwork?.installationType || primaryArtwork?.medium || 'Visual Arts | Spatial Installation';

  const programmingMembers = (artistData?.programmingAssignments || []).map(
    (p: any) => p.programmingPerson?.name || p.name
  ).filter(Boolean);

  const productionMembers = (artistData?.productionAssignments || []).map(
    (p: any) => p.productionPerson?.name || p.name
  ).filter(Boolean);

  // Allocations
  const productionAllotments = (artistData?.allocations || []).filter(
    (a: any) => (a.department || '').toUpperCase() === 'PRODUCTION'
  );

  const techAllotments = (artistData?.allocations || []).filter(
    (a: any) => (a.department || '').toUpperCase() === 'TECHNICAL'
  );

  // Purchase / Rentals
  const purchaseList = (artistData?.purchaseRequests || []).map((p: any) => ({
    type: 'PURCHASE',
    name: p.itemName || p.description,
    brand: p.brand || p.vendor?.vendorName || 'Na',
    model: p.model || 'Na',
    qty: p.quantity || 1,
    link: p.supplierLink || p.purchaseLink || p.notes || '-',
  }));

  const rentalList = (artistData?.rentalRecords || []).map((r: any) => ({
    type: 'RENTAL',
    name: r.equipmentName || r.description,
    brand: r.brand || r.vendor?.vendorName || 'Na',
    model: r.model || 'Na',
    qty: r.quantity || 1,
    link: r.supplierLink || r.vendor?.contactEmail || '-',
  }));

  const combinedRentPurchaseList = [...purchaseList, ...rentalList];

  // Final Layout URL (from room or artwork)
  const finalLayoutUrl =
    primaryInstallation?.room?.techProdLayout ||
    primaryArtwork?.techProdLayout ||
    primaryInstallation?.room?.roomImage ||
    primaryInstallation?.room?.floorplan ||
    null;

  const isPdfLayout = finalLayoutUrl?.endsWith('.pdf') || finalLayoutUrl?.includes('.pdf');

  const generatedDateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const generatedTimeStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });



  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#181824] border border-white/10 w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1f1f30] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Artist Docket <span className="text-emerald-400">— {artistData.artistName}</span>
              </h2>
              <span className="text-xs text-[#8a8d9b]">
                Venue: {venueName} | {roomName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Page Filter Tabs */}
            <div className="hidden sm:flex items-center bg-[#141420] p-1 rounded-xl border border-white/5 text-xs font-bold">
              <button
                onClick={() => setActivePage('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activePage === 'all' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-[#8a8d9b] hover:text-white'
                }`}
              >
                All Pages (Continuous)
              </button>
              <button
                onClick={() => setActivePage('1')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activePage === '1' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-[#8a8d9b] hover:text-white'
                }`}
              >
                Page 1
              </button>
              <button
                onClick={() => setActivePage('2')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activePage === '2' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-[#8a8d9b] hover:text-white'
                }`}
              >
                Page 2
              </button>
              <button
                onClick={() => setActivePage('3')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activePage === '3' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-[#8a8d9b] hover:text-white'
                }`}
              >
                Page 3 (Layout)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#28283c] hover:bg-[#34344e] text-[#8a8d9b] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (PRINTABLE DOCUMENT AREA) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0f0f17] flex flex-col items-center gap-6">
          <div id="artist-docket-printable-area" className="w-full max-w-[1020px] space-y-8">
            {/* ========================================================================= */}
            {/* PAGE 1: OVERVIEW, CURATOR, TEAMS, CONCEPT & PRODUCTION ALLOTMENT TABLE   */}
            {/* ========================================================================= */}
            {(activePage === 'all' || activePage === '1') && (
              <div className="docket-page-sheet relative bg-white text-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl overflow-hidden min-h-[620px] flex flex-col justify-between border border-slate-200">
                {/* Top-Left PNG Motif */}
                <img
                  src="/images/docket_motif_top_left.png"
                  alt="Decorative motif"
                  className="absolute top-0 left-0 w-36 sm:w-44 h-auto object-contain pointer-events-none select-none z-0"
                />

                <div className="relative z-10">
                  {/* Top Right Header: Event Title (without date below it) */}
                  <div className="flex justify-end text-right pl-32 mb-2">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-wider uppercase">
                        {artistData.event?.name || 'SERENDIPITY ARTS FESTIVAL 2026'}
                      </h3>
                    </div>
                  </div>

                  {/* Artist Name & Artwork Title (Properly left-aligned) */}
                  <div className="mb-4 mt-8 sm:mt-10">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                      {artistData.artistName || 'Artist Name'}
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                      {primaryArtwork?.artworkName || 'Artwork title / installation project'}
                    </p>
                  </div>

                  {/* Middle Grid: Left pills & Curator block */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start mb-5 pl-2">
                    {/* Left: Venue & Room Lavender Pills */}
                    <div className="md:col-span-4 space-y-2">
                      <div className="bg-[#d2bfdf] text-[#3c2a4d] px-4 py-2 rounded-2xl font-bold text-xs shadow-sm truncate">
                        📍 {venueName}
                      </div>
                      <div className="bg-[#d2bfdf] text-[#3c2a4d] px-4 py-2 rounded-2xl font-bold text-xs shadow-sm truncate">
                        🚪 {roomName}
                      </div>
                    </div>

                    {/* Right: Curator & Discipline Pill */}
                    <div className="md:col-span-8 flex flex-col items-end text-right space-y-1">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Curator</span>
                      <span className="text-sm font-bold text-slate-950">{curatorName}</span>
                      <div className="bg-[#cad19a] text-[#3b4317] px-4 py-1.5 rounded-full font-extrabold text-[11px] shadow-sm mt-1">
                        {discipline}
                      </div>
                    </div>
                  </div>

                  {/* Artwork Concept & Team Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                    {/* Left: Artwork Concept / Description Box (Olive) */}
                    <div className="md:col-span-6 bg-[#d8dfaa] text-[#2b3310] p-4 rounded-2xl text-[11px] leading-relaxed shadow-sm font-medium flex flex-col justify-center">
                      <span className="font-extrabold uppercase text-[10px] tracking-wider block mb-1 text-[#3b4317]">
                        Artwork Concept / Description:
                      </span>
                      <p className="line-clamp-6">
                        {primaryArtwork?.description ||
                          artistData.biography ||
                          'Spatial installation exploring interactive light, sound, and tangible architecture.'}
                      </p>
                    </div>

                    {/* Right: Programming Team & Production Team (Separated by line) */}
                    <div className="md:col-span-6 grid grid-cols-2 gap-3 pl-2 border-l-2 border-slate-300">
                      <div>
                        <h4 className="font-black text-xs text-slate-900 mb-1.5 uppercase tracking-wider">
                          Programming Team
                        </h4>
                        <div className="space-y-0.5 text-[11px] text-slate-700 font-medium">
                          {programmingMembers.length > 0 ? (
                            programmingMembers.map((name: string, i: number) => (
                              <div key={i} className="truncate">
                                • {name}
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Assigned Curator / Lead</span>
                          )}
                        </div>
                      </div>

                      <div className="border-l border-slate-200 pl-3">
                        <h4 className="font-black text-xs text-slate-900 mb-1.5 uppercase tracking-wider">
                          Production Team
                        </h4>
                        <div className="space-y-0.5 text-[11px] text-slate-700 font-medium">
                          {productionMembers.length > 0 ? (
                            productionMembers.map((name: string, i: number) => (
                              <div key={i} className="truncate">
                                • {name}
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Production & Layout Team</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Production Allotment Table */}
                  <div className="space-y-2">
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      Production Allotment
                    </h3>
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#cad19a] text-[#2c330c] font-black uppercase text-[10px] tracking-wider">
                            <th className="p-2 border-r border-[#b6bd85]">SAF Code</th>
                            <th className="p-2 border-r border-[#b6bd85]">Category</th>
                            <th className="p-2 border-r border-[#b6bd85]">Element</th>
                            <th className="p-2 border-r border-[#b6bd85]">Sub category</th>
                            <th className="p-2 border-r border-[#b6bd85]">Size | LWH</th>
                            <th className="p-2 border-r border-[#b6bd85]">Brand</th>
                            <th className="p-2 text-center">QTY</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {productionAllotments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-3 text-center text-slate-400 italic bg-[#f3f4f6]">
                                No production inventory items allocated yet.
                              </td>
                            </tr>
                          ) : (
                            productionAllotments.map((alloc: any, idx: number) => {
                              const item = alloc.inventoryItem;
                              const isEven = idx % 2 === 0;
                              return (
                                <tr key={alloc.id || idx} className={isEven ? 'bg-[#ebecee]' : 'bg-[#f4f5f6]'}>
                                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                                    {item?.safCode || 'PRD-AUTO'}
                                  </td>
                                  <td className="p-2 text-slate-700 border-r border-slate-200 truncate max-w-[100px]">
                                    {item?.inventoryCategory || 'Production'}
                                  </td>
                                  <td className="p-2 font-semibold text-slate-900 border-r border-slate-200 truncate max-w-[150px]">
                                    {item?.element || 'Fabrication Item'}
                                  </td>
                                  <td className="p-2 text-slate-700 border-r border-slate-200 truncate max-w-[120px]">
                                    {item?.subCategory || 'Structure'}
                                  </td>
                                  <td className="p-2 text-slate-600 border-r border-slate-200 truncate max-w-[90px]">
                                    {item?.sizeLwh || '-'}
                                  </td>
                                  <td className="p-2 text-slate-600 border-r border-slate-200 truncate max-w-[90px]">
                                    {item?.brandProject || item?.brand || '-'}
                                  </td>
                                  <td className="p-2 font-black text-slate-950 text-center">
                                    {alloc.issuedQuantity || alloc.requestedQuantity || 1}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer of Page 1 */}
                <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center mt-6">
                  <span>
                    Docket generated by : <strong className="text-slate-700">{currentUser}</strong> on{' '}
                    <strong className="text-slate-700">{generatedDateStr}</strong> at {generatedTimeStr}
                  </span>
                  <span className="font-bold text-slate-500">Page 1 of 3</span>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PAGE 2: TECH ALLOTMENT TABLE & RENT / PURCHASE ITEM LIST TABLE             */}
            {/* ========================================================================= */}
            {(activePage === 'all' || activePage === '2') && (
              <div className="docket-page-sheet relative bg-white text-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl overflow-hidden min-h-[620px] flex flex-col justify-between border border-slate-200">
                <div className="space-y-8">
                  {/* Top Header */}
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="font-black text-lg text-slate-950 uppercase tracking-tight">
                        {artistData.artistName} — Technical Specifications & Procurement
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Venue: {venueName} | {roomName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Docket Reference</span>
                      <span className="text-xs font-black text-slate-800">
                        DOC-{artistData.id?.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Tech Allotment Table */}
                  <div className="space-y-2">
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      Tech Allotment
                    </h3>
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#cad19a] text-[#2c330c] font-black uppercase text-[10px] tracking-wider">
                            <th className="p-2 border-r border-[#b6bd85]">SAF Code</th>
                            <th className="p-2 border-r border-[#b6bd85]">Element</th>
                            <th className="p-2 border-r border-[#b6bd85]">Brand</th>
                            <th className="p-2 border-r border-[#b6bd85]">Model</th>
                            <th className="p-2 border-r border-[#b6bd85]">Size | LWH</th>
                            <th className="p-2 border-r border-[#b6bd85]">Sub Category</th>
                            <th className="p-2 text-center">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {techAllotments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-3 text-center text-slate-400 italic bg-[#f3f4f6]">
                                No technical inventory items allocated yet.
                              </td>
                            </tr>
                          ) : (
                            techAllotments.map((alloc: any, idx: number) => {
                              const item = alloc.inventoryItem;
                              const isEven = idx % 2 === 0;
                              return (
                                <tr key={alloc.id || idx} className={isEven ? 'bg-[#ebecee]' : 'bg-[#f4f5f6]'}>
                                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                                    {item?.safCode || 'TECH-AUTO'}
                                  </td>
                                  <td className="p-2 font-semibold text-slate-900 border-r border-slate-200 truncate max-w-[150px]">
                                    {item?.element || 'Technical Equipment'}
                                  </td>
                                  <td className="p-2 text-slate-700 border-r border-slate-200 truncate max-w-[90px]">
                                    {item?.brandProject || item?.brand || '-'}
                                  </td>
                                  <td className="p-2 text-slate-700 border-r border-slate-200 truncate max-w-[90px]">
                                    {item?.model || '-'}
                                  </td>
                                  <td className="p-2 text-slate-600 border-r border-slate-200 truncate max-w-[90px]">
                                    {item?.sizeLwh || '-'}
                                  </td>
                                  <td className="p-2 text-slate-600 border-r border-slate-200 truncate max-w-[120px]">
                                    {item?.subCategory || item?.inventoryCategory || '-'}
                                  </td>
                                  <td className="p-2 font-black text-slate-950 text-center">
                                    {alloc.issuedQuantity || alloc.requestedQuantity || 1}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Rent | Purchase item LIST Table */}
                  <div className="space-y-2">
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      Rent | Purchase item LIST
                    </h3>
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#cad19a] text-[#2c330c] font-black uppercase text-[10px] tracking-wider">
                            <th className="p-2 border-r border-[#b6bd85]">Type</th>
                            <th className="p-2 border-r border-[#b6bd85]">Item Name</th>
                            <th className="p-2 border-r border-[#b6bd85]">Brand</th>
                            <th className="p-2 border-r border-[#b6bd85]">Model</th>
                            <th className="p-2 border-r border-[#b6bd85] text-center">Qty</th>
                            <th className="p-2">Purchase link / Vendor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {combinedRentPurchaseList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-3 text-center text-slate-400 italic bg-[#f3f4f6]">
                                No external rental or purchase items registered.
                              </td>
                            </tr>
                          ) : (
                            combinedRentPurchaseList.map((item: any, idx: number) => {
                              const isEven = idx % 2 === 0;
                              return (
                                <tr key={idx} className={isEven ? 'bg-[#ebecee]' : 'bg-[#f4f5f6]'}>
                                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                        item.type === 'PURCHASE'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-purple-100 text-purple-800'
                                      }`}
                                    >
                                      {item.type}
                                    </span>
                                  </td>
                                  <td className="p-2 font-semibold text-slate-900 border-r border-slate-200 truncate max-w-[160px]">
                                    {item.name}
                                  </td>
                                  <td className="p-2 text-slate-700 border-r border-slate-200 truncate max-w-[100px]">
                                    {item.brand}
                                  </td>
                                  <td className="p-2 text-slate-700 border-r border-slate-200 truncate max-w-[100px]">
                                    {item.model}
                                  </td>
                                  <td className="p-2 font-black text-slate-950 text-center border-r border-slate-200">
                                    {item.qty}
                                  </td>
                                  <td className="p-2 text-slate-600 truncate max-w-[180px]">
                                    {item.link}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer of Page 2 */}
                <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center mt-6">
                  <span>
                    Docket generated by : <strong className="text-slate-700">{currentUser}</strong> on{' '}
                    <strong className="text-slate-700">{generatedDateStr}</strong> at {generatedTimeStr}
                  </span>
                  <span className="font-bold text-slate-500">Page 2 of 3</span>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PAGE 3: FINAL LAYOUT (DRAWING / UPLOADED FINAL LAYOUT DIAGRAM)            */}
            {/* ========================================================================= */}
            {(activePage === 'all' || activePage === '3') && (
              <div className="docket-page-sheet relative bg-white text-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl overflow-hidden min-h-[620px] flex flex-col justify-between border border-slate-200">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="font-black text-xl text-slate-950 uppercase tracking-tight">
                        Final Layout
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {artistData.artistName} — {venueName} ({roomName})
                      </p>
                    </div>
                    {finalLayoutUrl && (
                      <a
                        href={finalLayoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-print bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Full Resolution
                      </a>
                    )}
                  </div>

                  {/* Main Layout Drawing Container */}
                  <div className="relative w-full h-[460px] sm:h-[480px] bg-[#e6e7eb] rounded-2xl overflow-hidden border border-slate-300 flex items-center justify-center p-2 shadow-inner">
                    {finalLayoutUrl ? (
                      isPdfLayout ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl p-4 text-center">
                          <iframe
                            src={finalLayoutUrl}
                            className="w-full h-full rounded-lg border border-slate-200"
                            title="Final Layout PDF"
                          />
                        </div>
                      ) : (
                        <img
                          src={finalLayoutUrl}
                          alt="Final Layout Drawing"
                          className="max-w-full max-h-full object-contain rounded-xl shadow-md"
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 text-center p-6">
                        <FileText className="w-12 h-12 text-slate-400 stroke-1" />
                        <span className="font-bold text-sm text-slate-700">No Final Layout Drawing Uploaded</span>
                        <p className="text-xs text-slate-500 max-w-sm">
                          Use the "Upload Final Layout" option in Artist 360 view or Rooms module to attach the official technical & spatial drawing for this room.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom-Right PNG Motif */}
                <img
                  src="/images/docket_motif_bottom_right.png"
                  alt="Decorative motif"
                  className="absolute bottom-0 right-0 w-36 sm:w-44 h-auto object-contain pointer-events-none select-none z-0"
                />

                {/* Footer of Page 3 */}
                <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center mt-6">
                  <span>
                    Docket generated by : <strong className="text-slate-700">{currentUser}</strong> on{' '}
                    <strong className="text-slate-700">{generatedDateStr}</strong> at {generatedTimeStr}
                  </span>
                  <span className="font-bold text-slate-500">Page 3 of 3</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
