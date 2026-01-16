import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { clearToken, getToken } from "./lib/auth";
import type { JSX } from "react";

function Protected({children}: {children: JSX.Element }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const nav = useNavigate();
  const token = getToken();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16}}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16}}>
        <Link to="/" style={{ fontWeight: 700, textDecoration: "none"}}>
          Habit Tracker
        </Link>
        
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {!token ? (
            <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            </>
          ) : (
            <button onClick={() => {
              clearToken();
              nav('/login');
            }}
            >Logout
            </button>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />}/>
        <Route path="/dashboard" element={<Protected><DashboardPage/></Protected>}/>
      </Routes>
    </div>
  )
}