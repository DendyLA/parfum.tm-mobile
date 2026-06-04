const API_BASE_URL = "https://parfum.com.tm/api/v1";

export async function apiGet<T>(path: string): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    let response: Response;

    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    } catch {
        throw new Error("Нет соединения с интернетом. Проверьте сеть и попробуйте снова.");
    }

    if (!response.ok) {
        let message = "Не удалось отправить данные. Попробуйте ещё раз.";

        try {
            const errorBody = await response.json();
            const detail = errorBody?.detail || errorBody?.message || errorBody?.error;
            if (typeof detail === "string") {
                message = detail;
            }
        } catch {
            if (response.status >= 500) {
                message = "Сервер временно недоступен. Попробуйте чуть позже.";
            }
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export function asList<T>(
    data: T[] | { results?: T[] } | null | undefined
): T[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

export function absoluteMediaUrl(value?: string | null) {
    if (!value) return null;
    if (value.startsWith("http")) return value;
    return `https://parfum.com.tm${value}`;
}
