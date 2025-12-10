const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getPrompts: () => request("/prompts"),
  getBooks: () => request("/books"),
  getBook: (bookId) => request(`/books/${bookId}`),
  getPages: (bookId) => request(`/books/${bookId}/pages`),
  getPage: (pageId) => request(`/pages/${pageId}`),
  getPageHistory: (pageId) => request(`/pages/${pageId}/history`),
  runOCR: (payload) => request("/ocr/run", { method: "POST", body: JSON.stringify(payload) }),
  runTranslation: (payload) => request("/translate/run", { method: "POST", body: JSON.stringify(payload) }),
  getContext: (pageId) => request(`/context/${pageId}`),
  getRequests: () => request("/requests"),
  updateRequest: (id, payload) => request(`/requests/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  publishBook: (bookId, payload) => request(`/books/${bookId}/publish`, { method: "POST", body: JSON.stringify(payload) }),
  searchBooks: (query) => request(`/reader/search?query=${encodeURIComponent(query)}`),
  getInfraStatus: () => request("/infra/status"),
  getUsers: () => request("/users"),
  getPromptsContext: (pageId) => request(`/context/${pageId}`),
  listComments: (pageId) => request(`/pages/${pageId}/comments`),
  createComment: (pageId, payload) => request(`/pages/${pageId}/comments`, { method: "POST", body: JSON.stringify(payload) }),
};
