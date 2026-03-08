'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as faceapi from '@vladmandic/face-api';
import {
    Camera,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Loader2,
    Users,
    ChevronDown,
    Zap,
    History,
    Search,
    Upload,
    Clock,
    UserCheck,
    Check,
    CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from './SessionProvider';

interface EnrolledStudent {
    id: string;
    name: string;
    classId: string;
    faceDescriptor: number[];
    photo?: string;
    stats?: {
        totalDays: number;
        presentDays: number;
        percentage: number;
    };
}

type AttendanceStatus = 'IDLE' | 'LOADING_MODELS' | 'LOADING_STUDENTS' | 'INITIALIZING' | 'SCANNING' | 'ERROR';

// Global scope
let modelsLoadingPromise: Promise<void> | null = null;

export default function FRSAttendanceScanner({ classId: propClassId, selectedDate }: { classId?: string, selectedDate?: string }) {
    const { activeInstitute } = useSession();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>(propClassId || '');
    const [students, setStudents] = useState<EnrolledStudent[]>([]);
    const [status, setStatus] = useState<AttendanceStatus>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
    const [markedStudents, setMarkedStudents] = useState<Set<string>>(new Set());
    const [lastMarked, setLastMarked] = useState<{ name: string, time: string, photo?: string } | null>(null);
    const [isTestMode, setIsTestMode] = useState(false);
    const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Multi-device sync states
    const [deviceId] = useState(() => Math.random().toString(36).substring(2, 10));
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { deviceId: string, timestamp: Date }>>({});

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const uploadImgRef = useRef<HTMLInputElement>(null);
    const markingCooldown = useRef<{ [key: string]: number }>({});
    const hasAutoStarted = useRef(false);

    // Web Audio API Context & Buffers
    const audioCtx = useRef<AudioContext | null>(null);
    const audioBuffers = useRef<{ [key: string]: AudioBuffer }>({});

    useEffect(() => {
        const loadSound = async (url: string, key: string) => {
            try {
                if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioCtx.current.decodeAudioData(arrayBuffer);
                audioBuffers.current[key] = audioBuffer;
            } catch (err) {
                console.error(`Failed to load sound: ${url}`, err);
            }
        };

        loadSound('/audio/success.mp3', 'success');
        loadSound('/audio/denied.mp3', 'fail');

        return () => {
            if (audioCtx.current) audioCtx.current.close();
        };
    }, []);

    // Sync prop classId if provided
    useEffect(() => {
        if (propClassId !== undefined) {
            setSelectedClassId(propClassId);
        }
    }, [propClassId]);

    useEffect(() => {
        if (activeInstitute && !propClassId) {
            fetchClasses();
        }
        if (activeInstitute) {
            fetchEnrolledStudents(propClassId || selectedClassId);
        }
        loadModels();
    }, [activeInstitute, propClassId, selectedClassId, selectedDate]);

    const fetchClasses = async () => {
        try {
            const res = await fetch(`/api/admin/classes?instituteId=${activeInstitute?.id}`);
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
                if (data.length > 0 && !selectedClassId && !propClassId) {
                    setSelectedClassId(data[0].id);
                }
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    const fetchEnrolledStudents = async (forcedClassId?: string) => {
        if (!activeInstitute) return;
        const targetClassId = forcedClassId !== undefined ? forcedClassId : selectedClassId;

        setStatus('LOADING_STUDENTS');
        try {
            // Use provided selectedDate or fallback to current local date if absolutely missing
            const today = selectedDate || new Date().toISOString().split('T')[0];

            const [studentsRes, attendanceRes, statsRes] = await Promise.all([
                fetch(`/api/admin/users?role=STUDENT&instituteId=${activeInstitute.id}&classId=${targetClassId}`),
                fetch(`/api/attendance/list?instituteId=${activeInstitute.id}&date=${today}`),
                fetch(`/api/attendance/stats?instituteId=${activeInstitute.id}&classId=${targetClassId}`)
            ]);

            if (studentsRes.ok) {
                const data = await studentsRes.json();
                const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];
                const statsData = statsRes.ok ? await statsRes.json() : [];

                const normalizeId = (id: any): string => {
                    if (!id) return '';
                    if (typeof id === 'string') return id;
                    if (typeof id === 'object') {
                        if (id.$oid) return id.$oid;
                        if (id.toString && typeof id.toString === 'function') return id.toString();
                    }
                    return String(id);
                };

                const statsMap = new Map(statsData.map((s: any) => [normalizeId(s.studentId), s]));

                const fullStudents = data.map((s: any) => ({
                    id: normalizeId(s.id),
                    name: s.name,
                    classId: s.metadata?.classId,
                    faceDescriptor: s.faceDescriptor,
                    photo: s.metadata?.studentPhoto,
                    stats: statsMap.get(normalizeId(s.id))
                }));

                const enrolled = fullStudents.filter((s: any) => s.faceDescriptor && s.faceDescriptor.length > 0);
                setStudents(fullStudents);

                if (attendanceRes.ok) {
                    const present = attendanceData.filter((a: any) => ['PRESENT', 'LATE', 'LEAVE'].includes(a.status));
                    const presentIds = present.map((a: any) => normalizeId(a.studentId));

                    const newRecords: Record<string, { deviceId: string, timestamp: Date }> = {};
                    present.forEach((a: any) => {
                        const sId = normalizeId(a.studentId);
                        if (sId) {
                            newRecords[sId] = {
                                deviceId: a.remarks || 'unknown',
                                timestamp: new Date(a.createdAt || a.updatedAt || Date.now())
                            };
                        }
                    });

                    setAttendanceRecords(newRecords);
                    setMarkedStudents(new Set(presentIds.filter(Boolean)));
                }

                if (enrolled.length > 0) {
                    const labeledDescriptors = enrolled.map((s: any) =>
                        new faceapi.LabeledFaceDescriptors(s.id, [new Float32Array(s.faceDescriptor)])
                    );
                    setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
                } else {
                    setFaceMatcher(null);
                }
            }
            setStatus('IDLE');
        } catch (err) {
            console.error('Error fetching enrolled students:', err);
            setError('ছাত্রদের তথ্য লোড করতে সমস্যা হয়েছে।');
            setStatus('IDLE');
        }
    };

    const classStudents = useMemo(() => {
        // propClassId is explicitly passed from Dashboard. It can be '' for "All classes".
        // Only fallback to internal selectedClassId if propClassId is strictly undefined.
        const targetClass = propClassId !== undefined ? propClassId : selectedClassId;
        if (!targetClass) return students; // Returns all students if targetClass is ''
        return students.filter(s => s.classId === targetClass);
    }, [students, propClassId, selectedClassId]);

    const classMarkedStudents = useMemo(() => {
        const targetClass = propClassId !== undefined ? propClassId : selectedClassId;
        const markedArray = Array.from(markedStudents);

        return new Set(
            markedArray.filter(id => {
                const sId = String(id);
                const student = students.find(s => s.id === sId);
                if (!student) return false;
                if (!targetClass) return true;
                return student.classId === targetClass;
            })
        );
    }, [markedStudents, students, propClassId, selectedClassId]);

    const loadModels = async () => {
        if (modelsLoaded) return;
        try {
            if (!modelsLoadingPromise) {
                modelsLoadingPromise = Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]).then(() => { });
            }
            await modelsLoadingPromise;
            setModelsLoaded(true);
        } catch (err) {
            console.error('Error loading face-api models:', err);
            setError('AI মডেল লোড করতে সমস্যা হয়েছে।');
        }
    };

    const playSound = (type: 'success' | 'fail') => {
        try {
            if (!audioCtx.current || !audioBuffers.current[type]) return;

            // Resume context if suspended (browser policy)
            if (audioCtx.current.state === 'suspended') {
                audioCtx.current.resume();
            }

            const source = audioCtx.current.createBufferSource();
            source.buffer = audioBuffers.current[type];
            source.connect(audioCtx.current.destination);
            source.start(0);
        } catch (e) {
            console.error('Audio playback error:', e);
        }
    };

    const startScanner = async () => {
        // Allow starting even if selectedClassId is '' (All Classes)
        if (selectedClassId === null && !isTestMode) {
            setError('দয়া করে একটি ক্লাস নির্বাচন করুন।');
            return;
        }

        setError(null);
        setStatus('INITIALIZING');


        try {
            await loadModels();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
                setStatus('SCANNING');
                setIsTestMode(false);
            }
        } catch (err: any) {
            console.error('Error accessing camera:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission dismissed')) {
                setError('PERMISSION_DENIED');
            } else {
                setError('ক্যামেরা অ্যাক্সেস করতে সমস্যা হয়েছে।');
            }
            setStatus('IDLE');
        }
    };

    const stopScanner = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setIsCameraActive(false);
            setStatus('IDLE');
            setIsTestMode(false);
        }
    };

    // Real-time Sync Polling
    useEffect(() => {
        if (!activeInstitute) return;
        const interval = setInterval(async () => {
            try {
                const today = selectedDate || new Date().toISOString().split('T')[0];
                const res = await fetch(`/api/attendance/list?instituteId=${activeInstitute.id}&date=${today}`);
                if (res.ok) {
                    const data = await res.json();
                    const normalizeId = (id: any) => {
                        if (!id) return '';
                        if (typeof id === 'string') return id;
                        if (typeof id === 'object') {
                            if (id.$oid) return id.$oid;
                            if (id.toString) return id.toString();
                        }
                        return String(id);
                    };

                    const present = data.filter((a: any) => ['PRESENT', 'LATE', 'LEAVE'].includes(a.status));

                    setMarkedStudents(prevMarked => {
                        const nextMarked = new Set(prevMarked);
                        let changed = false;
                        present.forEach((a: any) => {
                            const sId = normalizeId(a.studentId);
                            if (!nextMarked.has(sId)) {
                                nextMarked.add(sId);
                                changed = true;
                            }
                        });
                        return changed ? nextMarked : prevMarked;
                    });

                    setAttendanceRecords(prevRec => {
                        const nextRec = { ...prevRec };
                        let changed = false;
                        present.forEach((a: any) => {
                            const sId = normalizeId(a.studentId);
                            if (!nextRec[sId] || nextRec[sId].deviceId !== a.remarks) {
                                nextRec[sId] = {
                                    deviceId: a.remarks || 'unknown',
                                    timestamp: new Date(a.createdAt || a.updatedAt)
                                };
                                changed = true;
                            }
                        });
                        return changed ? nextRec : prevRec;
                    });
                }
            } catch (e) {
                console.error('Sync error', e);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [activeInstitute, selectedDate]);

    // Auto-start Scanner
    useEffect(() => {
        if (students.length > 0 && !isCameraActive && status === 'IDLE' && !error && !isTestMode && !hasAutoStarted.current) {
            // Only auto-start if we haven't hit a permission error or explicit error state
            // AND we haven't already tried to auto-start this mount
            if (error !== 'PERMISSION_DENIED') {
                hasAutoStarted.current = true;
                startScanner();
            }
        }
    }, [students, isCameraActive, status, error, isTestMode]);

    const markAttendance = async (studentId: string, studentName: string, overrideClassId?: string) => {
        const now = Date.now();
        if (markingCooldown.current[studentId] && now - markingCooldown.current[studentId] < 10000) {
            return;
        }
        markingCooldown.current[studentId] = now;

        try {
            const dateString = selectedDate || new Date().toISOString().split('T')[0];
            const deviceId = localStorage.getItem('attendance_device_id') || 'unknown';
            const response = await fetch('/api/attendance/mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    instituteId: activeInstitute?.id,
                    classId: overrideClassId || selectedClassId || students.find(s => s.id === studentId)?.classId,
                    dateString,
                    status: 'PRESENT',
                    method: 'FRS',
                    remarks: deviceId
                }),
            });

            if (response.ok) {
                setMarkedStudents(prev => new Set(prev).add(studentId));
                setAttendanceRecords(prev => ({
                    ...prev,
                    [studentId]: { deviceId, timestamp: new Date() }
                }));
                const student = students.find(s => s.id === studentId);
                setLastMarked({ name: studentName, time: new Date().toLocaleTimeString('bn-BD'), photo: student?.photo });
                setTimeout(() => setLastMarked(null), 4000);
            }
        } catch (err) {
            console.error('Error marking attendance:', err);
        }
    };

    const unmarkAttendance = async (studentId: string) => {
        try {
            const dateString = selectedDate || new Date().toISOString().split('T')[0];

            const response = await fetch('/api/attendance/unmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, dateString }),
            });

            if (response.ok) {
                setMarkedStudents(prev => {
                    const next = new Set(prev);
                    next.delete(studentId);
                    return next;
                });
                setAttendanceRecords(prev => {
                    const next = { ...prev };
                    delete next[studentId];
                    return next;
                });
                // Optional: success toast could go here
            } else {
                const errorData = await response.json();
                alert(`হাজিরা বাতিল করা যায়নি: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error unmarking attendance:', error);
            alert('সার্ভারে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeInstitute) return;
        setError(null);
        setIsProcessingPhoto(true);

        try {
            await loadModels();
            const img = await faceapi.bufferToImage(file);
            let currentMatcher = faceMatcher;
            let currentStudents = students;

            if (isTestMode) {
                const res = await fetch(`/api/admin/users?role=STUDENT&instituteId=${activeInstitute.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const enrolled = data
                        .filter((s: any) => s.faceDescriptor && s.faceDescriptor.length > 0)
                        .map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            classId: s.metadata?.classId,
                            faceDescriptor: s.faceDescriptor,
                            photo: s.metadata?.photo
                        }));
                    currentStudents = enrolled;
                    const labeledDescriptors = enrolled.map((s: any) =>
                        new faceapi.LabeledFaceDescriptors(s.id, [new Float32Array(s.faceDescriptor)])
                    );
                    currentMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
                }
            }

            if (!currentMatcher) {
                setError('কোনো এনরোলড ছাত্র পাওয়া যায়নি।');
                return;
            }

            const detections = await faceapi
                .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();

            if (detections.length === 0) {
                setError('ছবিতে কোনো মুখ পাওয়া যায়নি।');
            } else {
                setStatus('SCANNING');
                if (canvasRef.current) {
                    const displaySize = { width: 640, height: 480 };
                    faceapi.matchDimensions(canvasRef.current, displaySize);
                    const ctx = canvasRef.current.getContext('2d');
                    ctx?.drawImage(img, 0, 0, 640, 480);
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    resizedDetections.forEach(detection => {
                        const result = currentMatcher!.findBestMatch(detection.descriptor);
                        const label = result.label;
                        const student = currentStudents.find(s => s.id === label);
                        const box = detection.detection.box;
                        const drawBox = new faceapi.draw.DrawBox(box, {
                            label: student ? student.name : 'অচেনা',
                            boxColor: student ? '#10b981' : '#f43f5e'
                        });
                        drawBox.draw(canvasRef.current!);
                        if (student) markAttendance(student.id, student.name, student.classId);
                    });
                }
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            setError('ছবি প্রসেস করতে সমস্যা হয়েছে।');
        } finally {
            setIsProcessingPhoto(false);
            if (uploadImgRef.current) uploadImgRef.current.value = '';
            setTimeout(() => {
                const ctx = canvasRef.current?.getContext('2d');
                ctx?.clearRect(0, 0, canvasRef.current?.width || 640, canvasRef.current?.height || 480);
                setStatus('IDLE');
                setIsTestMode(false);
                setIsCameraActive(false);
            }, 5000);
        }
    };

    const lastSoundPlayed = useRef<{ [label: string]: number }>({});

    useEffect(() => {
        // Better approach: use Web Audio API for reliable generated sounds using single context
        // processFrame will use the playSound from the outer scope

        let interval: NodeJS.Timeout;
        const processFrame = async () => {
            if (status !== 'SCANNING' || !videoRef.current || !faceMatcher || !isCameraActive) return;
            const detections = await faceapi
                .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();
            if (detections.length > 0 && canvasRef.current) {
                const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
                faceapi.matchDimensions(canvasRef.current, displaySize);
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, displaySize.width, displaySize.height);
                    resizedDetections.forEach(detection => {
                        const result = faceMatcher.findBestMatch(detection.descriptor);
                        const label = result.label;
                        const student = students.find(s => s.id === label);
                        const box = detection.detection.box;
                        const drawBox = new faceapi.draw.DrawBox(box, {
                            label: student ? student.name : 'অচেনা',
                            boxColor: student ? '#10b981' : '#f43f5e'
                        });
                        drawBox.draw(canvasRef.current!);

                        // Audio Feedback Logic
                        const now = Date.now();
                        const soundCooldown = 3000; // 3 seconds before playing sound again for the same person/unknown
                        const trackLabel = student ? student.id : 'unknown';

                        if (!lastSoundPlayed.current[trackLabel] || now - lastSoundPlayed.current[trackLabel] > soundCooldown) {
                            playSound(student ? 'success' : 'fail');
                            lastSoundPlayed.current[trackLabel] = now;
                        }

                        if (student) markAttendance(student.id, student.name, student.classId);
                    });
                }
            } else if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        };
        if (status === 'SCANNING' && !isTestMode) interval = setInterval(processFrame, 500);
        return () => { if (interval) clearInterval(interval); };
    }, [status, faceMatcher, students, isCameraActive, isTestMode]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Scanner Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative aspect-video bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white ring-8 ring-slate-100/50 group">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full scale-x-[-1]" />

                        <AnimatePresence mode="wait">
                            {(status === 'IDLE' || (status as string) === 'ERROR') && !isCameraActive && (
                                <motion.div key="scanner-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-4">
                                    <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center mb-6 ring-8 ring-white/5 group-hover:scale-110 transition-transform duration-500">
                                        <Camera size={32} className="text-white/80" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 italic uppercase tracking-tighter">স্মার্ট হাজিরা সিস্টেম</h3>
                                    <p className="text-xs font-bold text-slate-300 max-w-[320px] mb-8 leading-relaxed opacity-60">ক্যামেরা দিয়ে অটো হাজিরা নিতে "স্ক্যান শুরু" ক্লিক করুন অথবা ফটো আপলোড করে চেক করুন।</p>
                                    <div className="flex gap-4 w-full max-w-[480px]">
                                        <button onClick={startScanner} disabled={status === 'LOADING_STUDENTS'} className="flex-1 py-4 bg-[#045c84] text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#034a6b] transition-all flex items-center justify-center gap-2 group/btn">
                                            <Zap size={18} className="group-hover/btn:animate-pulse" />
                                            স্ক্যান শুরু করুন
                                        </button>
                                        <button onClick={() => { setIsTestMode(true); uploadImgRef.current?.click(); }} className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2">
                                            <Upload size={18} />
                                            ফটো আপলোড
                                        </button>
                                    </div>
                                    <input ref={uploadImgRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                </motion.div>
                            )}

                            {status === 'INITIALIZING' && (
                                <motion.div key="scanner-initializing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white">
                                    <Loader2 size={48} className="animate-spin text-[#045c84] mb-6" />
                                    <p className="text-sm font-black italic tracking-widest text-[#045c84] uppercase">Initalizing Hardware...</p>
                                </motion.div>
                            )}

                            {error === 'PERMISSION_DENIED' && (
                                <motion.div key="scanner-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center text-white p-8">
                                    <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-rose-500/10">
                                        <XCircle size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 italic">ক্যামেরা পারমিশন নেই</h3>
                                    <p className="text-xs font-bold text-slate-400 max-w-[320px] mb-8 leading-relaxed">ব্রাউজার সেটিংস থেকে ক্যামেরা ব্যবহারের অনুমতি দিন অথবা ফটো আপলোড করে হাজিরা দিন।</p>
                                    <div className="flex gap-4">
                                        <button onClick={startScanner} className="px-8 py-4 bg-[#045c84] text-white font-black rounded-2xl shadow-xl hover:bg-[#034a6b] transition-all active:scale-95 text-[14px] flex items-center gap-2">
                                            <RefreshCw size={18} /> আবার চেষ্টা করুন
                                        </button>
                                        <button onClick={() => { setIsTestMode(true); uploadImgRef.current?.click(); }} className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-95 text-[14px]">ফটো আপলোড</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Recent detection pop-up */}
                        <AnimatePresence mode="wait">
                            {lastMarked && (
                                <motion.div key="detection-popup" initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-4 border-2 border-white/30 z-50 min-w-[320px]">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden border border-white/20">
                                        {lastMarked.photo ? <img src={lastMarked.photo} className="w-full h-full object-cover" /> : <CheckCircle2 size={24} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black opacity-80 uppercase tracking-widest leading-none mb-1">Marked Present</p>
                                        <p className="text-lg font-black italic uppercase leading-tight truncate">{lastMarked.name}</p>
                                    </div>
                                    <div className="text-[11px] font-black bg-black/10 px-3 py-2 rounded-xl uppercase">{lastMarked.time}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Top Indicators */}
                        <div className="absolute top-6 left-6 flex items-center gap-2">
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10">
                                <div className={`w-2 h-2 rounded-full ${status === 'SCANNING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest pt-0.5 italic">
                                    {status === 'SCANNING' ? (isTestMode ? 'Test Mode' : 'Live Mode') : 'Standby'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 bg-blue-600/80 backdrop-blur-md rounded-2xl border border-white/10 text-white">
                                <span className="text-[10px] font-black uppercase italic tracking-widest pt-0.5">Pool: {students.length}</span>
                            </div>
                        </div>

                        {status === 'SCANNING' && !isTestMode && (
                            <button onClick={stopScanner} className="absolute bottom-6 right-6 w-14 h-14 bg-rose-500/90 text-white rounded-2xl transition-all z-40 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 border-2 border-white/20 blur-none">
                                <XCircle size={28} />
                            </button>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { id: 'stat-attended', label: 'Attended', value: classMarkedStudents.size, color: 'emerald', icon: UserCheck },
                            { id: 'stat-absent', label: 'Absent', value: classStudents.length - classMarkedStudents.size, color: 'rose', icon: XCircle },
                            { id: 'stat-pool', label: 'Class Pool', value: classStudents.length, color: 'blue', icon: Users },
                        ].map((stat) => (
                            <div key={stat.id} className="bg-white p-6 rounded-[32px] border border-slate-200 flex items-center gap-5 group hover:shadow-xl transition-all duration-500">
                                <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic opacity-60">{stat.label}</p>
                                    <p className="text-2xl font-black text-slate-800 leading-none">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile Only: Attended Students Horizontal List (Below Camera/Stats) */}
                    <div className="lg:hidden bg-white rounded-[32px] border border-emerald-100 p-5 shadow-sm overflow-hidden h-[200px] flex flex-col">
                        <div className="flex items-center gap-2 mb-4 px-2 shrink-0">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <h4 className="text-sm font-black text-emerald-600 italic uppercase">উপস্থিত ছাত্রছাত্রী</h4>
                            <span className="ml-auto bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-lg text-[10px] font-black">{classMarkedStudents.size} জন</span>
                        </div>
                        {classMarkedStudents.size === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                                <Users size={24} className="mb-2 text-emerald-300" />
                                <p className="text-[10px] font-bold text-emerald-600 uppercase italic">কোনো রেকর্ড নেই</p>
                            </div>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-2 flex-1 items-start">
                                <AnimatePresence>
                                    {Array.from(classMarkedStudents).reverse().map((id, idx) => {
                                        const student = students.find(s => s.id === id);
                                        if (!student) return null;
                                        return (
                                            <motion.div
                                                key={`mobile-attn-${id || idx}`}
                                                initial={{ opacity: 0, scale: 0.9, x: -20 }}
                                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                                className={`min-w-[140px] rounded-2xl border-2 p-3 flex flex-col items-center text-center relative shadow-sm group/card ${attendanceRecords[student.id]?.deviceId === deviceId || attendanceRecords[student.id]?.deviceId === 'unknown' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-indigo-50/50 border-indigo-100'}`}
                                            >
                                                <button
                                                    onClick={() => unmarkAttendance(student.id)}
                                                    className="absolute top-2 left-2 w-5 h-5 bg-white text-rose-500 rounded-full flex items-center justify-center shadow-sm border border-rose-100 hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all z-10"
                                                    title="Remove Attendance"
                                                >
                                                    <XCircle size={12} strokeWidth={3} />
                                                </button>
                                                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white ${attendanceRecords[student.id]?.deviceId === deviceId || attendanceRecords[student.id]?.deviceId === 'unknown' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                </div>
                                                <div className={`w-12 h-12 bg-white rounded-full border-2 overflow-hidden mb-2 shadow-sm shrink-0 ${attendanceRecords[student.id]?.deviceId === deviceId || attendanceRecords[student.id]?.deviceId === 'unknown' ? 'border-emerald-200' : 'border-indigo-200'}`}>
                                                    {student.photo ? (
                                                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className={`w-full h-full flex items-center justify-center font-black text-xs uppercase ${attendanceRecords[student.id]?.deviceId === deviceId || attendanceRecords[student.id]?.deviceId === 'unknown' ? 'text-emerald-300' : 'text-indigo-300'}`}>
                                                            {student.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[11px] font-black text-slate-700 truncate w-full uppercase italic leading-tight mb-1">{student.name}</p>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mt-auto">
                                                    <Clock size={10} />
                                                    {attendanceRecords[student.id]?.timestamp?.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) || new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full mt-1.5 w-full justify-center ${attendanceRecords[student.id]?.deviceId === deviceId || attendanceRecords[student.id]?.deviceId === 'unknown' ? 'text-blue-500 bg-blue-50' : 'text-indigo-500 bg-indigo-50'}`}>
                                                    <CheckSquare size={10} /> {attendanceRecords[student.id]?.deviceId === deviceId || attendanceRecords[student.id]?.deviceId === 'unknown' ? 'Message Sent' : 'Synced'}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Absent Students List (Below Camera) */}
                    {classStudents.length - classMarkedStudents.size > 0 && (
                        <div className="bg-white rounded-[32px] border border-rose-100 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <XCircle size={16} className="text-rose-500" />
                                <h4 className="text-sm font-black text-rose-600 italic uppercase">অনুপস্থিত ছাত্রছাত্রী</h4>
                                <span className="ml-auto bg-rose-100 text-rose-600 px-2.5 py-1 rounded-lg text-[10px] font-black">{classStudents.length - classMarkedStudents.size} জন</span>
                            </div>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-2">
                                <AnimatePresence>
                                    {classStudents.filter(s => s.id && !classMarkedStudents.has(s.id)).map((student, idx) => (
                                        <motion.div
                                            key={`absent-${student.id || idx}`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="min-w-[140px] bg-rose-50/50 rounded-2xl border-2 border-rose-100 p-3 flex flex-col items-center text-center group hover:bg-rose-50 hover:border-rose-200 transition-colors"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-full border-2 border-rose-200 overflow-hidden mb-2 shadow-sm shrink-0">
                                                {student.photo ? (
                                                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-rose-300 font-black text-sm uppercase">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs font-black text-slate-700 truncate w-full group-hover:text-rose-600 transition-colors uppercase italic">{student.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Absent</p>
                                                {student.stats && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${student.stats.percentage >= 80 ? 'text-emerald-600 bg-emerald-50' :
                                                        student.stats.percentage >= 50 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'
                                                        }`}>
                                                        {student.stats.percentage}%
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>

                {/* Log Panel */}
                <div className="bg-white rounded-[40px] border border-slate-200 flex flex-col shadow-sm h-[calc(100vh-220px)] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                                <History size={18} />
                            </div>
                            <h3 className="font-black text-slate-700 italic uppercase tracking-tighter">Attendance Log</h3>
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest ring-1 ring-emerald-100">Live</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        <AnimatePresence mode="wait" initial={false}>
                            {classMarkedStudents.size === 0 ? (
                                <motion.div key="empty-log" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                                    <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-[28px] flex items-center justify-center mb-6">
                                        <Users size={32} />
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs uppercase italic tracking-widest text-center px-8 leading-relaxed">এই ক্লাসের কোনো হাজিরার রেকর্ড নেই।</p>
                                </motion.div>
                            ) : (
                                Array.from(classMarkedStudents).reverse().map((id, index) => {
                                    if (!id) return null; // Skip invalid IDs
                                    const s = students.find(std => std.id === id);
                                    return (
                                        <motion.div key={`marked-${id}-${index}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`group flex items-center gap-4 p-4 rounded-3xl border hover:shadow-lg transition-all duration-300 ${attendanceRecords[id]?.deviceId === deviceId || attendanceRecords[id]?.deviceId === 'unknown' ? 'bg-slate-50 border-slate-100 hover:bg-white hover:border-emerald-200' : 'bg-indigo-50/30 border-indigo-50 hover:bg-white hover:border-indigo-200'}`}>
                                            <div className={`w-12 h-12 bg-white rounded-2xl border overflow-hidden flex-shrink-0 ${attendanceRecords[id]?.deviceId === deviceId || attendanceRecords[id]?.deviceId === 'unknown' ? 'border-slate-100' : 'border-indigo-100'}`}>
                                                {s?.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center font-black text-xs uppercase ${attendanceRecords[id]?.deviceId === deviceId || attendanceRecords[id]?.deviceId === 'unknown' ? 'text-slate-300' : 'text-indigo-300'}`}>{s?.name.charAt(0)}</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className={`text-[14px] font-black text-slate-700 truncate uppercase italic tracking-tight transition-colors leading-none ${attendanceRecords[id]?.deviceId === deviceId || attendanceRecords[id]?.deviceId === 'unknown' ? 'group-hover:text-emerald-600' : 'group-hover:text-indigo-600'}`}>
                                                        {s?.name || 'Unknown'}
                                                    </p>
                                                    {s?.classId && (!propClassId && !selectedClassId) && (
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-black text-slate-400 border border-slate-200 uppercase tracking-tighter">
                                                            {classes.find(c => c.id === s.classId)?.name || 'N/A'}
                                                        </span>
                                                    )}
                                                    {s?.stats && (
                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ml-auto ${s.stats.percentage >= 80 ? 'text-emerald-600 bg-emerald-50' :
                                                            s.stats.percentage >= 50 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'
                                                            }`}>
                                                            {s.stats.percentage}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 opacity-60">
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${attendanceRecords[id]?.deviceId === deviceId || attendanceRecords[id]?.deviceId === 'unknown' ? 'text-emerald-500' : 'text-indigo-500'}`}>PRESENT {attendanceRecords[id]?.deviceId !== deviceId && attendanceRecords[id]?.deviceId !== 'unknown' ? '(REMOTE)' : ''}</span>
                                                    <div className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
                                                    <span className="text-[9px] font-black flex items-center gap-1"><Clock size={10} /> {attendanceRecords[id]?.timestamp?.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) || new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {s?.stats && (
                                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                                                        <div
                                                            className={`h-full transition-all duration-500 rounded-full ${s.stats.percentage >= 80 ? 'bg-emerald-500' :
                                                                s.stats.percentage >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                                                                }`}
                                                            style={{ width: `${s.stats.percentage}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => unmarkAttendance(id)}
                                                title="Mark Absent (Undo)"
                                                className="w-8 h-8 rounded-full bg-white text-rose-400 border border-slate-100 hover:bg-rose-500 hover:border-rose-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div >
    );
}
