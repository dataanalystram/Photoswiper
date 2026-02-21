'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SwipeCard from '@/components/SwipeCard';
import { ArrowLeft, Check, X, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SwiperPage() {
    const [source, setSource] = useState<string | null>(null);
    const [target, setTarget] = useState<string | null>(null);
    const [files, setFiles] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [targetCount, setTargetCount] = useState(0);
    const [history, setHistory] = useState<{ index: number, fileName: string, action: 'copy' | 'skip' }[]>([]);
    const [decisions, setDecisions] = useState<Record<string, 'copy' | 'skip'>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    // Editable Focus Photo state
    const [isEditingIndex, setIsEditingIndex] = useState(false);
    const [editInputValue, setEditInputValue] = useState('');

    const router = useRouter();

    const initializeTargetState = async (targetDir: string) => {
        try {
            const res = await fetch(`/api/target-count?dir=${encodeURIComponent(targetDir)}`);
            const data = await res.json();

            if (data.count !== undefined) {
                setTargetCount(data.count);
            }

            if (data.files && Array.isArray(data.files)) {
                // Initialize decisions for already copied files so they show "KEPT" instantly
                const initialDecisions: Record<string, 'copy' | 'skip'> = {};
                data.files.forEach((file: string) => {
                    initialDecisions[file] = 'copy';
                });
                setDecisions(prev => ({ ...initialDecisions, ...prev }));
            }
        } catch (err) {
            console.error('Failed to initialize target state:', err);
        }
    };

    useEffect(() => {
        const s = sessionStorage.getItem('photoSwiper_source');
        const t = sessionStorage.getItem('photoSwiper_target');
        const f = sessionStorage.getItem('photoSwiper_files');
        const savedIndex = localStorage.getItem('photoSwiper_currentIndex');

        if (!s || !t || !f) {
            router.replace('/');
            return;
        }

        setTimeout(() => {
            setSource(s);
            setTarget(t);
            setFiles(JSON.parse(f));
            if (savedIndex) {
                setCurrentIndex(parseInt(savedIndex, 10));
            }
            initializeTargetState(t);
        }, 0);
    }, [router]);

    const handleSwipe = async (direction: 'left' | 'right', index: number) => {
        if (!source || !target || index >= files.length) return;

        // We no longer use a global isProcessing lock here because SwipeCard
        // handles its own local hasSwipedRef lock.
        const file = files[index];
        const targetDir = target;
        const sourcePath = `${source.replace(/\/$/, '')}/${file}`;
        const action = direction === 'right' ? 'copy' : 'skip';

        // Check if we've already done this action for this file to avoid double counting
        const alreadyKept = decisions[file] === 'copy';

        // Update decisions map
        setDecisions(prev => ({ ...prev, [file]: action }));
        setHistory(prev => [...prev, { index, fileName: file, action }]);

        // Auto-advance if we're acting on the current card
        if (index === currentIndex && index < files.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }

        if (action === 'copy' && !alreadyKept) {
            try {
                const res = await fetch('/api/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourcePath, targetDir, action: 'copy' }),
                });
                const data = await res.json();
                // If the check in API says it already exists, we might have successfully skipped it
                if (data.success && !data.message.includes('already exists')) {
                    setTargetCount(prev => prev + 1);
                }
            } catch (err) {
                console.error('Failed to copy file:', err);
            }
        }
    };

    const undoLastAction = useCallback(async () => {
        if (history.length === 0 || !source || !target || isProcessing) return;

        setIsProcessing(true);
        const lastAction = history[history.length - 1];
        const sourcePath = `${source.replace(/\/$/, '')}/${lastAction.fileName}`;

        // Pop from history and reset index
        setHistory(prev => prev.slice(0, -1));
        setCurrentIndex(lastAction.index);

        // Remove from decisions
        setDecisions(prev => {
            const next = { ...prev };
            delete next[lastAction.fileName];
            return next;
        });

        if (lastAction.action === 'copy') {
            try {
                await fetch('/api/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourcePath, targetDir: target, action: 'undo' }),
                });
                setTargetCount(prev => Math.max(0, prev - 1));
            } catch (err) {
                console.error('Failed to undo file:', err);
            }
        }

        setTimeout(() => {
            setIsProcessing(false);
        }, 600);
    }, [history, source, target, isProcessing]);

    // Keyboard support for browsing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isProcessing) return;

            if (e.key === 'ArrowRight') {
                setCurrentIndex(prev => Math.min(files.length - 1, prev + 1));
            } else if (e.key === 'ArrowLeft') {
                setCurrentIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
                undoLastAction();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [files.length, isProcessing, undoLastAction]);

    // Save current index to localStorage whenever it changes
    useEffect(() => {
        if (files.length > 0) {
            localStorage.setItem('photoSwiper_currentIndex', currentIndex.toString());
        }
    }, [currentIndex, files.length]);

    if (!source || !target) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400">
                Loading workspace...
            </div>
        );
    }

    // Optimized Carousel Window
    // Expanded buffer and stable keying
    const buffer = 8;
    const windowStart = Math.max(0, currentIndex - buffer);
    const windowEnd = Math.min(files.length, currentIndex + buffer);

    // Create a stable map for visible files to avoid re-renders
    const visibleFiles = files.slice(windowStart, windowEnd).map((name) => ({
        name,
        index: files.indexOf(name) // Use absolute index for stability
    }));

    // Aggressive Preloader - renders hidden images for future files
    const prefetchBuffer = 15;
    const prefetchFiles = files.slice(currentIndex + 1, currentIndex + prefetchBuffer);

    // Carousel Window
    const isFinished = files.length > 0 && currentIndex >= files.length;

    const handleEditIndexSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const newIndex = parseInt(editInputValue, 10) - 1; // Convert to 0-based
        if (!isNaN(newIndex) && newIndex >= 0 && newIndex < files.length) {
            setCurrentIndex(newIndex);
        }
        setIsEditingIndex(false);
    };

    return (
        <div className="fixed inset-0 bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden">
            {/* Hidden Preloader Area */}
            <div className="hidden pointer-events-none opacity-0 select-none">
                {prefetchFiles.map(file => (
                    <img key={`preload-${file}`} src={`/api/media?path=${encodeURIComponent(`${source?.replace(/\/$/, '')}/${file}`)}`} />
                ))}
            </div>

            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between p-6 z-20 gap-4">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="p-3 bg-neutral-900 rounded-full hover:bg-neutral-800 transition shadow-lg ring-1 ring-neutral-800 flex items-center space-x-2 group">
                        <ArrowLeft className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
                        <span className="pr-2 text-sm font-medium text-neutral-400 group-hover:text-white transition-colors hidden sm:inline">Back to Folders</span>
                    </Link>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center bg-neutral-900 border border-neutral-800 px-6 py-2 rounded-2xl shadow-lg ring-1 ring-blue-500/10 transition-colors hover:bg-neutral-800">
                        <span className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-0.5">Focus Photo</span>
                        <div className="flex items-center font-mono text-white font-bold text-lg leading-none">
                            {isEditingIndex ? (
                                <form onSubmit={handleEditIndexSubmit} className="inline-block">
                                    <input
                                        type="number"
                                        className="w-16 bg-black text-white px-1 py-0.5 rounded outline-none border border-blue-500/50 text-center text-lg"
                                        value={editInputValue}
                                        onChange={(e) => setEditInputValue(e.target.value)}
                                        onBlur={() => handleEditIndexSubmit()}
                                        autoFocus
                                        min={1}
                                        max={files.length}
                                    />
                                </form>
                            ) : (
                                <button
                                    onClick={() => {
                                        setEditInputValue((currentIndex + 1).toString());
                                        setIsEditingIndex(true);
                                    }}
                                    className="hover:text-blue-400 hover:scale-105 transition-all outline-none"
                                    title="Click to jump to a specific photo"
                                >
                                    {currentIndex + 1}
                                </button>
                            )}
                            <span className="text-neutral-600 mx-2">/</span> {files.length}
                        </div>
                    </div>

                    <div className="flex flex-col items-center bg-neutral-900 border border-neutral-800 px-6 py-2 rounded-2xl shadow-lg ring-1 ring-green-500/10">
                        <span className="text-[10px] uppercase tracking-widest text-green-500 font-bold mb-0.5">Kept in Target</span>
                        <p className="font-mono text-white font-bold text-lg leading-none">
                            {targetCount}
                        </p>
                    </div>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={undoLastAction}
                        disabled={history.length === 0 || isProcessing}
                        className="p-3 bg-neutral-900 rounded-full hover:bg-neutral-800 transition disabled:opacity-30 shadow-lg ring-1 ring-neutral-800 group"
                        title="Undo Last Action"
                    >
                        <RotateCcw className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </header>

            {/* Main Swiper Area */}
            <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
                {files.length === 0 ? (
                    <div className="text-neutral-500">No media found.</div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {visibleFiles.map(({ name, index }) => {
                                const isActive = index === currentIndex;
                                const offset = index - currentIndex;

                                // Only show 2 neighbors on each side to keep DOM light, 
                                // but keep buffer in memory via the hidden preloader.
                                if (Math.abs(offset) > 2) return null;

                                return (
                                    <motion.div
                                        key={`card-${name}`} // STABLE KEY - doesn't change when window shifts
                                        initial={{ opacity: 0, x: offset > 0 ? '100%' : '-100%' }}
                                        animate={{
                                            x: `${offset * 105}%`,
                                            scale: isActive ? 1 : 0.85,
                                            opacity: isActive ? 1 : 0.3,
                                            zIndex: isActive ? 10 : 5
                                        }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 35 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                        <div className="pointer-events-auto flex items-center justify-center w-full h-full">
                                            <SwipeCard
                                                fileName={name}
                                                sourceDir={source || ''}
                                                isActive={isActive}
                                                onSwipe={(direction) => handleSwipe(direction, index)}
                                                zIndex={isActive ? 10 : 5}
                                                decision={decisions[name]}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* Controls */}
                {!isFinished && files.length > 0 && (
                    <div className="absolute bottom-6 flex items-center justify-center space-x-8 w-full pointer-events-none">
                        <div className="flex flex-col items-center space-y-2 pointer-events-auto opacity-50 hover:opacity-100 transition">
                            <button
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentIndex === 0}
                                className="p-3 bg-neutral-900 rounded-full border border-neutral-800 disabled:opacity-10 shadow-xl"
                            >
                                <ArrowLeft className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>

                        <div className="flex items-center space-x-6">
                            <div className="flex flex-col items-center space-y-2 pointer-events-auto">
                                <button
                                    onClick={() => handleSwipe('left', currentIndex)}
                                    className="p-4 bg-neutral-900 rounded-full shadow-2xl ring-2 ring-red-500/20 hover:ring-red-500/50 hover:bg-red-500/10 transition-all active:scale-95 group"
                                >
                                    <X className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                                </button>
                                <span className="text-neutral-500 text-[9px] font-bold tracking-widest uppercase">Skip (Down)</span>
                            </div>

                            <div className="flex flex-col items-center space-y-2 pointer-events-auto">
                                <button
                                    onClick={() => handleSwipe('right', currentIndex)}
                                    className="p-4 bg-neutral-900 rounded-full shadow-2xl ring-2 ring-green-500/20 hover:ring-green-500/50 hover:bg-green-500/10 transition-all active:scale-95 group"
                                >
                                    <Check className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                                </button>
                                <span className="text-neutral-500 text-[9px] font-bold tracking-widest uppercase">Keep (Up)</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-2 pointer-events-auto opacity-50 hover:opacity-100 transition">
                            <button
                                onClick={() => setCurrentIndex(prev => Math.min(files.length - 1, prev + 1))}
                                disabled={currentIndex === files.length - 1}
                                className="p-3 bg-neutral-900 rounded-full border border-neutral-800 disabled:opacity-10 shadow-xl"
                            >
                                <ArrowLeft className="w-5 h-5 text-neutral-400 rotate-180" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
