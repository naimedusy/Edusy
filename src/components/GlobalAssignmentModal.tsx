'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ClipboardList } from 'lucide-react';
import { useUI } from './UIProvider';
import TeacherAssignmentPanel from './TeacherAssignmentPanel';

export default function GlobalAssignmentModal() {
    const { isAssignmentModalOpen: isOpen, closeAssignmentModal: onClose, assignmentModalConfig } = useUI();
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-2 md:p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={`w-full ${assignmentModalConfig.view === 'EDITOR' ? 'max-w-3xl' : 'max-w-4xl'} transform transition-all ${assignmentModalConfig.view === 'EDITOR'
                                ? 'rounded-none md:rounded-[32px] bg-transparent p-0 overflow-visible'
                                : 'rounded-2xl md:rounded-[32px] bg-white p-3 md:p-6 border-2 md:border-4 border-[#045c84] shadow-xl text-left align-middle overflow-hidden'
                                }`}>
                                {assignmentModalConfig.view !== 'EDITOR' && (
                                    <div className="flex items-center justify-between mb-6">
                                        <Dialog.Title as="h3" className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                            <div className="p-2 bg-[#045c84] text-white rounded-xl">
                                                <ClipboardList size={24} />
                                            </div>
                                            ক্লাস ডাইরি স্ট্যাটাস প্যানেল
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="p-2 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                )}

                                <div
                                    className={`${assignmentModalConfig.view === 'EDITOR'
                                        ? 'h-screen md:h-[98vh] max-h-[100vh] md:max-h-[98vh]'
                                        : 'max-h-[80vh]'
                                        } overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200`}
                                    data-lenis-prevent
                                >
                                    <TeacherAssignmentPanel
                                        onClose={onClose}
                                        initialView={assignmentModalConfig.view}
                                        initialSubject={assignmentModalConfig.subject}
                                        hideTitle={true}
                                    />
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
