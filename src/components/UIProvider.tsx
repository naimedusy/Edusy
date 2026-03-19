'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import AssignmentDetailsModal from './AssignmentDetailsModal';
import CustomDialog from './CustomDialog';

const PinnedAssignmentOverlay = dynamic(() => import('./PinnedAssignmentOverlay'), { ssr: false });

interface UIContextType {
    isAssignmentModalOpen: boolean;
    assignmentModalConfig: {
        view: 'LIST' | 'EDITOR';
        subject: { classId: string; bookId: string } | null;
    };
    openAssignmentModal: (view?: 'LIST' | 'EDITOR', subject?: { classId: string; bookId: string } | null) => void;
    setAssignmentModalView: (view: 'LIST' | 'EDITOR') => void;
    closeAssignmentModal: () => void;
    pinnedAssignment: any | null;
    togglePinAssignment: (assignment: any) => void;
    globalAssignmentDetail: { assignment: any; options?: { selectedStudentId?: string } } | null;
    openAssignmentDetails: (assignment: any, options?: { selectedStudentId?: string }) => void;
    closeAssignmentDetails: () => void;
    // New Dialog API
    confirm: (message: string, title?: string) => Promise<boolean>;
    alert: (message: string, title?: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [assignmentModalConfig, setAssignmentModalConfig] = useState<{
        view: 'LIST' | 'EDITOR';
        subject: { classId: string; bookId: string } | null;
    }>({ view: 'LIST', subject: null });

    const [globalAssignmentDetail, setGlobalAssignmentDetail] = useState<any | null>(null);

    // Dialog state
    const [dialog, setDialog] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title: string;
        message: string;
        resolve: (value: boolean) => void;
    }>({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        resolve: () => { }
    });

    const [pinnedAssignment, setPinnedAssignment] = useState<any | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('edusy_pinned_assignment');
            return saved ? JSON.parse(saved) : null;
        }
        return null;
    });

    const openAssignmentModal = (
        view: 'LIST' | 'EDITOR' = 'LIST',
        subject: { classId: string; bookId: string } | null = null
    ) => {
        setAssignmentModalConfig({ view, subject });
        setIsAssignmentModalOpen(true);
    };

    const setAssignmentModalView = (view: 'LIST' | 'EDITOR') => {
        setAssignmentModalConfig((prev: any) => ({ ...prev, view }));
    };

    const closeAssignmentModal = () => {
        setIsAssignmentModalOpen(false);
    };

    const openAssignmentDetails = (assignment: any, options?: { selectedStudentId?: string }) => {
        setGlobalAssignmentDetail({ assignment, options });
    };

    const closeAssignmentDetails = () => {
        setGlobalAssignmentDetail(null);
    };

    const togglePinAssignment = (assignment: any) => {
        setPinnedAssignment((prev: any) => {
            if (prev?.id === assignment.id) {
                localStorage.removeItem('edusy_pinned_assignment');
                return null;
            }
            localStorage.setItem('edusy_pinned_assignment', JSON.stringify(assignment));
            return assignment;
        });
    };

    // Dialog handlers
    const confirm = (message: string, title: string = 'নিশ্চিত করুন') => {
        return new Promise<boolean>((resolve) => {
            setDialog({
                isOpen: true,
                type: 'confirm',
                title,
                message,
                resolve
            });
        });
    };

    const alert = (message: string, title: string = 'সতর্কবার্তা') => {
        setDialog({
            isOpen: true,
            type: 'alert',
            title,
            message,
            resolve: () => { }
        });
    };

    const handleDialogConfirm = () => {
        dialog.resolve(true);
        setDialog(prev => ({ ...prev, isOpen: false }));
    };

    const handleDialogCancel = () => {
        dialog.resolve(false);
        setDialog(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <UIContext.Provider value={{
            isAssignmentModalOpen,
            assignmentModalConfig,
            openAssignmentModal,
            setAssignmentModalView,
            closeAssignmentModal,
            pinnedAssignment,
            togglePinAssignment,
            globalAssignmentDetail,
            openAssignmentDetails,
            closeAssignmentDetails,
            confirm,
            alert
        }}>
            {children}
            <PinnedAssignmentOverlay />
            <AssignmentDetailsModal
                isOpen={!!globalAssignmentDetail}
                onClose={closeAssignmentDetails}
                assignments={globalAssignmentDetail?.assignment ? [globalAssignmentDetail.assignment] : []}
                selectedStudentId={globalAssignmentDetail?.options?.selectedStudentId}
            />
            <CustomDialog
                isOpen={dialog.isOpen}
                type={dialog.type}
                title={dialog.title}
                message={dialog.message}
                onConfirm={handleDialogConfirm}
                onCancel={handleDialogCancel}
            />
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
