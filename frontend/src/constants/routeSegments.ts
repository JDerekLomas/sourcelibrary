export const ROUTE_SEGMENTS = {
  HOME: "",
  LIBRARY: "library",
  CONTACT: "contact",
  ABOUT: "about",
  PATRON: "patron",
  LOGIN: "login",
  DISCOVER: "discover",

  BOOK_DETAILS: "book/:book_id",

  ADMIN: {
    DASHBOARD: "admin/dashboard",
    REQUESTS: "admin/requests",
    CATEGORIES: "admin/categories",
    USERS: "admin/users",
    SETTINGS: "admin/settings",
    TENANTS: "admin/tenants",
  },

  ADD_BOOK: "addbook",
  EDIT_BOOK: "book/edit/:book_id",

  ASTROLOGY: "astrology",
  UNITY_GAME: "game",
  PHASER_GAME: "jsgame",

  TRANSLATION: "translation/:book_id/:page_id",
};