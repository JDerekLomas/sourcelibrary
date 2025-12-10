import React, { useState } from 'react';
import { apiService } from '../../services/api';

interface Props {
    tenantId: string;
    tenantName: string;
    onCancel: () => void;
    onDeleted: () => void;
}

const DeleteTenantModal: React.FC<Props> = ({ tenantId, tenantName, onCancel, onDeleted }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirmDelete = async () => {
        setError(null);
        if (input !== tenantName) {
            setError('Tenant name does not match. Please type the exact tenant name to confirm.');
            return;
        }
        setLoading(true);
        try {
            await apiService.deleteTenant(tenantId, tenantName);
            onDeleted();
        } catch (err) {
            setError('Failed to delete tenant!');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setInput('');
        setError(null);
        onCancel();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
        >
            {/* Dark overlay to sit on top of everything and block interaction below. */}
            <div
                className="absolute inset-0 bg-black opacity-50"
                // clicking overlay cancels modal
                onClick={handleCancel}
            />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-lg mx-4">
                <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg">
                    <h2 className="text-lg font-semibold font-sans text-gray-800 mb-2">Are you sure you want to delete this tenant?</h2>

                    <p className="text-sm text-gray-600 mb-3">
                        Enter <span className="text-red-600 font-medium">{tenantName}</span> to confirm your action.
                    </p>

                    {error && <p className="text-red-600 bg-red-100 p-2 rounded mb-3">{error}</p>}

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type the tenant name..."
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    />

                    <div className="flex space-x-4">
                        <button
                            onClick={confirmDelete}
                            disabled={loading || input !== tenantName}
                            className={`font-semibold py-2 px-4 rounded transition duration-200 ${loading || input !== tenantName
                                ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                        >
                            {loading ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteTenantModal;
