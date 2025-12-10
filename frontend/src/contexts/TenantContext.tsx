import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiService } from "../services/api";
import type { TenantBrandingConfig } from "../types/tenant_interfaces";

type TenantContextValue = {
    tenantSlug: string | null;
    tenantConfig: TenantBrandingConfig | null;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const tenantSlug = useLocation().pathname.split('/').filter(Boolean)[0] || null;
    const [isValidating, setIsValidating] = useState(false);
    const [tenantConfig, setTenantConfig] = useState<TenantBrandingConfig | null>(null);

    useEffect(() => {
        if (!tenantSlug || isValidating) return;

        setIsValidating(true);
        (async () => {
            try {
                const response = await apiService.validateTenant();
                setTenantConfig(response);
            } catch (error: any) {
                if (error.response?.status === 401 ||
                    error.response?.status === 404 ||
                    error.response?.status === 500) {
                    console.error("Invalid tenant slug or tenant not found!");
                    window.location.href = "/"; // Redirect to homepage
                    return;
                }
            } finally {
                setIsValidating(false);
            }
        })();
    }, [tenantSlug]);

    if (isValidating)
        return;

    const value: TenantContextValue = {
        tenantSlug: tenantSlug,
        tenantConfig: tenantConfig,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = (): TenantContextValue | null => {
    const value = useContext(TenantContext);
    return value;
};
