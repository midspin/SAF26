'use client';

import React, { useEffect, useState } from 'react';
import { Printer, X, FileText, Sparkles } from 'lucide-react';

interface ArtistPdfExportModalProps {
  artistId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialArtistData?: any;
}

export default function ArtistPdfExportModal({
  artistId,
  isOpen,
  onClose,
  initialArtistData,
}: ArtistPdfExportModalProps) {
  const [loading, setLoading] = useState(false);
  const [artistData, setArtistData] = useState<any>(initialArtistData || null);

  useEffect(() => {
    if (isOpen && artistId) {
      // Always fetch complete artist details from /api/artists/[id] to ensure all allocations, purchase requests, rental records & layout URLs are present
      fetchArtistDetails(artistId);
    }
  }, [isOpen, artistId]);

  const fetchArtistDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/artists/${id}`);
      const data = await res.json();
      if (data.success && data.artist) {
        setArtistData(data.artist);
      }
    } catch (err) {
      console.error('Error fetching artist details for Technical Docket:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !artistId) return null;

  const handlePrint = () => {
    const container = document.getElementById('artist-pdf-export-container');
    if (!container) {
      window.print();
      return;
    }

    // Remove any existing print iframe
    const existingIframe = document.getElementById('technical-docket-print-iframe');
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    // Create an isolated hidden iframe for printing ONLY the Technical Docket
    const iframe = document.createElement('iframe');
    iframe.id = 'technical-docket-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    // Collect all stylesheets and style tags from the current document
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
          <title>Technical Docket - ${artistData?.artistName || 'Artist'}</title>
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            html, body {
              background: white !important;
              color: black !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-sheet {
              position: relative !important;
              width: 794px !important;
              min-height: 1123px !important;
              margin: 0 auto !important;
              page-break-after: always !important;
              break-after: page !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            .page-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            thead {
              display: table-header-group !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${container.innerHTML}
          </div>
        </body>
      </html>
    `;

    printDoc.open();
    printDoc.write(htmlContent);
    printDoc.close();

    // Trigger print preview on the isolated iframe document
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Error triggering iframe print:', e);
        window.print();
      }
    }, 250);
  };

  // Helper data formatters
  const artworkNames =
    artistData?.artworks?.map((a: any) => a.artworkName).filter(Boolean).join(', ') || 'Artwork name';

  const venueNames =
    Array.from(
      new Set(artistData?.installations?.map((i: any) => i.venue?.venueName).filter(Boolean))
    ).join(', ') || 'Venue Name';

  const roomNumbers = Array.from(
    new Set(
      artistData?.installations
        ?.map((i: any) => i.room?.roomNumber || i.room?.roomName)
        .filter(Boolean)
    )
  ) as string[];

  const curatorNames =
    artistData?.curatorAssignments?.map((ca: any) => ca.curator?.name).filter(Boolean).join(', ') ||
    'Curator Name';

  const curatorCategory =
    artistData?.curatorAssignments
      ?.map((ca: any) => ca.curator?.category)
      .filter(Boolean)
      .join(', ') || 'Catogory';

  const curatorOrg =
    artistData?.curatorAssignments
      ?.map((ca: any) => ca.curator?.organisation)
      .filter(Boolean)
      .join(', ') || 'Organisation';

  // Teams
  const programmingList = artistData?.programmingAssignments?.map((pa: any) => ({
    name: pa.programmingPerson?.name || 'Name',
    designation: pa.programmingPerson?.role || 'Designation',
  })) || [];

  const productionList = artistData?.pocAssignments?.map((poc: any) => ({
    name: poc.poc?.name || 'Name',
    designation: poc.poc?.role || 'Designation',
  })) || [];

  // Separated allocations into Production Allotment and Technical Stock Allotment
  const productionAllocations = (artistData?.allocations || []).filter((alloc: any) => {
    const dept = (alloc.department || '').toUpperCase();
    const usage = (alloc.inventoryItem?.inventoryUsageType || '').toUpperCase();
    const cat = (alloc.inventoryItem?.inventoryCategory || '').toLowerCase();
    return dept === 'PRODUCTION' || usage === 'PRODUCTION' || (cat !== '' && cat !== 'technical');
  });

  const technicalAllocations = (artistData?.allocations || []).filter((alloc: any) => {
    const dept = (alloc.department || '').toUpperCase();
    const usage = (alloc.inventoryItem?.inventoryUsageType || '').toUpperCase();
    const cat = (alloc.inventoryItem?.inventoryCategory || '').toLowerCase();
    return dept !== 'PRODUCTION' && usage !== 'PRODUCTION' && (cat === '' || cat === 'technical');
  });

  // Rent / Purchase items combined
  const purchaseItems = (artistData?.purchaseRequests || []).map((pr: any) => ({
    id: pr.id,
    itemName: pr.itemName,
    brand: pr.brand || 'Na',
    model: pr.model || 'Na',
    qty: pr.quantity || 1,
    type: pr.itemType || 'Purchase',
    notes: pr.notes || 'Purchase Request',
  }));

  const rentalItems = (artistData?.rentalRecords || []).map((rr: any) => ({
    id: rr.id,
    itemName: rr.itemName,
    brand: rr.vendor?.name || 'Na',
    model: rr.category || 'Na',
    qty: rr.quantity || 1,
    type: 'Rental',
    notes: rr.notes || 'Rental Record',
  }));

  const rentPurchaseList = [...purchaseItems, ...rentalItems];

  // Dynamic pagination item splits across 3 distinct tables (fits up to 13 total rows on Page 1)
  const PAGE_1_CAPACITY = 13;
  let page1RemainingCapacity = PAGE_1_CAPACITY;

  // 1. Production Allotment allocation
  const page1ProdCount = Math.min(productionAllocations.length, page1RemainingCapacity);
  const page1ProductionItems = productionAllocations.slice(0, page1ProdCount);
  const page2ProductionItems = productionAllocations.slice(page1ProdCount);
  page1RemainingCapacity -= Math.max(page1ProdCount, 1);

  // 2. Technical Stock Allotment allocation
  const page1TechCount = Math.min(technicalAllocations.length, Math.max(0, page1RemainingCapacity));
  const page1TechnicalItems = technicalAllocations.slice(0, page1TechCount);
  const page2TechnicalItems = technicalAllocations.slice(page1TechCount);
  page1RemainingCapacity -= Math.max(page1TechCount, 1);

  // 3. Rent / Purchase List allocation
  const page1RentCount = Math.min(rentPurchaseList.length, Math.max(0, page1RemainingCapacity));
  const page1RentPurchaseList = rentPurchaseList.slice(0, page1RentCount);
  const page2RentPurchaseList = rentPurchaseList.slice(page1RentCount);

  // Determine if Rent/Purchase list should appear on Page 1
  const renderRentPurchaseOnPage1 =
    page1RentPurchaseList.length > 0 ||
    (rentPurchaseList.length === 0 && page1RemainingCapacity >= 0);

  const hasPage2 =
    page2ProductionItems.length > 0 ||
    page2TechnicalItems.length > 0 ||
    page2RentPurchaseList.length > 0;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#1c1c2a] border border-white/10 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
          {/* Modal Header Utilities */}
          <div className="p-4 bg-[#232334] border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#38bdf8]" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Technical Docket Preview
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                disabled={loading}
                className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-4 h-4" /> Print / Save Technical Docket
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-[#161622] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Printable Container View */}
          <div className="p-4 md:p-8 overflow-y-auto bg-slate-300 flex-1 space-y-6">
            {loading || !artistData ? (
              <div className="p-12 text-center text-slate-600 bg-white rounded-3xl shadow-sm">
                <Sparkles className="w-8 h-8 text-[#38bdf8] animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold">Generating Technical Docket...</p>
              </div>
            ) : (
              /* DOCKET CONTAINER WRAPPER */
              <div id="artist-pdf-export-container" className="space-y-6">
                
                {/* ================= PAGE 1 ================= */}
                <div
                  className="page-sheet relative bg-white text-black w-[794px] min-h-[1123px] mx-auto shadow-2xl overflow-hidden box-border"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {/* Foreground HTML Template Image */}
                  <img
                    src="/doket-template-main-page.png"
                    alt="Technical Docket Page 1 Template"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
                  />

                  {/* Content Container (Z-10) */}
                  <div className="relative z-10 w-full box-border flex flex-col min-h-[1123px] justify-between pb-28">
                    <div className="w-full">
                      {/* Top Header Clearance */}
                      <div className="h-[85px] w-full"></div>

                      {/* MAIN OLIVE GREEN BANNER OVERLAY CONTENT */}
                      <div className="h-[195px] px-[120px] flex items-center box-border">
                        <div className="grid grid-cols-12 gap-3 items-start w-full">
                          {/* Left Column: Artist Name, Artwork Name, Venue, Room */}
                          <div className="col-span-6 space-y-1.5 min-w-0 pr-1">
                            <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight truncate">
                              {artistData?.artistName || 'Artist Name'}
                            </h2>
                            <p className="text-sm font-normal text-white/95 truncate">
                              {artworkNames}
                            </p>

                            <div className="pt-1 space-y-1">
                              <div>
                                <div className="bg-white text-slate-800 px-3 py-1 rounded-md text-xs font-semibold inline-block shadow-sm max-w-[180px] truncate">
                                  {venueNames}
                                </div>
                              </div>
                              <div>
                                <div className="bg-white text-slate-800 px-3 py-0.5 rounded-md text-xs font-semibold inline-block shadow-sm max-w-[160px] truncate">
                                  {roomNumbers.length > 0
                                    ? roomNumbers.map((r) => `Room Number ${r}`).join(', ')
                                    : 'Room Number'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Middle Divider Line */}
                          <div className="col-span-1 flex justify-center self-stretch py-1">
                            <div className="border-r border-white/40 h-full"></div>
                          </div>

                          {/* Right Column: Curator Information */}
                          <div className="col-span-5 space-y-0.5 text-slate-900 self-center min-w-0 pl-1">
                            <h3 className="font-extrabold text-xs uppercase tracking-wide text-[#1E220B]">
                              Curator
                            </h3>
                            <p className="text-xs font-semibold text-[#1E220B] leading-tight break-words">
                              {curatorNames}
                            </p>
                            <div className="py-0.5">
                              <div className="bg-white text-slate-800 px-2.5 py-0.5 rounded-md text-xs font-medium inline-block shadow-sm max-w-full truncate">
                                {curatorCategory}
                              </div>
                            </div>
                            <p className="text-[11px] text-[#1E220B]/90 font-medium leading-tight break-words">
                              {curatorOrg}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* TEAMS SECTION */}
                      <div className="mt-4 px-[120px]">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Programming team */}
                          <div>
                            <h3 className="font-bold text-xs text-slate-900 mb-1 uppercase tracking-wide">
                              Programming team
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              {programmingList.length > 0 ? (
                                programmingList.map((prog: any, idx: number) => (
                                  <div key={idx}>
                                    <p className="text-xs font-bold text-slate-900">{prog.name}</p>
                                    <p className="text-[11px] text-slate-600">{prog.designation}</p>
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">Name</p>
                                    <p className="text-[11px] text-slate-600">Designation</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">Name</p>
                                    <p className="text-[11px] text-slate-600">Designation</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Production team */}
                          <div>
                            <h3 className="font-bold text-xs text-slate-900 mb-1 uppercase tracking-wide">
                              Production team
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              {productionList.length > 0 ? (
                                productionList.map((prod: any, idx: number) => (
                                  <div key={idx}>
                                    <p className="text-xs font-bold text-slate-900">{prod.name}</p>
                                    <p className="text-[11px] text-slate-600">{prod.designation}</p>
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">Name</p>
                                    <p className="text-[11px] text-slate-600">Designation</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">Name</p>
                                    <p className="text-[11px] text-slate-600">Designation</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3 SEPARATE TABLES ON DOCKET PAGE 1 */}
                      <div className="mt-4 px-[120px] space-y-4">
                        
                        {/* TABLE 1: PRODUCTION ALLOTMENT */}
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wide flex items-center justify-between">
                            <span>Production Allotment ({productionAllocations.length})</span>
                          </h3>
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#858E38] text-white font-bold uppercase text-[10px]">
                                <th className="py-1 px-2.5">SAF CODE</th>
                                <th className="py-1 px-2.5">Element</th>
                                <th className="py-1 px-2.5">Brand</th>
                                <th className="py-1 px-2.5">Model</th>
                                <th className="py-1 px-2.5 text-center">Qty</th>
                                <th className="py-1 px-2.5">Category</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {page1ProductionItems.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-2 px-2.5 text-slate-400 italic text-center text-[11px]">
                                    No production equipment allocated
                                  </td>
                                </tr>
                              ) : (
                                page1ProductionItems.map((alloc: any) => (
                                  <tr key={alloc.id} className="text-slate-800 border-b border-slate-200 text-[11px]">
                                    <td className="py-1 px-2.5 font-semibold text-amber-700">
                                      {alloc.inventoryItem?.safCode || '-'}
                                    </td>
                                    <td className="py-1 px-2.5 font-bold">{alloc.inventoryItem?.element || '-'}</td>
                                    <td className="py-1 px-2.5">
                                      {alloc.inventoryItem?.brandProject || alloc.inventoryItem?.brand || '-'}
                                    </td>
                                    <td className="py-1 px-2.5">{alloc.inventoryItem?.model || '-'}</td>
                                    <td className="py-1 px-2.5 text-center font-bold text-slate-900">
                                      {alloc.issuedQuantity || alloc.requestedQuantity || 1}
                                    </td>
                                    <td className="py-1 px-2.5">
                                      {alloc.inventoryItem?.inventoryCategory || 'Production'}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* TABLE 2: TECHNICAL STOCK ALLOTMENT */}
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wide flex items-center justify-between">
                            <span>Technical Stock Allotment ({technicalAllocations.length})</span>
                          </h3>
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#858E38] text-white font-bold uppercase text-[10px]">
                                <th className="py-1 px-2.5">SAF CODE</th>
                                <th className="py-1 px-2.5">Element</th>
                                <th className="py-1 px-2.5">Brand</th>
                                <th className="py-1 px-2.5">Model</th>
                                <th className="py-1 px-2.5 text-center">Qty</th>
                                <th className="py-1 px-2.5">Category</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {page1TechnicalItems.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-2 px-2.5 text-slate-400 italic text-center text-[11px]">
                                    No technical stock items allocated
                                  </td>
                                </tr>
                              ) : (
                                page1TechnicalItems.map((alloc: any) => (
                                  <tr key={alloc.id} className="text-slate-800 border-b border-slate-200 text-[11px]">
                                    <td className="py-1 px-2.5 font-semibold text-emerald-700">
                                      {alloc.inventoryItem?.safCode || '-'}
                                    </td>
                                    <td className="py-1 px-2.5 font-bold">{alloc.inventoryItem?.element || '-'}</td>
                                    <td className="py-1 px-2.5">
                                      {alloc.inventoryItem?.brandProject || alloc.inventoryItem?.brand || '-'}
                                    </td>
                                    <td className="py-1 px-2.5">{alloc.inventoryItem?.model || '-'}</td>
                                    <td className="py-1 px-2.5 text-center font-bold text-slate-900">
                                      {alloc.issuedQuantity || alloc.requestedQuantity || 1}
                                    </td>
                                    <td className="py-1 px-2.5">
                                      {alloc.inventoryItem?.inventoryCategory || 'Technical'}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* TABLE 3: RENT | PURCHASE LIST (If shown on Page 1) */}
                        {renderRentPurchaseOnPage1 && (
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wide flex items-center justify-between">
                              <span>Rent | Purchase List ({rentPurchaseList.length})</span>
                            </h3>
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-[#858E38] text-white font-bold uppercase text-[10px]">
                                  <th className="py-1 px-2.5">Item Name</th>
                                  <th className="py-1 px-2.5">Brand / Vendor</th>
                                  <th className="py-1 px-2.5">Model / Specification</th>
                                  <th className="py-1 px-2.5 text-center">Qty</th>
                                  <th className="py-1 px-2.5">Type</th>
                                  <th className="py-1 px-2.5">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {page1RentPurchaseList.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="py-2 px-2.5 text-slate-400 italic text-center text-[11px]">
                                      No rent or purchase items recorded
                                    </td>
                                  </tr>
                                ) : (
                                  page1RentPurchaseList.map((item: any) => (
                                    <tr key={item.id} className="text-slate-800 border-b border-slate-200 text-[11px]">
                                      <td className="py-1 px-2.5 font-bold">{item.itemName}</td>
                                      <td className="py-1 px-2.5">{item.brand}</td>
                                      <td className="py-1 px-2.5">{item.model}</td>
                                      <td className="py-1 px-2.5 text-center font-bold text-slate-900">{item.qty}</td>
                                      <td className="py-1 px-2.5">
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${item.type === 'Rental' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                          {item.type}
                                        </span>
                                      </td>
                                      <td className="py-1 px-2.5 truncate max-w-[120px]">{item.notes}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Bottom Clearance Spacer */}
                    <div className="h-12 w-full"></div>
                  </div>
                </div>


                {/* ================= PAGE 2 (OVERFLOW TABLES & RENT/PURCHASE) ================= */}
                {hasPage2 && (
                  <div
                    className="page-sheet relative bg-white text-black w-[794px] min-h-[1123px] mx-auto shadow-2xl overflow-hidden box-border"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    {/* Foreground HTML Template Image */}
                    <img
                      src="/Bg_tech-docket_Page2.jpg"
                      alt="Technical Docket Page 2 Template"
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
                    />

                    {/* Content Container (Z-10) */}
                    <div className="relative z-10 w-full box-border flex flex-col min-h-[1123px] justify-between pb-28">
                      <div className="w-full pt-12 px-[120px] space-y-4">
                        
                        {/* OVERFLOW PRODUCTION ALLOTMENT TABLE */}
                        {page2ProductionItems.length > 0 && (
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wide">
                              Production Allotment (Continued)
                            </h3>
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-[#858E38] text-white font-bold uppercase text-[10px]">
                                  <th className="py-1 px-2.5">SAF CODE</th>
                                  <th className="py-1 px-2.5">Element</th>
                                  <th className="py-1 px-2.5">Brand</th>
                                  <th className="py-1 px-2.5">Model</th>
                                  <th className="py-1 px-2.5 text-center">Qty</th>
                                  <th className="py-1 px-2.5">Category</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {page2ProductionItems.map((alloc: any) => (
                                  <tr key={alloc.id} className="text-slate-800 border-b border-slate-200 text-[11px]">
                                    <td className="py-1 px-2.5 font-semibold text-amber-700">
                                      {alloc.inventoryItem?.safCode || '-'}
                                    </td>
                                    <td className="py-1 px-2.5 font-bold">{alloc.inventoryItem?.element || '-'}</td>
                                    <td className="py-1 px-2.5">
                                      {alloc.inventoryItem?.brandProject || alloc.inventoryItem?.brand || '-'}
                                    </td>
                                    <td className="py-1 px-2.5">{alloc.inventoryItem?.model || '-'}</td>
                                    <td className="py-1 px-2.5 text-center font-bold text-slate-900">
                                      {alloc.issuedQuantity || alloc.requestedQuantity || 1}
                                    </td>
                                    <td className="py-1 px-2.5">
                                      {alloc.inventoryItem?.inventoryCategory || 'Production'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* OVERFLOW TECHNICAL ALLOTMENT TABLE */}
                        {page2TechnicalItems.length > 0 && (
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wide">
                              Technical Stock Allotment (Continued)
                            </h3>
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-[#858E38] text-white font-bold uppercase text-[10px]">
                                  <th className="py-1 px-2.5">SAF CODE</th>
                                  <th className="py-1 px-2.5">Element</th>
                                  <th className="py-1 px-2.5">Brand</th>
                                  <th className="py-1 px-2.5">Model</th>
                                  <th className="py-1 px-2.5 text-center">Qty</th>
                                  <th className="py-1 px-2.5">Category</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {page2TechnicalItems.map((alloc: any) => (
                                  <tr key={alloc.id} className="text-slate-800 border-b border-slate-200 text-[11px]">
                                    <td className="py-1 px-2.5 font-semibold text-emerald-700">
                                      {alloc.inventoryItem?.safCode || '-'}
                                    </td>
                                    <td className="py-1 px-2.5 font-bold">{alloc.inventoryItem?.element || '-'}</td>
                                    <td className="py-1 px-2.5">
                                      {alloc.inventoryItem?.brandProject || alloc.inventoryItem?.brand || '-'}
                                    </td>
                                    <td className="py-1 px-2.5">{alloc.inventoryItem?.model || '-'}</td>
                                    <td className="py-1 px-2.5 text-center font-bold text-slate-900">
                                      {alloc.issuedQuantity || alloc.requestedQuantity || 1}
                                    </td>
                                    <td className="py-1 px-2.5">
                                      {alloc.inventoryItem?.inventoryCategory || 'Technical'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* RENT | PURCHASE LIST TABLE (If not shown on Page 1 or overflow) */}
                        {page2RentPurchaseList.length > 0 && (
                          <div className="space-y-1 pt-2">
                            <h3 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wide">
                              Rent | Purchase List ({rentPurchaseList.length})
                            </h3>
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-[#858E38] text-white font-bold uppercase text-[10px]">
                                  <th className="py-1 px-2.5">Item Name</th>
                                  <th className="py-1 px-2.5">Brand / Vendor</th>
                                  <th className="py-1 px-2.5">Model / Specification</th>
                                  <th className="py-1 px-2.5 text-center">Qty</th>
                                  <th className="py-1 px-2.5">Type</th>
                                  <th className="py-1 px-2.5">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {page2RentPurchaseList.map((item: any) => (
                                  <tr key={item.id} className="text-slate-800 border-b border-slate-200 text-[11px]">
                                    <td className="py-1 px-2.5 font-bold">{item.itemName}</td>
                                    <td className="py-1 px-2.5">{item.brand}</td>
                                    <td className="py-1 px-2.5">{item.model}</td>
                                    <td className="py-1 px-2.5 text-center font-bold text-slate-900">{item.qty}</td>
                                    <td className="py-1 px-2.5">
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${item.type === 'Rental' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {item.type}
                                      </span>
                                    </td>
                                    <td className="py-1 px-2.5 truncate max-w-[120px]">{item.notes}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Bottom Clearance Spacer */}
                      <div className="h-12 w-full"></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
