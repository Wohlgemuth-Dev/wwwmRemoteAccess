
export const API_BASE_URL = "http://localhost:8080";

export class ApiError extends Error {
    public status: number;
    public statusText: string;
    public data: unknown;

    constructor(status: number, statusText: string, data: unknown) {
        const errorMsg = (data as { error?: string })?.error;
        super(errorMsg || statusText);
        this.status = status;
        this.statusText = statusText;
        this.data = data;
    }
}


async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const body = options.body;
    const isFormDataBody = typeof FormData !== 'undefined' && body instanceof FormData;

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if (!isFormDataBody && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const token = sessionStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    let jsonData: any = undefined;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        jsonData = await response.json();
    }

    if (!response.ok) {
        throw new ApiError(response.status, response.statusText, jsonData);
    }

    return (jsonData !== undefined ? jsonData : undefined) as T;
}

export const apiClient = {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(url: string, body: unknown) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),

    // For raw fetch access (e.g. blobs)
    fetch: (endpoint: string, options: RequestInit = {}) => request<unknown>(endpoint, options),
};