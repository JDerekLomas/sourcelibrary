import React, { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import DashboardButton from "../../components/ui/Buttons/DashboardButton";
import type {
    TenantBrandingConfig,
    TenantSettings,
    TenantRolePermissions,
    RoleName,
} from "../../types/tenant_interfaces";
import { ROLE_NAME } from "../../types/tenant_interfaces";
import { useAuth } from "../../contexts/AuthContext";
import { ResourceType, ActionType } from "../../auth/RoleGuard";

const Settings: React.FC = () => {
    const tenantId = useAuth()?.tenantId || null;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // branding fields
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [headerVideoUrl, setHeaderVideoUrl] = useState<string | null>(null);
    const [headingText, setHeadingText] = useState("");
    const [subheadingText, setSubheadingText] = useState("");
    const [primaryHexColor, setPrimaryHexColor] = useState("");
    const [originalPrimaryHexColor, setOriginalPrimaryHexColor] = useState<string>("");

    // structured role permissions state
    const [rolePermissions, setRolePermissions] = useState<TenantRolePermissions[]>(
        () =>
            Object.values(ROLE_NAME).map((r) => ({
                role: r,
                permissions: Object.values(ResourceType)
                    .filter((res) => res !== ResourceType.TENANT)
                    .reduce((acc, res) => {
                        acc[res as ResourceType] = [];
                        return acc;
                    }, {} as Record<ResourceType, ActionType[]>),
            }))
    );

    const setBrandingFields = (bc: TenantBrandingConfig | null) => {
        if (!bc) return;

        setLogoUrl(bc.logo_url ?? null);
        setHeaderVideoUrl(bc.header_video_url ?? null);
        setHeadingText(bc.heading_text ?? "");
        setSubheadingText(bc.subheading_text ?? "");
        const orig = bc.primary_hex_color ?? "";
        setPrimaryHexColor(orig);
        setOriginalPrimaryHexColor(orig);
    };

    useEffect(() => {
        if (!tenantId) return;
        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiService.getTenantSettings();
                const bc = data.branding_config ?? ({} as TenantBrandingConfig);
                setBrandingFields(bc);

                // initialize structured rolePermissions from backend (or keep defaults)                
                if (data.role_permissions && Array.isArray(data.role_permissions)) {
                    // normalize backend shape to our TenantRolePermissions[]
                    const normalized = Object.values(ROLE_NAME).map((r) => {
                        const found = data.role_permissions?.find((rp: any) => rp.role === r);
                        if (found && found.permissions) {
                            // ensure each resource exists (excluding tenant)
                            const perms = Object.values(ResourceType)
                                .filter((res) => res !== ResourceType.TENANT)
                                .reduce((acc, res) => {
                                    acc[res as ResourceType] = found.permissions[res] ?? [];
                                    return acc;
                                }, {} as Record<ResourceType, ActionType[]>);
                            return { role: r, permissions: perms };
                        }
                        // default empty perms (excluding tenant)
                        return {
                            role: r,
                            permissions: Object.values(ResourceType)
                                .filter((res) => res !== ResourceType.TENANT)
                                .reduce((acc, res) => {
                                    acc[res as ResourceType] = [];
                                    return acc;
                                }, {} as Record<ResourceType, ActionType[]>),
                        };
                    });
                    setRolePermissions(normalized);
                }
            } catch (err) {
                setError("Failed to load tenant details!");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const toggleAction = (role: RoleName, resource: ResourceType, action: ActionType) => {
        setRolePermissions((prev) =>
            prev.map((rp) => {
                if (rp.role !== role) return rp;
                const current = rp.permissions[resource] ?? [];
                const exists = current.includes(action);
                const updated = exists ? current.filter((a) => a !== action) : [...current, action];
                return {
                    ...rp,
                    permissions: {
                        ...rp.permissions,
                        [resource]: updated,
                    },
                };
            })
        );
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (!tenantId) return;

        if (e) e.preventDefault();
        setError(null);
        setSuccess(null);

        const payload: TenantSettings = {
            tenant_id: tenantId,
            branding_config: {
                logo_url: logoUrl ?? null,
                header_video_url: headerVideoUrl ?? null,
                heading_text: headingText,
                subheading_text: subheadingText,
                primary_hex_color: primaryHexColor,
            },
            role_permissions: rolePermissions,
        };

        setSaving(true);
        try {
            await apiService.updateTenantSettings(payload);
            setSuccess("Settings saved successfully.");
            // refresh tenant info
            const refreshed = await apiService.getTenantSettings();
            setBrandingFields(refreshed.branding_config || null);

            // update role permissions from refreshed if present
            if (refreshed.role_permissions && Array.isArray(refreshed.role_permissions)) {
                const normalized = Object.values(ROLE_NAME).map((r) => {
                    const found = refreshed.role_permissions?.find((rp: any) => rp.role === r);
                    if (found && found.permissions) {
                        const perms = Object.values(ResourceType)
                            .filter((res) => res !== ResourceType.TENANT)
                            .reduce((acc, res) => {
                                acc[res as ResourceType] = found.permissions[res] ?? [];
                                return acc;
                            }, {} as Record<ResourceType, ActionType[]>);
                        return { role: r, permissions: perms };
                    }
                    return {
                        role: r,
                        permissions: Object.values(ResourceType)
                            .filter((res) => res !== ResourceType.TENANT)
                            .reduce((acc, res) => {
                                acc[res as ResourceType] = [];
                                return acc;
                            }, {} as Record<ResourceType, ActionType[]>),
                    };
                });
                setRolePermissions(normalized);
            }
        } catch (err) {
            setError("Failed to save settings!");
        } finally {
            setSaving(false);
        }
    };

    // helper to validate and normalize hex colors
    const isValidHex = (s: string) => /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s.trim());
    const normalizeHex = (s: string) => {
        if (!s) return "";
        let t = s.trim();
        if (!t.startsWith("#")) t = `#${t}`;
        if (!isValidHex(t)) return "";
        if (t.length === 4) {
            // expand shorthand #abc -> #aabbcc
            const r = t[1], g = t[2], b = t[3];
            return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        }
        return t.toLowerCase();
    };

    // computed picker value (must be a valid #rrggbb)
    const colorPickerValue = (() => {
        const n = normalizeHex(primaryHexColor);
        return n || "#000000";
    })();

    const handleColorTextBlur = () => {
        const n = normalizeHex(primaryHexColor);
        if (n) setPrimaryHexColor(n);
    };

    if (loading) return null;

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            {/* Header */}
            <div className="mb-6">
                {logoUrl && (
                    <div className="mb-4">
                        <img src={logoUrl} alt="Tenant Logo" className="h-20 object-contain" />
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                    <DashboardButton />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Branding Section */}
                <section className="p-4 border rounded bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Branding</h2>
                        <p className="text-sm text-gray-500">Update logos, headings and primary color</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Logo URL</label>
                            <input
                                type="text"
                                value={logoUrl ?? ""}
                                onChange={(e) => setLogoUrl(e.target.value || null)}
                                placeholder="https://..."
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Header Video URL</label>
                            <input
                                type="text"
                                value={headerVideoUrl ?? ""}
                                onChange={(e) => setHeaderVideoUrl(e.target.value || null)}
                                placeholder="https://..."
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Heading Text</label>
                                <input
                                    type="text"
                                    value={headingText}
                                    onChange={(e) => setHeadingText(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Subheading Text</label>
                                <input
                                    type="text"
                                    value={subheadingText}
                                    onChange={(e) => setSubheadingText(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Primary Brand Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={colorPickerValue}
                                    onChange={(e) => setPrimaryHexColor(e.target.value)}
                                    className="w-12 h-10 p-0 border rounded"
                                    aria-label="Primary color picker"
                                />
                                <input
                                    type="text"
                                    value={primaryHexColor}
                                    onChange={(e) => setPrimaryHexColor(e.target.value)}
                                    onBlur={handleColorTextBlur}
                                    placeholder="#123abc"
                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPrimaryHexColor(originalPrimaryHexColor)}
                                    disabled={!originalPrimaryHexColor || originalPrimaryHexColor === primaryHexColor}
                                    className={`ml-2 px-3 py-2 rounded text-sm border ${(!originalPrimaryHexColor || originalPrimaryHexColor === primaryHexColor) ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"}`}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Roles & Permissions Section */}
                <section className="p-4 border rounded bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Roles & Permissions</h2>
                        <p className="text-sm text-gray-500">Assign actions per role and resource</p>
                    </div>

                    <div className="space-y-4 bg-white">
                        {rolePermissions.map((rp) => (
                            <div key={rp.role} className="p-3 border rounded">
                                <h3 className="font-sans font-semibold mb-2 capitalize">{rp.role}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.values(ResourceType)
                                        .filter((res) => res !== ResourceType.TENANT)
                                        .map((res) => (
                                            <div key={res} className="p-2 border rounded">
                                                <div className="font-medium mb-2 capitalize">{res}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.values(ActionType).map((act) => {
                                                        const checked = (rp.permissions[res as ResourceType] || []).includes(act);
                                                        return (
                                                            <label key={act} className="inline-flex items-center space-x-2 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleAction(rp.role, res as ResourceType, act)}
                                                                    className="rounded"
                                                                />
                                                                <span className="capitalize">{act}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Submit + messages (moved here so messages are visible when scrolled) */}
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`font-semibold py-2 px-4 rounded transition duration-200 ${saving ? "bg-gray-300 text-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                        >
                            {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>

                    <div className="min-w-0 md:ml-4">
                        {error && (
                            <p className="text-red-600 bg-red-100 p-3 rounded">
                                {error}
                            </p>
                        )}
                        {success && (
                            <p className="text-green-700 bg-green-100 p-3 rounded">
                                {success}
                            </p>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Settings;
