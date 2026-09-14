import { NavLink, Outlet } from "react-router-dom";

const navigation = [["/", "Home"], ["/about", "About"], ["/membership", "Membership"], ["/resources", "Resources"], ["/events", "Events"], ["/chat", "Community Chat"]];

export function AppShell() {
  return <div className="min-h-screen bg-stone-50 text-stone-900"><header className="border-b border-stone-200 bg-stone-950 text-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4"><NavLink to="/" className="font-display text-xl font-bold tracking-wide text-amber-400">ATAS<span className="text-white">-LASU</span></NavLink><nav aria-label="Primary navigation" className="hidden items-center gap-5 text-sm md:flex">{navigation.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? "text-amber-400" : "text-stone-200 hover:text-white"}>{label}</NavLink>)}</nav></div></header><main><Outlet /></main></div>;
}
