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
  const defaultHeaders: any = {
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
        // Handle 401 Unauthorized globally if needed (e.g. redirect to login)
        if (response.status === 401) {
            // Optional: removeAuthToken(); 
            // window.location.href = '/login'; 
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch API Error:', error);
    throw error;
  }
}
