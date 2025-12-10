import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { TenantSummary } from '../../types/tenant_interfaces';
import TenantDetails from '../../components/Tenants/TenantDetails';
import CreateTenant from '../../components/Tenants/CreateTenant';
import DeleteTenantModal from '../../components/Tenants/DeleteTenantModal';
import UpdateTenant from '../../components/Tenants/UpdateTenant';
import DashboardButton from '../../components/ui/Buttons/DashboardButton';

type Panel =
    | { name: 'none' }
    | { name: 'details'; tenantId: string }
    | { name: 'create' }
    | { name: 'update'; tenantId: string };

type PanelProps = {
    tenantId?: string;
    onClose: () => void;
    onDone?: () => void;
};

const TenantManagement: React.FC = () => {
    const [tenants, setTenants] = useState<TenantSummary[]>([]);
    const [activePanel, setActivePanel] = useState<Panel>({ name: 'none' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Delete modal state remains separate (overlay)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const data = await apiService.getAllTenants();
            setTenants(data);
        } catch (err) {
            setError('Failed to fetch tenants');
        } finally {
            setLoading(false);
        }
    };

    // Panel openers
    const openDetails = (tenantId: string) => setActivePanel({ name: 'details', tenantId });
    const startCreate = () => setActivePanel({ name: 'create' });
    const startUpdate = (tenantId: string) => setActivePanel({ name: 'update', tenantId });

    const openDeleteModal = (tenantId: string, tenantName: string) => {
        setDeleteTarget({ id: tenantId, name: tenantName });
        setDeleteModalOpen(true);
    };

    // central panel registry: maps panel name -> renderer (adapts props to existing components)
    const panelRegistry: Record<string, (p: PanelProps) => JSX.Element | null> = {
        details: ({ tenantId, onClose }) =>
            tenantId ? <TenantDetails tenantId={tenantId} onClose={onClose} /> : null,

        create: ({ onClose, onDone }) => (
            <CreateTenant
                onCancel={onClose}
                onCreated={() => {
                    if (onDone) onDone();
                }}
            />
        ),

        update: ({ tenantId, onClose }) =>
            tenantId ? (
                <UpdateTenant
                    tenantId={tenantId}
                    onCancel={onClose}
                    onUpdated={async () => {
                        await fetchTenants();
                        setActivePanel({ name: 'details', tenantId });
                    }}
                />
            ) : null,
    };

    // prepare props for the active panel
    const activePanelElement =
        activePanel.name === 'none'
            ? null
            : panelRegistry[activePanel.name]({
                tenantId: (activePanel as any).tenantId,
                onClose: () => setActivePanel({ name: 'none' }),
                onDone: async () => {
                    setActivePanel({ name: 'none' });
                    await fetchTenants();
                },
            });

    return (
        <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            {/* Page Header  */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Tenant Management</h1>
                <DashboardButton />
            </div>

            {/* Error Message Area */}
            {error && <p className="text-red-600 bg-red-100 p-3 rounded mb-4">{error}</p>}

            <button
                onClick={startCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 mb-4"
            >
                Create New Tenant
            </button>
            {loading && <p className="text-gray-600 mb-4">Loading...</p>}
            <div className="overflow-x-auto">
                <table className="table-auto w-full border-collapse border border-gray-300 bg-white rounded-lg shadow-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 px-4 py-2 text-left text-gray-700 font-semibold">ID</th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-gray-700 font-semibold">Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-gray-700 font-semibold">Slug</th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-gray-700 font-semibold">Status</th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-gray-700 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2 text-gray-800">{tenant.id}</td>
                                <td className="border border-gray-300 px-4 py-2 text-gray-800">{tenant.name}</td>
                                <td className="border border-gray-300 px-4 py-2 text-gray-800">{tenant.slug}</td>
                                <td className="capitalize border border-gray-300 px-4 py-2 text-gray-800">{tenant.status}</td>
                                <td className="border border-gray-300 px-4 py-2 space-x-2">
                                    <button
                                        onClick={() => openDetails(tenant.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded transition duration-200"
                                    >
                                        Details
                                    </button>
                                    <button
                                        onClick={() => startUpdate(tenant.id)}
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded transition duration-200"
                                    >
                                        Update
                                    </button>
                                    {tenant.slug.toLowerCase() !== 'root' && (
                                        <button
                                            onClick={() => openDeleteModal(tenant.id, tenant.name)}
                                            className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded transition duration-200"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* render the active panel (single place) */}
            {activePanelElement}

            {/* Delete modal (overlay) */}
            {deleteModalOpen && deleteTarget && (
                <DeleteTenantModal
                    tenantId={deleteTarget.id}
                    tenantName={deleteTarget.name}
                    onCancel={() => {
                        setDeleteModalOpen(false);
                        setDeleteTarget(null);
                    }}
                    onDeleted={() => {
                        setDeleteModalOpen(false);
                        setDeleteTarget(null);
                        setActivePanel({ name: 'none' })
                        fetchTenants();
                    }}
                />
            )}
        </div>
    );
};

export default TenantManagement;