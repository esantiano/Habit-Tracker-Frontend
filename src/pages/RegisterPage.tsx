import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";



export default function RegisterPage() {
    const nav = useNavigate();
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [form, setForm] = useState({
        email: "",
        username: "",
        password: "",
        timezone: browserTz,
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    interface registrationResponse {
        id: number;
        email: string;
        timezone: string;
        created_at: string
    }
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const regResponse = await api.register(form);
            const user = regResponse as registrationResponse;
            if (user.id != null && user.id >= 0){
                const username = form.username;
                const password = form.password;
                const loginResponse = await api.login({username, password})
                if (loginResponse.access_token != "")
                {
                    setToken(loginResponse.access_token);
                    nav("/dashboard");
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                const errorObj = JSON.parse(err.message)
                setError(errorObj.detail); 
            } else {
                setError(String(err)); 
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h2 className="centered">Register</h2>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
                <input
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value })}
                />
                <input
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value})}
                />
                <input
                    placeholder="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <input
                    placeholder="Timezone"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value})}
                />
                <button disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
                {error && <pre style={{ color: "crimson", whiteSpace: "pre-wrap", display: "flex", justifyContent: "center"}}>{error}</pre>}
            </form>
        </div>
    );
}