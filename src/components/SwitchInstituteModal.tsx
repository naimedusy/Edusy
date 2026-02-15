'use client';

import Modal from './Modal';
import InstituteSwitcher from './InstituteSwitcher';

interface SwitchInstituteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SwitchInstituteModal({ isOpen, onClose }: SwitchInstituteModalProps) {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
        >
            <InstituteSwitcher />
        </Modal>
    );
}
