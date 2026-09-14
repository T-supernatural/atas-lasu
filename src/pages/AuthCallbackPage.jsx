import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function AuthCallbackPage() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { async function continueAfterConfirmation() { const { data: { user } } = await supabase.auth.getUser(); if (!user) { setReady(true); return; } const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(); navigate(profile?.role === "admin" ? "/admin" : "/dashboard", { replace: true }); } continueAfterConfirmation(); }, [navigate]);
  if (!ready) return <main className="grid min-h-screen place-items-center bg-stage-black px-5 text-paper-stone"><p className="text-sm">Confirming your membership…</p></main>;
  return <main className="grid min-h-screen place-items-center bg-stage-black px-5 text-paper-stone"><section className="max-w-lg border border-paper-stone/20 p-8"><p className="text-xs font-semibold uppercase tracking-[.2em] text-marigold">ATAS-LASU membership</p><h1 className="mt-5 font-display text-5xl leading-none">Email confirmed.</h1><p className="mt-5 leading-7 text-paper-stone/75">Your membership email has been confirmed. Continue to sign in and enter your member area.</p><Link to="/membership" className="editorial-link mt-8 text-sm font-semibold">Continue to sign in <span aria-hidden="true">↗</span></Link></section></main>;
}
