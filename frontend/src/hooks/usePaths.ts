import { PATHS } from "../constants/paths";
import { useTenant } from "../contexts/TenantContext";

export const usePaths = () => {
  const tenant = useTenant();
  const tenantSlug = tenant?.tenantSlug ?? "";

  return {
    home: PATHS.HOME(tenantSlug),
    library: PATHS.LIBRARY(tenantSlug),
    contact: PATHS.CONTACT(tenantSlug),
    about: PATHS.ABOUT(tenantSlug),
    patron: PATHS.PATRON(tenantSlug),
    login: PATHS.LOGIN(tenantSlug),
    discover: PATHS.DISCOVER(tenantSlug),

    bookDetails: (bookId:string) => PATHS.BOOK_DETAILS(tenantSlug, bookId),

    admin: {
      dashboard: PATHS.ADMIN.DASHBOARD(tenantSlug),
      requests: PATHS.ADMIN.REQUESTS(tenantSlug),
      categories: PATHS.ADMIN.CATEGORIES(tenantSlug),
      users: PATHS.ADMIN.USERS(tenantSlug),
      settings: PATHS.ADMIN.SETTINGS(tenantSlug),
      tenants: PATHS.ADMIN.TENANTS(tenantSlug),
    },

    addBook: PATHS.ADD_BOOK(tenantSlug),
    editBook: (bookId:string) => PATHS.EDIT_BOOK(tenantSlug, bookId),

    astrology: PATHS.ASTROLOGY(tenantSlug),
    unityGame: PATHS.UNITY_GAME(tenantSlug),
    phaserGame: PATHS.PHASER_GAME(tenantSlug),

    translation: (bookId:string, pageId:string) => PATHS.TRANSLATION(tenantSlug, bookId, pageId),
    translator: (bookId:string, pageId:string) => PATHS.TRANSLATOR(tenantSlug, bookId, pageId),
  };
};
