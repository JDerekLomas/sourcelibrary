import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { apiService } from '../../services/api';
import { TenantUpdate, PlanName, PLAN_NAME, CELL_ID, CellID, STATUS_OPTIONS, EntityStatus } from '../../types/tenant_interfaces';

interface Props {
    tenantId: string;
    onCancel: () => void;
    onUpdated?: () => void;
}

const UpdateTenant: React.FC<Props> = ({ tenantId, onCancel, onUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // form local state matching TenantUpdate (tenant_id will be added on submit)
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [cellId, setCellId] = useState<CellID>(CELL_ID.DEFAULT);
    const [plan, setPlan] = useState<PlanName>(PLAN_NAME.BASIC as PlanName);
    const [status, setStatus] = useState<EntityStatus>('active');

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const data = await apiService.getTenantInfo(tenantId);
                // prefill fields
                setName(data.name || '');
                setSlug(data.slug || '');
                setCellId(data.cell_id || CELL_ID.DEFAULT);
                setPlan(data.plan || (PLAN_NAME.BASIC as PlanName));
                setStatus(data.status || 'active');
            } catch (err) {
                setError('Failed to load tenant details');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [tenantId]);

    const isValid = useMemo(() => {
        return Boolean(name && name.trim() && slug && slug.trim());
    }, [name, slug]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        if (!isValid) {
            setError('Please fill required fields');
            return;
        }
        setSaving(true);
        try {
            const payload: TenantUpdate = {
                tenant_id: tenantId,
                name: name.trim(),
                slug: slug.trim(),
                cell_id: cellId,
                plan: plan,
                status: status,
            };
            await apiService.updateTenant(tenantId, payload);
            if (onUpdated) onUpdated();
        } catch (err) {
            let msg = 'Failed to update tenant';
            if (axios.isAxiosError(err) && err.response) {
                msg = `FAILED: ${err.response.data?.detail ?? err.response.statusText}`;
            }
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">Loading tenant...</div>;
    }

    return (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Update Tenant</h2>
            {error && <p className="text-red-600 bg-red-100 p-2 rounded mb-3">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Name</label>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-1">Slug</label>
                    <input
                        type="text"
                        placeholder="Slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Cell</label>
                        <select
                            value={cellId}
                            onChange={(e) => setCellId(e.target.value as CellID)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none"
                        >
                            {Object.values(CELL_ID).map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Plan</label>
                        <select
                            value={plan}
                            onChange={(e) => setPlan(e.target.value as PlanName)}
                            className="w-full p-2 capitalize border border-gray-300 rounded focus:outline-none"
                        >
                            {Object.values(PLAN_NAME).map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as EntityStatus)}
                        className="w-full p-2 capitalize border border-gray-300 rounded focus:outline-none"
                    >
                        {Object.values(STATUS_OPTIONS).map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={saving || !isValid}
                        className={`font-semibold py-2 px-4 rounded transition duration-200 ${saving || !isValid
                            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateTenant;
