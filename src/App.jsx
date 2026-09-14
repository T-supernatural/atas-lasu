import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AboutPage } from "./pages/AboutPage";
import { HomePage } from "./pages/HomePage";
import { MembershipPage } from "./pages/MembershipPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { EventsPage } from "./pages/EventsPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { ChatPage } from "./pages/ChatPage";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { RequireAdmin, RequireMember } from "./auth/RequireRole";

export default function App() { return <RouteErrorBoundary><Routes><Route element={<AppShell />}><Route path="/" element={<HomePage />} /><Route path="/about" element={<AboutPage />} /><Route path="/membership" element={<MembershipPage />} /><Route element={<RequireMember />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/resources" element={<ResourcesPage />} /><Route path="/events" element={<EventsPage />} /><Route path="/chat" element={<ChatPage />} /></Route><Route element={<RequireAdmin />}><Route path="/admin" element={<AdminPage />} /></Route></Route><Route path="/auth/callback" element={<AuthCallbackPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></RouteErrorBoundary>; }
