"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function LogoutButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!supabase) { setIsReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setIsLoggedIn(Boolean(data.session)); setIsReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
      setIsReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    if (!supabase) return;
    setIsLeaving(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!isReady) return null;
  if (!isLoggedIn) return <Link className="navAction" href="/login">Entrar</Link>;

  return <button className="logoutButton" type="button" onClick={logout} disabled={isLeaving}>{isLeaving ? "Saindo..." : "Sair"}</button>;
}
