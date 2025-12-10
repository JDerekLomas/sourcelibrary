import React, { useState, useMemo } from 'react';
import axios from 'axios';

import { apiService } from '../../services/api';
import {
    TenantCreate,
    TenantBrandingConfig,
    PLAN_NAME,
    PlanName,
    CellID,
    CELL_ID
} from '../../types/tenant_interfaces';

interface Props {
    onCancel: () => void;
    onCreated?: () => void;
}

const CreateTenant: React.FC<Props> = ({ onCancel, onCreated }) => {
    const [form, setForm] = useState<TenantCreate>({
        name: '',
        slug: '',
        cell_id: 'cell-default',
        plan: 'basic',
        branding_config: {
            logo_url: null,
            header_video_url: null,
            heading_text: '',
            subheading_text: '',
            primary_hex_color: '',
        },
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateBranding = (key: keyof TenantBrandingConfig, value: string) => {
        setForm((f) => ({
            ...f,
            branding_config: {
                ...(f.branding_config || ({} as TenantBrandingConfig)),
                [key]: value,
            },
        }));
    };

    // form validity: required fields must be present and non-empty
    const isValid = useMemo(() => {
        return Boolean(form.name && form.name.trim() && form.slug && form.slug.trim() && form.cell_id && form.plan);
    }, [form.name, form.slug, form.cell_id, form.plan]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        setLoading(true);
        try {
            await apiService.createTenant(form);
            if (onCreated) onCreated();
        }
        catch (err) {
            let errorMsg: string = "Failed to create tenant!";

            if (axios.isAxiosError(err) && err.response)
                errorMsg = `FAILED: ${err.response.data.detail} || "Unknown error from server!"`;

            setError(errorMsg);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create Tenant</h2>
            {error && <p className="text-red-600 bg-red-100 p-2 rounded mb-3">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 font-medium mb-1">
                        Name <span className="text-red-600">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-1">
                        Slug <span className="text-red-600">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Slug"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">
                            Cell <span className="text-red-600">*</span>
                        </label>
                        <select
                            value={form.cell_id}
                            onChange={(e) => setForm({ ...form, cell_id: e.target.value as CellID })}
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
                        <label className="block text-gray-700 font-medium mb-1">
                            Plan <span className="text-red-600">*</span>
                        </label>
                        <select
                            value={form.plan}
                            onChange={(e) => setForm({ ...form, plan: e.target.value as PlanName })}
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
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Branding (optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 text-sm mb-1">Logo URL</label>
                            <input
                                value={form.branding_config?.logo_url || ''}
                                onChange={(e) => updateBranding('logo_url', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm mb-1">Header Video URL</label>
                            <input
                                value={form.branding_config?.header_video_url || ''}
                                onChange={(e) => updateBranding('header_video_url', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm mb-1">Heading</label>
                            <input
                                value={form.branding_config?.heading_text || ''}
                                onChange={(e) => updateBranding('heading_text', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm mb-1">Sub-Heading</label>
                            <input
                                value={form.branding_config?.subheading_text || ''}
                                onChange={(e) => updateBranding('subheading_text', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm mb-1">Primary Color</label>
                            <input
                                type="text"
                                value={form.branding_config?.primary_hex_color || ''}
                                onChange={(e) => updateBranding('primary_hex_color', e.target.value)}
                                placeholder="#1f2937"
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={loading || !isValid}
                        className={`font-semibold py-2 px-4 rounded transition duration-200 ${loading || !isValid
                            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {loading ? 'Creating...' : 'Create'}
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

export default CreateTenant;
