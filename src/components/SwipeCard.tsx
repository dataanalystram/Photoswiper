'use client';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';

interface SwipeCardProps {
    fileName: string;
    sourceDir: string;
    onSwipe: (direction: 'left' | 'right') => void;
    isActive: boolean;
    zIndex: number;
    decision?: 'copy' | 'skip';
}

export default function SwipeCard({ fileName, sourceDir, onSwipe, isActive, zIndex, decision }: SwipeCardProps) {
    const y = useMotionValue(0);
    const rotate = useTransform(y, [-300, 300], [-5, 5]);
    const scale = useTransform(y, [-300, 0, 300], [1.05, 1, 0.95]);

    const nopeOpacity = useTransform(y, [0, 50, 150], [0, 0, 1]);
    const yesOpacity = useTransform(y, [-150, -50, 0], [1, 0, 0]);

    const [exitY, setExitY] = useState<number>(0);
    const [isExiting, setIsExiting] = useState(false);
    const hasSwipedRef = useRef(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const triggerSwipe = useCallback((direction: 'left' | 'right') => {
        if (hasSwipedRef.current) return;
        hasSwipedRef.current = true;

        const exitPos = direction === 'right' ? -1200 : 1200;
        setExitY(exitPos);
        setIsExiting(true);
        setTimeout(() => onSwipe(direction), 250);
    }, [onSwipe]);

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!isActive || isExiting) return;
        const threshold = 120;
        const velocity = info.velocity.y;

        if (info.offset.y < -threshold || velocity < -500) {
            triggerSwipe('right');
        } else if (info.offset.y > threshold || velocity > 500) {
            triggerSwipe('left');
        }
    };

    const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleWheel = (e: React.WheelEvent) => {
        if (!isActive || isExiting || hasSwipedRef.current) return;

        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            const currentY = y.get();
            const newY = currentY - e.deltaY * 1.2;
            y.set(newY);

            const threshold = 180;
            if (newY < -threshold) {
                triggerSwipe('right');
            } else if (newY > threshold) {
                triggerSwipe('left');
            }

            if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
            wheelTimeoutRef.current = setTimeout(() => {
                if (!isExiting && !hasSwipedRef.current) {
                    y.set(0);
                }
            }, 100);
        }
    };

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (!isActive) {
            // When card becomes inactive (user swiped past it or used buttons),
            // we wait a short delay for any "throwing" animation to finish, 
            // then reset it so it reappears correctly in the background carousel row.
            timeout = setTimeout(() => {
                if (hasSwipedRef.current || isExiting) {
                    setIsExiting(false);
                    setExitY(0);
                    hasSwipedRef.current = false;
                    y.set(0);
                }
            }, 300);
        } else {
            // Ensure card is reset if it becomes active again (e.g. undo)
            if (isExiting || hasSwipedRef.current) {
                // Schedule state updates to the next tick to avoid synchronous setState warning
                setTimeout(() => {
                    setIsExiting(false);
                    setExitY(0);
                    hasSwipedRef.current = false;
                    y.set(0);
                }, 0);
            }
        }
        return () => clearTimeout(timeout);
    }, [isActive, isExiting, y]);

    useEffect(() => {
        if (!isActive || isExiting || hasSwipedRef.current) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') {
                triggerSwipe('right');
            } else if (e.key === 'ArrowDown') {
                triggerSwipe('left');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, isExiting, triggerSwipe]);

    const isVideo = fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i);
    const mediaUrl = `/api/media?path=${encodeURIComponent(`${sourceDir.replace(/\/$/, '')}/${fileName}`)}`;

    return (
        <motion.div
            style={{
                y: isExiting ? exitY : y,
                rotate,
                scale: isActive ? scale : 0.9,
                zIndex,
                opacity: isActive ? 1 : 0.4,
            }}
            drag={isActive ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            onWheel={handleWheel}
            animate={isExiting ? { y: exitY, opacity: 0 } : { y: 0, opacity: isActive ? 1 : 0.4, scale: isActive ? 1 : 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className={`relative w-[90vw] h-[75vh] max-w-6xl bg-neutral-900 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] border border-neutral-800/50 overflow-hidden cursor-grab active:cursor-grabbing flex flex-col items-center justify-center transition-opacity duration-300`}
        >
            {/* Loading Spinner */}
            {!isVideo && !isImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-10">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Decision Status Badge */}
            {decision && !isExiting && (
                <div className={`absolute top-8 left-1/2 -translate-x-1/2 z-30 px-8 py-2 rounded-full border-2 font-bold text-sm tracking-widest uppercase shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-300 ${decision === 'copy' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'
                    }`}>
                    {decision === 'copy' ? 'KEPT' : 'SKIPPED'}
                </div>
            )}

            {/* Gestures Overlays */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <motion.div style={{ opacity: yesOpacity }} className="absolute top-12 left-1/2 -translate-x-1/2 bg-green-500/20 backdrop-blur-xl rounded-full p-8 border-4 border-green-500 flex flex-col items-center">
                    <Check className="w-20 h-20 text-green-500" />
                    <span className="text-green-500 font-bold text-xl mt-2 tracking-widest uppercase">KEEP</span>
                </motion.div>

                <motion.div style={{ opacity: nopeOpacity }} className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-red-500/20 backdrop-blur-xl rounded-full p-8 border-4 border-red-500 flex flex-col items-center">
                    <X className="w-20 h-20 text-red-500" />
                    <span className="text-red-500 font-bold text-xl mt-2 tracking-widest uppercase">SKIP</span>
                </motion.div>
            </div>

            {/* Media Content */}
            <div className="w-full h-full relative">
                {isVideo ? (
                    <video
                        src={mediaUrl}
                        className="w-full h-full object-contain"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                ) : (
                    <div className={`w-full h-full relative transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                        {/* Use native img to avoid Next.js Image configuration issues with dynamic local API routes */}
                        <img
                            src={mediaUrl}
                            alt={fileName}
                            className="w-full h-full object-contain select-none pointer-events-none"
                            onLoad={() => setIsImageLoaded(true)}
                            draggable={false}
                        />
                    </div>
                )}
            </div>

            {/* File Label Overlay */}
            <div className="absolute bottom-0 w-full p-10 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-20">
                <p className="text-white font-bold truncate text-3xl tracking-tight drop-shadow-2xl">
                    {fileName}
                </p>
            </div>
        </motion.div>
    );
}
