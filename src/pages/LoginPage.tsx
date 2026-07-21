import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

interface FastAPIValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
}

interface FastAPIErrorResponse {
    detail: FastAPIValidationError[] | string;
}
export default function LoginPage() {
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState("");   
    const [loading, setLoading] = useState(false);
    const [usernameError, setUsernameError] = useState("gray");
    const [passwordError, setPasswordError] = useState("gray");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors("");         
        setLoading(true);
        if (username == "" || password == ""){
            setErrors("Error missing username or password.");
            if (username == "") {
                setUsernameError("red");
            } if (password == "") {
                setPasswordError("red");
            }
            setLoading(false);
        } else if (username != "" && password != ""){
            try {
                const res = await api.login({ username, password });
                setToken(res.access_token);
                nav("/dashboard");
            } catch (err) {
                const apiErrors = err as FastAPIErrorResponse
                console.log(apiErrors);
                setErrors("unknown error");
            } finally { 
                setLoading(false);
            }
        }
    }

    return (
        <div>
            <h2 className="centered">Login</h2>
            <form onSubmit={onSubmit} style={{display: "grid", gap: 10}}>
                <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{border: `1px solid ${usernameError}`}}/>
                <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{border: `1px solid ${passwordError}`}}/>
                <button disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
            </form>
            {errors && <pre style={{color: "crimson", whiteSpace: "prewrap", display: "flex", justifyContent: "center"}}>{errors}</pre>}
        </div>
    );
}

