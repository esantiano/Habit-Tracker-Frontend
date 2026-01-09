import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: Record<string, string> = {
        ...(options.headers as Record<string,string> | undefined),
    };

    if (!headers["Content-Type"] && options.body && typeof options.body === "string") {
        //placeholder -- caller set body manually
    } else if (!headers["Content-Type"] && options.body) {
        headers["Content-Type"] = "applications/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
}

export const api = {
    register: (payload: {email: string; username: string; password: string; timezone: string }) => 
        request("/auth/register", {
            method: "POST",
            headers: {
                    'Content-Type': 'application/json' // Crucial for the server to treat the string as an object
            },
            body: JSON.stringify(payload),
        }),

        login: async (payload: {username: string; password: string }) => {
            const form = new URLSearchParams();
            form.set("username", payload.username);
            form.set("password", payload.password);

            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded"},
                body: form.toString(),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Login failted ${res.status}`);
            }

            return res.json() as Promise<{access_token: string; token_type: string}>
        },

        me: () => request("/auth/me"),

        dashboardToday: () =>
            request<{
                date: string;
                habits: Array<{
                    habit: {id: number; name: string; description: string; goal_type: string };
                    is_completed: boolean;
                    current_streak: number;
                    best_streak: number;
                }>;
            }>("/dashboard/today"),
        
        createHabitLog: (habitId: number, payload: {date: string; value: number }) =>
            request(`/habits/${habitId}/logs`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json' // Crucial for the server to treat the string as an object
                },
                body: JSON.stringify(payload),
            }),
};