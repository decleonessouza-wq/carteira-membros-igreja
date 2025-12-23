import React, { useMemo, useState } from 'react';
import { Mail, Lock, LogIn, AlertTriangle } from 'lucide-react';
import { supabase } from '@/src/lib/supabaseClient';

type Props = {
  appName?: string;
};

export const Login: React.FC<Props> = ({ appName = 'Carteira Digital' }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.trim().length >= 6 && !isLoading;
  }, [email, password, isLoading]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    // A sessão será capturada pelo App via onAuthStateChange
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-white/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-white text-2xl font-extrabold tracking-tight">{appName}</h1>
                <p className="text-green-100 text-sm mt-1 opacity-90">
                  Acesse com seu e-mail e senha
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-200/30 bg-red-500/15 text-red-50 px-4 py-3 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold">Não foi possível entrar</div>
                  <div className="opacity-90 break-words">{error}</div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-green-100 uppercase tracking-wider mb-1.5 ml-1">
                E-mail
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-green-100/70 group-focus-within:text-white transition-colors" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 text-white placeholder:text-green-100/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-green-100 uppercase tracking-wider mb-1.5 ml-1">
                Senha
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-green-100/70 group-focus-within:text-white transition-colors" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 text-white placeholder:text-green-100/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-white text-green-900 font-extrabold py-3 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-50 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="text-center text-xs text-green-100/80 leading-relaxed">
              <span className="opacity-90">Dica:</span> se der erro, verifique se o usuário existe no Supabase Auth
              e se o e-mail/senha estão corretos.
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-green-100/70">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Login por e-mail/senha (padrão do Supabase Auth)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
