// src/constants/paths.js
import { ROUTE_SEGMENTS } from "./routeSegments";

export const withTenant = (tenant: string, segment: string) => {  
  if (!tenant && !segment)
    return "/";
  
  if (!tenant && segment)
    return `/${segment}`;
  
  if (tenant && !segment)
    return `/${tenant}`;
  
  return `/${tenant}/${segment}`;
};

export const PATHS = {
  HOME: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.HOME),
  LIBRARY: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.LIBRARY),
  CONTACT: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.CONTACT),
  ABOUT: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.ABOUT),
  PATRON: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.PATRON),
  LOGIN: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.LOGIN),
  DISCOVER: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.DISCOVER),

  BOOK_DETAILS: (tenant: string, bookId: string) =>
    `/${tenant}/${ROUTE_SEGMENTS.BOOK_DETAILS.replace(":book_id", bookId)}`,

  ADMIN: {
    DASHBOARD: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.ADMIN.DASHBOARD),
    REQUESTS: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.ADMIN.REQUESTS),
    CATEGORIES: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.ADMIN.CATEGORIES),
    USERS: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.ADMIN.USERS),
    SETTINGS: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.ADMIN.SETTINGS),
    TENANTS: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.ADMIN.TENANTS),
  },

  ADD_BOOK: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.ADD_BOOK),
  EDIT_BOOK: (tenant: string, bookId: string) =>
    `/${tenant}/${ROUTE_SEGMENTS.EDIT_BOOK.replace(":book_id", bookId)}`,

  ASTROLOGY: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.ASTROLOGY),
  UNITY_GAME: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.UNITY_GAME),
  PHASER_GAME: (tenant: string) => withTenant(tenant, ROUTE_SEGMENTS.PHASER_GAME),

  TRANSLATION: (tenant: string, bookId: string, pageId: string) => {
    return `/${tenant}/${ROUTE_SEGMENTS.TRANSLATION.
      replace(":book_id", bookId).
      replace(":page_id", pageId)}`;        
  }
};