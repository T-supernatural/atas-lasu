import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireMember() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <GateStatus text="Checking access…" />;
  if (!user) return <Navigate to="/membership" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, role, loading } = useAuth();
  if (loading) return <GateStatus text="Checking administrator access…" />;
  if (!user) return <Navigate to="/membership" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function GateStatus({ text }) { return <main className="grid min-h-[60vh] place-items-center bg-paper-stone px-5"><p className="text-sm text-stage-black/65">{text}</p></main>; }
