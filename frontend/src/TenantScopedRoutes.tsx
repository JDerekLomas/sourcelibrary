import { Routes, Route } from "react-router-dom";

import { ROUTE_SEGMENTS } from "./constants/routeSegments";
import { ProtectedRoutes } from "./auth/ProtectedRoute";
import { ResourceType, ActionType } from "./auth/RoleGuard";

import Login from "./pages/Login";
import BookDetails from "./pages/BookDetails";
import AddBook from "./pages/AddBook";
import EditBook from "./pages/EditBook";
import OCRTranslation from "./pages/OCRTranslation";
import BookTranslator from "./pages/BookTranslator";
import Discover from "./pages/Discover";
import AdminHomePage from "./pages/admin/dashboard";
import RequestsPage from "./pages/admin/request";
import AdminCategoriesPage from "./pages/admin/categories";
import AdminUsersPage from "./pages/admin/users";
import Settings from "./pages/admin/Settings";
import Astrology from "./pages/Astrology";
import UnityGame from "./pages/UnityGame";
import PhaserGame from "./pages/PhaserGame";
// import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import ContactPage from "./pages/ContactPage";
// import AboutPage from "./pages/AboutPage";
import PatronPage from "./pages/PatronPage";
import TenantManagement from "./pages/root/TenantManagement";

import { AuthProvider } from "./contexts/AuthContext";

export const TenantScopedRoutes = () => {
    return (
        <AuthProvider>
            <Routes>
                {/* Public Routes */}
                <Route path={ROUTE_SEGMENTS.HOME} element={<LibraryPage />} />
                <Route path={ROUTE_SEGMENTS.LIBRARY} element={<LibraryPage />} />
                <Route path={ROUTE_SEGMENTS.CONTACT} element={<ContactPage />} />
                {/* <Route path={ROUTE_SEGMENTS.ABOUT} element={<AboutPage />} /> */}
                <Route path={ROUTE_SEGMENTS.PATRON} element={<PatronPage />} />
                <Route path={ROUTE_SEGMENTS.LOGIN} element={<Login />} />
                <Route path={ROUTE_SEGMENTS.DISCOVER} element={<Discover />} />
                <Route path={ROUTE_SEGMENTS.BOOK_DETAILS} element={<BookDetails />} />
                <Route path={ROUTE_SEGMENTS.TRANSLATION} element={<OCRTranslation />} />
                <Route path={ROUTE_SEGMENTS.TRANSLATOR} element={<BookTranslator />} />

                {/* Admin Routes */}
                <Route element={<ProtectedRoutes allowedPermissions={{ [ResourceType.USER]: [ActionType.CREATE, ActionType.UPDATE, ActionType.DELETE] }} />}>
                    <Route path={ROUTE_SEGMENTS.ADMIN.DASHBOARD} element={<AdminHomePage />} />
                    <Route path={ROUTE_SEGMENTS.ADMIN.USERS} element={<AdminUsersPage />} />
                    <Route path={ROUTE_SEGMENTS.ADMIN.SETTINGS} element={<Settings />} />

                    {/* Miscellaneous Pages */}
                    <Route path={ROUTE_SEGMENTS.ASTROLOGY} element={<Astrology />} />
                    <Route path={ROUTE_SEGMENTS.UNITY_GAME} element={<UnityGame />} />
                    <Route path={ROUTE_SEGMENTS.PHASER_GAME} element={<PhaserGame />} />
                </Route>

                <Route element={<ProtectedRoutes allowedPermissions={{ [ResourceType.REQUEST]: [ActionType.UPDATE, ActionType.DELETE] }} />}>
                    <Route path={ROUTE_SEGMENTS.ADMIN.REQUESTS} element={<RequestsPage />} />
                </Route>

                <Route element={<ProtectedRoutes allowedPermissions={{ [ResourceType.CATEGORY]: [ActionType.CREATE, ActionType.UPDATE, ActionType.DELETE] }} />}>
                    <Route path={ROUTE_SEGMENTS.ADMIN.CATEGORIES} element={<AdminCategoriesPage />} />
                </Route>

                <Route element={<ProtectedRoutes allowedPermissions={{ [ResourceType.TENANT]: [ActionType.DELETE] }} />}>
                    <Route path={ROUTE_SEGMENTS.ADMIN.TENANTS} element={<TenantManagement />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<ProtectedRoutes allowedPermissions={{ [ResourceType.BOOK]: [ActionType.CREATE] }} />}>
                    <Route path={ROUTE_SEGMENTS.ADD_BOOK} element={<AddBook />} />
                </Route>

                <Route element={<ProtectedRoutes allowedPermissions={{ [ResourceType.BOOK]: [ActionType.UPDATE] }} />}>
                    <Route path={ROUTE_SEGMENTS.EDIT_BOOK} element={<EditBook />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
};
