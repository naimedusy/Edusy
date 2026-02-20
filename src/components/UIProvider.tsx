'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import PinnedAssignmentOverlay from './PinnedAssignmentOverlay';
import AssignmentDetailsModal from './AssignmentDetailsModal';

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
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [assignmentModalConfig, setAssignmentModalConfig] = useState<{
        view: 'LIST' | 'EDITOR';
        subject: { classId: string; bookId: string } | null;
    }>({ view: 'LIST', subject: null });

    const [globalAssignmentDetail, setGlobalAssignmentDetail] = useState<any | null>(null);

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
            closeAssignmentDetails
        }}>
            {children}
            <PinnedAssignmentOverlay />
            <AssignmentDetailsModal
                isOpen={!!globalAssignmentDetail}
                onClose={closeAssignmentDetails}
                assignment={globalAssignmentDetail?.assignment}
                selectedStudentId={globalAssignmentDetail?.options?.selectedStudentId}
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
