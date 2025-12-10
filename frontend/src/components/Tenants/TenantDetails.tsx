import React, { useEffect, useState, useRef } from 'react';
import { apiService } from '../../services/api';
import { Tenant } from '../../types/tenant_interfaces';

interface TenantDetailsProps {
    tenantId: string;
    onClose: () => void;
}

const formatDateTime = (iso?: string) => {
    if (!iso) return '-';
    try {
        console.log("Formatting date:", iso);
        const d = new Date(iso);
        return d.toLocaleString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return iso;
    }
};

const KeyValue: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="bg-white p-3 rounded shadow-sm">
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-gray-800 mt-1">{value ?? '-'}</div>
    </div>
);

const TenantDetails: React.FC<TenantDetailsProps> = ({ tenantId, onClose }) => {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // cache last fetched id while this component is mounted
    const lastFetchedTenantIdRef = useRef<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetch = async () => {
            // If another fetch for this id already started while mounted, skip.
            if (lastFetchedTenantIdRef.current === tenantId) {
                return;
            }

            // Mark as fetching immediately to prevent concurrent calls (fixes double-call in dev StrictMode)
            lastFetchedTenantIdRef.current = tenantId;

            setLoading(true);
            setError(null);
            try {
                const data = await apiService.getTenantInfo(tenantId);
                if (!mounted) return;
                setTenant(data);
                // keep lastFetchedTenantIdRef.current so repeated renders while mounted won't re-fetch
            } catch (err) {
                if (!mounted) return;
                // clear marker on failure so retries are possible
                lastFetchedTenantIdRef.current = null;
                setError('Failed to load tenant details');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetch();

        return () => {
            mounted = false;
            // clear cache marker when component unmounts
            lastFetchedTenantIdRef.current = null;
        };
    }, [tenantId]);

    if (loading) {
        return <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">Loading tenant...</div>;
    }

    if (error) {
        return (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="text-red-600 mb-3">{error}</div>
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded">
                    Close
                </button>
            </div>
        );
    }

    if (!tenant) return null;

    return (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-lg relative">
            <div className="flex justify-between items-end mb-2">
                <span className="flex items-end space-x-3">
                    <h2 className="text-2xl font-semibold text-gray-800">Tenant Details</h2>
                    <span className="text-sm text-gray-600">(ID: <span className="text-gray-800 ml-1">{tenant.id}</span>)</span>
                </span>

                <button
                    onClick={onClose}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded transition duration-200"
                >
                    Close
                </button>
            </div>

            {/* Two-column grid for core fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <KeyValue label="Name" value={tenant.name} />
                <KeyValue label="Slug" value={tenant.slug} />
                <KeyValue label="External System ID" value={tenant.external_sys_id ?? '-'} />
                <KeyValue label="Cell" value={tenant.cell_id} />
                <KeyValue label="Status" value={<span className="capitalize">{tenant.status}</span>} />
                <KeyValue label="Plan" value={<span className="capitalize">{tenant.plan}</span>} />
                <KeyValue label="Created At" value={formatDateTime(tenant.created_at)} />
                <KeyValue label="Updated At" value={formatDateTime(tenant.updated_at)} />
            </div>

            {/* Branding config - full width */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Branding</h3>
                <div className="bg-white p-4 rounded shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logo */}
                    <div>
                        <div className="text-sm text-gray-600">Logo</div>

                        {/* Scrollable URL box */}
                        {!tenant.branding_config?.logo_url ? (
                            <div className="text-gray-700">-</div>
                        ) : (
                            <div className="max-w-s overflow-x-auto mt-1 px-1 py-1 bg-gray-100 rounded text-xs text-gray-700 border whitespace-nowrap">
                                {tenant.branding_config?.logo_url}
                            </div>
                        )}

                        {/* Logo Image */}
                        {tenant.branding_config?.logo_url && (
                            <img
                                src={tenant.branding_config.logo_url}
                                alt="logo"
                                className="max-h-24 object-contain rounded mt-4"
                            />
                        )}
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Header Video</div>
                        {/* Scrollable URL box */}
                        {!tenant.branding_config?.header_video_url ? (
                            <div className="text-gray-700">-</div>
                        ) : (
                            <div className="max-w-s overflow-x-auto mt-1 px-1 py-1 bg-gray-100 rounded text-xs text-gray-700 border whitespace-nowrap">
                                {tenant.branding_config?.header_video_url}
                            </div>
                        )}

                        <div className="text-sm text-gray-600 mt-3">Heading</div>
                        <div className="text-gray-800 mt-1">{tenant.branding_config?.heading_text ?? '-'}</div>

                        <div className="text-sm text-gray-600 mt-3">Sub-Heading</div>
                        <div className="text-gray-800 mt-1">{tenant.branding_config?.subheading_text ?? '-'}</div>

                        <div className="text-sm text-gray-600 mt-3">Primary Color</div>
                        <div className="flex items-center mt-1 space-x-3">
                            <div className="text-gray-800">{tenant.branding_config?.primary_hex_color ?? '-'}</div>
                            {tenant.branding_config?.primary_hex_color && (
                                <span className="w-6 h-6 rounded" style={{ backgroundColor: tenant.branding_config.primary_hex_color }} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Role permissions - full width */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Role Permissions</h3>
                <div className="bg-white p-4 rounded shadow-sm">
                    {Array.isArray(tenant.role_permissions) && tenant.role_permissions.length > 0 ? (
                        <div className="space-y-4">
                            {tenant.role_permissions.map((rp, idx) => (
                                <div key={idx} className="border border-gray-100 p-3 rounded">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium text-gray-700 capitalize">{rp.role}</div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(rp.permissions).map(([resource, actions]) => (
                                            <div key={resource} className="text-sm text-gray-700">
                                                <div className="text-gray-500 text-xs">{resource.replace(/_/g, ' ')}</div>
                                                <div className="mt-1">
                                                    {(actions || []).map((a, i) => (
                                                        <span key={i} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded mr-2">
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-600">No role permissions configured.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TenantDetails;
