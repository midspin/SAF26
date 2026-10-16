'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Search,
  Filter,
  Maximize2,
  ExternalLink,
  ChevronDown,
  Hammer,
  Sparkles,
} from 'lucide-react';

export const PRODUCTION_CATEGORIES = [
  { code: 'T', name: 'T - Technical', shortName: 'Technical' },
  { code: 'RI', name: 'RI - Infrastructure', shortName: 'Infrastructure' },
  { code: 'CF', name: 'CF - Curtain and Flooring', shortName: 'Curtain and Flooring' },
  { code: 'F', name: 'F - Furniture', shortName: 'Furniture' },
  { code: 'P', name: 'P - Printing', shortName: 'Printing' },
  { code: 'SPN', name: 'SPN - Special Project Needs', shortName: 'Special Project Needs' },
];

export const PRODUCTION_SUBCATEGORIES = [
  { categoryCode: 'RI', label: 'RI- walls' },
  { categoryCode: 'T', label: 'T- audio' },
  { categoryCode: 'T', label: 'T- video' },
  { categoryCode: 'T', label: 'T- IT' },
  { categoryCode: 'T', label: 'T- cables and connectors' },
  { categoryCode: 'T', label: 'T- lights' },
  { categoryCode: 'RI', label: 'RI- ceiling' },
  { categoryCode: 'RI', label: 'RI- paint' },
  { categoryCode: 'RI', label: 'RI- electrical' },
  { categoryCode: 'CF', label: 'CF- curtains' },
  { categoryCode: 'CF', label: 'CF- carpet' },
  { categoryCode: 'F', label: 'F- bench' },
  { categoryCode: 'F', label: 'F- display and pedestals' },
  { categoryCode: 'F', label: 'F- misc furniture' },
  { categoryCode: 'P', label: 'P- banner' },
  { categoryCode: 'P', label: 'P- vinyl/flex' },
  { categoryCode: 'P', label: 'P- invitation/collateral' },
  { categoryCode: 'P', label: 'P- signage' },
  { categoryCode: 'P', label: 'P- artwork' },
  { categoryCode: 'SPN', label: 'SPN- fabrication' },
  { categoryCode: 'SPN', label: 'SPN- rigging' },
  { categoryCode: 'SPN', label: 'SPN- props' },
  { categoryCode: 'SPN', label: 'SPN- artwork fabrication' },
  { categoryCode: 'SPN', label: 'SPN- other' },
];

export const ACQUISITION_SOURCES = [
  'SAF Inventory',
  'Purchase',
  'Rental',
  'Fabricate',
  'By Artist',
];

export const PRODUCTION_STATUSES = [
  'Done',
  'Requisition confirmed',
  'Requisition on hold',
  'Requisition in pending',
  'Artist info pending',
];

export const DIMENSION_UNITS = ['mm', 'cm', 'm', 'inch', 'ft', 'pcs'];

