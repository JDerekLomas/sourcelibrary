import { useState } from 'react';

interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
    loading?: boolean;
}

const initialState: ModalState = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    loading: false
};

export const useModal = () => {
    const [modalState, setModalState] = useState<ModalState>(initialState);

    const showModal = (config: Partial<ModalState> & { title: string; message: string }) => {
        setModalState({
            ...initialState,
            ...config,
            isOpen: true
        });
    };

    const hideModal = () => {
        setModalState(initialState);
    };

    const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
        showModal({ title, message, type: 'success', onConfirm });
    };

    const showError = (title: string, message: string, onConfirm?: () => void) => {
        showModal({ title, message, type: 'error', onConfirm });
    };

    const showWarning = (title: string, message: string, onConfirm?: () => void) => {
        showModal({ title, message, type: 'warning', onConfirm });
    };

    const showInfo = (title: string, message: string, onConfirm?: () => void) => {
        showModal({ title, message, type: 'info', onConfirm });
    };

    const showConfirm = (
        title: string, 
        message: string, 
        onConfirm: () => void, 
        onCancel?: () => void,
        type: 'warning' | 'error' | 'info' = 'warning'
    ) => {
        showModal({ 
            title, 
            message, 
            type, 
            onConfirm, 
            onCancel, 
            showCancel: true,
            confirmText: 'Confirm',
            cancelText: 'Cancel'
        });
    };

    const setLoading = (loading: boolean) => {
        setModalState(prev => ({ ...prev, loading }));
    };

    return {
        modalState,
        showModal,
        hideModal,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        setLoading
    };
};
