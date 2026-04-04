import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate({ to: "/productos" });
    } catch {
      setError("Email o password incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "380px",
        padding: "2rem",
      }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            width: "40px", height: "40px",
            backgroundColor: "var(--accent)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1rem",
          }}>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: "600" }}>SV</span>
          </div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: "500", marginBottom: "4px" }}>
            Sistema de Ventas
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Iniciá sesión para continuar
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "var(--danger-light)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger)",
            fontSize: "13px",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "1rem",
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--accent-text)", marginBottom: "6px" }}>
            Email
          </label>
          <input
            type="email"
            placeholder="alan@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "14px",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--accent-text)", marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "14px",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "14px",
            fontWeight: "500",
            backgroundColor: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}

export default Login;