'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, RefreshCw, CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaceEnrollmentProps {
    studentId: string;
    studentName: string;
    profilePhoto?: string;
    onSuccess?: () => void;
    onClose: () => void;
}

export default function FaceEnrollment({ studentId, studentName, profilePhoto, onSuccess, onClose }: FaceEnrollmentProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<'IDLE' | 'LOADING_MODELS' | 'READY' | 'CAPTURING' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [isUsingPhoto, setIsUsingPhoto] = useState(false);

    useEffect(() => {
        loadModels();
        return () => {
            stopCamera();
        };
    }, []);

    const loadModels = async () => {
        try {
            setStatus('LOADING_MODELS');
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setModelsLoaded(true);
            setStatus('READY');
            startCamera();
        } catch (err: any) {
            console.error('Error loading models:', err);
            setError('মডেল লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
            setStatus('ERROR');
        }
    };

    const startCamera = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error('Error accessing camera:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('ক্যামেরা ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজারের বাম পাশের লক আইকন থেকে পারমিশন পরিবর্তন করতে পারেন।');
            } else {
                setError('ক্যামেরা চালু করা সম্ভব হয়নি। দয়া করে ফটো আপলোড অপশনটি ব্যবহার করুন।');
            }
            // Don't set status to ERROR if models loaded successfully
            if (status !== 'ERROR') setStatus('READY');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const processImage = async (imgSource: HTMLImageElement | string | File) => {
        try {
            setStatus('CAPTURING');
            setError(null);
            setProgress(20);

            let img: HTMLImageElement;
            if (imgSource instanceof HTMLImageElement) {
                img = imgSource;
            } else if (imgSource instanceof File) {
                img = await faceapi.bufferToImage(imgSource);
            } else {
                img = await faceapi.fetchImage(imgSource);
            }

            setProgress(40);
            const detections = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detections) {
                setError('ছবিতে কোনো মুখ পাওয়া যায়নি। দয়া করে পরিষ্কার ছবি ব্যবহার করুন।');
                setStatus('READY');
                return;
            }

            setProgress(70);
            setStatus('SAVING');

            const response = await fetch(`/api/students/${studentId}/face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descriptor: Array.from(detections.descriptor) }),
            });

            if (!response.ok) throw new Error('Failed to save face data');

            setProgress(100);
            setStatus('SUCCESS');
            if (onSuccess) onSuccess();

            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err: any) {
            console.error('Image processing error:', err);
            setError('ছবি প্রসেস করতে সমস্যা হয়েছে।');
            setStatus('READY');
        } finally {
            setIsUsingPhoto(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUsingPhoto(true);
        await processImage(file);
        if (uploadInputRef.current) uploadInputRef.current.value = '';
    };

    const useProfilePhoto = async () => {
        if (!profilePhoto) return;
        setIsUsingPhoto(true);
        await processImage(profilePhoto);
    };

    const handleEnroll = async () => {
        if (!videoRef.current) return;

        try {
            setStatus('CAPTURING');
            setProgress(20);

            const detections = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detections) {
                setError('আপনার মুখ স্পষ্টভাবে বোঝা যাচ্ছে না। পর্যাপ্ত আলোতে আবার চেষ্টা করুন।');
                setStatus('READY');
                return;
            }

            setProgress(60);
            setStatus('SAVING');

            // Save to database
            const response = await fetch(`/api/students/${studentId}/face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descriptor: Array.from(detections.descriptor) }),
            });

            if (!response.ok) throw new Error('Failed to save face data');

            setProgress(100);
            setStatus('SUCCESS');
            if (onSuccess) onSuccess();

            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err: any) {
            console.error('Enrollment error:', err);
            setError('ফেস ডেটা সেভ করতে সমস্যা হয়েছে।');
            setStatus('READY');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
            >
                {/* Header */}
                <div className="px-6 py-5 border-bottom border-slate-50 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-[16px] font-black text-slate-800 tracking-tight">ফেস আইডি রেজিস্ট্রেসন</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{studentName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <XCircle size={20} className="text-slate-300" />
                    </button>
                </div>

                {/* Camera View */}
                <div className="relative aspect-square bg-slate-950 overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover mirror scale-x-[-1]"
                    />

                    {/* Face Overlay Guideline */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center">
                            <div className="w-56 h-56 border-2 border-white/40 rounded-full" />
                        </div>
                    </div>

                    {/* Status Overlays */}
                    <AnimatePresence>
                        {status === 'LOADING_MODELS' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white text-center p-6">
                                <Loader2 className="animate-spin text-[#045c84] mb-4" size={40} />
                                <h4 className="text-lg font-black mb-1">সিস্টেম প্রস্তুত হচ্ছে...</h4>
                                <p className="text-sm text-slate-400 font-bold">প্রথমবার লোড হতে কিছুক্ষণ সময় লাগতে পারে</p>
                            </motion.div>
                        )}

                        {status === 'SUCCESS' && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 bg-[#045c84]/90 flex flex-col items-center justify-center text-white text-center p-6">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 size={40} strokeWidth={3} />
                                </div>
                                <h4 className="text-xl font-black mb-1">সাফল্যের সাথে সেভ হয়েছে!</h4>
                                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">ফেস আইডি এখন সচল</p>
                            </motion.div>
                        )}

                        {error && (error.includes('ক্যামেরা') || error.includes('অনুমতি')) && status === 'READY' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-center p-6 backdrop-blur-md">
                                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-4 border border-white/20">
                                    <Camera size={28} className="text-white/60" />
                                </div>
                                <h4 className="text-[13px] font-black mb-1 italic">স্ক্যানার নিষ্ক্রিয়</h4>
                                <p className="text-[10px] font-bold text-slate-300 max-w-[220px] leading-relaxed mb-6">
                                    ক্যামেরা কাজ না করলে সরাসরি ফটো আপলোড করে ট্রাই করুন।
                                </p>
                                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                    <button
                                        onClick={() => uploadInputRef.current?.click()}
                                        className="py-2.5 bg-white text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-lg shadow-white/10"
                                    >
                                        ফটো আপলোড করুন
                                    </button>
                                    <button
                                        onClick={startCamera}
                                        className="py-2.5 bg-white/5 hover:bg-white/10 text-white/80 font-black rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 text-[11px]"
                                    >
                                        আবার চেষ্টা করুন
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Progress Bar */}
                    {(status === 'CAPTURING' || status === 'SAVING') && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-[#045c84]"
                            />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50/50">
                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={uploadInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                    />

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                            <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-red-600 leading-tight">{error}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <button
                                disabled={!modelsLoaded || isUsingPhoto || status === 'SAVING' || status === 'CAPTURING'}
                                onClick={handleEnroll}
                                className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl text-[14px] font-black transition-all ${modelsLoaded && !isUsingPhoto && status !== 'SAVING' && status !== 'CAPTURING'
                                    ? 'bg-[#045c84] text-white shadow-lg shadow-[#045c84]/20 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {status === 'CAPTURING' || status === 'SAVING' ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <Camera size={18} />
                                        <span>ছবি তুলুন</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setError(null);
                                    startCamera();
                                }}
                                className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-[#045c84] hover:text-white transition-all active:scale-95 shadow-sm"
                                title="ক্যামেরা আবার চেষ্টা করুন"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {profilePhoto && (
                                <button
                                    disabled={!modelsLoaded || isUsingPhoto || status === 'SAVING' || status === 'CAPTURING'}
                                    onClick={useProfilePhoto}
                                    className="flex items-center justify-center gap-2 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all disabled:opacity-50"
                                >
                                    <Sparkles size={14} />
                                    প্রোফাইল ফটো ব্যবহার
                                </button>
                            )}
                            <button
                                disabled={!modelsLoaded || isUsingPhoto || status === 'SAVING' || status === 'CAPTURING'}
                                onClick={() => uploadInputRef.current?.click()}
                                className={`flex items-center justify-center gap-2 h-12 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50 ${!profilePhoto ? 'col-span-2' : ''}`}
                            >
                                <RefreshCw size={14} className="rotate-45" />
                                ফটো আপলোড
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
                        <Sparkles size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Advanced Biometric Enrollment System</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
