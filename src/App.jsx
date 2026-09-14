import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { AboutPage } from "./pages/AboutPage";
import { HomePage } from "./pages/HomePage";
import { MembershipPage } from "./pages/MembershipPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { EventsPage } from "./pages/EventsPage";
import { ResourcesPage } from "./pages/ResourcesPage";

const routes = [
  { path: "/dashboard", title: "Member Dashboard", description: "The member starting point for resources, events, and chat." },
  { path: "/chat", title: "Community Chat", description: "Realtime discussion for ATAS-LASU members." },
  { path: "/admin", title: "Admin Dashboard", description: "Restricted resource and event administration." },
];

export default function App() {
  return <Routes><Route element={<AppShell />}><Route path="/" element={<HomePage />} /><Route path="/about" element={<AboutPage />} /><Route path="/membership" element={<MembershipPage />} /><Route path="/resources" element={<ResourcesPage />} /><Route path="/events" element={<EventsPage />} />{routes.map((route) => <Route key={route.path} path={route.path} element={<PlaceholderPage {...route} />} />)}</Route><Route path="/auth/callback" element={<AuthCallbackPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
