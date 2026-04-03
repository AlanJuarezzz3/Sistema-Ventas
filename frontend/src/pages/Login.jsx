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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-sm p-8">
        <div className="mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-xl mb-4 flex items-center justify-center">
  <span className="text-white text-xs font-medium">SV</span>
</div>
          <h1 className="text-xl font-medium text-gray-900">Sistema de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">Iniciá sesión para continuar</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="alan@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-6 w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}

export default Login;