import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const initialSignUp = { name: "", email: "", password: "" };
const initialSignIn = { email: "", password: "" };

export function MembershipPage() {
  const [mode, setMode] = useState("signup");
  const [signUp, setSignUp] = useState(initialSignUp);
  const [signIn, setSignIn] = useState(initialSignIn);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const update = (setter) => (event) => setter((values) => ({ ...values, [event.target.name]: event.target.value }));

  async function createAccount(event) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    const { data, error: authError } = await supabase.auth.signUp({ email: signUp.email.trim(), password: signUp.password, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { full_name: signUp.name.trim() } } });
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({ id: data.user.id, full_name: signUp.name.trim(), role: "user" }, { onConflict: "id", ignoreDuplicates: true });
      if (profileError) { setError("Your account was created, but we could not create the member profile. Please contact ATAS support."); setLoading(false); return; }
    }
    if (data.user && !data.session) { setMessage("Check your inbox to confirm your email, then return here to sign in."); }
    else if (data.user) { navigate("/dashboard", { replace: true }); }
    setLoading(false);
  }

  async function signInAccount(event) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: signIn.email.trim(), password: signIn.password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profileError) { setError("You are signed in, but we could not load your member profile. Please contact ATAS support."); setLoading(false); return; }
    navigate(profile?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }

  return <section className="min-h-[calc(100vh-73px)] bg-stone-200 px-5 py-14 sm:py-20"><div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-[.9fr_1.1fr]"><aside className="relative hidden overflow-hidden bg-stone-950 p-12 text-white lg:block"><img src="/IMG/pic-one.jpg" alt="Theatre performer" className="absolute inset-0 size-full object-cover opacity-30" /><div className="relative"><p className="text-sm font-bold uppercase tracking-[.24em] text-amber-300">Membership</p><h1 className="mt-7 font-display text-5xl font-bold leading-tight">Your work belongs in the room.</h1><p className="mt-7 max-w-sm leading-7 text-stone-200">Join the ATAS-LASU community to access resources, keep up with events, and take part in the conversation.</p></div></aside><div className="p-7 sm:p-12"><p className="text-sm font-bold uppercase tracking-[.2em] text-amber-700">ATAS-LASU members</p><div className="mt-5 flex gap-6 border-b border-stone-200"><button type="button" onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className={mode === "signup" ? "border-b-2 border-amber-600 pb-3 font-semibold" : "pb-3 text-stone-500"}>Create account</button><button type="button" onClick={() => { setMode("signin"); setError(""); setMessage(""); }} className={mode === "signin" ? "border-b-2 border-amber-600 pb-3 font-semibold" : "pb-3 text-stone-500"}>Sign in</button></div><h2 className="mt-8 font-display text-4xl font-bold">{mode === "signup" ? "Take your place." : "Welcome back."}</h2><p className="mt-3 text-stone-600">{mode === "signup" ? "Create your member account with your email address." : "Sign in to continue to your member area."}</p>{error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}{message && <p role="status" className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}{mode === "signup" ? <form onSubmit={createAccount} className="mt-8 space-y-5"><Field label="Full name" name="name" value={signUp.name} onChange={update(setSignUp)} autoComplete="name" /><Field label="Email address" name="email" type="email" value={signUp.email} onChange={update(setSignUp)} autoComplete="email" /><Field label="Password" name="password" type="password" value={signUp.password} onChange={update(setSignUp)} autoComplete="new-password" hint="Use at least 6 characters." /><Submit loading={loading}>Create member account</Submit></form> : <form onSubmit={signInAccount} className="mt-8 space-y-5"><Field label="Email address" name="email" type="email" value={signIn.email} onChange={update(setSignIn)} autoComplete="email" /><Field label="Password" name="password" type="password" value={signIn.password} onChange={update(setSignIn)} autoComplete="current-password" /><Submit loading={loading}>Sign in</Submit></form>}</div></div></section>;
}

function Field({ label, hint, ...input }) { return <label className="block text-sm font-medium text-stone-800">{label}<input required className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200" {...input} />{hint && <span className="mt-2 block text-xs font-normal text-stone-500">{hint}</span>}</label>; }
function Submit({ loading, children }) { return <button disabled={loading} className="w-full rounded-full bg-stone-950 px-5 py-3 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait…" : children}</button>; }
