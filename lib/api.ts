export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

export async function fetchAPI(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const requestUrl = `${STRAPI_URL}/api${path}`;
  
  try {
    const response = await fetch(requestUrl, mergedOptions);
    
    if (!response.ok) {
        let errorMessage = 'API Error';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || `Error ${response.status}: ${response.statusText}`;
        } catch {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        
        console.error(`API Request Failed: ${requestUrl} [${response.status}]`, errorMessage);
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Fetch API Error on ${requestUrl}:`, error);
    throw error;
  }
}
export async function uploadFile(file: File) {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("files", file);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestUrl = `${STRAPI_URL}/api/upload`;

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await response.json();
    return data[0]; // Strapi returns an array of uploaded files
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
}
