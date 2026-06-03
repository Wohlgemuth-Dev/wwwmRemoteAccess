
export const API_BASE_URL = window.location.protocol + "//" + window.location.hostname + ":8080";

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

function buildRequestHeaders(options: RequestInit): Headers {
    const body = options.body;
    const isFormDataBody = typeof FormData !== 'undefined' && body instanceof FormData;

    const headers = new Headers(options.headers);

    if (!isFormDataBody && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const token = sessionStorage.getItem('token');
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
}


async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const config: RequestInit = {
        ...options,
        headers: buildRequestHeaders(options),
        signal: controller.signal,
    };

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    } catch (err) {
        window.dispatchEvent(new CustomEvent('api-error', {
            detail: { message: 'Server is unreachable. Please check if the backend is running.' }
        }));
        throw new ApiError(0, 'Network Error', { error: 'Server unreachable' });
    } finally {
        clearTimeout(timeoutId);
    }

    let jsonData: any = undefined;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        jsonData = await response.json();
    }

    if (!response.ok) {
        const error = new ApiError(response.status, response.statusText, jsonData);
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent('auth-unauthorized'));
        } else if (response.status >= 500) {
            window.dispatchEvent(new CustomEvent('api-error', {
                detail: { message: `Server error (${response.status}): ${error.message}` }
            }));
        }
        throw error;
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
    fetchRaw: async (endpoint: string, options: RequestInit = {}) => {
        let response: Response;
        try {
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: buildRequestHeaders(options),
            });
        } catch (err) {
            window.dispatchEvent(new CustomEvent('api-error', {
                detail: { message: 'Server is unreachable. Please check if the backend is running.' }
            }));
            throw new ApiError(0, 'Network Error', { error: 'Server unreachable' });
        }

        if (!response.ok) {
            let errorData: unknown;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
            } else {
                errorData = { error: response.statusText };
            }

            const error = new ApiError(response.status, response.statusText, errorData);
            if (response.status === 401) {
                window.dispatchEvent(new CustomEvent('auth-unauthorized'));
            } else if (response.status >= 500) {
                window.dispatchEvent(new CustomEvent('api-error', {
                    detail: { message: `Server error (${response.status}): ${error.message}` }
                }));
            }
            throw error;
        }

        return response;
    },
};