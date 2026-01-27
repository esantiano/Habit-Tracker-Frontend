import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function RegisterPage() {
    const nav = useNavigate();
    const [form, setForm] = useState({
        email: "",
        username: "",
        password: "",
        timezone: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await api.register(form);
            nav("/login");
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