import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

export default function LoginPage() {
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.login({ username, password });
            setToken(res.access_token);
            nav("/dashboard");
        } catch (err: unknown) {
            if (err instanceof Error) {
                const errorObj = JSON.parse(err.message)
                setError(errorObj.detail); 
            } else {
                setError(String(err)); 
            }
        } finally { setLoading(false)

        }
    }

    return (
        <div>
            <h2 className="centered">Login</h2>
            <form onSubmit={onSubmit} style={{display: "grid", gap: 10}}>
                <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
                {error && <pre style={{color: "crimson", whiteSpace: "prewrap", display: "flex", justifyContent: "center"}}>{error}</pre>}
            </form>
        </div>
    );
}

