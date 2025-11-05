

import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import { ScanFaceIcon, MicIcon, PlusIcon, ChevronLeftIcon, Trash2Icon } from './icons';

const AVAILABLE_AVATARS = ['👨', '👩', '👦', '👧', '👴', '👵', '👶', '🐶', '🐱', '🤖'];

// --- Face Enrollment View ---
const FaceEnrollmentView: React.FC<{ user: User, onComplete: () => void, onCancel: () => void }> = ({ user, onComplete, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("Please look directly at the camera.");

    useEffect(() => {
        let stream: MediaStream;
        let isCancelled = false;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current && !isCancelled) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setMessage("Could not access camera. Please check permissions.");
            }
        };

        startCamera();

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const next = prev + 10;
                if (next === 30) setMessage("Turn your head slightly to the left.");
                if (next === 60) setMessage("Now slightly to the right.");
                if (next >= 100) {
                    clearInterval(progressInterval);
                    setMessage("Enrollment complete!");
                    setTimeout(onComplete, 1500);
                    return 100;
                }
                return next;
            });
        }, 500);

        return () => {
            isCancelled = true;
            clearInterval(progressInterval);
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg flex flex-col items-center gap-4 border border-teal-500/50 animate-slide-up-fast">
                <h3 className="text-2xl font-bold text-teal-300">Face Enrollment for {user.name}</h3>
                <div className="w-64 h-48 bg-slate-900 rounded-lg overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                </div>
                <div className="w-full">
                    <p className="text-center text-slate-300 mb-2">{message}</p>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                 <button onClick={onCancel} className="mt-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            </div>
        </div>
    );
};


