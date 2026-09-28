'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export default function ImageUploadInput({
  value,
  onChange,
  label = 'Photo / Image',
  placeholder = 'https://... or upload local file',
}: ImageUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to upload image.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error uploading file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-1.5 text-xs">
      <label className="text-slate-400 font-medium block flex items-center justify-between">
        <span>{label}</span>
        {uploadSuccess && (
          <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1 animate-pulse">
            <CheckCircle2 className="w-3 h-3" /> Uploaded successfully!
          </span>
        )}
      </label>

      {/* Image Preview & Controls */}
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative group shrink-0">
            <img
              src={value}
              alt="Preview"
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-1.5 -right-1.5 bg-red-900 text-red-300 rounded-full p-0.5 border border-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
        )}

        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            title="Upload image file from computer"
          >
            {uploading ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && <p className="text-[11px] text-red-400 font-medium pt-0.5">⚠️ {error}</p>}
    </div>
  );
}
