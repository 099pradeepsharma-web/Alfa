import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student } from '../types';
import { useLanguage } from '../contexts/Language-context';
import LoadingSpinner from './LoadingSpinner';
import { XMarkIcon, ArrowPathIcon, CameraIcon } from '@heroicons/react/24/solid';
import { Save, X } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Student;
  grades: { level: string; description: string }[];
  updateUserProfile: (data: any) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, grades, updateUserProfile, loading, error }) => {
    const { t, tCurriculum } = useLanguage();
    
    const [name, setName] = useState(user.name);
    const [grade, setGrade] = useState(user.grade);
    const [school, setSchool] = useState(user.school || '');
    const [city, setCity] = useState(user.city || '');
    const [board, setBoard] = useState(user.board || '');
    const [avatarSeed, setAvatarSeed] = useState(user.avatarSeed || user.name);
    const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
    
    const [localError, setLocalError] = useState<string | null>(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName(user.name);
            setGrade(user.grade);
            setSchool(user.school || '');
            setCity(user.city || '');
            setBoard(user.board || '');
            const seed = user.avatarSeed || user.name;
            setAvatarSeed(seed);
            setAvatarPreview(user.avatarUrl);
            setLocalError(null);
            handleCloseCamera(); // Ensure camera is closed when modal re-opens
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (isCameraOpen && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [isCameraOpen, stream]);

    useEffect(() => {
        const generatePreview = async () => {
            if (avatarSeed === 'custom') return; // Don't generate if a custom photo was taken
            const seed = avatarSeed.trim() || name.trim() || 'default';
            const avatar = createAvatar(lorelei, { seed });
            const dataUri = await avatar.toDataUri();
            setAvatarPreview(dataUri);
        };
        const handler = setTimeout(() => {
            generatePreview();
        }, 300);

        return () => clearTimeout(handler);
    }, [avatarSeed, name]);
    
    const handleRandomizeAvatar = () => {
        setAvatarSeed(Math.random().toString(36).substring(7));
    };

    const handleOpenCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                setIsCameraOpen(true);
                setCameraError(null);
            } catch (err) {
                console.error("Error accessing camera: ", err);
                setCameraError("Could not access camera. Please check permissions in your browser settings.");
            }
        } else {
            setCameraError("Camera not supported on this device.");
        }
    };

    const handleCloseCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setIsCameraOpen(false);
    };

    const handleTakePicture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUri = canvas.toDataURL('image/png');
                setAvatarPreview(dataUri);
                setAvatarSeed('custom'); // Prevents seed from overriding the picture
            }
            handleCloseCamera();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (!name.trim()) {
            setLocalError("Name cannot be empty.");
            return;
        }

        try {
            await updateUserProfile({ name, grade, school, city, board, avatarSeed, avatarUrl: avatarPreview });
            onClose();
        } catch (err) {
            setLocalError((err as Error).message);
        }
    };

    if (!isOpen) return null;

    const displayedError = localError || error;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
            <div className="modal-content w-full max-w-3xl">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 id="profile-modal-title" className="text-2xl font-bold text-text-primary">Edit Profile</h2>
                        <p className="text-sm text-text-secondary">Update your personal and academic information.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 transition">
                        <XMarkIcon className="h-6 w-6 text-text-secondary" />
                    </button>
                </div>

                <form onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Avatar Section */}
                        <div className="md:col-span-1 flex flex-col items-center text-center">
                            {!isCameraOpen ? (
                                <>
                                    <img src={avatarPreview} alt="Profile Avatar Preview" className="w-32 h-32 rounded-full border-4 border-primary shadow-lg mb-4 object-cover" />
                                    <div>
                                        <label htmlFor="avatar-seed" className="block text-sm font-bold text-text-secondary mb-1">Avatar Seed</label>
                                        <input
                                            id="avatar-seed"
                                            type="text"
                                            value={avatarSeed}
                                            onChange={(e) => setAvatarSeed(e.target.value)}
                                            className="w-full text-center"
                                            placeholder="Type anything..."
                                        />
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 w-full">
                                        <button type="button" onClick={handleRandomizeAvatar} className="flex-1 flex items-center justify-center px-4 py-2 text-sm bg-slate-700 text-text-primary font-semibold rounded-lg hover:bg-slate-600 transition">
                                            <ArrowPathIcon className="h-4 w-4 mr-2" />
                                            Randomize
                                        </button>
                                        <button type="button" onClick={handleOpenCamera} className="flex-1 flex items-center justify-center px-4 py-2 text-sm bg-slate-700 text-text-primary font-semibold rounded-lg hover:bg-slate-600 transition">
                                            <CameraIcon className="h-4 w-4 mr-2" />
                                            Use Camera
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full space-y-3">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg bg-black aspect-square object-cover"></video>
                                    <button type="button" onClick={handleTakePicture} className="w-full flex items-center justify-center px-4 py-2 text-sm bg-primary text-white font-semibold rounded-lg" style={{backgroundColor: 'rgb(var(--c-primary))'}}>
                                        Take Picture
                                    </button>
                                    <button type="button" onClick={handleCloseCamera} className="w-full flex items-center justify-center px-4 py-2 text-sm bg-slate-700 text-text-primary font-semibold rounded-lg hover:bg-slate-600 transition">
                                        Cancel
                                    </button>
                                </div>
                            )}
                            {cameraError && <p className="text-xs text-red-400 mt-2">{cameraError}</p>}
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>

                        {/* Details Section */}
                        <div className="md:col-span-2 space-y-5">
                             <div>
                                <label htmlFor="profile-name" className="block text-sm font-bold text-text-secondary mb-1">Name</label>
                                <input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full" required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="profile-grade" className="block text-sm font-bold text-text-secondary mb-1">Grade</label>
                                    <select id="profile-grade" value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full">
                                        {grades.map(g => ( <option key={g.level} value={g.level}>{tCurriculum(g.level)}</option> ))}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="profile-board" className="block text-sm font-bold text-text-secondary mb-1">Board of Education</label>
                                    <input id="profile-board" type="text" value={board} onChange={(e) => setBoard(e.target.value)} className="w-full" placeholder="e.g., CBSE, ICSE" />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="profile-school" className="block text-sm font-bold text-text-secondary mb-1">School</label>
                                    <input id="profile-school" type="text" value={school} onChange={(e) => setSchool(e.target.value)} className="w-full" placeholder="Your school name" />
                                </div>
                                <div>
                                    <label htmlFor="profile-city" className="block text-sm font-bold text-text-secondary mb-1">City</label>
                                    <input id="profile-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full" placeholder="e.g., New Delhi" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {displayedError && <p className="mt-6 text-center text-sm text-red-400">{displayedError}</p>}

                    <div className="mt-8 flex justify-end gap-4 border-t border-border pt-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-700 text-text-primary font-semibold rounded-lg hover:bg-slate-600 transition flex items-center gap-2">
                            <X className="h-5 w-5" /> Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 btn-accent disabled:opacity-50 flex items-center justify-center min-w-[140px]">
                            {loading ? <LoadingSpinner /> : <><Save className="h-5 w-5 mr-2" /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;