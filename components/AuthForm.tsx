"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

type Role = "customer" | "professional";
type ProfileRole = "customer" | "professional" | "admin";
type Mode = "login" | "signup";

function getRolePath(role?: string) {
  if (role === "admin") return "/gestao";
  if (role === "professional") return "/profissional";
  return "/cliente";
}

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase ainda não está configurado na Vercel.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const response =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, role } }
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (response.error) {
      setIsLoading(false);
      setMessage(response.error.message);
      return;
    }

    const user = response.data.user;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const profileRole = profile?.role as ProfileRole | undefined;
      const metadataRole = user.user_metadata?.role as ProfileRole | undefined;
      const fallbackRole = mode === "signup" ? role : metadataRole;
      const rolePath = getRolePath(profileRole || fallbackRole);

      setMessage("Entrada realizada. Redirecionando...");
      window.location.assign(rolePath);
      return;
    }

    setIsLoading(false);
    setMessage("Cadastro criado. Agora você já pode entrar com seu e-mail e senha.");
  }

  return (
    <form className="loginCard stack" onSubmit={handleSubmit}>
      <div className="modeTabs" role="tablist" aria-label="Tipo de acesso">
        <button type="button" className={mode === "login" ? "isActive" : ""} onClick={() => setMode("login")}>Entrar</button>
        <button type="button" className={mode === "signup" ? "isActive" : ""} onClick={() => setMode("signup")}>Criar conta</button>
      </div>
      <div><h1>{mode === "login" ? "Entrar na plataforma" : "Criar conta"}</h1><p>{mode === "login" ? "Acesse sua área de cliente, profissional ou gestão." : "Cadastre-se como cliente ou profissional para começar."}</p></div>
      {mode === "signup" ? <><label>Nome completo<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Seu nome" required /></label><label>Tipo de conta<select value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="customer">Cliente</option><option value="professional">Profissional</option></select></label></> : null}
      <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" required /></label>
      <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" minLength={6} required /></label>
      <button className="formButton" type="submit" disabled={isLoading}>{isLoading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button>
      <p className="authMessage">{message || `Status Supabase: ${isSupabaseConfigured ? "configurado" : "aguardando chave"}`}</p>
    </form>
  );
}
