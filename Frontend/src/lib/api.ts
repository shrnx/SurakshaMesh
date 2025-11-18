const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL environment variable. Please add it to .env.local");
}

export async function fetchFromApi<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...options?.headers,
        'ngrok-skip-browser-warning': 'true',
      },
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Request failed with status ' + response.status }));
      throw new Error(errorBody.error || 'An unknown error occurred');
    }
    return response.json();
  } catch (error) {
    console.error(`API fetch error for path ${path}:`, error);
    throw error; // Re-throw so the component can handle it
  }
}