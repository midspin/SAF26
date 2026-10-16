'use client';

import React, { useEffect, useState, use } from 'react';
import {
  Layers,
  Printer,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  MapPin,
  Calendar,
  Box,
  Ruler,
  Hash,
  Tag,
  Info,
  Clock,
  User,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  X,
  Sparkles,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ProductionItemDetail {
  id: string;
  artistId: string;
  artworkId?: string | null;
  eventId?: string | null;
  productionCategory?: string | null;
  subCategory?: string | null;
  element?: string | null;
  typeSpec?: string | null;
  referenceImages?: string | null;
  length?: string | null;
  breadth?: string | null;
  height?: string | null;
  unit?: string | null;
  quantity: number;
  source?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  remarks?: string | null;
  specification?: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
  artist?: {
    id: string;
    artistName: string;
    country?: string | null;
    category?: string | null;
    artistPhoto?: string | null;
    biography?: string | null;
  } | null;
  artwork?: {
    id: string;
    artworkName: string;
    medium?: string | null;
    dimensions?: string | null;
    venue?: {
      id: string;
      venueName: string;
      address?: string | null;
    } | null;
    room?: {
      id: string;
      roomNumber: string;
      roomName: string;
      floor?: string | null;
    } | null;
  } | null;
  event?: {
    id: string;
    name: string;
    year: number;
  } | null;
}

export default function FabricationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [item, setItem] = useState<ProductionItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href.split('?')[0]);
    }
  }, []);

  useEffect(() => {
    async function fetchItem() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/production-requirements?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.item) {
          setItem(data.item);
        } else {
          setError(data.error || 'Fabrication item not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load fabrication details');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchItem();
    }
  }, [id]);

  // Check auto-print query param
  useEffect(() => {
    if (!loading && item && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('print') === 'true') {
        setTimeout(() => {
          handlePrint();
        }, 600);
      }
    }
  }, [loading, item]);

  const copyShareLink = () => {
    const url = shareUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareViaWhatsApp = () => {
    if (!item) return;
    const url = shareUrl || window.location.href;
    const dimensions = item.length || item.breadth || item.height
      ? `${item.length || '-'}${item.breadth ? ` × ${item.breadth}` : ''}${item.height ? ` × ${item.height}` : ''} ${item.unit || ''}`
      : 'Not specified';

    const text = `🛠️ *Serendipity Arts Festival 2026 - Fabrication Specification*\n\n` +
      `*Item:* ${item.element || 'Fabrication Element'}\n` +
      `*Category:* ${item.productionCategory || 'Production'} - ${item.subCategory || 'General'}\n` +
      `*Dimensions:* ${dimensions}\n` +
      `*Quantity:* ${item.quantity || 1}\n` +
      `*Source:* ${item.source || 'Fabricate'}\n` +
      `*Status:* ${item.status || 'Pending'}\n` +
      (item.artist ? `*Artist:* ${item.artist.artistName}\n` : '') +
      (item.artwork ? `*Artwork / Project:* ${item.artwork.artworkName}\n` : '') +
      `\n🔗 *View Technical Specification & Visual References:*\n${url}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    const printContent = document.getElementById('fabrication-printable-spec');
    if (!printContent) {
      window.print();
      return;
    }

    // Remove any existing print iframe
    const existingIframe = document.getElementById('fabrication-print-iframe');
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'fabrication-print-iframe';
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
          <title>${item?.element || 'Fabrication Spec'} - Serendipity Arts Festival</title>
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-clean {
              background: #ffffff !important;
              color: #0f172a !important;
            }
            .print-border {
              border-color: #cbd5e1 !important;
            }
            .print-card {
              background: #f8fafc !important;
              border: 1px solid #e2e8f0 !important;
            }
            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              max-width: 100% !important;
            }
            @media print {
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body class="print-clean p-4">
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    printDoc.open();
    printDoc.write(htmlContent);
    printDoc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print trigger error:', err);
        window.print();
      }
    };

    const imgs = printDoc.images;
    if (imgs.length === 0) {
      setTimeout(triggerPrint, 300);
    } else {
      let loadedCount = 0;
      const total = imgs.length;
      const onImageDone = () => {
        loadedCount++;
        if (loadedCount >= total) {
          setTimeout(triggerPrint, 400);
        }
      };

      for (let i = 0; i < total; i++) {
        if (imgs[i].complete) {
          onImageDone();
        } else {
          imgs[i].onload = onImageDone;
          imgs[i].onerror = onImageDone;
        }
      }
      // Safety timeout
      setTimeout(triggerPrint, 1500);
    }
  };

  // Parse reference images
  let imageList: string[] = [];
  if (item?.referenceImages) {
    try {
      const parsed = JSON.parse(item.referenceImages);
      if (Array.isArray(parsed)) imageList = parsed.filter(Boolean);
    } catch {
      imageList = [item.referenceImages].filter(Boolean);
    }
  }

  const dimensionText = item && (item.length || item.breadth || item.height)
    ? `${item.length || '-'}${item.breadth ? ` × ${item.breadth}` : ''}${item.height ? ` × ${item.height}` : ''} ${item.unit || ''}`
    : null;

  const getStatusColor = (status?: string | null) => {
    const s = (status || '').toLowerCase();
    if (s.includes('done') || s.includes('confirmed') || s.includes('approved')) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        printBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    }
    if (s.includes('hold')) {
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
        printBg: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    }
    return {
      bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
      printBg: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  };

  const getSourceBadge = (src?: string | null) => {
    const s = (src || '').toLowerCase();
    if (s.includes('fabricate')) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (s.includes('inventory')) {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (s.includes('purchase')) {
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
    if (s.includes('rental')) {
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    }
    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#11111a] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-spin mb-4">
          <Layers className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-sm font-bold text-amber-300 tracking-wide uppercase">
          Loading Fabrication Specification...
        </p>
        <p className="text-xs text-[#8a8d9b] mt-1">Connecting to Serendipity Arts Festival docket</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#11111a] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-black text-white">Fabrication Spec Not Found</h1>
        <p className="text-xs text-[#8a8d9b] max-w-sm mt-1 mb-6">
          {error || 'The requested fabrication specification link is invalid or has been archived.'}
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#232334] text-xs font-bold text-white hover:bg-[#2d2d42] border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Home
        </a>
      </div>
    );
  }

  const statusStyle = getStatusColor(item.status);

  return (
    <div className="min-h-screen bg-[#0e0e17] text-white font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* TOP NOTIFICATION / HEADER BAR */}
      <header className="sticky top-0 z-30 bg-[#151522]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Layers className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-amber-400 uppercase">
                Serendipity Arts Festival 2026
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                WEAVE Production
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-md">
              {item.element || 'Fabrication Element Spec Sheet'}
            </h1>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#232334] hover:bg-[#2c2c42] text-xs font-bold text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
            title="Copy Public Link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#8a8d9b]" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={shareViaWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-md shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            title="Share via WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            title="Download PDF or Print Spec Sheet"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* PRINTABLE DOCKET CONTAINER */}
        <div
          id="fabrication-printable-spec"
          className="rounded-3xl bg-[#171725] border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
        >
          {/* FESTIVAL HEADER (PRINT + SCREEN) */}
          <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.productionCategory || 'Production'}
                </span>
                {item.subCategory && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/10">
                    {item.subCategory}
                  </span>
                )}
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${getSourceBadge(item.source)}`}>
                  Source: {item.source || 'Fabricate'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {item.element || 'Fabrication Item'}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#8a8d9b]">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                  <span className="font-semibold text-white/90">{item.status || 'Pending'}</span>
                </span>
                <span>•</span>
                <span>Created: {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {item.assignedTo && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-medium">Assigned: {item.assignedTo}</span>
                  </>
                )}
              </div>
            </div>

            {/* QR CODE BOX (FOR PRINT & SITE VERIFICATION) */}
            <div className="flex items-center gap-3 bg-[#11111c] p-3 rounded-2xl border border-white/10 shrink-0">
              <div className="bg-white p-2 rounded-xl">
                <QRCodeSVG
                  value={shareUrl || `https://weave.saf.in/fabrication/${item.id}`}
                  size={84}
                  level="M"
                />
              </div>
              <div className="text-[11px] space-y-0.5 max-w-[140px]">
                <div className="font-bold text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Live Spec Sheet
                </div>
                <p className="text-[10px] text-[#8a8d9b] leading-tight">
                  Scan to view interactive high-res photos & status updates
                </p>
              </div>
            </div>
          </div>

          {/* KEY METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* QUANTITY */}
            <div className="p-4 rounded-2xl bg-[#1f1f30] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-[#8a8d9b] tracking-wider">
                <Hash className="w-3.5 h-3.5 text-amber-400" /> Quantity
              </div>
              <div className="text-2xl font-black text-amber-400">
                {item.quantity || 1}
                <span className="text-xs font-normal text-white/60 ml-1.5">
                  {item.unit === 'pcs' ? 'units' : item.unit || 'units'}
                </span>
              </div>
            </div>

            {/* DIMENSIONS */}
            <div className="p-4 rounded-2xl bg-[#1f1f30] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-[#8a8d9b] tracking-wider">
                <Ruler className="w-3.5 h-3.5 text-sky-400" /> Dimensions (L × B × H)
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono truncate" title={dimensionText || 'Not specified'}>
                {dimensionText || <span className="text-[#8a8d9b] italic text-xs">Not specified</span>}
              </div>
            </div>

            {/* ACQUISITION SOURCE */}
            <div className="p-4 rounded-2xl bg-[#1f1f30] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-[#8a8d9b] tracking-wider">
                <Box className="w-3.5 h-3.5 text-emerald-400" /> Source
              </div>
              <div className="text-sm font-extrabold text-white truncate">
                {item.source || 'Fabricate'}
              </div>
            </div>

            {/* STATUS */}
            <div className="p-4 rounded-2xl bg-[#1f1f30] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-[#8a8d9b] tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Status
              </div>
              <div className="text-xs font-black truncate text-white/95">
                {item.status || 'Pending'}
              </div>
            </div>
          </div>

          {/* SPECIFICATIONS & TECHNICAL REQUIREMENTS */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Technical Specification & Material Details
            </h3>
            <div className="p-5 rounded-2xl bg-[#12121e] border border-white/5 text-sm text-[#cbd5e1] leading-relaxed whitespace-pre-wrap font-sans">
              {item.typeSpec || item['specification'] || (
                <span className="text-[#8a8d9b] italic">No technical specification text provided.</span>
              )}
            </div>
          </div>

          {/* REMARKS & SPECIAL INSTRUCTIONS */}
          {item.remarks && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Production Remarks & Notes
              </h3>
              <div className="p-4 rounded-2xl bg-[#12121e] border border-white/5 text-xs text-[#cbd5e1] leading-relaxed whitespace-pre-wrap">
                {item.remarks}
              </div>
            </div>
          )}

          {/* DOCKET / PROJECT CONTEXT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* ARTIST & PROJECT */}
            <div className="p-5 rounded-2xl bg-[#1f1f30] border border-white/5 space-y-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8d9b] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" /> Artist & Project Association
              </div>
              <div>
                <div className="text-base font-black text-white">
                  {item.artist?.artistName || 'Serendipity Arts Festival'}
                </div>
                {item.artist?.country && (
                  <div className="text-xs text-[#8a8d9b]">{item.artist.country}</div>
                )}
                {item.artwork?.artworkName && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase font-bold text-[#8a8d9b] block">Project / Artwork</span>
                    <span className="text-xs font-bold text-amber-300">{item.artwork.artworkName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* VENUE & LOCATION */}
            <div className="p-5 rounded-2xl bg-[#1f1f30] border border-white/5 space-y-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8d9b] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Venue & Installation Location
              </div>
              <div>
                <div className="text-base font-black text-white">
                  {item.artwork?.venue?.venueName || 'To Be Assigned'}
                </div>
                {item.artwork?.venue?.address && (
                  <div className="text-xs text-[#8a8d9b] truncate">{item.artwork.venue.address}</div>
                )}
                {item.artwork?.room && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#8a8d9b]">Room:</span>
                    <span className="text-xs font-bold text-white">
                      {item.artwork.room.roomNumber} - {item.artwork.room.roomName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* REFERENCE IMAGES & DRAWINGS SECTION */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" /> Visual References & Technical Drawings ({imageList.length})
              </h3>
              {imageList.length > 0 && (
                <span className="text-[11px] text-[#8a8d9b]">
                  Click any image to enlarge in full resolution
                </span>
              )}
            </div>

            {imageList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#12121e] border border-white/5 text-[#8a8d9b] text-xs">
                No visual reference images or technical drawings attached to this requirement.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {imageList.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxImage(url)}
                    className="group relative rounded-2xl overflow-hidden bg-[#12121e] border border-white/10 hover:border-amber-400/60 transition-all cursor-pointer shadow-lg aspect-video flex items-center justify-center"
                  >
                    <img
                      src={url}
                      alt={`Reference ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 rounded-xl bg-black/60 text-white backdrop-blur-sm">
                        <ZoomIn className="w-4 h-4 text-amber-400" />
                      </span>
                      <span className="text-xs font-bold text-white drop-shadow">Enlarge</span>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono text-white/90">
                      Ref #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRINT FOOTER */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#8a8d9b]">
            <div>
              Serendipity Arts Festival 2026 • WEAVE Production Platform • Document Generated:{' '}
              {new Date().toLocaleDateString('en-GB')}
            </div>
            <div className="font-mono text-[10px] text-white/60">
              Docket ID: {item.id.slice(0, 8)}...
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#171725] border border-white/10">
          <div className="text-xs text-[#8a8d9b] text-center sm:text-left">
            Have questions about this specification? Contact the SAF Production Coordinator or team.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={shareViaWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-xs text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Share on WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-black text-xs text-slate-950 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </main>

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white p-1 rounded-lg bg-white/10 cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Enlarged Reference"
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Resolution
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
