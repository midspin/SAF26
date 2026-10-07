'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import ArtistPdfExportModal from '@/components/ArtistPdfExportModal';
import {
  Users,
  User,
  Palette,
  Briefcase,
  UserCheck,
  UserCog,
  Building2,
  DoorOpen,
  Wrench,
  Package,
  ShoppingCart,
  FileText,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  Search,
  Check,
  Ban,
  Upload,
  Edit3,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Download,
  Paperclip,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Maximize2,
} from 'lucide-react';

export default function Artist360FormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // User Role & Permission
  const [userRole, setUserRole] = useState<string>('SUPER ADMIN');

  useEffect(() => {
    const readRole = () => {
      if (typeof window !== 'undefined') {
        const role = localStorage.getItem('saf_user_role') || 'SUPER ADMIN';
        setUserRole(role);
      }
    };
    readRole();
    window.addEventListener('saf-role-changed', readRole);
    window.addEventListener('storage', readRole);
    return () => {
      window.removeEventListener('saf-role-changed', readRole);
      window.removeEventListener('storage', readRole);
    };
  }, []);

  const normalizedRole = (userRole || '').trim().toUpperCase();

  // Permissions for Card #1, Card #2, Card #3: Super Admin & Programming Team only
  const canEditProgrammingCards = [
    'SUPER ADMIN',
    'PROGRAMMING TEAM',
    'PROGRAMMING',
    'PROGRAMMER',
    'PROGRAMMERS',
  ].includes(normalizedRole);

  const isProductionOrProgrammingTeam = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'ADMIN',
    'PRODUCTION TEAM',
    'PRODUCTION HEAD',
    'PRODUCTION',
    'PROGRAMMING TEAM',
    'PROGRAMMING HEAD',
    'PROGRAMMING',
    'PROGRAMMER',
    'PROGRAMMERS',
  ].includes(normalizedRole);

  const isTechnicalOrInventoryTeam = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'ADMIN',
    'TECHNICAL TEAM',
    'TECHNICAL HEAD',
    'TECH HEAD',
    'INSTALLATION TEAM',
    'INVENTORY TEAM',
    'INVENTORY HEAD',
    'INVENTORY MANAGER',
    'INVENTORY',
    'TECHNICAL INSTALLATION',
    'TECH INSTALL TEAM',
  ].includes(normalizedRole);

  const isSuperAdmin = ['SUPER ADMIN', 'SUPERADMIN', 'ADMIN'].includes(normalizedRole);

  // Strict role check for positioning order
  const isPureTechnicalOrInventory =
    ['TECHNICAL TEAM', 'TECHNICAL HEAD', 'TECH HEAD', 'INSTALLATION TEAM', 'INVENTORY TEAM', 'INVENTORY HEAD', 'INVENTORY MANAGER', 'INVENTORY'].includes(normalizedRole) &&
    !['PRODUCTION TEAM', 'PRODUCTION HEAD', 'PRODUCTION', 'PROGRAMMING TEAM', 'PROGRAMMING HEAD', 'PROGRAMMING'].includes(normalizedRole);

  // Can assign items to Production Allotment: Super Admin, Production Team, Programming Team
  const canAssignProductionAllotment = isProductionOrProgrammingTeam;

  // Can assign items to Technical Stock Allotment: Super Admin, Technical Team, Inventory Team
  const canAssignTechnicalAllotment = isTechnicalOrInventoryTeam;

  // Permission to Upload Final Layout: Production Team, Spatial Designer, Tech Layout Designer, Super Admin
  const canUploadFinalLayout = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'ADMIN',
    'PRODUCTION TEAM',
    'PRODUCTION HEAD',
    'PRODUCTION',
    'PRODUCTION & LAYOUT',
    'SPATIAL DESIGNER',
    'SPATIAL DESIGN',
    'SPATIAL DESIGN TEAM',
    'TECH LAYOUT DESIGNER',
    'TECHNICAL LAYOUT DESIGNER',
    'LAYOUT DESIGNER',
  ].includes(normalizedRole);

  // Upload Final Layout Modal State (PDF, JPEG, JPG, PNG)
  const [uploadFinalLayoutModalOpen, setUploadFinalLayoutModalOpen] = useState(false);
  const [selectedRoomForLayout, setSelectedRoomForLayout] = useState('');
  const [uploadingFinalLayout, setUploadingFinalLayout] = useState(false);
  const [selectedLayoutFile, setSelectedLayoutFile] = useState<File | null>(null);
  const [layoutFilePreviewUrl, setLayoutFilePreviewUrl] = useState<string | null>(null);

  const parseImageList = (rawImages: string | null | undefined): string[] => {
    if (!rawImages) return [];
    try {
      if (typeof rawImages === 'string' && rawImages.trim().startsWith('[')) {
        const parsed = JSON.parse(rawImages);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      }
    } catch (e) {}
    return typeof rawImages === 'string' ? [rawImages].filter(Boolean) : [];
  };

  // Permissions for Card #4: Super Admin, Technical Team, Inventory Team & Production Team
  const canManageTechnicalInventory = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'TECHNICAL TEAM',
    'TECHNICAL HEAD',
    'INSTALLATION TEAM',
    'INVENTORY TEAM',
    'INVENTORY HEAD',
    'INVENTORY MANAGER',
    'INVENTORY',
    'PRODUCTION TEAM',
    'TECHNICAL INSTALLATION',
    'TECH INSTALL TEAM',
  ].includes(normalizedRole);

  // Technical Specification & Live Stock Assignment pallet visibility: Technical Team, Inventory Team & Super Admin
  const canViewTechnicalAssignmentPallet = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'TECHNICAL TEAM',
    'INSTALLATION TEAM',
    'INVENTORY TEAM',
    'INVENTORY MANAGER',
    'INVENTORY HEAD',
    'TECHNICAL HEAD',
    'INVENTORY',
  ].includes(normalizedRole);

  // Permission for Export PDF button: Super Admin, Technical Team, Inventory Team
  const canExportPDF = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'TECHNICAL TEAM',
    'TECHNICAL HEAD',
    'TECH HEAD',
    'INSTALLATION TEAM',
    'INVENTORY TEAM',
    'INVENTORY MANAGER',
    'INVENTORY HEAD',
    'INVENTORY',
  ].includes(normalizedRole);

  const [pdfExportModalOpen, setPdfExportModalOpen] = useState(false);

  const [artistData, setArtistData] = useState<any>(null);
  const [completenessScore, setCompletenessScore] = useState<number>(0);
  const [missingFields, setMissingFields] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Spatial Drawing Popup View Modal (Technical & Production Layout)
  const [spatialDrawingModal, setSpatialDrawingModal] = useState<{
    title: string;
    url: string;
    type: string;
  } | null>(null);

  // Card #2 Document Attachments State (PDF, Excel, Word, Images) - Starts EMPTY with no pre-attached dummy files
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; name: string; size: string; type: string; url: string; date: string }[]
  >([]);

  // Load saved artist reference files from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        const saved = localStorage.getItem(`saf_artist_docs_${id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setUploadedFiles(parsed);
        }
      } catch (e) {
        console.error('Failed to load artist documents:', e);
      }
    }
  }, [id]);

  const updateAndSaveFiles = (newFiles: any[]) => {
    setUploadedFiles(newFiles);
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`saf_artist_docs_${id}`, JSON.stringify(newFiles));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditProgrammingCards) {
      alert('Access Restricted: Only Programming Team & Super Admin can upload reference documents.');
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: { id: string; name: string; size: string; type: string; url: string; date: string }[] = [];

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let fileType = 'doc';
      if (['pdf'].includes(ext)) fileType = 'pdf';
      else if (['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'excel';
      else if (['doc', 'docx'].includes(ext)) fileType = 'word';
      else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) fileType = 'image';

      newDocs.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: fileType,
        url: URL.createObjectURL(file),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      });
    });

    const updated = [...newDocs, ...uploadedFiles];
    updateAndSaveFiles(updated);

    e.target.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    if (!canEditProgrammingCards) {
      alert('Access Restricted: Only Programming Team & Super Admin can delete reference documents.');
      return;
    }
    const updated = uploadedFiles.filter((f) => f.id !== fileId);
    updateAndSaveFiles(updated);
  };

  // Upload Final Layout Handlers (PDF, JPEG, JPG, PNG)
  const openUploadFinalLayoutModal = (targetRoomId?: string) => {
    const roomId = targetRoomId || artistData?.installations?.[0]?.roomId || artistData?.installations?.[0]?.room?.id || '';
    setSelectedRoomForLayout(roomId);
    setSelectedLayoutFile(null);
    setLayoutFilePreviewUrl(null);
    setUploadFinalLayoutModalOpen(true);
  };

  const handleSelectLayoutFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'jpeg', 'jpg', 'png'].includes(ext)) {
      alert('Invalid file format. Please upload a PDF, JPEG, JPG, or PNG file.');
      e.target.value = '';
      return;
    }

    setSelectedLayoutFile(file);
    if (['jpeg', 'jpg', 'png'].includes(ext)) {
      setLayoutFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setLayoutFilePreviewUrl(null);
    }
  };

  const handleExecuteUploadFinalLayout = async () => {
    if (!selectedLayoutFile) {
      alert('Please select a PDF, JPEG, JPG, or PNG file to upload.');
      return;
    }
    const roomId = selectedRoomForLayout || artistData?.installations?.[0]?.roomId || artistData?.installations?.[0]?.room?.id;
    if (!roomId) {
      alert('No valid room selected. Please allocate a venue & room first.');
      return;
    }

    setUploadingFinalLayout(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedLayoutFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.error || 'Failed to upload layout file');
      }

      const finalUrl = uploadData.url;
      const ext = selectedLayoutFile.name.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

      // Update room in database
      const roomRes = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          techProdLayout: finalUrl,
          ...(isImage ? { roomImage: finalUrl } : {}),
          userRole,
          userName: userRole ? `${userRole} User` : 'Production / Spatial Designer',
        }),
      });

      const roomData = await roomRes.json();
      if (!roomData.success) {
        throw new Error(roomData.error || 'Failed to update room layout');
      }

      // Also update primary artwork if available
      if (artistData?.artworks && artistData.artworks.length > 0) {
        try {
          const primaryArt = artistData.artworks[0];
          await fetch(`/api/artworks/${primaryArt.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              techProdLayout: finalUrl,
              userRole,
              userName: userRole ? `${userRole} User` : 'Production / Spatial Designer',
            }),
          });
        } catch (artErr) {
          console.warn('Artwork layout sync notice:', artErr);
        }
      }

      // Optimistically update local artist state so thumbnails and viewers update immediately
      setArtistData((prev: any) => {
        if (!prev) return prev;
        const updatedInstallations = (prev.installations || []).map((inst: any) => {
          if (inst.roomId === roomId || inst.room?.id === roomId) {
            return {
              ...inst,
              room: {
                ...inst.room,
                techProdLayout: finalUrl,
                ...(isImage ? { roomImage: finalUrl } : {}),
              },
            };
          }
          return inst;
        });
        return {
          ...prev,
          installations: updatedInstallations,
        };
      });

      setUploadFinalLayoutModalOpen(false);
      setSelectedLayoutFile(null);
      setLayoutFilePreviewUrl(null);

      setToastNotification({
        show: true,
        title: 'Final Layout Uploaded',
        safCode: 'LAYOUT',
        elementName: selectedLayoutFile.name,
        quantity: 1,
        category: 'Production & Spatial Design',
      });
      playSuccessChime();

      fetchArtistDetails(false);
    } catch (err: any) {
      console.error('Failed to upload final layout:', err);
      alert(err.message || 'Failed to upload final layout');
    } finally {
      setUploadingFinalLayout(false);
    }
  };

  // Live Technical Specs Inventory Search & Pool Filter State
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [selectedTechCategory, setSelectedTechCategory] = useState('ALL');
  const [selectedTechSubCategory, setSelectedTechSubCategory] = useState('ALL');
  const [assignQuantities, setAssignQuantities] = useState<Record<string, number>>({});
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);

  // Allotment Assignment Modal State (Production Allotment & Technical Stock Allotment)
  const [assignItemModalOpen, setAssignItemModalOpen] = useState(false);
  const [assignItemModalDepartment, setAssignItemModalDepartment] = useState<'PRODUCTION' | 'TECHNICAL'>('PRODUCTION');
  const [selectedAssignInvId, setSelectedAssignInvId] = useState('');
  const [selectedAssignArtworkId, setSelectedAssignArtworkId] = useState('');
  const [assignItemQuantity, setAssignItemQuantity] = useState(1);
  const [assignItemNotes, setAssignItemNotes] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [assignModalSearch, setAssignModalSearch] = useState('');
  const [modalItemQuantities, setModalItemQuantities] = useState<Record<string, number>>({});

  const openAssignModal = (dept: 'PRODUCTION' | 'TECHNICAL') => {
    setAssignItemModalDepartment(dept);
    setSelectedAssignInvId('');
    setSelectedAssignArtworkId(artistData?.artworks?.[0]?.id || '');
    setAssignItemQuantity(1);
    setAssignItemNotes('');
    setAssignModalSearch('');
    setModalItemQuantities({});
    if (inventoryItems.length === 0) {
      fetchInventoryPool();
    }
    setAssignItemModalOpen(true);
  };

  const handleConfirmAssignItem = async (overrideItemId?: string, overrideQty?: number) => {
    const targetInvId = overrideItemId || selectedAssignInvId;
    if (!targetInvId) {
      alert('Please select a master pool item to allocate.');
      return;
    }
    const itemToAssign = inventoryItems.find((i) => i.id === targetInvId);
    if (!itemToAssign) return;

    const targetQty = overrideQty || modalItemQuantities[targetInvId] || assignItemQuantity || 1;

    setSubmittingAssign(true);
    try {
      const res = await fetch('/api/inventory/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: artistData?.eventId || itemToAssign.eventId,
          inventoryItemId: targetInvId,
          artistId: artistData.id,
          artworkId: selectedAssignArtworkId || artistData.artworks?.[0]?.id || null,
          venueId: artistData.installations?.[0]?.venueId || null,
          roomId: artistData.installations?.[0]?.roomId || null,
          department: assignItemModalDepartment,
          requestedQuantity: targetQty,
          approvedBy: userRole,
          notes: assignItemNotes || `${assignItemModalDepartment} Allotment for Artist`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignItemModalOpen(false);
        // Optimistically append newly created allocation to local artist state if available
        if (data.allocation) {
          setArtistData((prev: any) => ({
            ...prev,
            allocations: [data.allocation, ...(prev?.allocations || [])],
          }));
        }
        const deptLabel = assignItemModalDepartment === 'PRODUCTION' ? 'Production Allotment' : 'Technical Stock Allotment';
        setToastNotification({
          show: true,
          title: `Item Allocated to ${deptLabel}`,
          safCode: itemToAssign.safCode,
          elementName: itemToAssign.element,
          quantity: targetQty,
          category: deptLabel,
        });
        playSuccessChime();
        // Fetch fresh details concurrently in background
        Promise.all([fetchArtistDetails(false), fetchInventoryPool()]).catch(console.error);
      } else {
        alert(data.message || data.error || 'Failed to allocate item.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting allocation.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Inventory Pool & Modal State
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // Computed modal stock items filter
  const filteredModalStockItems = inventoryItems.filter((item) => {
    const itemCat = (item.inventoryCategory || '').trim().toLowerCase();
    const itemDept = (item.inventoryUsageType || '').trim().toUpperCase();
    const targetDept = (assignItemModalDepartment || '').trim().toUpperCase();

    // 1. Category Filtering:
    // Production Allotment: Exclude "Technical" category completely
    // Technical Stock Allotment: Include ONLY "Technical" category / TECHNICAL usage
    if (targetDept === 'PRODUCTION') {
      if (itemCat === 'technical') return false;
    } else if (targetDept === 'TECHNICAL') {
      if (itemCat !== 'technical' && itemDept !== 'TECHNICAL') return false;
    }

    // 2. Search Query Matching
    const q = assignModalSearch.toLowerCase().trim();
    if (!q) return true;

    return (
      (item.safCode && item.safCode.toLowerCase().includes(q)) ||
      (item.element && item.element.toLowerCase().includes(q)) ||
      (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
      (item.inventoryCategory && item.inventoryCategory.toLowerCase().includes(q)) ||
      (item.brandProject && item.brandProject.toLowerCase().includes(q)) ||
      (item.model && item.model.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.serialNo && item.serialNo.toLowerCase().includes(q)) ||
      (item.remarks && item.remarks.toLowerCase().includes(q))
    );
  });

  const selectedAssignItemInfo = inventoryItems.find((i) => i.id === selectedAssignInvId);
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<string>('');
  const [requestedQty, setRequestedQty] = useState<number>(1);
  const [allocNotes, setAllocNotes] = useState<string>('');

  // Remove Allocation Modal States
  const [removeAllocModalOpen, setRemoveAllocModalOpen] = useState(false);
  const [removingAlloc, setRemovingAlloc] = useState<any>(null);
  const [isRemovingAlloc, setIsRemovingAlloc] = useState(false);

  const openRemoveAllocModal = (alloc: any) => {
    setRemovingAlloc(alloc);
    setRemoveAllocModalOpen(true);
  };

  const handleRemoveAllocation = async () => {
    if (!removingAlloc) return;
    setIsRemovingAlloc(true);
    try {
      const itemInfo = removingAlloc.inventoryItem;
      const res = await fetch(`/api/inventory/allocations?id=${removingAlloc.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setRemoveAllocModalOpen(false);
        setRemovingAlloc(null);
        await fetchArtistDetails();
        await fetchInventoryPool();

        setToastNotification({
          show: true,
          safCode: itemInfo?.safCode || 'RETURNED',
          elementName: `${itemInfo?.element || 'Stock Item'} (Returned to Master Pool)`,
          quantity: data.unallocatedQuantity || removingAlloc.issuedQuantity || 1,
        });
        playSuccessChime();
      } else {
        alert(data.error || 'Failed to remove allocation.');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing allocation.');
    } finally {
      setIsRemovingAlloc(false);
    }
  };

  // Reallocate Modal States & Comprehensive Modes (SWAP, RETURN, REASSIGN)
  const [reallocateModalOpen, setReallocateModalOpen] = useState(false);
  const [reallocatingAlloc, setReallocatingAlloc] = useState<any>(null);
  const [isReallocating, setIsReallocating] = useState(false);
  const [reallocateMode, setReallocateMode] = useState<'SWAP' | 'RETURN' | 'REASSIGN'>('SWAP');
  const [reallocSearchQuery, setReallocSearchQuery] = useState('');
  const [selectedReplacementItem, setSelectedReplacementItem] = useState<any | null>(null);
  const [replacementQuantity, setReplacementQuantity] = useState(1);
  const [reallocNotes, setReallocNotes] = useState('');
  const [allArtistsList, setAllArtistsList] = useState<any[]>([]);
  const [reallocForm, setReallocForm] = useState({
    targetArtistId: '',
    newIssuedQuantity: 1,
    notes: '',
  });

  const openReallocateModal = async (alloc: any) => {
    setReallocatingAlloc(alloc);
    setReallocateMode('SWAP');
    setReallocSearchQuery('');
    setSelectedReplacementItem(null);
    setReplacementQuantity(alloc.issuedQuantity || 1);
    setReallocNotes('');
    setReallocForm({
      targetArtistId: alloc.artistId || '',
      newIssuedQuantity: alloc.issuedQuantity || 1,
      notes: '',
    });
    setReallocateModalOpen(true);

    if (inventoryItems.length === 0) {
      fetchInventoryPool();
    }
    if (allArtistsList.length === 0) {
      try {
        const res = await fetch('/api/artists');
        const data = await res.json();
        if (data.artists) setAllArtistsList(data.artists);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 1. Handle Submit Swap Request for Inventory Approval
  const handleSubmitSwapRequest = async () => {
    if (!reallocatingAlloc) return;
    if (!selectedReplacementItem) {
      alert('Please search and select a replacement item from the inventory pool.');
      return;
    }
    setIsReallocating(true);
    try {
      let requesterName = 'Team Member';
      try {
        const session = localStorage.getItem('saf_user_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.name) requesterName = parsed.name;
        }
      } catch (e) {}

      const res = await fetch('/api/inventory/reallocate-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId: reallocatingAlloc.id,
          replacementInventoryItemId: selectedReplacementItem.id,
          replacementQuantity,
          requesterName,
          requesterRole: userRole,
          reason: reallocNotes || 'Swapped equipment request',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReallocateModalOpen(false);
        setReallocatingAlloc(null);
        setSelectedReplacementItem(null);
        setToastNotification({
          show: true,
          safCode: 'SWAP PENDING',
          elementName: `Swap Request for "${selectedReplacementItem.element}" submitted to Inventory Team!`,
          quantity: replacementQuantity,
        });
        playSuccessChime();
      } else {
        alert(data.error || 'Failed to submit swap request.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting swap request.');
    } finally {
      setIsReallocating(false);
    }
  };

  // 2. Handle Send Back to Inventory Pool (Direct Return / Unallocate)
  const handleDirectReturnToInventory = async () => {
    if (!reallocatingAlloc) return;
    setIsReallocating(true);
    try {
      const res = await fetch(`/api/inventory/allocations?id=${reallocatingAlloc.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setReallocateModalOpen(false);
        setReallocatingAlloc(null);
        await Promise.all([fetchArtistDetails(false), fetchInventoryPool()]);
        setToastNotification({
          show: true,
          safCode: 'RETURNED',
          elementName: `Returned ${reallocatingAlloc.inventoryItem?.element || 'item'} back to inventory pool`,
          quantity: reallocatingAlloc.issuedQuantity || 1,
        });
        playSuccessChime();
      } else {
        alert(data.error || 'Failed to return item to inventory.');
      }
    } catch (err) {
      console.error(err);
      alert('Error returning item to inventory.');
    } finally {
      setIsReallocating(false);
    }
  };

  // 3. Handle Standard Reallocation to Target Artist
  const handleSaveReallocation = async () => {
    if (!reallocatingAlloc) return;
    setIsReallocating(true);
    try {
      const res = await fetch('/api/inventory/allocations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId: reallocatingAlloc.id,
          targetArtistId: reallocForm.targetArtistId,
          newIssuedQuantity: reallocForm.newIssuedQuantity,
          notes: reallocForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReallocateModalOpen(false);
        setReallocatingAlloc(null);
        await Promise.all([fetchArtistDetails(false), fetchInventoryPool()]);

        setToastNotification({
          show: true,
          safCode: reallocatingAlloc.inventoryItem?.safCode || 'REALLOCATED',
          elementName: `${reallocatingAlloc.inventoryItem?.element || 'Stock Item'} Reallocated`,
          quantity: reallocForm.newIssuedQuantity,
        });
        playSuccessChime();
      } else {
        alert(data.error || 'Failed to reallocate item.');
      }
    } catch (err) {
      console.error(err);
      alert('Error reallocating item.');
    } finally {
      setIsReallocating(false);
    }
  };

  // Artwork Modal State
  const [artworkModalOpen, setArtworkModalOpen] = useState(false);
  const [newArtwork, setNewArtwork] = useState({
    artworkName: '',
    description: '',
    dimensions: '',
    medium: '',
    installationType: 'Projection',
  });

  // Rent | Purchase Card State & Handlers
  const [rentPurchaseModalOpen, setRentPurchaseModalOpen] = useState(false);
  const [editRentPurchaseModal, setEditRentPurchaseModal] = useState<any | null>(null);
  const [deleteRentPurchaseModal, setDeleteRentPurchaseModal] = useState<any | null>(null);

  const [rentPurchaseForm, setRentPurchaseForm] = useState({
    itemType: 'Purchase', // Purchase or Rent
    itemName: '',
    brand: '',
    model: '',
    quantity: 1,
    purchaseLink: '',
    notes: '',
  });

  const [submittingRentPurchase, setSubmittingRentPurchase] = useState(false);
  const [deletingRentPurchase, setDeletingRentPurchase] = useState(false);

  const handleSaveRentPurchaseItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentPurchaseForm.itemName.trim()) {
      alert('Item Name is required');
      return;
    }

    setSubmittingRentPurchase(true);
    try {
      const res = await fetch('/api/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: rentPurchaseForm.itemType === 'Rent' ? 'RENTAL' : 'PURCHASE',
          artistId: id,
          itemName: rentPurchaseForm.itemName,
          brand: rentPurchaseForm.brand,
          model: rentPurchaseForm.model,
          itemType: rentPurchaseForm.itemType,
          quantity: rentPurchaseForm.quantity,
          purchaseLink: rentPurchaseForm.purchaseLink,
          notes: rentPurchaseForm.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRentPurchaseModalOpen(false);

        // Optimistically update local artist state
        const isRent = rentPurchaseForm.itemType === 'Rent';
        const newItem = data.record || data.item || {
          id: `temp-${Date.now()}`,
          itemName: rentPurchaseForm.itemName,
          brand: rentPurchaseForm.brand,
          model: rentPurchaseForm.model,
          itemType: rentPurchaseForm.itemType,
          quantity: rentPurchaseForm.quantity,
          purchaseLink: rentPurchaseForm.purchaseLink,
          notes: rentPurchaseForm.notes,
        };

        if (isRent) {
          setArtistData((prev: any) => ({
            ...prev,
            rentalRecords: [newItem, ...(prev?.rentalRecords || [])],
          }));
        } else {
          setArtistData((prev: any) => ({
            ...prev,
            purchaseRequests: [newItem, ...(prev?.purchaseRequests || [])],
          }));
        }

        const catLabel = isRent ? 'Rent List' : 'Purchase List';
        setToastNotification({
          show: true,
          title: `Item Added to ${catLabel}`,
          safCode: isRent ? 'RENT' : 'PURCHASE',
          elementName: rentPurchaseForm.itemName,
          quantity: rentPurchaseForm.quantity,
          category: 'Rent | Purchase List',
        });
        playSuccessChime();

        setRentPurchaseForm({
          itemType: 'Purchase',
          itemName: '',
          brand: '',
          model: '',
          quantity: 1,
          purchaseLink: '',
          notes: '',
        });
        fetchArtistDetails(false);
      } else {
        alert(data.error || 'Failed to save item');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving rent/purchase item');
    } finally {
      setSubmittingRentPurchase(false);
    }
  };

  const handleUpdateRentPurchaseItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRentPurchaseModal) return;

    setSubmittingRentPurchase(true);
    try {
      const res = await fetch('/api/procurement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editRentPurchaseModal.itemType === 'Rent' || editRentPurchaseModal._isRental ? 'RENTAL' : 'PURCHASE',
          id: editRentPurchaseModal.id,
          itemName: editRentPurchaseModal.itemName,
          brand: editRentPurchaseModal.brand,
          model: editRentPurchaseModal.model,
          itemType: editRentPurchaseModal.itemType,
          quantity: editRentPurchaseModal.quantity,
          purchaseLink: editRentPurchaseModal.purchaseLink,
          notes: editRentPurchaseModal.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditRentPurchaseModal(null);
        await fetchArtistDetails();
      } else {
        alert(data.error || 'Failed to update item');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating item');
    } finally {
      setSubmittingRentPurchase(false);
    }
  };

  const handleDeleteRentPurchaseItem = async () => {
    if (!deleteRentPurchaseModal) return;
    setDeletingRentPurchase(true);
    try {
      const itemType = deleteRentPurchaseModal._isRental ? 'RENTAL' : 'PURCHASE';
      const res = await fetch(`/api/procurement?id=${deleteRentPurchaseModal.id}&type=${itemType}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setDeleteRentPurchaseModal(null);
        await fetchArtistDetails();
      } else {
        alert(data.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting item');
    } finally {
      setDeletingRentPurchase(false);
    }
  };

  // Edit & Delete artist state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    artistName: '',
    country: '',
    city: '',
    email: '',
    phone: '',
    website: '',
    biography: '',
    arrivalDate: '',
    departureDate: '',
    travelNotes: '',
    lodgingDetails: '',
    status: 'Confirmed',
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openEditModal = () => {
    if (!artistData) return;
    setEditFormData({
      artistName: artistData.artistName || '',
      country: artistData.country || '',
      city: artistData.city || '',
      email: artistData.email || '',
      phone: artistData.phone || '',
      website: artistData.website || '',
      biography: artistData.biography || '',
      arrivalDate: artistData.arrivalDate || '',
      departureDate: artistData.departureDate || '',
      travelNotes: artistData.travelNotes || '',
      lodgingDetails: artistData.lodgingDetails || '',
      status: artistData.status || 'Confirmed',
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleUpdateArtist = async () => {
    if (!artistData) return;
    if (!editFormData.artistName.trim()) {
      setEditError('Artist Name is required.');
      return;
    }
    setSubmittingEdit(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole, ...editFormData }),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        fetchArtistDetails();
      } else {
        setEditError(data.error || 'Failed to update artist.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Error updating artist.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteArtist = async () => {
    if (!artistData) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/artists';
      } else {
        alert(data.error || 'Failed to delete artist.');
      }
    } catch (err) {
      alert('Network error deleting artist.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Assignment Modals State
  const [curatorModalOpen, setCuratorModalOpen] = useState(false);
  const [allCurators, setAllCurators] = useState<any[]>([]);
  const [selectedCuratorIds, setSelectedCuratorIds] = useState<string[]>([]);

  const [programmingModalOpen, setProgrammingModalOpen] = useState(false);
  const [allProgrammingPeople, setAllProgrammingPeople] = useState<any[]>([]);
  const [selectedProgrammingIds, setSelectedProgrammingIds] = useState<string[]>([]);

  const [productionModalOpen, setProductionModalOpen] = useState(false);
  const [allProductionPeople, setAllProductionPeople] = useState<any[]>([]);
  const [selectedProductionIds, setSelectedProductionIds] = useState<string[]>([]);

  const [spatialModalOpen, setSpatialModalOpen] = useState(false);
  const [allSpatialDesigners, setAllSpatialDesigners] = useState<any[]>([]);
  const [selectedSpatialDesignerIds, setSelectedSpatialDesignerIds] = useState<string[]>([]);

  const [pocModalOpen, setPocModalOpen] = useState(false);
  const [allPocs, setAllPocs] = useState<any[]>([]);
  const [selectedPocIds, setSelectedPocIds] = useState<string[]>([]);

  // Assign Venue & Room Modal State
  const [assignVenueModalOpen, setAssignVenueModalOpen] = useState(false);
  const [availableVenues, setAvailableVenues] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedArtworkIdForVenue, setSelectedArtworkIdForVenue] = useState<string>('');
  const [installationNotes, setInstallationNotes] = useState<string>('');
  const [installationStatus, setInstallationStatus] = useState<string>('Planned');

  const [savingAssignment, setSavingAssignment] = useState(false);

  // Popup Toast Notification State
  const [toastNotification, setToastNotification] = useState<{
    show: boolean;
    title?: string;
    safCode: string;
    elementName: string;
    quantity: number;
    category?: string;
  }>({
    show: false,
    title: 'Stock Allocated Successfully',
    safCode: '',
    elementName: '',
    quantity: 1,
    category: 'Production Allotment',
  });

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.09);
      gain2.gain.setValueAtTime(0.2, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn('AudioContext warning:', e);
    }
  };

  useEffect(() => {
    if (toastNotification.show) {
      const timer = setTimeout(() => {
        setToastNotification((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification.show]);

  useEffect(() => {
    fetchArtistDetails(true);
    fetchInventoryPool();
  }, [id]);

  const fetchArtistDetails = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch(`/api/artists/${id}`);
      const data = await res.json();
      if (data.success) {
        setArtistData(data.artist);
        setCompletenessScore(data.completenessScore);
        setMissingFields(data.missingFields || []);
        setActivityLogs(data.activityLogs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const fetchInventoryPool = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) setInventoryItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Live Inventory Search-to-Assign Handler
  const handleQuickAssignStock = async (invItem: any) => {
    const qtyToAssign = assignQuantities[invItem.id] || 1;
    setAssigningItemId(invItem.id);
    try {
      const res = await fetch('/api/inventory/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: artistData?.eventId || invItem.eventId,
          inventoryItemId: invItem.id,
          artistId: artistData.id,
          artworkId: artistData.artworks?.[0]?.id || null,
          venueId: artistData.installations?.[0]?.venueId || null,
          roomId: artistData.installations?.[0]?.roomId || null,
          department: invItem.inventoryUsageType || 'TECHNICAL',
          requestedQuantity: qtyToAssign,
          approvedBy: 'Admin Operations',
          notes: 'Assigned directly from Technical Requirements Search',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || data.error || 'Cannot allocate item');
      } else {
        if (data.allocation) {
          setArtistData((prev: any) => ({
            ...prev,
            allocations: [data.allocation, ...(prev?.allocations || [])],
          }));
        }
        playSuccessChime();
        setToastNotification({
          show: true,
          safCode: invItem.safCode,
          elementName: invItem.element,
          quantity: qtyToAssign,
        });

        Promise.all([fetchArtistDetails(false), fetchInventoryPool()]).catch(console.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error allocating stock item.');
    } finally {
      setAssigningItemId(null);
    }
  };

  // Curator & Programming Modal Handlers
  const openCuratorModal = async () => {
    try {
      const res = await fetch('/api/curators');
      const data = await res.json();
      if (data.success) {
        setAllCurators(data.curators || []);
        const currentlyAssigned = artistData?.curatorAssignments?.map((ca: any) => ca.curatorId) || [];
        setSelectedCuratorIds(currentlyAssigned);
        setCuratorModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCurators = async () => {
    setSavingAssignment(true);
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curatorIds: selectedCuratorIds }),
      });
      const data = await res.json();
      if (data.success) {
        setCuratorModalOpen(false);
        fetchArtistDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAssignment(false);
    }
  };

  const openProgrammingModal = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success) {
        setAllProgrammingPeople(data.teams?.programming || []);
        const currentlyAssigned = artistData?.programmingAssignments?.map((pa: any) => pa.programmingPersonId) || [];
        setSelectedProgrammingIds(currentlyAssigned);
        setProgrammingModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProgramming = async () => {
    setSavingAssignment(true);
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programmingIds: selectedProgrammingIds }),
      });
      const data = await res.json();
      if (data.success) {
        setProgrammingModalOpen(false);
        fetchArtistDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAssignment(false);
    }
  };

  const openProductionModal = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success) {
        setAllProductionPeople(data.teams?.production || []);
        const currentlyAssigned = artistData?.productionAssignments?.map((pa: any) => pa.productionPersonId) || [];
        setSelectedProductionIds(currentlyAssigned);
        setProductionModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProduction = async () => {
    setSavingAssignment(true);
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionIds: selectedProductionIds }),
      });
      const data = await res.json();
      if (data.success) {
        setProductionModalOpen(false);
        fetchArtistDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAssignment(false);
    }
  };

  const openSpatialModal = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success) {
        setAllSpatialDesigners(data.teams?.spatial || []);
        const currentlyAssigned = artistData?.spatialAssignments?.map((sa: any) => sa.spatialDesignerId) || [];
        setSelectedSpatialDesignerIds(currentlyAssigned);
        setSpatialModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSpatial = async () => {
    setSavingAssignment(true);
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spatialDesignerIds: selectedSpatialDesignerIds }),
      });
      const data = await res.json();
      if (data.success) {
        setSpatialModalOpen(false);
        fetchArtistDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAssignment(false);
    }
  };

  const openAssignVenueModal = async () => {
    try {
      const res = await fetch('/api/venues');
      const data = await res.json();
      if (data.success) {
        setAvailableVenues(data.venues || []);
        const currentVenueId = artistData.installations?.[0]?.venueId || data.venues?.[0]?.id || '';
        setSelectedVenueId(currentVenueId);

        const foundVenue = data.venues?.find((v: any) => v.id === currentVenueId);
        const rooms = foundVenue?.rooms || [];
        setAvailableRooms(rooms);

        const currentRoomIds = artistData.installations?.map((inst: any) => inst.roomId).filter(Boolean) || [];
        setSelectedRoomIds(currentRoomIds);

        setAssignVenueModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVenueChange = (venueId: string) => {
    setSelectedVenueId(venueId);
    const foundVenue = availableVenues.find((v) => v.id === venueId);
    const rooms = foundVenue?.rooms || [];
    setAvailableRooms(rooms);
    setSelectedRoomIds([]);
  };

  const handleSaveVenueAssignment = async () => {
    setSavingAssignment(true);
    try {
      const res = await fetch('/api/installations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: artistData.eventId,
          artistId: artistData.id,
          artworkId: selectedArtworkIdForVenue || artistData.artworks[0]?.id || null,
          venueId: selectedVenueId,
          roomIds: selectedRoomIds,
          installationNotes,
          installationStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignVenueModalOpen(false);
        fetchArtistDetails();
        fetchInventoryPool();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleCreateArtwork = async () => {
    try {
      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: artistData.eventId,
          artistId: artistData.id,
          ...newArtwork,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setArtworkModalOpen(false);
        fetchArtistDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !artistData) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Sparkles className="w-8 h-8 text-[#38bdf8] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading Artist 360 Master View...</p>
      </div>
    );
  }

  // Categories for Tech Specs Filter
  const availableTechCategories = Array.from(new Set(inventoryItems.map((i) => i.inventoryCategory).filter(Boolean)));
  const availableTechSubCategories = Array.from(new Set(inventoryItems.map((i) => i.subCategory).filter(Boolean)));

  // Search Results
  const searchResults = inventoryItems.filter((i) => {
    const q = techSearchQuery.toLowerCase().trim();
    const matchesCat = selectedTechCategory === 'ALL' || i.inventoryCategory === selectedTechCategory;
    const matchesSubCat = selectedTechSubCategory === 'ALL' || i.subCategory === selectedTechSubCategory;

    const matchesQuery =
      !q ||
      (i.safCode && i.safCode.toLowerCase().includes(q)) ||
      (i.element && i.element.toLowerCase().includes(q)) ||
      (i.subCategory && i.subCategory.toLowerCase().includes(q)) ||
      (i.brandProject && i.brandProject.toLowerCase().includes(q)) ||
      (i.model && i.model.toLowerCase().includes(q)) ||
      (i.inventoryCategory && i.inventoryCategory.toLowerCase().includes(q));

    return matchesCat && matchesSubCat && matchesQuery;
  });

  // Separate allocations into Production Allotments and Technical Stock Allotments
  const productionAllocations = (artistData?.allocations || []).filter(
    (alloc: any) => alloc.department === 'PRODUCTION' || alloc.inventoryItem?.inventoryUsageType === 'PRODUCTION'
  );

  const technicalAllocations = (artistData?.allocations || []).filter(
    (alloc: any) => alloc.department !== 'PRODUCTION' && alloc.inventoryItem?.inventoryUsageType !== 'PRODUCTION'
  );

  return (
    <div className="space-y-6 pb-24 select-none">
      {/* Top Navigation & Header Utility */}
      <div className="flex items-center justify-between">
        <Link href="/artists" className="text-xs font-semibold text-[#38bdf8] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Artists Directory
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#8a8d9b] bg-[#232334] px-2.5 py-1 rounded-lg border border-white/10">
            Role: <strong className="text-[#38bdf8]">{userRole}</strong>
          </span>
          <span className="text-[10px] font-mono text-[#8a8d9b] bg-[#232334] px-2.5 py-1 rounded-lg border border-white/10">
            Artist ID: {artistData.id}
          </span>
        </div>
      </div>

      {/* POPUP TOAST NOTIFICATION WITH ANIMATED TICK MARK */}
      {toastNotification.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 text-slate-100 p-4 rounded-2xl shadow-2xl flex items-center gap-3.5 min-w-[320px] max-w-md">
          {/* Animated Checkmark Icon with Pulse Ring */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 text-emerald-400 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {toastNotification.category || 'Allocated'}
              </span>
              {toastNotification.safCode && (
                <span className="text-[10px] text-slate-400 font-mono">{toastNotification.safCode}</span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-100 truncate">{toastNotification.title || 'Item Allocated Successfully'}</h4>
            <p className="text-xs text-emerald-400 font-semibold truncate mt-0.5">
              {toastNotification.quantity}x {toastNotification.elementName}
            </p>
          </div>
          <button
            onClick={() => setToastNotification((prev) => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* REWORKED ARTIST 360 LAYOUT GRID */}

      {/* ROW 1: CARD #1 & CARD #2 SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD #1: ARTIST PROFILE + CONTACT INFO + SPATIAL ALLOCATION DETAILS */}
        <div className="p-6 rounded-3xl bg-[#232334] border border-white/10 shadow-2xl flex flex-col justify-between space-y-5">
          <div>
            {/* Card Header & Edit/Delete Controls */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                {artistData.artistPhoto ? (
                  <img
                    src={artistData.artistPhoto}
                    alt={artistData.artistName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#8b5cf6]/50 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-black text-2xl shadow-md">
                    {artistData.artistName.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black text-white flex items-center gap-2">
                    {artistData.artistName}
                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 uppercase">
                      {artistData.status || 'CONFIRMED'}
                    </span>
                  </h1>
                  <p className="text-xs text-[#38bdf8] font-bold mt-0.5">
                    📍 {artistData.city ? `${artistData.city}, ` : ''}{artistData.country || 'International Artist'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {canExportPDF && (
                  <button
                    onClick={() => setPdfExportModalOpen(true)}
                    className="bg-[#38bdf8]/10 hover:bg-[#38bdf8] hover:text-slate-950 text-[#38bdf8] font-extrabold text-xs px-3 py-1.5 rounded-xl border border-[#38bdf8]/30 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Export technical docket
                  </button>
                )}
                {canEditProgrammingCards ? (
                  <>
                    <button
                      onClick={openEditModal}
                      className="bg-[#1c1c2a] hover:bg-[#8b5cf6] hover:text-white text-[#8b5cf6] font-bold text-xs px-3 py-1.5 rounded-xl border border-white/10 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-rose-800/40 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] font-mono text-[#8a8d9b] bg-[#1c1c2a] px-2.5 py-1 rounded-lg border border-white/5">
                    View Only
                  </span>
                )}
              </div>
            </div>

            {/* Artist Biography & Contact Info */}
            <div className="space-y-3 pt-4">
              <div>
                <span className="text-[10px] font-extrabold text-[#8a8d9b] uppercase tracking-wider block mb-1">
                  Biography & Overview
                </span>
                <p className="text-xs text-white/90 leading-relaxed bg-[#1c1c2a] p-3.5 rounded-2xl border border-white/5">
                  {artistData.biography || 'No biography details recorded.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5">
                  <span className="text-[9px] text-[#8a8d9b] block uppercase">Email</span>
                  <span className="font-bold text-white truncate block mt-0.5">{artistData.email || 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5">
                  <span className="text-[9px] text-[#8a8d9b] block uppercase">Phone</span>
                  <span className="font-bold text-white truncate block mt-0.5">{artistData.phone || 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5">
                  <span className="text-[9px] text-[#8a8d9b] block uppercase">Website</span>
                  <span className="font-bold text-[#38bdf8] truncate block mt-0.5">{artistData.website || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LINE SEPARATION & SPATIAL ALLOCATION DETAILS */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#38bdf8]" /> Venue & Room Spatial Allocation
              </h3>
              <div className="flex items-center gap-2">
                {canUploadFinalLayout && artistData.installations?.length > 0 && (
                  <button
                    onClick={() => openUploadFinalLayoutModal()}
                    className="bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-extrabold text-[11px] px-3 py-1 rounded-xl border border-emerald-500/40 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Final Layout
                  </button>
                )}
                {canEditProgrammingCards && (
                  <button
                    onClick={openAssignVenueModal}
                    className="bg-[#38bdf8]/10 hover:bg-[#38bdf8] hover:text-slate-950 text-[#38bdf8] font-extrabold text-[11px] px-3 py-1 rounded-xl border border-[#38bdf8]/30 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Venue & Room
                  </button>
                )}
              </div>
            </div>

            {artistData.installations?.length === 0 ? (
              <p className="text-xs text-[#8a8d9b] py-2 text-center bg-[#1c1c2a] rounded-xl border border-white/5">
                No venue or room allocated yet.
              </p>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#38bdf8]">
                    📍 {artistData.installations[0]?.venue?.venueName || 'Primary Venue'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30">
                    Status: {artistData.installations[0]?.installationStatus || 'Planned'}
                  </span>
                </div>
                <div className="space-y-2.5 pt-1">
                  {artistData.installations.map((inst: any) => {
                    const roomLayoutUrl = inst.room?.techProdLayout || inst.room?.roomImage || inst.room?.floorplan;
                    const isPdf = roomLayoutUrl?.endsWith('.pdf') || roomLayoutUrl?.includes('.pdf');
                    const hasFinalLayout = Boolean(inst.room?.techProdLayout);

                    return (
                      <div key={inst.id} className="p-3 rounded-2xl bg-[#232334] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-white block text-xs">
                              Room {inst.room?.roomNumber || 'Gallery Space'} - {inst.room?.roomName || 'Exhibition Space'}
                            </span>
                            <span className="text-[10px] text-[#8a8d9b]">
                              Floor: {inst.room?.floor || 'Ground'} | Area: {inst.room?.area || 'N/A'} | Height: {inst.room?.height || '4.0m'}
                            </span>
                          </div>
                          {hasFinalLayout && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ✓ Final Layout
                            </span>
                          )}
                        </div>

                        {/* Technical & Production Layout Thumbnail & Interactive Popup Button */}
                        {roomLayoutUrl ? (
                          <div className="mt-1.5 p-2 rounded-xl bg-[#1c1c2a] border border-emerald-500/30 hover:border-emerald-400 transition-all flex items-center justify-between gap-3 group">
                            <div
                              onClick={() =>
                                setSpatialDrawingModal({
                                  title: `Room ${inst.room?.roomNumber} (${inst.room?.roomName}) - ${hasFinalLayout ? 'Final Technical & Production Layout' : 'Spatial Floorplan'}`,
                                  url: roomLayoutUrl,
                                  type: isPdf ? 'PDF' : 'IMAGE',
                                })
                              }
                              className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
                            >
                              {/* Rich Thumbnail Preview */}
                              <div className="relative w-14 h-14 rounded-lg bg-slate-900 overflow-hidden border border-emerald-500/40 shrink-0 flex items-center justify-center group/img">
                                {isPdf ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-emerald-400 p-1">
                                    <FileText className="w-5 h-5 mb-0.5" />
                                    <span className="text-[7px] font-black">PDF</span>
                                  </div>
                                ) : (
                                  <img
                                    src={roomLayoutUrl}
                                    alt="Final Layout Thumbnail"
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                                  />
                                )}
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                              </div>

                              <div className="truncate">
                                <span className="text-[11px] font-bold text-white block group-hover:text-emerald-300 transition-colors">
                                  📐 {hasFinalLayout ? 'Final Layout (Tech & Production)' : 'Room Spatial Floorplan'}
                                </span>
                                <span className="text-[9px] text-[#8a8d9b] truncate block">
                                  Visible to all roles • Click to view full layout ({isPdf ? 'PDF' : 'Image'})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setSpatialDrawingModal({
                                    title: `Room ${inst.room?.roomNumber} (${inst.room?.roomName}) - ${hasFinalLayout ? 'Final Technical & Production Layout' : 'Spatial Floorplan'}`,
                                    url: roomLayoutUrl,
                                    type: isPdf ? 'PDF' : 'IMAGE',
                                  })
                                }
                                className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Maximize2 className="w-3 h-3" /> View Drawing
                              </button>
                              {canUploadFinalLayout && (
                                <button
                                  type="button"
                                  onClick={() => openUploadFinalLayoutModal(inst.roomId || inst.room?.id)}
                                  className="text-[10px] font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500 hover:text-slate-950 px-2 py-1 rounded-lg border border-sky-500/30 transition-all flex items-center gap-1 shadow-sm"
                                  title="Upload new layout revision"
                                >
                                  <Upload className="w-3 h-3" /> Replace
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-[#1c1c2a] border border-dashed border-white/10 space-y-1.5">
                            <span className="text-[10px] text-[#8a8d9b] italic block">
                              No Technical & Production Layout uploaded for this room yet.
                            </span>
                            {canUploadFinalLayout && (
                              <button
                                type="button"
                                onClick={() => openUploadFinalLayoutModal(inst.roomId || inst.room?.id)}
                                className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-extrabold text-[10px] rounded-lg border border-emerald-500/30 flex items-center gap-1 transition-all"
                              >
                                <Upload className="w-3 h-3" /> Upload Final Layout (PDF, JPEG, JPG, PNG)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD #2: ARTWORK & DETAILS + FILE UPLOAD FACILITY */}
        <div className="p-6 rounded-3xl bg-[#232334] border border-white/10 shadow-2xl flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-[#a855f7]" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  Artwork Details & Artist Documents
                </h2>
              </div>
              {canEditProgrammingCards ? (
                <button
                  onClick={() => setArtworkModalOpen(true)}
                  className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-md shadow-purple-500/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Register Artwork
                </button>
              ) : (
                <span className="text-[10px] font-mono text-[#8a8d9b] bg-[#1c1c2a] px-2.5 py-1 rounded-lg border border-white/5">
                  View Only
                </span>
              )}
            </div>

            {/* Artwork List from Artworks Registry */}
            <div className="space-y-3 pt-4">
              {artistData.artworks?.length === 0 ? (
                <p className="text-xs text-[#8a8d9b] py-3 text-center bg-[#1c1c2a] rounded-2xl border border-white/5">
                  No artworks registered yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {artistData.artworks.map((art: any) => {
                    const files = parseImageList(art.images);

                    return (
                      <div
                        key={art.id}
                        className="p-4 rounded-2xl bg-[#1c1c2a] border border-white/5 text-xs space-y-2.5 shadow-md"
                      >
                        {/* Artwork Title & Installation Category */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                          <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                            <Palette className="w-4 h-4 text-[#a855f7]" /> {art.artworkName}
                          </h4>
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 shrink-0">
                            {art.installationType || 'Projection'}
                          </span>
                        </div>

                        {/* Artwork Concept / Description */}
                        {art.description ? (
                          <div>
                            <span className="text-[9px] font-bold text-[#8a8d9b] uppercase tracking-wider block mb-1">
                              Artwork Concept / Description
                            </span>
                            <p className="text-[#cbd5e1] text-[11px] leading-relaxed bg-[#232334] p-3 rounded-xl border border-white/5">
                              {art.description}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#8a8d9b] italic">No description available.</p>
                        )}

                        {/* Specs Summary: Medium & Dimensions */}
                        <div className="text-[10px] text-[#8a8d9b] pt-1 flex justify-between gap-2 border-t border-white/5">
                          <span>
                            Medium: <strong className="text-white">{art.medium || 'N/A'}</strong>
                          </span>
                          <span>
                            Dimensions: <strong className="text-white">{art.dimensions || 'N/A'}</strong>
                          </span>
                        </div>

                        {/* Attachments as small thumbnails with popup on click */}
                        {files.length > 0 && (
                          <div className="pt-2 border-t border-white/5 space-y-1.5">
                            <span className="text-[9px] font-bold text-[#38bdf8] uppercase tracking-wider block flex items-center gap-1">
                              <Paperclip className="w-3 h-3" /> Attachments ({files.length})
                            </span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {files.map((fileUrl, idx) => {
                                const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                                const fileName = fileUrl.split('/').pop() || `Attachment ${idx + 1}`;

                                return (
                                  <div
                                    key={idx}
                                    onClick={() =>
                                      setSpatialDrawingModal({
                                        title: `${art.artworkName} - Attachment #${idx + 1}`,
                                        url: fileUrl,
                                        type: isPdf ? 'PDF' : 'IMAGE',
                                      })
                                    }
                                    className="relative w-16 h-16 bg-[#232334] rounded-xl overflow-hidden border border-white/10 hover:border-[#38bdf8] transition-all cursor-pointer group shrink-0 flex items-center justify-center p-1"
                                    title={fileName}
                                  >
                                    {isPdf ? (
                                      <div className="flex flex-col items-center justify-center text-center p-1">
                                        <FileText className="w-5 h-5 text-emerald-400" />
                                        <span className="text-[8px] font-bold text-white truncate max-w-[50px] mt-0.5">
                                          PDF
                                        </span>
                                      </div>
                                    ) : (
                                      <img
                                        src={fileUrl}
                                        alt={`${art.artworkName} #${idx + 1}`}
                                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                                      />
                                    )}
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Maximize2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* UPLOAD FACILITY FOR ARTIST DOCUMENTS (PDF, EXCEL, WORD, IMAGES) */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#38bdf8]" /> Upload Documents (PDF, Excel, Word, Images)
              </span>
              {canEditProgrammingCards && (
                <label className="bg-[#1c1c2a] hover:bg-[#2c2c40] text-[#38bdf8] border border-[#38bdf8]/30 font-bold text-[11px] px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5" /> Select Files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Document Attachments List */}
            {uploadedFiles.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#1c1c2a] border border-white/5 text-center text-[#8a8d9b] text-xs space-y-1">
                <p className="font-semibold text-slate-300">No reference documents attached</p>
                <p className="text-[10px] text-[#8a8d9b]">
                  {canEditProgrammingCards
                    ? 'Use the "Select Files" button to attach artist reference riders, projection specs, or documents.'
                    : 'Programming Team can upload reference documents for artist.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {uploadedFiles.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between text-xs hover:border-[#38bdf8]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {doc.type === 'pdf' && <FileText className="w-4 h-4 text-rose-400 shrink-0" />}
                      {doc.type === 'excel' && <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {doc.type === 'word' && <FileCode className="w-4 h-4 text-blue-400 shrink-0" />}
                      {doc.type === 'image' && <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />}

                      <div className="overflow-hidden">
                        <span className="font-bold text-white truncate block text-[11px]">{doc.name}</span>
                        <span className="text-[9px] text-[#8a8d9b]">{doc.size} • {doc.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={doc.url}
                        download={doc.name}
                        className="p-1 rounded-lg bg-[#232334] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-slate-950 transition-all cursor-pointer"
                        title="Download document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {canEditProgrammingCards && (
                        <button
                          onClick={() => handleRemoveFile(doc.id)}
                          className="p-1 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ROW 2: CARD #3 (LONG CARD WITH SEPARATING LINE IN THE MIDDLE TO SHOW BOTH HEADINGS) */}
      <div className="p-6 rounded-3xl bg-[#232334] border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8b5cf6]" /> Curatorial Team & Programming Team (Artist POC)
          </h2>
          {!canEditProgrammingCards && (
            <span className="text-[10px] font-mono text-[#8a8d9b] bg-[#1c1c2a] px-2.5 py-1 rounded-lg border border-white/5">
              View Only Mode
            </span>
          )}
        </div>

        {/* 4-COLUMN LAYOUT FOR TEAMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* 1. CURATORIAL TEAM */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#1c1c2a]/60 border border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-[#a855f7] uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#a855f7]" /> Curator
              </h3>
              {canEditProgrammingCards && (
                <button
                  onClick={openCuratorModal}
                  className="bg-[#a855f7]/10 hover:bg-[#a855f7] hover:text-white text-[#a855f7] font-bold text-[10px] px-2 py-0.5 rounded-lg border border-[#a855f7]/30 transition-all shadow-sm"
                >
                  + Edit
                </button>
              )}
            </div>

            {artistData.curatorAssignments?.length === 0 ? (
              <p className="text-xs text-[#8a8d9b] py-3 text-center bg-[#1c1c2a] rounded-xl border border-white/5">
                No curator assigned yet.
              </p>
            ) : (
              <div className="space-y-2">
                {artistData.curatorAssignments.map((ca: any) => (
                  <div key={ca.id} className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5 flex items-center gap-2.5 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#a855f7] font-extrabold flex items-center justify-center shrink-0">
                      {ca.curator?.name?.charAt(0) || 'C'}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-extrabold text-white text-xs truncate">{ca.curator?.name}</h4>
                      <p className="text-[10px] text-[#8a8d9b] truncate">{ca.curator?.organisation || 'Lead Curator'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. PROGRAMMING TEAM */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#1c1c2a]/60 border border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-[#6366f1] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#6366f1]" /> Programming Team
              </h3>
              {canEditProgrammingCards && (
                <button
                  onClick={openProgrammingModal}
                  className="bg-[#6366f1]/10 hover:bg-[#6366f1] hover:text-white text-[#6366f1] font-bold text-[10px] px-2 py-0.5 rounded-lg border border-[#6366f1]/30 transition-all shadow-sm"
                >
                  + Edit
                </button>
              )}
            </div>

            {artistData.programmingAssignments?.length === 0 ? (
              <p className="text-xs text-[#8a8d9b] py-3 text-center bg-[#1c1c2a] rounded-xl border border-white/5">
                No Programming staff assigned yet.
              </p>
            ) : (
              <div className="space-y-2">
                {artistData.programmingAssignments.map((pa: any) => (
                  <div key={pa.id} className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5 flex items-center gap-2.5 text-xs">
                    {pa.programmingPerson?.photo ? (
                      <img src={pa.programmingPerson.photo} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#6366f1] font-extrabold flex items-center justify-center shrink-0">
                        {pa.programmingPerson?.name?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-extrabold text-white text-xs truncate">{pa.programmingPerson?.name}</h4>
                      <p className="text-[10px] text-[#8a8d9b] truncate">{pa.programmingPerson?.role || 'Programming'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. PRODUCTION TEAM */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#1c1c2a]/60 border border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400" /> Production Team
              </h3>
              {canEditProgrammingCards && (
                <button
                  onClick={openProductionModal}
                  className="bg-purple-500/10 hover:bg-purple-500 hover:text-white text-purple-300 font-bold text-[10px] px-2 py-0.5 rounded-lg border border-purple-500/30 transition-all shadow-sm"
                >
                  + Edit
                </button>
              )}
            </div>

            {artistData.productionAssignments?.length === 0 ? (
              <p className="text-xs text-[#8a8d9b] py-3 text-center bg-[#1c1c2a] rounded-xl border border-white/5">
                No Production team assigned yet.
              </p>
            ) : (
              <div className="space-y-2">
                {artistData.productionAssignments.map((pa: any) => (
                  <div key={pa.id} className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5 flex items-center gap-2.5 text-xs">
                    {pa.productionPerson?.photo ? (
                      <img src={pa.productionPerson.photo} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold flex items-center justify-center shrink-0">
                        {pa.productionPerson?.name?.charAt(0) || 'PR'}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-extrabold text-white text-xs truncate">{pa.productionPerson?.name}</h4>
                      <p className="text-[10px] text-[#8a8d9b] truncate">{pa.productionPerson?.role || 'Production'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. SPATIAL DESIGNERS */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#1c1c2a]/60 border border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> Spatial Designers
              </h3>
              {canEditProgrammingCards && (
                <button
                  onClick={openSpatialModal}
                  className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-lg border border-emerald-500/30 transition-all shadow-sm"
                >
                  + Edit
                </button>
              )}
            </div>

            {artistData.spatialAssignments?.length === 0 ? (
              <p className="text-xs text-[#8a8d9b] py-3 text-center bg-[#1c1c2a] rounded-xl border border-white/5">
                No Spatial Designer assigned yet.
              </p>
            ) : (
              <div className="space-y-2">
                {artistData.spatialAssignments.map((sa: any) => (
                  <div key={sa.id} className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5 flex items-center gap-2.5 text-xs">
                    {sa.spatialDesigner?.photo ? (
                      <img src={sa.spatialDesigner.photo} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold flex items-center justify-center shrink-0">
                        {sa.spatialDesigner?.name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-extrabold text-white text-xs truncate">{sa.spatialDesigner?.name}</h4>
                      <p className="text-[10px] text-[#8a8d9b] truncate">{sa.spatialDesigner?.role || 'Spatial Designer'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ROW 3: ALLOTMENT CARDS & TECHNICAL SPECIFICATIONS */}
      <div className="space-y-6">

        {/* Dynamic Card Ordering:
            - When accessed by Production / Programming Team (or Super Admin): PRODUCTION ALLOTMENT is placed directly below Card #3 (Curatorial & Programming Card), followed by Technical Stock Allotment.
            - When accessed by Technical Team & Inventory: Technical Stock Allotment is placed directly below Card #3.
        */}

        {isPureTechnicalOrInventory ? (
          <>
            {/* TECHNICAL STOCK ALLOTMENT CARD */}
            <div className="p-6 rounded-3xl bg-[#232334] border border-emerald-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-[#10b981]" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    Technical Stock Allotment ({technicalAllocations.length})
                  </h2>
                </div>
                {canAssignTechnicalAllotment && (
                  <button
                    onClick={() => openAssignModal('TECHNICAL')}
                    className="bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Assign Technical Item
                  </button>
                )}
              </div>

              {technicalAllocations.length === 0 ? (
                <p className="text-xs text-[#8a8d9b] py-3 text-center bg-[#1c1c2a] rounded-xl border border-white/5">
                  No technical stock equipment allocated to this artist yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {technicalAllocations.map((alloc: any) => (
                    <div
                      key={alloc.id}
                      className="px-3.5 py-2 rounded-xl bg-[#1c1c2a] hover:bg-[#202030] border border-white/5 flex items-center justify-between gap-3 text-xs transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                        <span className="font-mono font-extrabold text-[#38bdf8] text-[11px] bg-[#38bdf8]/10 px-2 py-0.5 rounded-lg border border-[#38bdf8]/20 shrink-0">
                          {alloc.inventoryItem?.safCode}
                        </span>
                        <span className="font-extrabold text-white text-xs truncate">
                          {alloc.inventoryItem?.element}
                        </span>
                        <span className="text-[#8a8d9b] text-[11px] hidden md:flex items-center gap-1.5 shrink-0 truncate border-l border-white/10 pl-2.5">
                          <span>Cat: <strong className="text-white/80 font-medium">{alloc.inventoryItem?.inventoryCategory}</strong></span>
                          <span className="text-white/20">•</span>
                          <span>Dept: <strong className="text-white/80 font-medium">{alloc.department}</strong></span>
                          {alloc.status && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="text-emerald-400 font-semibold">{alloc.status}</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-2 text-right">
                          <span className="font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {alloc.issuedQuantity} Issued
                          </span>
                        </div>

                        {canManageTechnicalInventory && (
                          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                            <button
                              onClick={() => openReallocateModal(alloc)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Reallocate stock item"
                            >
                              <RefreshCw className="w-3 h-3" /> Reallocate
                            </button>
                            <button
                              onClick={() => openRemoveAllocModal(alloc)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Remove allocation"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PRODUCTION ALLOTMENT CARD */}
            <div className="p-6 rounded-3xl bg-[#232334] border border-amber-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    Production Allotment ({productionAllocations.length})
                  </h2>
                </div>
                {canAssignProductionAllotment && (
                  <button
                    onClick={() => openAssignModal('PRODUCTION')}
                    className="bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Assign Production Item
                  </button>
                )}
              </div>

              {productionAllocations.length === 0 ? (
                <p className="text-xs text-[#8a8d9b] py-3 text-center bg-[#1c1c2a] rounded-xl border border-white/5">
                  No production equipment allocated to this artist yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {productionAllocations.map((alloc: any) => (
                    <div
                      key={alloc.id}
                      className="px-3.5 py-2 rounded-xl bg-[#1c1c2a] hover:bg-[#202030] border border-amber-500/20 flex items-center justify-between gap-3 text-xs transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                        <span className="font-mono font-extrabold text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 shrink-0">
                          {alloc.inventoryItem?.safCode || 'PROD'}
                        </span>
                        <span className="font-extrabold text-white text-xs truncate">
                          {alloc.inventoryItem?.element}
                        </span>
                        <span className="text-[#8a8d9b] text-[11px] hidden md:flex items-center gap-1.5 shrink-0 truncate border-l border-white/10 pl-2.5">
                          <span>Cat: <strong className="text-white/80 font-medium">{alloc.inventoryItem?.inventoryCategory || 'Production'}</strong></span>
                          <span className="text-white/20">•</span>
                          <span>SubCat: <strong className="text-white/80 font-medium">{alloc.inventoryItem?.subCategory || 'General'}</strong></span>
                          {alloc.artwork?.artworkName && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="text-amber-300 font-semibold">Artwork: {alloc.artwork.artworkName}</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-2 text-right">
                          <span className="font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            {alloc.issuedQuantity} Issued
                          </span>
                        </div>

                        {canAssignProductionAllotment && (
                          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                            <button
                              onClick={() => openReallocateModal(alloc)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Reallocate stock item"
                            >
                              <RefreshCw className="w-3 h-3" /> Reallocate
                            </button>
                            <button
                              onClick={() => openRemoveAllocModal(alloc)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Remove allocation"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* PRODUCTION ALLOTMENT CARD */}
            <div className="p-6 rounded-3xl bg-[#232334] border border-amber-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    Production Allotment ({productionAllocations.length})
                  </h2>
                </div>
                {canAssignProductionAllotment && (
                  <button
                    onClick={() => openAssignModal('PRODUCTION')}
                    className="bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Assign Production Item
                  </button>
                )}
              </div>

              {productionAllocations.length === 0 ? (
                <p className="text-xs text-[#8a8d9b] py-3 text-center bg-[#1c1c2a] rounded-xl border border-white/5">
                  No production equipment allocated to this artist yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {productionAllocations.map((alloc: any) => (
                    <div
                      key={alloc.id}
                      className="px-3.5 py-2 rounded-xl bg-[#1c1c2a] hover:bg-[#202030] border border-amber-500/20 flex items-center justify-between gap-3 text-xs transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                        <span className="font-mono font-extrabold text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 shrink-0">
                          {alloc.inventoryItem?.safCode || 'PROD'}
                        </span>
                        <span className="font-extrabold text-white text-xs truncate">
                          {alloc.inventoryItem?.element}
                        </span>
                        <span className="text-[#8a8d9b] text-[11px] hidden md:flex items-center gap-1.5 shrink-0 truncate border-l border-white/10 pl-2.5">
                          <span>Cat: <strong className="text-white/80 font-medium">{alloc.inventoryItem?.inventoryCategory || 'Production'}</strong></span>
                          <span className="text-white/20">•</span>
                          <span>SubCat: <strong className="text-white/80 font-medium">{alloc.inventoryItem?.subCategory || 'General'}</strong></span>
                          {alloc.artwork?.artworkName && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="text-amber-300 font-semibold">Artwork: {alloc.artwork.artworkName}</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-2 text-right">
                          <span className="font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            {alloc.issuedQuantity} Issued
                          </span>
                        </div>

                        {canAssignProductionAllotment && (
                          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                            <button
                              onClick={() => openReallocateModal(alloc)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Reallocate stock item"
                            >
                              <RefreshCw className="w-3 h-3" /> Reallocate
                            </button>
                            <button
                              onClick={() => openRemoveAllocModal(alloc)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Remove allocation"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TECHNICAL STOCK ALLOTMENT CARD */}
            <div className="p-6 rounded-3xl bg-[#232334] border border-emerald-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-[#10b981]" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    Technical Stock Allotment ({technicalAllocations.length})
                  </h2>
                </div>
                {canAssignTechnicalAllotment && (
                  <button
                    onClick={() => openAssignModal('TECHNICAL')}
                    className="bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Assign Technical Item
                  </button>
                )}
              </div>

              {technicalAllocations.length === 0 ? (
                <p className="text-xs text-[#8a8d9b] py-3 text-center bg-[#1c1c2a] rounded-xl border border-white/5">
                  No technical stock equipment allocated to this artist yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {technicalAllocations.map((alloc: any) => (
                    <div
                      key={alloc.id}
                      className="px-3.5 py-2 rounded-xl bg-[#1c1c2a] hover:bg-[#202030] border border-white/5 flex items-center justify-between gap-3 text-xs transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                        <span className="font-mono font-extrabold text-[#38bdf8] text-[11px] bg-[#38bdf8]/10 px-2 py-0.5 rounded-lg border border-[#38bdf8]/20 shrink-0">
                          {alloc.inventoryItem?.safCode}
                        </span>
                        <span className="font-extrabold text-white text-xs truncate">
                          {alloc.inventoryItem?.element}
                        </span>
                        <span className="text-[#8a8d9b] text-[11px] hidden md:flex items-center gap-1.5 shrink-0 truncate border-l border-white/10 pl-2.5">
                          <span>Cat: <strong className="text-white/80 font-medium">{alloc.inventoryItem?.inventoryCategory}</strong></span>
                          <span className="text-white/20">•</span>
                          <span>Dept: <strong className="text-white/80 font-medium">{alloc.department}</strong></span>
                          {alloc.status && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="text-emerald-400 font-semibold">{alloc.status}</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-2 text-right">
                          <span className="font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {alloc.issuedQuantity} Issued
                          </span>
                        </div>

                        {canManageTechnicalInventory && (
                          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                            <button
                              onClick={() => openReallocateModal(alloc)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Reallocate stock item"
                            >
                              <RefreshCw className="w-3 h-3" /> Reallocate
                            </button>
                            <button
                              onClick={() => openRemoveAllocModal(alloc)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Remove allocation"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* SECTION 7: TECHNICAL SPECIFICATIONS & LIVE INVENTORY SEARCH-TO-ASSIGN (ONLY VISIBLE TO INVENTORY MANAGER, INVENTORY HEAD & SUPER ADMIN) */}
        {canViewTechnicalAssignmentPallet && (
          <div className="p-6 rounded-3xl bg-[#232334] border-2 border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-400" /> Technical Specifications & Live Stock Assignment
                </h2>
                <p className="text-xs text-[#8a8d9b] mt-0.5">
                  Search Master Inventory Pool below. Selected items immediately assign to this artist and update Master Inventory Pool records.
                </p>
              </div>
            </div>

            {/* SEARCH & CATEGORY FILTER TOOLBAR */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* LIVE SEARCH BOX */}
                <div className="md:col-span-6 relative">
                  <div className="flex items-center gap-2 bg-[#1c1c2a] border-2 border-amber-500/60 rounded-xl px-4 py-2.5 focus-within:border-amber-400 shadow-xl">
                    <Search className="w-4 h-4 text-amber-400 shrink-0" />
                    <input
                      type="text"
                      value={techSearchQuery}
                      onChange={(e) => setTechSearchQuery(e.target.value)}
                      placeholder="Search by Sub Category, Element, Brand, Model, or SAF Code..."
                      className="bg-transparent text-xs text-white placeholder-[#8a8d9b] focus:outline-none w-full font-semibold"
                    />
                    {techSearchQuery && (
                      <button onClick={() => setTechSearchQuery('')} className="text-[#8a8d9b] hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* CATEGORY FILTER DROPDOWN */}
                <div className="md:col-span-3">
                  <select
                    value={selectedTechCategory}
                    onChange={(e) => setSelectedTechCategory(e.target.value)}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                  >
                    <option value="ALL">📁 All Categories ({inventoryItems.length})</option>
                    {availableTechCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUB-CATEGORY FILTER DROPDOWN */}
                <div className="md:col-span-3">
                  <select
                    value={selectedTechSubCategory}
                    onChange={(e) => setSelectedTechSubCategory(e.target.value)}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                  >
                    <option value="ALL">🏷️ All Sub Categories</option>
                    {availableTechSubCategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RESULTS COUNTER & SUMMARY */}
              <div className="flex items-center justify-between text-xs text-[#8a8d9b] pt-1">
                <span>
                  Found <strong className="text-amber-400">{searchResults.length}</strong> matching items in Master Pool
                </span>
                {(selectedTechCategory !== 'ALL' || selectedTechSubCategory !== 'ALL' || techSearchQuery) && (
                  <button
                    onClick={() => {
                      setTechSearchQuery('');
                      setSelectedTechCategory('ALL');
                      setSelectedTechSubCategory('ALL');
                    }}
                    className="text-xs text-[#38bdf8] hover:underline font-bold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* SEARCH RESULTS ITEMS LIST */}
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <div className="p-8 text-center bg-[#1c1c2a] rounded-2xl border border-white/5 text-[#8a8d9b] text-xs">
                    No inventory items match your search query "{techSearchQuery}".
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-amber-500/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-[#38bdf8] bg-[#232334] px-2 py-0.5 rounded-lg border border-white/10">
                            {item.safCode}
                          </span>
                          <span className="font-bold text-white text-sm">{item.element}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                            {item.subCategory || item.inventoryCategory || 'General'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8a8d9b] mt-1.5 flex items-center gap-x-2.5 gap-y-0.5 flex-wrap">
                          <span>Brand: <strong className="text-slate-200">{item.brandProject || item.brand || 'Na'}</strong></span>
                          <span>•</span>
                          <span>Model: <strong className="text-slate-200">{item.model || 'Na'}</strong></span>
                          <span>•</span>
                          <span>Size/LWH: <strong className="text-slate-200">{item.sizeLwh || 'Na'}</strong></span>
                          <span>•</span>
                          <span>Unit: <strong className="text-slate-200">{item.uom || 'Na'}</strong></span>
                          <span>•</span>
                          <span>Available: <strong className="text-[#10b981]">{item.availableQuantity ?? 0}</strong> / Total: {item.totalQuantity ?? 0}</span>
                        </div>
                      </div>

                      {canManageTechnicalInventory && (
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={1}
                            max={item.availableQuantity || 1}
                            value={assignQuantities[item.id] || 1}
                            onChange={(e) =>
                              setAssignQuantities({
                                ...assignQuantities,
                                [item.id]: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-14 bg-[#232334] border border-white/10 rounded-xl px-2 py-1.5 text-center text-xs text-white font-bold"
                          />
                          <button
                            disabled={item.availableQuantity <= 0 || assigningItemId === item.id}
                            onClick={() => handleQuickAssignStock(item)}
                            className={`font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                              item.availableQuantity <= 0
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                            }`}
                          >
                            {assigningItemId === item.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            {item.availableQuantity <= 0 ? 'Out of Stock' : 'Quick Assign'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* RENT | PURCHASE CARD */}
      <div className="p-6 rounded-3xl bg-[#232334] border border-white/10 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Rent | Purchase List
              </h2>
              <p className="text-[10px] text-[#8a8d9b] mt-0.5">
                Specialized items, custom procurement requests, rentals, and purchase links for this artist
              </p>
            </div>
          </div>

          {canManageTechnicalInventory ? (
            <button
              onClick={() => setRentPurchaseModalOpen(true)}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rent / Purchase Item
            </button>
          ) : (
            <span className="text-[10px] font-mono text-[#8a8d9b] bg-[#1c1c2a] px-2.5 py-1 rounded-lg border border-white/5">
              View Only ({userRole})
            </span>
          )}
        </div>

        {/* ITEMS LIST TABLE / GRID */}
        {(() => {
          const purchaseItems = (artistData.purchaseRequests || []).map((p: any) => ({
            ...p,
            _isRental: false,
            itemType: p.itemType || 'Purchase',
          }));
          const rentalItems = (artistData.rentalRecords || []).map((r: any) => ({
            ...r,
            _isRental: true,
            itemType: 'Rent',
            purchaseLink: r.rentalLink,
          }));
          const allProcurementItems = [...purchaseItems, ...rentalItems];

          if (allProcurementItems.length === 0) {
            return (
              <div className="p-8 text-center bg-[#1c1c2a] rounded-2xl border border-white/5 text-[#8a8d9b] text-xs space-y-2">
                <p>No Rent or Purchase items added yet for this artist.</p>
                {canManageTechnicalInventory && (
                  <button
                    onClick={() => setRentPurchaseModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sky-400 hover:underline font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Rent / Purchase Item Now
                  </button>
                )}
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-extrabold text-[#8a8d9b] uppercase tracking-wider bg-[#1c1c2a]">
                    <th className="py-2.5 px-3 rounded-l-xl">Type</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Brand</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3">Purchase / Rental Link</th>
                    {canManageTechnicalInventory && <th className="py-2.5 px-3 text-right rounded-r-xl">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allProcurementItems.map((item: any) => {
                    const isRental = item._isRental || item.itemType === 'Rent';
                    const linkUrl = item.purchaseLink || item.rentalLink;

                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* TYPE BADGE */}
                        <td className="py-3 px-3">
                          <span
                            className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${
                              isRental
                                ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
                                : 'bg-sky-950/80 text-sky-300 border-sky-800/80'
                            }`}
                          >
                            {isRental ? '⚡ Rent' : '🛒 Purchase'}
                          </span>
                        </td>

                        {/* ITEM NAME */}
                        <td className="py-3 px-3 font-bold text-white max-w-[200px] truncate" title={item.itemName}>
                          {item.itemName}
                        </td>

                        {/* BRAND */}
                        <td className="py-3 px-3 text-[#cbd5e1] font-medium">
                          {item.brand || 'N/A'}
                        </td>

                        {/* MODEL */}
                        <td className="py-3 px-3 text-[#cbd5e1] font-medium">
                          {item.model || 'N/A'}
                        </td>

                        {/* QTY */}
                        <td className="py-3 px-3 text-center font-extrabold text-amber-400">
                          {item.quantity || 1}
                        </td>

                        {/* PURCHASE / RENTAL LINK */}
                        <td className="py-3 px-3">
                          {linkUrl ? (
                            <a
                              href={linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 hover:underline font-bold max-w-[180px] truncate"
                              title={linkUrl}
                            >
                              <span>Open Link</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-[#8a8d9b] italic">No link provided</span>
                          )}
                        </td>

                        {/* ACTIONS FOR AUTHORIZED ROLES */}
                        {canManageTechnicalInventory && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  setEditRentPurchaseModal({
                                    id: item.id,
                                    itemType: isRental ? 'Rent' : 'Purchase',
                                    _isRental: isRental,
                                    itemName: item.itemName || '',
                                    brand: item.brand || '',
                                    model: item.model || '',
                                    quantity: item.quantity || 1,
                                    purchaseLink: linkUrl || '',
                                    notes: item.notes || '',
                                  })
                                }
                                className="p-1.5 rounded-lg bg-[#1c1c2a] text-[#8a8d9b] hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                                title="Edit Item"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteRentPurchaseModal({
                                    id: item.id,
                                    itemName: item.itemName,
                                    _isRental: isRental,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-[#1c1c2a] text-[#8a8d9b] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* ALL MODALS (EDIT ARTIST, DELETE ARTIST, REGISTER ARTWORK, CURATORS, PROGRAMMING, VENUE & ROOM, RENT/PURCHASE) */}

      {/* ADD RENT / PURCHASE ITEM MODAL */}
      {rentPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-sky-400" /> Add Rent / Purchase Item
              </h3>
              <button onClick={() => setRentPurchaseModalOpen(false)} className="text-[#8a8d9b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRentPurchaseItem} className="space-y-4 text-xs">
              {/* ITEM TYPE TOGGLE */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Item Category / Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRentPurchaseForm({ ...rentPurchaseForm, itemType: 'Purchase' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      rentPurchaseForm.itemType === 'Purchase'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                        : 'bg-[#1c1c2a] text-slate-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    🛒 Purchase Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setRentPurchaseForm({ ...rentPurchaseForm, itemType: 'Rent' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      rentPurchaseForm.itemType === 'Rent'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : 'bg-[#1c1c2a] text-slate-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    ⚡ Rental Item
                  </button>
                </div>
              </div>

              {/* ITEM NAME */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">
                  Item Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultra Short Throw 4K Laser Projector"
                  value={rentPurchaseForm.itemName}
                  onChange={(e) => setRentPurchaseForm({ ...rentPurchaseForm, itemName: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* BRAND, MODEL & QTY */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Panasonic"
                    value={rentPurchaseForm.brand}
                    onChange={(e) => setRentPurchaseForm({ ...rentPurchaseForm, brand: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Model</label>
                  <input
                    type="text"
                    placeholder="e.g. PT-MZ880"
                    value={rentPurchaseForm.model}
                    onChange={(e) => setRentPurchaseForm({ ...rentPurchaseForm, model: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={rentPurchaseForm.quantity}
                    onChange={(e) => setRentPurchaseForm({ ...rentPurchaseForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* PURCHASE / RENTAL LINK */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Purchase / Rental Link (URL)</label>
                <input
                  type="text"
                  placeholder="https://vendor.com/item-specifications"
                  value={rentPurchaseForm.purchaseLink}
                  onChange={(e) => setRentPurchaseForm({ ...rentPurchaseForm, purchaseLink: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* NOTES */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Notes / Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Additional specs, vendor info or approval notes..."
                  value={rentPurchaseForm.notes}
                  onChange={(e) => setRentPurchaseForm({ ...rentPurchaseForm, notes: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRentPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRentPurchase}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md"
                >
                  {submittingRentPurchase ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RENT / PURCHASE ITEM MODAL */}
      {editRentPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" /> Edit Rent / Purchase Item
              </h3>
              <button onClick={() => setEditRentPurchaseModal(null)} className="text-[#8a8d9b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRentPurchaseItem} className="space-y-4 text-xs">
              {/* ITEM TYPE TOGGLE */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Item Category / Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRentPurchaseModal({ ...editRentPurchaseModal, itemType: 'Purchase' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      editRentPurchaseModal.itemType === 'Purchase'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                        : 'bg-[#1c1c2a] text-slate-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    🛒 Purchase Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRentPurchaseModal({ ...editRentPurchaseModal, itemType: 'Rent' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      editRentPurchaseModal.itemType === 'Rent'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : 'bg-[#1c1c2a] text-slate-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    ⚡ Rental Item
                  </button>
                </div>
              </div>

              {/* ITEM NAME */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={editRentPurchaseModal.itemName}
                  onChange={(e) => setEditRentPurchaseModal({ ...editRentPurchaseModal, itemName: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* BRAND, MODEL & QTY */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Brand</label>
                  <input
                    type="text"
                    value={editRentPurchaseModal.brand}
                    onChange={(e) => setEditRentPurchaseModal({ ...editRentPurchaseModal, brand: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Model</label>
                  <input
                    type="text"
                    value={editRentPurchaseModal.model}
                    onChange={(e) => setEditRentPurchaseModal({ ...editRentPurchaseModal, model: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editRentPurchaseModal.quantity}
                    onChange={(e) => setEditRentPurchaseModal({ ...editRentPurchaseModal, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* PURCHASE / RENTAL LINK */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Purchase / Rental Link (URL)</label>
                <input
                  type="text"
                  value={editRentPurchaseModal.purchaseLink}
                  onChange={(e) => setEditRentPurchaseModal({ ...editRentPurchaseModal, purchaseLink: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* NOTES */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Notes / Specifications</label>
                <textarea
                  rows={2}
                  value={editRentPurchaseModal.notes}
                  onChange={(e) => setEditRentPurchaseModal({ ...editRentPurchaseModal, notes: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditRentPurchaseModal(null)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRentPurchase}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md"
                >
                  {submittingRentPurchase ? 'Updating...' : 'Update Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE RENT / PURCHASE ITEM MODAL */}
      {deleteRentPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-rose-800/60 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Delete Procurement Item</h3>
              <p className="text-xs text-[#8a8d9b] mt-1">
                Are you sure you want to delete{' '}
                <strong className="text-white">"{deleteRentPurchaseModal.itemName}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setDeleteRentPurchaseModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRentPurchaseItem}
                disabled={deletingRentPurchase}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md"
              >
                {deletingRentPurchase ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ARTIST PROFILE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Edit Artist Profile</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-[#8a8d9b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
                {editError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Artist Name *</label>
                <input
                  type="text"
                  value={editFormData.artistName}
                  onChange={(e) => setEditFormData({ ...editFormData, artistName: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Country</label>
                  <input
                    type="text"
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Website</label>
                <input
                  type="text"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Biography</label>
                <textarea
                  rows={3}
                  value={editFormData.biography}
                  onChange={(e) => setEditFormData({ ...editFormData, biography: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateArtist}
                disabled={submittingEdit}
                className="px-4 py-2 rounded-xl bg-[#8b5cf6] text-white font-extrabold text-xs shadow-md"
              >
                {submittingEdit ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-rose-800/60 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-extrabold text-white">Delete Artist Profile?</h3>
            </div>
            <p className="text-xs text-[#8a8d9b]">
              Are you sure you want to delete <strong className="text-white">{artistData.artistName}</strong>? All associated artwork records and allocations will be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteArtist}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-md"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER NEW ARTWORK MODAL */}
      {artworkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Register New Artwork</h3>
              <button onClick={() => setArtworkModalOpen(false)} className="text-[#8a8d9b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Artwork Title *</label>
                <input
                  type="text"
                  value={newArtwork.artworkName}
                  onChange={(e) => setNewArtwork({ ...newArtwork, artworkName: e.target.value })}
                  placeholder="e.g. Echoes of the Digital Void"
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Installation Type</label>
                  <input
                    type="text"
                    value={newArtwork.installationType}
                    onChange={(e) => setNewArtwork({ ...newArtwork, installationType: e.target.value })}
                    placeholder="e.g. Multi-projection / Sound"
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Medium</label>
                  <input
                    type="text"
                    value={newArtwork.medium}
                    onChange={(e) => setNewArtwork({ ...newArtwork, medium: e.target.value })}
                    placeholder="e.g. Laser & Generative Code"
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Dimensions</label>
                <input
                  type="text"
                  value={newArtwork.dimensions}
                  onChange={(e) => setNewArtwork({ ...newArtwork, dimensions: e.target.value })}
                  placeholder="e.g. 12m x 8m x 4.5m"
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newArtwork.description}
                  onChange={(e) => setNewArtwork({ ...newArtwork, description: e.target.value })}
                  placeholder="Provide technical description and concept..."
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setArtworkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateArtwork}
                className="px-4 py-2 rounded-xl bg-[#a855f7] text-white font-extrabold text-xs shadow-md"
              >
                Register Artwork
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CURATOR ASSIGNMENT MODAL */}
      {curatorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Assign Curators</h3>
              <button onClick={() => setCuratorModalOpen(false)} className="text-[#8a8d9b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allCurators.map((cur) => (
                <label key={cur.id} className="p-3 rounded-xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between text-xs cursor-pointer hover:border-[#a855f7]/40">
                  <div>
                    <span className="font-bold text-white block">{cur.name}</span>
                    <span className="text-[10px] text-[#8a8d9b]">{cur.organisation || 'Curatorial Team'}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedCuratorIds.includes(cur.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCuratorIds([...selectedCuratorIds, cur.id]);
                      else setSelectedCuratorIds(selectedCuratorIds.filter((cid) => cid !== cur.id));
                    }}
                    className="w-4 h-4 accent-[#a855f7]"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button onClick={() => setCuratorModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleSaveCurators} disabled={savingAssignment} className="px-4 py-2 rounded-xl bg-[#a855f7] text-white font-extrabold text-xs shadow-md">
                {savingAssignment ? 'Saving...' : 'Save Curator Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROGRAMMING POC ASSIGNMENT MODAL */}
      {programmingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Assign Programming POC</h3>
              <button onClick={() => setProgrammingModalOpen(false)} className="text-[#8a8d9b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allProgrammingPeople.map((pp) => (
                <label key={pp.id} className="p-3 rounded-xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between text-xs cursor-pointer hover:border-[#6366f1]/40">
                  <div>
                    <span className="font-bold text-white block">{pp.name}</span>
                    <span className="text-[10px] text-[#8a8d9b]">{pp.role || 'Programming POC'}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedProgrammingIds.includes(pp.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedProgrammingIds([...selectedProgrammingIds, pp.id]);
                      else setSelectedProgrammingIds(selectedProgrammingIds.filter((pid) => pid !== pp.id));
                    }}
                    className="w-4 h-4 accent-[#6366f1]"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button onClick={() => setProgrammingModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleSaveProgramming} disabled={savingAssignment} className="px-4 py-2 rounded-xl bg-[#6366f1] text-white font-extrabold text-xs shadow-md">
                {savingAssignment ? 'Saving...' : 'Save POC Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN PRODUCTION TEAM MODAL */}
      {productionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Assign Production Team</h3>
              <button onClick={() => setProductionModalOpen(false)} className="text-[#8a8d9b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allProductionPeople.map((pr) => (
                <label key={pr.id} className="p-3 rounded-xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between text-xs cursor-pointer hover:border-purple-500/40">
                  <div>
                    <span className="font-bold text-white block">{pr.name}</span>
                    <span className="text-[10px] text-[#8a8d9b]">{pr.role || 'Production'}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedProductionIds.includes(pr.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedProductionIds([...selectedProductionIds, pr.id]);
                      else setSelectedProductionIds(selectedProductionIds.filter((pid) => pid !== pr.id));
                    }}
                    className="w-4 h-4 accent-purple-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button onClick={() => setProductionModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleSaveProduction} disabled={savingAssignment} className="px-4 py-2 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-md">
                {savingAssignment ? 'Saving...' : 'Save Production Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN SPATIAL DESIGNERS MODAL */}
      {spatialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Assign Spatial Designers</h3>
              <button onClick={() => setSpatialModalOpen(false)} className="text-[#8a8d9b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allSpatialDesigners.map((sd) => (
                <label key={sd.id} className="p-3 rounded-xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-500/40">
                  <div>
                    <span className="font-bold text-white block">{sd.name}</span>
                    <span className="text-[10px] text-[#8a8d9b]">{sd.role || 'Spatial Designer'}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedSpatialDesignerIds.includes(sd.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSpatialDesignerIds([...selectedSpatialDesignerIds, sd.id]);
                      else setSelectedSpatialDesignerIds(selectedSpatialDesignerIds.filter((sid) => sid !== sd.id));
                    }}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button onClick={() => setSpatialModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleSaveSpatial} disabled={savingAssignment} className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-md">
                {savingAssignment ? 'Saving...' : 'Save Spatial Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN VENUE & ROOM MODAL */}
      {assignVenueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Assign Venue & Room Spatial Allocation</h3>
              <button onClick={() => setAssignVenueModalOpen(false)} className="text-[#8a8d9b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Primary Venue</label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {availableVenues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.venueName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Select Rooms / Galleries</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-[#1c1c2a] rounded-xl border border-white/10">
                  {availableRooms.length === 0 ? (
                    <p className="text-[11px] text-[#8a8d9b]">No rooms configured for this venue.</p>
                  ) : (
                    availableRooms.map((rm) => (
                      <label key={rm.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#232334] cursor-pointer">
                        <span className="font-bold text-white text-[11px]">Room {rm.roomNumber || rm.roomName}</span>
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(rm.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedRoomIds([...selectedRoomIds, rm.id]);
                            else setSelectedRoomIds(selectedRoomIds.filter((rid) => rid !== rm.id));
                          }}
                          className="w-4 h-4 accent-[#38bdf8]"
                        />
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button onClick={() => setAssignVenueModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleSaveVenueAssignment} disabled={savingAssignment} className="px-4 py-2 rounded-xl bg-[#38bdf8] text-slate-950 font-extrabold text-xs shadow-md">
                {savingAssignment ? 'Saving...' : 'Save Venue Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REALLOCATE & SWAP ALLOCATION MODAL */}
      {reallocateModalOpen && reallocatingAlloc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" /> Reallocate & Equipment Actions
                </h3>
                <p className="text-[11px] text-[#8a8d9b] mt-0.5">
                  Swap with new inventory, return to stock pool, or reassign artist.
                </p>
              </div>
              <button onClick={() => setReallocateModalOpen(false)} className="text-[#8a8d9b] hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#1c1c2a] rounded-2xl border border-white/5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setReallocateMode('SWAP')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center ${
                  reallocateMode === 'SWAP'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-[#8a8d9b] hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Swap Item</span>
              </button>
              <button
                type="button"
                onClick={() => setReallocateMode('RETURN')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center ${
                  reallocateMode === 'RETURN'
                    ? 'bg-rose-600 text-white shadow-md font-black'
                    : 'text-[#8a8d9b] hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Return to Pool</span>
              </button>
              <button
                type="button"
                onClick={() => setReallocateMode('REASSIGN')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center ${
                  reallocateMode === 'REASSIGN'
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                    : 'text-[#8a8d9b] hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Reassign Artist</span>
              </button>
            </div>

            {/* Current Item Card */}
            <div className="p-3 rounded-2xl bg-[#1c1c2a] border border-white/10 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#8a8d9b] uppercase font-bold block">Currently Allocated Item</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs font-bold text-[#38bdf8] bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/60">
                    {reallocatingAlloc.inventoryItem?.safCode || 'ITEM'}
                  </span>
                  <strong className="text-white text-xs">{reallocatingAlloc.inventoryItem?.element}</strong>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg font-bold">
                  {reallocatingAlloc.issuedQuantity} Issued
                </span>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto space-y-3.5 text-xs pr-1">
              {/* 1. SWAP MODE: SEARCH INVENTORY & REQUEST APPROVAL */}
              {reallocateMode === 'SWAP' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-300 block font-bold mb-1.5 flex items-center justify-between">
                      <span>Search Replacement Item in Inventory</span>
                      <span className="text-[10px] text-amber-400 font-normal">Requires Inventory Approval</span>
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={reallocSearchQuery}
                        onChange={(e) => setReallocSearchQuery(e.target.value)}
                        placeholder="Search by code, element name, model, category..."
                        className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white font-medium text-xs focus:border-amber-500 focus:outline-none"
                      />
                      {reallocSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setReallocSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected Replacement Banner */}
                  {selectedReplacementItem && (
                    <div className="p-3 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 flex items-center justify-between gap-2 shadow-lg">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-emerald-400">
                              {selectedReplacementItem.safCode}
                            </span>
                            <span className="text-[10px] text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                              {selectedReplacementItem.availableQuantity} Available
                            </span>
                          </div>
                          <p className="font-extrabold text-white text-xs mt-0.5">{selectedReplacementItem.element}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedReplacementItem(null)}
                        className="text-xs text-rose-400 hover:underline font-bold"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  {/* Search Results List */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto bg-[#1c1c2a]/80 p-2 rounded-2xl border border-white/5">
                    {inventoryItems
                      .filter((item) => {
                        if (item.id === reallocatingAlloc.inventoryItemId) return false;
                        if (item.isFaulty) return false;
                        if (!reallocSearchQuery.trim()) return true;
                        const q = reallocSearchQuery.toLowerCase().trim();
                        return (
                          item.safCode?.toLowerCase().includes(q) ||
                          item.element?.toLowerCase().includes(q) ||
                          item.inventoryCategory?.toLowerCase().includes(q) ||
                          item.model?.toLowerCase().includes(q) ||
                          item.brand?.toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 15)
                      .map((item) => {
                        const isSelected = selectedReplacementItem?.id === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedReplacementItem(item)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-950/60 border-emerald-400 text-white'
                                : 'bg-[#232334] hover:bg-[#2c2c40] border-white/5 text-[#8a8d9b] hover:text-white'
                            }`}
                          >
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[11px] text-[#38bdf8]">{item.safCode}</span>
                                <span className="font-bold text-white text-xs truncate">{item.element}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {item.inventoryCategory} • {item.subCategory || 'General'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800">
                                {item.availableQuantity} Avail
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Quantity & Reason */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[#8a8d9b] block font-bold mb-1">Swap Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedReplacementItem ? selectedReplacementItem.availableQuantity : 999}
                        value={replacementQuantity}
                        onChange={(e) => setReplacementQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[#8a8d9b] block font-bold mb-1">Reason / Notes</label>
                      <input
                        type="text"
                        value={reallocNotes}
                        onChange={(e) => setReallocNotes(e.target.value)}
                        placeholder="e.g. Higher spec required..."
                        className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. RETURN MODE: DIRECT RETURN TO INVENTORY POOL */}
              {reallocateMode === 'RETURN' && (
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <strong className="text-white text-xs">Return Equipment to Master Stock Pool</strong>
                  </div>
                  <p className="text-xs text-[#8a8d9b]">
                    This will immediately release <strong className="text-white">{reallocatingAlloc.issuedQuantity} units</strong> of{' '}
                    <strong className="text-white">{reallocatingAlloc.inventoryItem?.element}</strong> back to the available inventory pool for other artists and spaces.
                  </p>
                </div>
              )}

              {/* 3. REASSIGN MODE: TRANSFER TO ANOTHER ARTIST */}
              {reallocateMode === 'REASSIGN' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[#8a8d9b] block font-bold mb-1">Target Artist</label>
                    <select
                      value={reallocForm.targetArtistId}
                      onChange={(e) => setReallocForm({ ...reallocForm, targetArtistId: e.target.value })}
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      {allArtistsList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.artistName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[#8a8d9b] block font-bold mb-1">Quantity to Reassign</label>
                    <input
                      type="number"
                      min={1}
                      value={reallocForm.newIssuedQuantity}
                      onChange={(e) => setReallocForm({ ...reallocForm, newIssuedQuantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setReallocateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] hover:text-white font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              {reallocateMode === 'SWAP' && (
                <button
                  type="button"
                  onClick={handleSubmitSwapRequest}
                  disabled={isReallocating || !selectedReplacementItem}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReallocating ? 'animate-spin' : ''}`} />
                  {isReallocating ? 'Sending Request...' : 'Submit Swap Request'}
                </button>
              )}

              {reallocateMode === 'RETURN' && (
                <button
                  type="button"
                  onClick={handleDirectReturnToInventory}
                  disabled={isReallocating}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  {isReallocating ? 'Returning...' : 'Confirm Return to Inventory'}
                </button>
              )}

              {reallocateMode === 'REASSIGN' && (
                <button
                  type="button"
                  onClick={handleSaveReallocation}
                  disabled={isReallocating}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isReallocating ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REMOVE ALLOCATION CONFIRMATION MODAL */}
      {removeAllocModalOpen && removingAlloc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-rose-800/60 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-extrabold text-white">Return Stock Item to Master Pool?</h3>
            </div>
            <p className="text-xs text-[#8a8d9b]">
              Are you sure you want to remove allocation of <strong className="text-white">{removingAlloc.inventoryItem?.element} ({removingAlloc.inventoryItem?.safCode})</strong>? Stock quantity ({removingAlloc.issuedQuantity || 1} units) will return to Master Pool.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRemoveAllocModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleRemoveAllocation} disabled={isRemovingAlloc} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-md">
                {isRemovingAlloc ? 'Returning...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPATIAL DRAWING POPUP MODAL (TECHNICAL & PRODUCTION LAYOUT) */}
      {spatialDrawingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-white/10 w-full max-w-4xl rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> {spatialDrawingModal.title}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={spatialDrawingModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                >
                  Open Original <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setSpatialDrawingModal(null)}
                  className="text-[#8a8d9b] hover:text-white p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#1c1c2a] rounded-2xl p-2 flex items-center justify-center border border-white/5">
              {spatialDrawingModal.type === 'PDF' ? (
                <iframe
                  src={spatialDrawingModal.url}
                  className="w-full h-[70vh] rounded-xl border-0"
                  title="Technical Layout PDF Preview"
                />
              ) : (
                <img
                  src={spatialDrawingModal.url}
                  alt="Technical & Production Layout"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* ALLOTMENT ASSIGNMENT MODAL (PRODUCTION ALLOTMENT & TECHNICAL STOCK ALLOTMENT) */}
      {assignItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Package className={`w-4 h-4 ${assignItemModalDepartment === 'PRODUCTION' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  Assign {assignItemModalDepartment === 'PRODUCTION' ? 'Production Allotment' : 'Technical Stock Allotment'} Item
                </h3>
                <button onClick={() => setAssignItemModalOpen(false)} className="text-[#8a8d9b] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Item search & select */}
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">
                    Search & Select Master Pool Item ({assignItemModalDepartment === 'PRODUCTION' ? 'PRODUCTION - EXCLUDING TECHNICAL' : 'TECHNICAL'}) *
                  </label>
                  <input
                    type="text"
                    value={assignModalSearch}
                    onChange={(e) => setAssignModalSearch(e.target.value)}
                    placeholder="Search item by SAF code, element, subcategory..."
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold mb-2 focus:outline-none focus:border-amber-400"
                  />

                  {/* Scrollable Master Pool Stock Items List with Qty & Allocate Button */}
                  <div className="mb-3 max-h-60 overflow-y-auto bg-[#161622] border border-white/10 rounded-2xl p-2 space-y-2 shadow-inner custom-scrollbar">
                    <div className="text-[10px] uppercase font-black tracking-wider text-[#8a8d9b] px-2 py-1 flex items-center justify-between border-b border-white/5 mb-1">
                      <span>Stock Items Pool ({filteredModalStockItems.length} available)</span>
                      <span className="text-amber-400">Set Qty &amp; Allocate</span>
                    </div>
                    {filteredModalStockItems.length === 0 ? (
                      <div className="p-4 text-center text-[#8a8d9b] italic text-xs">
                        No matching items found in {assignItemModalDepartment.toLowerCase()} pool.
                      </div>
                    ) : (
                      filteredModalStockItems.map((item) => {
                        const isSelected = selectedAssignInvId === item.id;
                        const isOutOfStock = item.availableQuantity <= 0;
                        const itemQty = modalItemQuantities[item.id] || 1;

                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-400/60 shadow-md'
                                : 'bg-[#1c1c2a] hover:bg-[#232338] border-white/5'
                            } ${isOutOfStock ? 'opacity-50' : ''}`}
                          >
                            {/* Left: Item Details */}
                            <div
                              className="min-w-0 flex-1 cursor-pointer"
                              onClick={() => setSelectedAssignInvId(item.id)}
                            >
                              <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                                <span className="text-amber-400 font-mono text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  [{item.safCode}]
                                </span>
                                <span className="font-bold text-white text-xs">{item.element}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  {item.subCategory || item.inventoryCategory || 'General'}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#8a8d9b] mt-1 flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                                <span>Brand: <strong className="text-slate-200">{item.brandProject || item.brand || 'Na'}</strong></span>
                                <span>•</span>
                                <span>Model: <strong className="text-slate-200">{item.model || 'Na'}</strong></span>
                                <span>•</span>
                                <span>Size/LWH: <strong className="text-slate-200">{item.sizeLwh || 'Na'}</strong></span>
                                <span>•</span>
                                <span>Unit: <strong className="text-slate-200">{item.uom || 'Na'}</strong></span>
                              </div>
                            </div>

                            {/* Right: Stock Badge, Qty Input & Allocate Button */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <span
                                className={`px-2 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                                  isOutOfStock
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                Avail: {item.availableQuantity} / {item.totalQuantity}
                              </span>

                              {/* Qty Input Field */}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-[#8a8d9b] font-bold">Qty:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={Math.max(1, item.availableQuantity)}
                                  disabled={isOutOfStock}
                                  value={itemQty}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.min(item.availableQuantity || 1, parseInt(e.target.value) || 1));
                                    setModalItemQuantities((prev) => ({ ...prev, [item.id]: val }));
                                  }}
                                  className="w-14 bg-[#141420] border border-white/20 rounded-lg px-2 py-1 text-white text-center font-bold text-xs focus:outline-none focus:border-amber-400 disabled:opacity-50"
                                />
                              </div>

                              {/* Inline Allocate Button */}
                              <button
                                type="button"
                                disabled={isOutOfStock || submittingAssign}
                                onClick={() => {
                                  setSelectedAssignInvId(item.id);
                                  handleConfirmAssignItem(item.id, itemQty);
                                }}
                                className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all shadow-sm flex items-center gap-1 shrink-0 ${
                                  isOutOfStock
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : assignItemModalDepartment === 'PRODUCTION'
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" /> Allocate
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <select
                    value={selectedAssignInvId}
                    onChange={(e) => setSelectedAssignInvId(e.target.value)}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="">
                      {assignModalSearch.trim() !== ''
                        ? `-- Choose Stock Item (${filteredModalStockItems.length} found) --`
                        : `-- Choose Stock Item (${filteredModalStockItems.length} available) --`}
                    </option>
                    {filteredModalStockItems.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.availableQuantity <= 0}>
                        [{item.safCode}] {item.element} ({item.subCategory || item.inventoryCategory}) | Brand: {item.brandProject || item.brand || 'Na'} | Model: {item.model || 'Na'} | Size: {item.sizeLwh || 'Na'} | Unit: {item.uom || 'Na'} - Avail: {item.availableQuantity}/{item.totalQuantity} {item.availableQuantity <= 0 ? '(Out of Stock)' : ''}
                      </option>
                    ))}
                  </select>

                  {/* Selected Item Badge Preview */}
                  {selectedAssignItemInfo && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[#8a8d9b] font-medium block text-[10px]">SELECTED STOCK ITEM:</span>
                          <span className="font-extrabold text-amber-300">
                            [{selectedAssignItemInfo.safCode}] {selectedAssignItemInfo.element}
                          </span>
                          <span className="text-amber-200/80 ml-2 text-[10px]">
                            ({selectedAssignItemInfo.subCategory || selectedAssignItemInfo.inventoryCategory})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedAssignInvId('')}
                          className="text-[10px] text-amber-400 hover:underline font-bold px-2 py-1 rounded bg-amber-400/10"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="text-[10px] text-[#8a8d9b] pt-1 flex items-center gap-x-2 gap-y-0.5 flex-wrap border-t border-amber-500/20">
                        <span>Brand: <strong className="text-white">{selectedAssignItemInfo.brandProject || selectedAssignItemInfo.brand || 'Na'}</strong></span>
                        <span>•</span>
                        <span>Model: <strong className="text-white">{selectedAssignItemInfo.model || 'Na'}</strong></span>
                        <span>•</span>
                        <span>Size/LWH: <strong className="text-white">{selectedAssignItemInfo.sizeLwh || 'Na'}</strong></span>
                        <span>•</span>
                        <span>Unit: <strong className="text-white">{selectedAssignItemInfo.uom || 'Na'}</strong></span>
                        <span>•</span>
                        <span>Available: <strong className="text-emerald-400">{selectedAssignItemInfo.availableQuantity} / {selectedAssignItemInfo.totalQuantity}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

              {/* Artwork selector */}
              {artistData.artworks?.length > 0 && (
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Target Artwork (Optional)</label>
                  <select
                    value={selectedAssignArtworkId}
                    onChange={(e) => setSelectedAssignArtworkId(e.target.value)}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="">-- General Artist Allocation --</option>
                    {artistData.artworks.map((art: any) => (
                      <option key={art.id} value={art.id}>
                        {art.artworkName} ({art.installationType || 'Artwork'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Quantity to Allocate *</label>
                <input
                  type="number"
                  min={1}
                  value={assignItemQuantity}
                  onChange={(e) => setAssignItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Notes / Installation Remarks</label>
                <input
                  type="text"
                  value={assignItemNotes}
                  onChange={(e) => setAssignItemNotes(e.target.value)}
                  placeholder="e.g. Assigned for stage/exhibition setup"
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAssignItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedAssignInvId || submittingAssign}
                  onClick={() => handleConfirmAssignItem()}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs shadow-md ${
                    assignItemModalDepartment === 'PRODUCTION'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {submittingAssign ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD FINAL LAYOUT MODAL (PDF, JPEG, JPG, PNG) */}
      {uploadFinalLayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-emerald-500/30 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" /> Upload Final Layout Drawing
              </h3>
              <button
                type="button"
                onClick={() => {
                  setUploadFinalLayoutModalOpen(false);
                  setSelectedLayoutFile(null);
                  setLayoutFilePreviewUrl(null);
                }}
                className="text-[#8a8d9b] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target Room Selection (if multiple installations) */}
              {artistData.installations?.length > 1 && (
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">Target Room *</label>
                  <select
                    value={selectedRoomForLayout}
                    onChange={(e) => setSelectedRoomForLayout(e.target.value)}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {artistData.installations.map((inst: any) => (
                      <option key={inst.id} value={inst.roomId || inst.room?.id}>
                        Room {inst.room?.roomNumber} - {inst.room?.roomName} ({inst.venue?.venueName || 'Venue'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Upload Drop Area */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1.5">
                  Select Layout File (PDF, JPEG, JPG, PNG) *
                </label>
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-[#1c1c2a] hover:bg-[#232334] cursor-pointer transition-all space-y-2 group">
                  <input
                    type="file"
                    accept=".pdf,.jpeg,.jpg,.png,image/jpeg,image/png,application/pdf"
                    onChange={handleSelectLayoutFile}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-white block">Click or Drag & Drop file here</span>
                    <span className="text-[10px] text-[#8a8d9b] block mt-0.5">
                      Supports PDF, JPEG, JPG, and PNG (up to 50MB)
                    </span>
                  </div>
                </label>
              </div>

              {/* Selected File Preview Card */}
              {selectedLayoutFile && (
                <div className="p-3 rounded-2xl bg-[#1c1c2a] border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {layoutFilePreviewUrl ? (
                      <img
                        src={layoutFilePreviewUrl}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-xl border border-emerald-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div className="truncate">
                      <span className="font-bold text-white block text-xs truncate">
                        {selectedLayoutFile.name}
                      </span>
                      <span className="text-[10px] text-[#8a8d9b] block">
                        {(selectedLayoutFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedLayoutFile.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLayoutFile(null);
                      setLayoutFilePreviewUrl(null);
                    }}
                    className="text-[#8a8d9b] hover:text-rose-400 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Information Note */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300/90 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Once uploaded, this final layout diagram becomes immediately visible to all user roles and will be set as the primary room thumbnail across all modules.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={uploadingFinalLayout}
                  onClick={() => {
                    setUploadFinalLayoutModalOpen(false);
                    setSelectedLayoutFile(null);
                    setLayoutFilePreviewUrl(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedLayoutFile || uploadingFinalLayout}
                  onClick={handleExecuteUploadFinalLayout}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  {uploadingFinalLayout ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading Layout...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" /> Upload & Publish Final Layout
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARTIST PDF EXPORT MODAL */}
      <ArtistPdfExportModal
        artistId={id}
        isOpen={pdfExportModalOpen}
        onClose={() => setPdfExportModalOpen(false)}
        initialArtistData={artistData}
      />
    </div>
  );
}
