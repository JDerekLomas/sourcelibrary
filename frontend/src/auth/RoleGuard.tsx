import React from "react";
import { useAuth } from "../contexts/AuthContext";

export enum ResourceType {
    TENANT = "tenant",
    USER = "user",
    BOOK = "book",
    PAGE = "page",
    REQUEST = "request",
    CATEGORY = "category",
}

export enum ActionType {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete"
}

export type UserPermissions = {
    [key in ResourceType]?: ActionType[];
};

interface RoleGuardProps {
    resource: ResourceType;
    action: ActionType;
    children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ resource, action, children }) => {
    const { can } = useAuth() || {};
    if (!can || !can(resource, action)) return null;
    return <>{children}</>;
}