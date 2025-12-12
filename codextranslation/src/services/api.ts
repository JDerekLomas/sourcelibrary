const BASE_URL = 'https://book-translation-backend-391835035966.asia-south1.run.app';

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

// Placeholder for login function
export const login = async (username: string, password: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  setAuthToken(data.access_token);
  return data;
};

// We will add more functions here to interact with the API endpoints

export const getBooks = async (): Promise<any[]> => {
  if (!authToken) {
    throw new Error('Authentication token not set.');
  }

  const response = await fetch(`${BASE_URL}/books/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }

  return response.json();
};

export const getPagesForBook = async (bookId: string): Promise<any[]> => {
  if (!authToken) {
    throw new Error('Authentication token not set.');
  }

  const response = await fetch(`${BASE_URL}/books/${bookId}/pages/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch pages for book ${bookId}`);
  }

  return response.json();
};

export const translatePage = async (bookId: string, pageId: string, targetLanguage: string): Promise<any> => {

  if (!authToken) {

    throw new Error('Authentication token not set.');

  }



  const response = await fetch(`${BASE_URL}/books/${bookId}/pages/${pageId}/translate`, {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json',

      'Authorization': `Bearer ${authToken}`,

    },

    body: JSON.stringify({ target_language: targetLanguage }),

  });



  if (!response.ok) {

    throw new Error(`Failed to translate page ${pageId} for book ${bookId}`);

  }



  return response.json();

};



export const updatePageContent = async (bookId: string, pageId: string, updatedFields: { ocrText?: string; translationText?: string }): Promise<any> => {

  if (!authToken) {

    throw new Error('Authentication token not set.');

  }



  const response = await fetch(`${BASE_URL}/books/${bookId}/pages/${pageId}`, {

    method: 'PUT',

    headers: {

      'Content-Type': 'application/json',

      'Authorization': `Bearer ${authToken}`,

    },

    body: JSON.stringify(updatedFields),

  });



  if (!response.ok) {

    throw new Error(`Failed to update page ${pageId} for book ${bookId}`);

  }



  return response.json();

};
