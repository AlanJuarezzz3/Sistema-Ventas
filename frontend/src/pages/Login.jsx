import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate({ to: "/productos" });
    } catch {
      setError("Email o password incorrectos");
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f4f4f4",
    }}>
      <div style={{
        background: "#fff",
        padding: "2rem",
        borderRadius: "12px",
        border: "0.5px solid #ddd",
        width: "100%",
        maxWidth: "380px",
      }}>
        <h2 style={{ fontWeight: "500", fontSize: "20px", marginBottom: "1.5rem" }}>
          Sistema de Ventas
        </h2>

        {error && (
          <p style={{ color: "#c0392b", fontSize: "13px", marginBottom: "1rem" }}>{error}</p>
        )}

        <label style={labelStyle}>Email</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="alan@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label style={labelStyle}>Password</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin} style={btnStyle}>Iniciar sesión</button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "13px",
  color: "#555",
  marginBottom: "4px",
  marginTop: "12px",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  fontSize: "14px",
  border: "0.5px solid #ccc",
  borderRadius: "8px",
  marginBottom: "4px",
};

const btnStyle = {
  marginTop: "1.5rem",
  width: "100%",
  padding: "10px",
  fontSize: "14px",
  border: "0.5px solid #ccc",
  borderRadius: "8px",
  background: "#1e1e2e",
  color: "#fff",
  cursor: "pointer",
};

export default Login;