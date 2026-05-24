import Link from "next/link";
import { isSupabaseConfigured } from "../../lib/supabase";

export default function LoginPage() {
  return (
    <main className="loginShell">
      <form className="loginCard stack">
        <Link className="brand" href="/">
          <span className="brandMark">ME</span>
          <span><strong>Manicure Expert</strong><small>Sua manicure onde você estiver.</small></span>
        </Link>
        <div><h1>Entrar na plataforma</h1><p>A autenticação já está preparada para Supabase. Falta adicionar a chave pública do projeto na Vercel.</p></div>
        <label>E-mail<input type="email" placeholder="voce@email.com" /></label>
        <label>Senha<input type="password" placeholder="Sua senha" /></label>
        <a className="formButton" href={isSupabaseConfigured ? "/" : "#"}>Entrar</a>
        <p>Status Supabase: <strong>{isSupabaseConfigured ? "configurado" : "aguardando chave"}</strong></p>
      </form>
    </main>
  );
}
