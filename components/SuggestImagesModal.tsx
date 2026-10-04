'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, RefreshCw, Image as ImageIcon, User, Palette, ExternalLink } from 'lucide-react';

interface SuggestImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialArtistName?: string;
  initialArtworkTitle?: string;
  onSelectProfileImage?: (url: string) => void;
  onSelectArtworkImage?: (url: string) => void;
}

export default function SuggestImagesModal({
  isOpen,
  onClose,
  initialArtistName = '',
  initialArtworkTitle = '',
  onSelectProfileImage,
  onSelectArtworkImage,
}: SuggestImagesModalProps) {
  const [artistName, setArtistName] = useState(initialArtistName);
  const [artworkTitle, setArtworkTitle] = useState(initialArtworkTitle);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileCandidates, setProfileCandidates] = useState<string[]>([]);
  const [artworkCandidates, setArtworkCandidates] = useState<string[]>([]);

  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);

  // Sync inputs when initial props change or modal opens
  useEffect(() => {
    if (isOpen) {
      setArtistName(initialArtistName);
      setArtworkTitle(initialArtworkTitle);
      setSelectedProfile(null);
      setSelectedArtwork(null);
      fetchSuggestions(initialArtistName, initialArtworkTitle);
    }
  }, [isOpen, initialArtistName, initialArtworkTitle]);

  const fetchSuggestions = async (nameToUse?: string, titleToUse?: string) => {
    const aName = nameToUse !== undefined ? nameToUse : artistName;
    const aTitle = titleToUse !== undefined ? titleToUse : artworkTitle;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/artists/suggest-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: aName,
          artworkTitle: aTitle,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.profileCandidates || data.artworkCandidates)) {
        setProfileCandidates(data.profileCandidates || []);
        setArtworkCandidates(data.artworkCandidates || []);
      } else {
        setError(data.error || 'Failed to fetch image suggestions');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error fetching image suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedProfile && onSelectProfileImage) {
      onSelectProfileImage(selectedProfile);
    }
    if (selectedArtwork && onSelectArtworkImage) {
      onSelectArtworkImage(selectedArtwork);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl p-6 space-y-5 shadow-2xl my-8 relative text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-950/80 border border-sky-800/80 text-sky-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              <h3 className="text-lg font-extrabold text-white tracking-wide">
                Auto-Suggest Profile & Artwork Images
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Query Google Search to find top 6 candidate images for artist profile and artwork. Click to select your preferred images.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Parameters Search Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1 text-xs">
            <label className="text-slate-400 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" /> Artist Name
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="e.g. Marina Abramović"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-5 space-y-1 text-xs">
            <label className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" /> Artwork Title
            </label>
            <input
              type="text"
              value={artworkTitle}
              onChange={(e) => setArtworkTitle(e.target.value)}
              placeholder="e.g. The Artist Is Present"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => fetchSuggestions()}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Search</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Candidates Grid Sections */}
        <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1">
          {/* SECTION A: ARTIST PROFILE CANDIDATES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Artist Profile Image Candidates (Top 6)
              </h4>
              {selectedProfile && (
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 1 Profile Selected
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-slate-950 animate-pulse border border-slate-800 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-700" />
                  </div>
                ))}
              </div>
            ) : profileCandidates.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 text-center text-xs text-slate-500">
                No profile image candidates found. Enter an artist name to search.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {profileCandidates.map((url, idx) => {
                  const isSelected = selectedProfile === url;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedProfile(isSelected ? null : url)}
                      className={`relative group rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 bg-slate-950 ${
                        isSelected
                          ? 'border-sky-500 ring-2 ring-sky-500/40 scale-[1.02] shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                          : 'border-slate-800 hover:border-sky-500/60 hover:scale-[1.02]'
                      }`}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-slate-950">
                        <img
                          src={url}
                          alt={`Profile Candidate ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Candidate badge */}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-lg bg-slate-950/80 text-[10px] font-bold text-slate-300 border border-slate-700 backdrop-blur-sm">
                        #{idx + 1}
                      </span>

                      {/* Selection Check Overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-sky-950/40 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shadow-lg animate-in zoom-in">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                        </div>
                      )}

                      {/* Bottom hover label */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-1.5 text-center">
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-sky-300' : 'text-slate-300'}`}>
                          {isSelected ? 'Selected' : 'Pick Profile'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: ARTWORK CANDIDATES */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4" /> Artwork Image Candidates (Top 6)
              </h4>
              {selectedArtwork && (
                <span className="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 1 Artwork Selected
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-slate-950 animate-pulse border border-slate-800 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-700" />
                  </div>
                ))}
              </div>
            ) : artworkCandidates.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 text-center text-xs text-slate-500">
                No artwork image candidates found. Enter artwork title to search.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {artworkCandidates.map((url, idx) => {
                  const isSelected = selectedArtwork === url;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedArtwork(isSelected ? null : url)}
                      className={`relative group rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 bg-slate-950 ${
                        isSelected
                          ? 'border-purple-500 ring-2 ring-purple-500/40 scale-[1.02] shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'border-slate-800 hover:border-purple-500/60 hover:scale-[1.02]'
                      }`}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-slate-950">
                        <img
                          src={url}
                          alt={`Artwork Candidate ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Candidate badge */}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-lg bg-slate-950/80 text-[10px] font-bold text-slate-300 border border-slate-700 backdrop-blur-sm">
                        #{idx + 1}
                      </span>

                      {/* Selection Check Overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-950/40 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg animate-in zoom-in">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                        </div>
                      )}

                      {/* Bottom hover label */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-1.5 text-center">
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-purple-300' : 'text-slate-300'}`}>
                          {isSelected ? 'Selected' : 'Pick Artwork'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with summary and Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>
              Profile Image:{' '}
              <strong className={selectedProfile ? 'text-sky-400' : 'text-slate-500'}>
                {selectedProfile ? '✓ Selected' : 'None'}
              </strong>
            </span>
            <span>|</span>
            <span>
              Artwork Image:{' '}
              <strong className={selectedArtwork ? 'text-purple-400' : 'text-slate-500'}>
                {selectedArtwork ? '✓ Selected' : 'None'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedProfile && !selectedArtwork}
              onClick={handleApply}
              className="flex-1 sm:flex-initial px-5 py-2 bg-gradient-to-r from-sky-500 to-purple-500 hover:from-sky-400 hover:to-purple-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Apply Selected Images</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
