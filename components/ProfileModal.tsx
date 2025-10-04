import React, { useState, useEffect, useMemo } from 'react';
import { Student } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/Language-context';
import LoadingSpinner from './LoadingSpinner';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Student;
  grades: { level: string; description: string }[];
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, grades }) => {
    const { updateUserProfile, loading, error: authError } = useAuth();
    const { t, tCurriculum } = useLanguage();
    
    const [name, setName] = useState(user.name);
    const [grade, setGrade] = useState(user.grade);
    const [school, setSchool] = useState(user.school || '');
    const [city, setCity] = useState(user.city || '');
    const [board, setBoard] = useState(user.board || '');
    const [avatarSeed, setAvatarSeed] = useState(user.avatarSeed || user.name);
    const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
    
    const [localError, setLocalError] = useState<string | null>(null);

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
        }
    }, [isOpen, user]);

    useEffect(() => {
        const generatePreview = async () => {
            const seed = avatarSeed.trim() || name.trim() || 'default';
            const avatar = createAvatar(lorelei, { seed });
            const dataUri = await avatar.toDataUri();
            setAvatarPreview(dataUri);
        };
        // Debounce preview generation
        const handler = setTimeout(() => {
            generatePreview();
        }, 300);

        return () => clearTimeout(handler);
    }, [avatarSeed, name]);
    
    const handleRandomizeAvatar = () => {
        setAvatarSeed(Math.random().toString(36).substring(7));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (!name.trim()) {
            setLocalError("Name cannot be empty.");
            return;
        }

        try {
            await updateUserProfile({ name, grade, school, city, board, avatarSeed });
            onClose();
        } catch (err) {
            setLocalError((err as Error).message);
        }
    };

    if (!isOpen) return null;

    const displayedError = localError || authError;

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
                            <img src={avatarPreview} alt="Profile Avatar Preview" className="w-32 h-32 rounded-full border-4 border-primary shadow-lg mb-4" />
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
                            <button type="button" onClick={handleRandomizeAvatar} className="mt-3 flex items-center justify-center w-full px-4 py-2 text-sm bg-slate-700 text-text-primary font-semibold rounded-lg hover:bg-slate-600 transition">
                                <ArrowPathIcon className="h-4 w-4 mr-2" />
                                Randomize
                            </button>
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
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-700 text-text-primary font-semibold rounded-lg hover:bg-slate-600 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 btn-accent disabled:opacity-50 flex items-center justify-center min-w-[140px]">
                            {loading ? <LoadingSpinner /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;