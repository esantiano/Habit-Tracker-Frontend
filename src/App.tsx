import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage  from "./pages/AnalyticsPage";
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
    <div style={{ minHeight: "100vh"}}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px"}}>
        <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16}}>
          <Link to="/" style={{ fontWeight: 700, textDecoration: "none"}}>
            Habit Tracker
          </Link>
          <Link className="centered" to="/analytics">Analytics</Link>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            {!token ? (
              <>
              <Link className="centered" to="/login">Login</Link>
              <Link className="centered" to="/register">Register</Link>
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
          <Route path="/analytics" element={<Protected><AnalyticsPage/></Protected>}/>
        </Routes>
      </div>
    </div>
  )
}