import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { UserPermissions, ResourceType } from "./RoleGuard";
import { useAuth } from "../contexts/AuthContext";
import { usePaths } from "../hooks/usePaths";

type ProtectedRouteProps = {
    allowedPermissions: UserPermissions;
};

export const ProtectedRoutes: React.FC<ProtectedRouteProps> = ({ allowedPermissions }) => {
    const { token, can, ready } = useAuth() || {};
    const paths = usePaths();

    if (!ready) return null;

    // Not logged in, redirect to login
    if (!token) {
        return <Navigate to={paths.login} replace />;
    }

    // Check if user has required permissions
    let hasAccess = false;
    if (allowedPermissions && can) {
        for (const resourceKey in allowedPermissions) {
            const resource = resourceKey as ResourceType;
            const allowedActions = allowedPermissions[resource];
            if (!allowedActions) break;

            for (const action of allowedActions) {
                if (can(resource, action)) {
                    hasAccess = true;
                    break;
                }
            }
        }
    }

    // User lacks required permissions, redirect to login
    if (!hasAccess) {
        window.alert("You're not privileged enough yet to access this page.");
        return <Navigate to={paths.home} replace />;
    }

    return <Outlet />;
};