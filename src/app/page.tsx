'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderUp, FolderDown, Image as ImageIcon, Loader2, AlertCircle, FolderSearch } from "lucide-react";

export default function Home() {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickingSource, setPickingSource] = useState(false);
  const [pickingTarget, setPickingTarget] = useState(false);
  const router = useRouter();

  const handleChooseFolder = async (type: 'source' | 'target') => {
    const setIsPicking = type === 'source' ? setPickingSource : setPickingTarget;
    setIsPicking(true);
    setError('');

    try {
      const res = await fetch('/api/choose-folder', { method: 'POST' });
      const data = await res.json();

      if (data.path) {
        if (type === 'source') setSource(data.path);
        else setTarget(data.path);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Failed to open folder picker.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleStart = async () => {
    if (!source || !target) {
      setError('Please provide both source and target directories.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, target }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to validate folders. Please check access permissions.');
        setLoading(false);
        return;
      }

      if (data.files.length === 0) {
        setError('No supported media files found in the source directory.');
        setLoading(false);
        return;
      }

      // Store in session storage to pass to the swiper page securely
      sessionStorage.setItem('photoSwiper_source', source);
      sessionStorage.setItem('photoSwiper_target', target);
      sessionStorage.setItem('photoSwiper_files', JSON.stringify(data.files));

      router.push('/swiper');
    } catch {
      setError('An unexpected error occurred while validating folders.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-neutral-900 rounded-full mb-4 ring-1 ring-neutral-800 shadow-xl">
            <ImageIcon className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">Photo Swiper</h1>
          <p className="text-neutral-400 text-lg">
            Organize thousands of photos instantly with a simple swipe.
          </p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center space-x-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-neutral-300">
                <FolderUp className="w-4 h-4 text-blue-400" />
                <span>Source Folder (Absolute Path)</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="/Volumes/HardDrive/MarriagePhotos"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleChooseFolder('source')}
                  disabled={pickingSource}
                  className="px-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-neutral-700 transition-colors disabled:opacity-50"
                  title="Choose Folder"
                >
                  {pickingSource ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderSearch className="w-5 h-5 text-blue-400" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-neutral-300">
                <FolderDown className="w-4 h-4 text-green-400" />
                <span>Target Folder (Absolute Path)</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="/Users/Username/Desktop/SelectedPhotos"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleChooseFolder('target')}
                  disabled={pickingTarget}
                  className="px-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-neutral-700 transition-colors disabled:opacity-50"
                  title="Choose Folder"
                >
                  {pickingTarget ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderSearch className="w-5 h-5 text-green-400" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Validating Folders...
              </>
            ) : (
              'Start Swiping'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
