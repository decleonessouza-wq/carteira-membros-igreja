import React, { useState } from "react";
import { supabase } from "../src/lib/supabaseClient";
import { LogIn } from "lucide-react";
import { APP_LOGO_SRC } from "../constants";

type Props = {
  onSuccess: () => void;
};

export const Login: React.FC<Props> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
        <div className="px-6 py-6 bg-green-700 text-white flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-green-100 flex items-center justify-center overflow-hidden">
            <img src={APP_LOGO_SRC} alt="Logo" className="w-full h-full object-contain" draggable={false} />
          </div>
          <div>
            <div className="text-sm text-green-100">Carteira Digital</div>
            <div className="font-black text-lg leading-tight">Login</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-800 font-medium placeholder-gray-400"
              placeholder="seuemail@exemplo.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-800 font-medium placeholder-gray-400"
              placeholder="********"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-green-200 hover:bg-green-800 hover:shadow-xl transition-all flex items-center justify-center gap-3 text-base transform active:scale-95 disabled:opacity-60"
          >
            <LogIn className="w-5 h-5" />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};
