
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

// Standard API response envelope
interface ApiEnvelope<T> {
    data: T;
    error: string | null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    const config: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    let envelope: ApiEnvelope<T> | undefined;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        envelope = await response.json();
    }

    if (!response.ok) {
        throw new ApiError(response.status, response.statusText, envelope);
    }

    // Unwrap the data from the envelope
    if (envelope) {
        return envelope.data;
    }

    return undefined as unknown as T;
}

export const apiClient = {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(url: string, body: unknown) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),

    // For raw fetch access (e.g. blobs)
    fetch: (endpoint: string, options: RequestInit = {}) => request<unknown>(endpoint, options),
};