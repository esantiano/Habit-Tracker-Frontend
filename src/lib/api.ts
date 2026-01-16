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

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/jdon"
    }
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        return (await res.text()) as unknown as T;
    }

    return (await res.json()) as T;
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
                throw new Error(text || `Login failed ${res.status}`);
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

        createHabit: (payload: {
            name: string;
            description?: string;
            goal_type: "DAILY" | "WEEKLY" | "X_PER_WEEK",
            target_per_period: number;
            start_date: string;
        }) => 
            request("/habits/", {
                method: "POST",
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify(payload)
            }),
        
        archiveHabit: (habitId: number) => 
            request<void>(`/habits/${habitId}`, {
                method: "DELETE"
            }),

        listHabits: (includeArchived = false) =>
            request<Array<{
                id: number;
                name: string;
                description: string;
                goal_type: string;
                is_archived: boolean;
                created_at: string;
            }>>(`/habits/?include_archived=${includeArchived}`),

        restoreHabit: (habitId: number) =>
            request(`/habits/${habitId}/restore`,{ method: "PATCH"}),
};