// --- User Form View ---
const UserForm: React.FC<{
    user: User | null; // null for new user
    onSave: (user: User | Omit<User, 'id' | 'color'>) => void;
    onCancel: () => void;
    onDelete: (userId: string) => void;
}> = ({ user, onSave, onCancel, onDelete }) => {
    const [formData, setFormData] = useState<Partial<User>>({
        name: user?.name || '',
        avatar: user?.avatar || AVAILABLE_AVATARS[0],
        category: user?.category || 'other',
        isFaceEnrolled: user?.isFaceEnrolled || false,
        isVoiceEnrolled: user?.isVoiceEnrolled || false,
    });
    const [isEnrolling, setIsEnrolling] = useState(false);

    const handleSave = () => {
        if (!formData.name) return; // Basic validation
        if (user) { // Editing existing user
            onSave({ ...user, ...formData });
        } else { // Creating new user
            onSave(formData as Omit<User, 'id' | 'color'>);
        }
    };
    
    const handleEnrollmentComplete = () => {
        setFormData(prev => ({...prev, isFaceEnrolled: true}));
        setIsEnrolling(false);
    };
    
     const handleRemoveEnrollment = () => {
        setFormData(prev => ({...prev, isFaceEnrolled: false}));
    };


    return (
        <div className="flex flex-col h-full text-slate-200">
            {isEnrolling && user && (
                <FaceEnrollmentView
                    user={user}
                    onComplete={handleEnrollmentComplete}
                    onCancel={() => setIsEnrolling(false)}
                />
            )}
            <header className="flex items-center gap-4 mb-6">
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-slate-700"><ChevronLeftIcon /></button>
                <h2 className="text-2xl font-bold text-slate-100">{user ? 'Edit Profile' : 'Add New Profile'}</h2>
            </header>
            
            <div className="flex-grow space-y-6 overflow-y-auto pr-2">
                {/* Basic Info */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                           className="w-full bg-slate-900/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>

                {/* Avatar Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Avatar</label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        {AVAILABLE_AVATARS.map(avatar => (
                            <button key={avatar} onClick={() => setFormData(p => ({...p, avatar}))}
                                    className={`text-4xl p-2 rounded-lg transition-all ${formData.avatar === avatar ? 'bg-teal-600 ring-2 ring-teal-400' : 'bg-slate-700/50 hover:bg-slate-600'}`}>
                                {avatar}
                            </button>
                        ))}
                    </div>
                </div>
                
                 {/* Category */}
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                    <div className="flex bg-slate-900/50 rounded-full p-1 text-sm font-semibold w-min">
                        {(['parent', 'kid', 'other'] as const).map(cat => (
                           <button key={cat} onClick={() => setFormData(p => ({...p, category: cat}))} 
                                   className={`px-4 py-1.5 rounded-full capitalize transition-colors ${formData.category === cat ? 'bg-teal-600 text-white' : 'text-slate-400'}`}>
                               {cat}
                           </button>
                        ))}
                    </div>
                 </div>

                 {/* Recognition */}
                 {user && ( // Only show for existing users
                     <div>
                        <h3 className="text-lg font-semibold text-teal-300 mb-2">Recognition Setup</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <ScanFaceIcon className="w-5 h-5 text-slate-300" />
                                    <div>
                                        <p>Face Enrollment</p>
                                        <p className={`text-sm ${formData.isFaceEnrolled ? 'text-green-400' : 'text-yellow-400'}`}>{formData.isFaceEnrolled ? 'Completed' : 'Not Enrolled'}</p>
                                    </div>
                                </div>
                                {formData.isFaceEnrolled ? (
                                    <button onClick={handleRemoveEnrollment} className="bg-red-800/80 hover:bg-red-700 text-white font-semibold text-xs px-3 py-1 rounded-md">Remove</button>
                                ): (
                                    <button onClick={() => setIsEnrolling(true)} className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-4 py-2 rounded-lg">Enroll</button>
                                )}
                            </div>
                             <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg opacity-50">
                                <div className="flex items-center gap-3">
                                    <MicIcon className="w-5 h-5 text-slate-300" />
                                    <div>
                                        <p>Voice Enrollment</p>
                                        <p className="text-sm text-yellow-400">Not Enrolled</p>
                                    </div>
                                </div>
                                <button disabled className="bg-slate-600 text-white font-semibold text-sm px-4 py-2 rounded-lg cursor-not-allowed">Enroll</button>
                            </div>
                        </div>
                     </div>
                 )}
            </div>
            
            <footer className="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                <div>
                {user && (
                    <button onClick={() => onDelete(user.id)} className="bg-red-800/70 hover:bg-red-700/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                        <Trash2Icon className="w-4 h-4" /> Delete Profile
                    </button>
                )}
                </div>
                <button onClick={handleSave} className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-lg">
                    Save
                </button>
            </footer>
        </div>
    );
};

// --- Toggle Switch Helper ---
const ToggleSwitch: React.FC<{ enabled: boolean, onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 ${enabled ? 'bg-teal-600' : 'bg-slate-600'}`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    );
};


// --- Main Modal Component ---
interface UserManagementModalProps {
    users: User[];
    onUpdateUser: (user: User) => void;
    onAddUser: (user: Omit<User, 'id' | 'color'>) => void;
    onDeleteUser: (userId: string) => void;
    onClose: () => void;
    isFaceRecognitionEnabled: boolean;
    setIsFaceRecognitionEnabled: (enabled: boolean) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ users, onUpdateUser, onAddUser, onDeleteUser, isFaceRecognitionEnabled, setIsFaceRecognitionEnabled }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isNewUser, setIsNewUser] = useState(false);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsNewUser(false);
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setIsNewUser(true);
    };
    
    const handleCancel = () => {
        setEditingUser(null);
        setIsNewUser(false);
    };

    const handleSave = (userData: User | Omit<User, 'id' | 'color'>) => {
        if ('id' in userData) {
            onUpdateUser(userData as User);
        } else {
            onAddUser(userData as Omit<User, 'id' | 'color'>);
        }
        handleCancel();
    };
    
    const handleDelete = (userId: string) => {
        onDeleteUser(userId);
        handleCancel();
    }

    if (editingUser || isNewUser) {
        return <UserForm user={editingUser} onSave={handleSave} onCancel={handleCancel} onDelete={handleDelete} />
    }

    return (
        <div className="flex flex-col h-full text-slate-200">
             <div className="mb-6 pb-6 border-b border-slate-700">
                <h3 className="text-xl font-semibold text-slate-100 mb-4">App Settings</h3>
                <div className="bg-slate-700/50 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <ScanFaceIcon className="w-6 h-6 text-slate-300" />
                        <div>
                            <p className="font-bold text-lg">Face Recognition</p>
                            <p className="text-sm text-slate-400">Automatically switch profiles using the camera.</p>
                        </div>
                    </div>
                    <ToggleSwitch enabled={isFaceRecognitionEnabled} onChange={setIsFaceRecognitionEnabled} />
                </div>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-100 mb-4">Family Profiles</h3>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                {users.map(user => (
                    <div key={user.id} className="bg-slate-700/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{user.avatar}</span>
                            <div>
                                <p className="font-bold text-lg">{user.name}</p>
                                <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                    <span className="flex items-center gap-1.5"><ScanFaceIcon className="w-4 h-4" /> <span className={user.isFaceEnrolled ? 'text-green-400 font-semibold' : 'text-yellow-400'}>{user.isFaceEnrolled ? 'Enrolled' : 'Not Enrolled'}</span></span>
                                    <span className="flex items-center gap-1.5 opacity-60"><MicIcon className="w-4 h-4" /> <span className="text-yellow-400">Not Enrolled</span></span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleEdit(user)} className="text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            Edit
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-4 border-t border-slate-700 pt-4">
                <button onClick={handleAddNew} className="w-full bg-teal-600/80 hover:bg-teal-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Add New Profile
                </button>
            </div>
        </div>
    );
};