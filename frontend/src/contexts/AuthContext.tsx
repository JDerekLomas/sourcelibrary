import React, { createContext, useContext, useState, useEffect } from "react";

import { useTenant } from "./TenantContext";
import { apiService } from "../services/api";
import { JwtPayload, parseJwt } from "../auth/jwt";
import {
    UserPermissions,
    ResourceType,
    ActionType
} from "../auth/RoleGuard";

type AuthState = {
    username: string | null;
    tenantId: string | null;
    token: string | null;
}

type AuthContextValue = AuthState & {
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    can: (resource: ResourceType, action: ActionType) => boolean;
    ready: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const emptyState: AuthState = {
    username: "",
    tenantId: "",
    token: null
};

const axiosClient = apiService.axiosClient;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [auth, setAuth] = useState<AuthState>(emptyState);
    const [permissions, setPermissions] = useState<UserPermissions>({});
    const [ready, setReady] = useState(false);
    const { tenantSlug } = useTenant() ?? { tenantSlug: null };

    const setAuthFromToken = (token: string) => {
        const payload = parseJwt(token) as JwtPayload | null;

        if (!payload) {
            setAuth(emptyState);
            return;
        }

        setAuth({
            token: token,
            username: payload.username ?? null,
            tenantId: payload.tenant_id ?? null
        });
    };

    const login = async (username: string, password: string) => {
        const response = await apiService.userLogin(username, password);
        setAuthFromToken(response.access_token);
    };

    const logout = async () => {
        await apiService.userLogout();
        setAuth(emptyState);
    };

    const can = (resource: ResourceType, action: ActionType): boolean => {
        const resourcePermissions = permissions[resource];
        if (!resourcePermissions) return false;
        return resourcePermissions.includes(action);
    }

    const getUserPermissions = async () => {
        const response = await apiService.getUserPermissions();
        if (response) {
            setPermissions(response);
            return;
        }

        // Set default permissions for users without specific permissions
        const default_permissions: UserPermissions = {
            [ResourceType.BOOK]: [ActionType.READ],
            [ResourceType.PAGE]: [ActionType.READ],
        };
        setPermissions(default_permissions);
    };

    // Axios interceptor to add Authorization header on requests
    // and try token refresh on 401 responses
    const setupAxiosInterceptors = (token: string | null, tenantSlug: string | null) => {
        const requestId = axiosClient.interceptors.request.use((config) => {
            config.headers = config.headers || {};

            if (token)
                config.headers.Authorization = `Bearer ${token}`;
            else
                delete config.headers.Authorization;

            if (tenantSlug)
                config.headers['X-Tenant-Slug'] = tenantSlug;
            else
                delete config.headers['X-Tenant-Slug'];

            return config;
        });

        const responseId = axiosClient.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const data = await apiService.userTokenRefresh();
                        setAuthFromToken(data.access_token);

                        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
                        return axiosClient(originalRequest);
                    } catch {
                        logout();
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axiosClient.interceptors.request.eject(requestId);
            axiosClient.interceptors.response.eject(responseId);
        };
    };

    // Try to restore session when user clicks back/forward or refreshes the page
    // because AuthProvider is mounted again and access token stored in memory is lost.
    useEffect(() => {
        let cancelled = false;
        let interceptorCleanup = () => { };
        (async () => {
            try {
                const data = await apiService.userTokenRefresh();
                if (!cancelled && data?.access_token) {
                    setAuthFromToken(data.access_token);

                    // Set up interceptors on mount
                    interceptorCleanup = setupAxiosInterceptors(data.access_token, tenantSlug);
                    await getUserPermissions();
                }
            } catch {
                // no valid refresh token / user not logged in -> ignore
            }
            finally {
                if (!cancelled) setReady(true);
            }
        })();

        return () => {
            cancelled = true;
            if (interceptorCleanup) interceptorCleanup();
        };
    }, []);


    useEffect(() => {
        if (!ready) return;

        // Updating interceptors whenever token or tenantSlug changes
        const cleanUp = setupAxiosInterceptors(auth.token, tenantSlug);

        // Getting fresh user permissions on change
        (async () => await getUserPermissions())();

        return () => {
            cleanUp();
        };
    }, [auth.token, tenantSlug]);

    const value: AuthContextValue = {
        ...auth,
        login: login,
        logout: logout,
        can: can,
        ready: ready,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue | null => {
    const ctx = useContext(AuthContext);
    return ctx;
};