interface ProductionItem {
  id: string;
  artistId: string;
  artworkId?: string | null;
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
  description?: string | null;
  specification?: string | null;
  requirementType?: string | null;
  notes?: string | null;
  artwork?: any;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface ArtistProductionItemsSectionProps {
  artistId: string;
  productionRequirements: ProductionItem[];
  artworks?: any[];
  canManage: boolean;
  onItemMutated: () => void;
}

export default function ArtistProductionItemsSection({
  artistId,
  productionRequirements = [],
  artworks = [],
  canManage,
  onItemMutated,
}: ArtistProductionItemsSectionProps) {
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductionItem | null>(null);
  const [deleteItemModal, setDeleteItemModal] = useState<ProductionItem | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Filter / Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Form states
  const [formData, setFormData] = useState({
    artworkId: '',
    productionCategory: 'T - Technical',
    subCategory: 'T- audio',
    element: '',
    typeSpec: '',
    referenceImages: [] as string[],
    length: '',
    breadth: '',
    height: '',
    unit: 'mm',
    quantity: 1,
    source: 'SAF Inventory',
    status: 'Requisition in pending',
    assignedTo: '',
    remarks: '',
  });

  const [subCategoryInput, setSubCategoryInput] = useState('T- audio');
  const [showSubCatSuggestions, setShowSubCatSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open modal for creating new item
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      artworkId: artworks[0]?.id || '',
      productionCategory: 'T - Technical',
      subCategory: 'T- audio',
      element: '',
      typeSpec: '',
      referenceImages: [],
      length: '',
      breadth: '',
      height: '',
      unit: 'mm',
      quantity: 1,
      source: 'SAF Inventory',
      status: 'Requisition in pending',
      assignedTo: '',
      remarks: '',
    });
    setSubCategoryInput('T- audio');
    setUrlInput('');
    setModalOpen(true);
  };

  // Open modal for editing existing item
  const openEditModal = (item: ProductionItem) => {
    setEditingItem(item);
    let parsedImages: string[] = [];
    try {
      if (item.referenceImages) {
        parsedImages = JSON.parse(item.referenceImages);
        if (!Array.isArray(parsedImages)) parsedImages = [];
      }
    } catch {
      parsedImages = item.referenceImages ? [item.referenceImages] : [];
    }

    const currentSub = item.subCategory || 'T- audio';
    setFormData({
      artworkId: item.artworkId || '',
      productionCategory: item.productionCategory || 'T - Technical',
      subCategory: currentSub,
      element: item.element || '',
      typeSpec: item.typeSpec || '',
      referenceImages: parsedImages,
      length: item.length || '',
      breadth: item.breadth || '',
      height: item.height || '',
      unit: item.unit || 'mm',
      quantity: item.quantity || 1,
      source: item.source || 'SAF Inventory',
      status: item.status || 'Requisition in pending',
      assignedTo: item.assignedTo || '',
      remarks: item.remarks || '',
    });
    setSubCategoryInput(currentSub);
    setUrlInput('');
    setModalOpen(true);
  };

  // Handle Category selection & Auto-sync
  const handleCategoryChange = (catName: string) => {
    const foundCat = PRODUCTION_CATEGORIES.find(
      (c) => c.name === catName || c.code === catName || catName.startsWith(c.code)
    );
    const code = foundCat?.code || 'T';

    // Pick first matching subcategory for this category
    const matchingSub = PRODUCTION_SUBCATEGORIES.find((s) => s.categoryCode === code);
    const newSub = matchingSub ? matchingSub.label : formData.subCategory;

    setFormData((prev) => ({
      ...prev,
      productionCategory: catName,
      subCategory: newSub,
    }));
    setSubCategoryInput(newSub);
  };

  // 3-Letter Auto Fill and Sub Category change handler
  const handleSubCategoryInputChange = (value: string) => {
    setSubCategoryInput(value);
    setShowSubCatSuggestions(true);

    const trimmed = value.trim().toLowerCase();

    // If 3 or more letters typed, check for auto-fill match
    if (trimmed.length >= 3) {
      const match = PRODUCTION_SUBCATEGORIES.find(
        (s) =>
          s.label.toLowerCase().includes(trimmed) ||
          s.label.toLowerCase().replace(/[^a-z0-9]/g, '').includes(trimmed.replace(/[^a-z0-9]/g, ''))
      );

      if (match) {
        // Auto-detect production category from prefix
        const matchedCat = PRODUCTION_CATEGORIES.find((c) => c.code === match.categoryCode);
        if (matchedCat) {
          setFormData((prev) => ({
            ...prev,
            productionCategory: matchedCat.name,
            subCategory: match.label,
          }));
        }
      }
    }
  };

  // Select a subcategory suggestion
  const selectSubCategory = (sub: { categoryCode: string; label: string }) => {
    const matchedCat = PRODUCTION_CATEGORIES.find((c) => c.code === sub.categoryCode);
    setSubCategoryInput(sub.label);
    setFormData((prev) => ({
      ...prev,
      subCategory: sub.label,
      productionCategory: matchedCat ? matchedCat.name : prev.productionCategory,
    }));
    setShowSubCatSuggestions(false);
  };

  // Upload multiple images
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadData = new FormData();
        uploadData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          newUrls.push(data.url);
        } else {
          console.error('Upload failed for file:', file.name, data.error);
        }
      }

      if (newUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          referenceImages: [...prev.referenceImages, ...newUrls],
        }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload one or more images.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add image by URL
  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      referenceImages: [...prev.referenceImages, urlInput.trim()],
    }));
    setUrlInput('');
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index),
    }));
  };

  // Submit form (Save / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.element.trim()) {
      alert('Element/Item is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        artistId,
        artworkId: formData.artworkId || null,
        productionCategory: formData.productionCategory,
        subCategory: formData.subCategory || subCategoryInput,
        element: formData.element.trim(),
        typeSpec: formData.typeSpec.trim(),
        referenceImages: formData.referenceImages,
        length: formData.length,
        breadth: formData.breadth,
        height: formData.height,
        unit: formData.unit,
        quantity: formData.quantity,
        source: formData.source,
        status: formData.status,
        assignedTo: formData.assignedTo.trim(),
        remarks: formData.remarks.trim(),
      };

      let res;
      if (editingItem) {
        res = await fetch('/api/production-requirements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        });
      } else {
        res = await fetch('/api/production-requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        onItemMutated();
      } else {
        alert(data.error || 'Failed to save production item');
      }
    } catch (err) {
      console.error('Error saving production item:', err);
      alert('An error occurred while saving the production item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete item
  const handleDeleteItem = async () => {
    if (!deleteItemModal) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/production-requirements?id=${deleteItemModal.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteItemModal(null);
        onItemMutated();
      } else {
        alert(data.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('An error occurred while deleting the item.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return productionRequirements.filter((item) => {
      // Category filter
      if (selectedCategoryFilter !== 'ALL') {
        const itemCat = (item.productionCategory || '').toUpperCase();
        const itemSub = (item.subCategory || '').toUpperCase();
        const codeMatch = itemCat.includes(selectedCategoryFilter) || itemSub.startsWith(selectedCategoryFilter);
        if (!codeMatch) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL') {
        const itemStatus = (item.status || '').toLowerCase();
        if (itemStatus !== selectedStatusFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchElement = (item.element || item['description'] || '').toLowerCase().includes(q);
        const matchType = (item.typeSpec || item['specification'] || '').toLowerCase().includes(q);
        const matchSub = (item.subCategory || '').toLowerCase().includes(q);
        const matchCat = (item.productionCategory || item['requirementType'] || '').toLowerCase().includes(q);
        const matchAssigned = (item.assignedTo || '').toLowerCase().includes(q);
        const matchSource = (item.source || '').toLowerCase().includes(q);
        if (!matchElement && !matchType && !matchSub && !matchCat && !matchAssigned && !matchSource) {
          return false;
        }
      }

      return true;
    });
  }, [productionRequirements, selectedCategoryFilter, selectedStatusFilter, searchQuery]);

  // Helper for status badge colors
  const getStatusBadge = (status?: string | null) => {
    const s = (status || 'Requisition in pending').toLowerCase();
    if (s.includes('done')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> Done
        </span>
      );
    }
    if (s.includes('confirmed')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
          <CheckCircle2 className="w-3 h-3" /> Requisition Confirmed
        </span>
      );
    }
    if (s.includes('hold')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertCircle className="w-3 h-3" /> Requisition on Hold
        </span>
      );
    }
    if (s.includes('info pending')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <HelpCircle className="w-3 h-3" /> Artist Info Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
        <Clock className="w-3 h-3" /> Requisition Pending
      </span>
    );
  };

  // Helper for source badge colors
  const getSourceBadge = (source?: string | null) => {
    const src = source || 'SAF Inventory';
    let colorClass = 'bg-teal-500/10 text-teal-300 border-teal-500/20';
    if (src.toLowerCase() === 'purchase') {
      colorClass = 'bg-sky-500/10 text-sky-300 border-sky-500/20';
    } else if (src.toLowerCase() === 'rental') {
      colorClass = 'bg-purple-500/10 text-purple-300 border-purple-500/20';
    } else if (src.toLowerCase() === 'fabricate') {
      colorClass = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    } else if (src.toLowerCase() === 'by artist') {
      colorClass = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    }
    return (
      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${colorClass}`}>
        {src}
      </span>
    );
  };

  return (
    <>
      {/* NEW FABRICATION CARD */}
      <div className="p-6 rounded-3xl bg-[#232334] border border-amber-500/40 shadow-2xl space-y-4">
        {/* CARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  New Fabrication ({productionRequirements.length})
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Requirements & Specifications
                </span>
              </div>
              <p className="text-[11px] text-[#8a8d9b] mt-0.5">
                Technical, infrastructure, fabrication, and custom production needs registered for this artist docket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManage ? (
              <button
                onClick={openCreateModal}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Fabrication
              </button>
            ) : (
              <span className="text-[10px] font-mono text-[#8a8d9b] bg-[#1c1c2a] px-2.5 py-1 rounded-lg border border-white/5">
                View Only
              </span>
            )}
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        {productionRequirements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1">
            <div className="md:col-span-6 relative">
              <div className="flex items-center gap-2 bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-amber-400 transition-colors">
                <Search className="w-3.5 h-3.5 text-[#8a8d9b] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search element, spec, subcategory, assigned to..."
                  className="bg-transparent text-xs text-white placeholder-[#8a8d9b] focus:outline-none w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-[#8a8d9b] hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
              >
                <option value="ALL">📁 All Categories</option>
                {PRODUCTION_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
              >
                <option value="ALL">⚡ All Statuses</option>
                {PRODUCTION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ITEMS LIST TABLE / EMPTY STATE */}
        {productionRequirements.length === 0 ? (
          <div className="p-8 text-center bg-[#1c1c2a] rounded-2xl border border-white/5 text-[#8a8d9b] text-xs space-y-2">
            <p>No new fabrication items or custom requirements added yet for this artist.</p>
            {canManage && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 hover:underline font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add First New Fabrication Now
              </button>
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 text-center bg-[#1c1c2a] rounded-2xl border border-white/5 text-[#8a8d9b] text-xs">
            No new fabrication items match your search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-extrabold text-[#8a8d9b] uppercase tracking-wider bg-[#1c1c2a]">
                  <th className="py-2.5 px-3 rounded-l-xl">Category / SubCat</th>
                  <th className="py-2.5 px-3">Element / Item</th>
                  <th className="py-2.5 px-3">Type / Spec</th>
                  <th className="py-2.5 px-3 text-center">Dimensions</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned To</th>
                  <th className="py-2.5 px-3">Images</th>
                  {canManage && <th className="py-2.5 px-3 text-right rounded-r-xl">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => {
                  let imageList: string[] = [];
                  try {
                    if (item.referenceImages) {
                      imageList = JSON.parse(item.referenceImages);
                      if (!Array.isArray(imageList)) imageList = [];
                    }
                  } catch {
                    imageList = item.referenceImages ? [item.referenceImages] : [];
                  }

                  const hasDimensions = item.length || item.breadth || item.height;
                  const dimensionText = hasDimensions
                    ? `${item.length || '-'}${item.breadth ? ` × ${item.breadth}` : ''}${
                        item.height ? ` × ${item.height}` : ''
                      } ${item.unit || ''}`
                    : '-';

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* CATEGORY & SUBCATEGORY */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-lg inline-block">
                            {item.subCategory || item.productionCategory || 'Production'}
                          </span>
                        </div>
                      </td>

                      {/* ELEMENT / ITEM NAME */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-xs max-w-[180px] truncate" title={item.element || ''}>
                          {item.element || item['description'] || 'Item'}
                        </div>
                        {item.artwork?.artworkName && (
                          <span className="text-[10px] text-amber-400 font-medium block truncate max-w-[160px]">
                            Artwork: {item.artwork.artworkName}
                          </span>
                        )}
                      </td>

                      {/* TYPE / SPEC */}
                      <td className="py-3 px-3 text-[#cbd5e1] max-w-[160px] truncate" title={item.typeSpec || item['specification'] || ''}>
                        {item.typeSpec || item['specification'] || <span className="text-[#8a8d9b] italic">-</span>}
                      </td>

                      {/* DIMENSIONS */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-[#cbd5e1]">
                        {dimensionText}
                      </td>

                      {/* QTY */}
                      <td className="py-3 px-3 text-center font-extrabold text-amber-400">
                        {item.quantity || 1}
                      </td>

                      {/* SOURCE */}
                      <td className="py-3 px-3">
                        {getSourceBadge(item.source)}
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-3">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* ASSIGNED TO */}
                      <td className="py-3 px-3 text-[#cbd5e1] font-medium max-w-[120px] truncate" title={item.assignedTo || ''}>
                        {item.assignedTo || <span className="text-[#8a8d9b] italic">Unassigned</span>}
                      </td>

                      {/* REFERENCE IMAGES */}
                      <td className="py-3 px-3">
                        {imageList.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setLightboxImage(imageList[0])}
                              className="w-8 h-8 rounded-lg overflow-hidden border border-white/15 bg-slate-800 hover:border-amber-400 transition-all shrink-0 cursor-pointer"
                              title="Click to view full image"
                            >
                              <img src={imageList[0]} alt="Ref" className="w-full h-full object-cover" />
                            </button>
                            {imageList.length > 1 && (
                              <button
                                onClick={() => setLightboxImage(imageList[0])}
                                className="text-[10px] font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded cursor-pointer"
                                title={`+${imageList.length - 1} more images`}
                              >
                                +{imageList.length - 1}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8a8d9b] italic">None</span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      {canManage && (
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg bg-[#1c1c2a] text-[#8a8d9b] hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="Edit New Fabrication"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteItemModal(item)}
                              className="p-1.5 rounded-lg bg-[#1c1c2a] text-[#8a8d9b] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT PRODUCTION ITEM MODAL                                          */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#232334] border border-white/10 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl my-8">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Hammer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {editingItem ? 'Edit New Fabrication' : 'Add New Fabrication'}
                  </h3>
                  <p className="text-[10px] text-[#8a8d9b]">
                    Specify custom production, technical infrastructure, or fabrication item
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#8a8d9b] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* ROW 1: CATEGORY & SUBCATEGORY (WITH 3-LETTER AUTOFILL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* PRODUCTION CATEGORY DROPDOWN */}
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">
                    Production Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.productionCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    {PRODUCTION_CATEGORIES.map((cat) => (
                      <option key={cat.code} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUBCATEGORY (DROPDOWN + 3-LETTER AUTO FILL) */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#8a8d9b] font-bold">
                      Sub Category <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[9px] text-amber-400/80 font-mono">
                      (Type 3 letters to auto-fill)
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. RI- walls, T- audio..."
                      value={subCategoryInput}
                      onChange={(e) => handleSubCategoryInputChange(e.target.value)}
                      onFocus={() => setShowSubCatSuggestions(true)}
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSubCatSuggestions(!showSubCatSuggestions)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8d9b] hover:text-white"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* AUTOCOMPLETE SUGGESTIONS POPUP */}
                  {showSubCatSuggestions && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1a28] border border-white/15 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50 divide-y divide-white/5">
                      {PRODUCTION_SUBCATEGORIES.filter((s) => {
                        if (!subCategoryInput) return true;
                        const q = subCategoryInput.toLowerCase();
                        return (
                          s.label.toLowerCase().includes(q) ||
                          s.categoryCode.toLowerCase().includes(q)
                        );
                      }).map((sub, i) => (
                        <div
                          key={i}
                          onClick={() => selectSubCategory(sub)}
                          className="px-3 py-2 hover:bg-amber-500/20 text-white font-medium cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <span>{sub.label}</span>
                          <span className="text-[10px] font-mono text-amber-400/70 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            {sub.categoryCode}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ROW 2: ELEMENT / ITEM & TYPE / SPEC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">
                    Element / Item <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wooden Partition Wall, Subwoofer 18-inch..."
                    value={formData.element}
                    onChange={(e) => setFormData({ ...formData, element: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">
                    Type / Spec
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Matte finish, Fire retardant ply, 800W RMS..."
                    value={formData.typeSpec}
                    onChange={(e) => setFormData({ ...formData, typeSpec: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* ROW 3: DIMENSIONS (LENGTH, BREADTH, HEIGHT, UNIT) & QTY */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">
                  Dimensions & Quantity
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Length"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[9px] text-[#8a8d9b] block text-center mt-0.5">Length</span>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Breadth"
                      value={formData.breadth}
                      onChange={(e) => setFormData({ ...formData, breadth: e.target.value })}
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[9px] text-[#8a8d9b] block text-center mt-0.5">Breadth</span>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Height"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[9px] text-[#8a8d9b] block text-center mt-0.5">Height</span>
                  </div>

                  <div>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-2 py-2 text-white font-bold text-center focus:outline-none focus:border-amber-400"
                    >
                      {DIMENSION_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <span className="text-[9px] text-[#8a8d9b] block text-center mt-0.5">Unit</span>
                  </div>

                  <div>
                    <input
                      type="number"
                      min={1}
                      required
                      placeholder="Qty"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-amber-400 font-extrabold text-center focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[9px] text-[#8a8d9b] block text-center mt-0.5 font-bold">Qty</span>
                  </div>
                </div>
              </div>

              {/* ROW 4: SOURCE & STATUS DROPDOWNS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">
                    Acquisition / Source Dropdown <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    {ACQUISITION_SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">
                    Status <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    {PRODUCTION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROW 5: ASSIGNED TO & ASSOCIATED ARTWORK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fabrication Vendor / In-house Carpenter / Tech Lead"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[#8a8d9b] block font-bold mb-1">
                    Associated Artwork
                  </label>
                  <select
                    value={formData.artworkId}
                    onChange={(e) => setFormData({ ...formData, artworkId: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="">General (Artist Wide)</option>
                    {artworks.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.artworkName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROW 6: REFERENCE IMAGE (IMAGE UPLOADER + MULTIPLE IMAGE) */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">
                  Reference Image (Image Uploader + Multiple Images)
                </label>

                {/* UPLOADER CONTROLS */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Upload Reference Images'}
                  </button>

                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="url"
                      placeholder="Or paste image URL..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="bg-[#1c1c2a] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-medium w-full focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 rounded-xl bg-[#1c1c2a] hover:bg-white/10 text-slate-200 border border-white/10 font-bold shrink-0 cursor-pointer"
                    >
                      + Add URL
                    </button>
                  </div>
                </div>

                {/* THUMBNAIL GALLERY */}
                {formData.referenceImages.length > 0 && (
                  <div className="flex items-center gap-2.5 mt-2.5 flex-wrap p-2.5 bg-[#1c1c2a] rounded-xl border border-white/5">
                    {formData.referenceImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group w-14 h-14 rounded-lg overflow-hidden border border-white/15 bg-slate-900 shrink-0"
                      >
                        <img src={imgUrl} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ROW 7: REMARKS */}
              <div>
                <label className="text-[#8a8d9b] block font-bold mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Additional instructions, site constraints, electrical notes, or vendor details..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* MODAL ACTIONS */}
              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c2a] hover:bg-[#28283c] text-[#8a8d9b] font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update New Fabrication' : 'Add New Fabrication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deleteItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Delete New Fabrication?
              </h3>
              <p className="text-xs text-[#8a8d9b] mt-1">
                Are you sure you want to remove "<strong>{deleteItemModal.element}</strong>"? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteItemModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteItem}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IMAGE PREVIEW LIGHTBOX                                                    */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] p-2 bg-[#232334] rounded-2xl border border-white/20">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 border border-white/20 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer shadow-xl"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImage}
              alt="Reference Preview"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
