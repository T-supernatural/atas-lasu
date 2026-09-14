import { Link } from "react-router-dom";

export function AuthCallbackPage() {
  return <main className="grid min-h-screen place-items-center bg-stone-950 px-5 text-white"><section className="max-w-lg rounded-2xl border border-white/15 bg-white/5 p-8"><p className="text-sm font-bold uppercase tracking-[.2em] text-amber-300">ATAS-LASU membership</p><h1 className="mt-5 font-display text-4xl font-bold">Email confirmed.</h1><p className="mt-4 leading-7 text-stone-300">Your membership email has been confirmed. Continue to sign in and enter your member area.</p><Link to="/membership" className="mt-8 inline-block rounded-full bg-amber-400 px-5 py-3 font-semibold text-stone-950">Continue to sign in</Link></section></main>;
}
