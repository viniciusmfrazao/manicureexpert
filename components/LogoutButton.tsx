"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function LogoutButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setIsLoggedIn(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    if (!supabase) return;
    setIsLeaving(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!isLoggedIn) return null;

  return <button className="logoutButton" type="button" onClick={logout} disabled={isLeaving}>{isLeaving ? "Saindo..." : "Sair"}</button>;
}
