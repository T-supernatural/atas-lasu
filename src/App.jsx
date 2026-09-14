import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PlaceholderPage } from "./components/PlaceholderPage";

const routes = [
  { path: "/", title: "Home", description: "Public home and association introduction." },
  { path: "/about", title: "About ATAS-LASU", description: "Association story, mission, values, and leadership." },
  { path: "/membership", title: "Membership", description: "Member sign-up, email confirmation, and sign-in." },
  { path: "/dashboard", title: "Member Dashboard", description: "The member starting point for resources, events, and chat." },
  { path: "/resources", title: "Resources", description: "Member learning resources and downloads." },
  { path: "/events", title: "Events", description: "Upcoming association events and member likes." },
  { path: "/chat", title: "Community Chat", description: "Realtime discussion for ATAS-LASU members." },
  { path: "/admin", title: "Admin Dashboard", description: "Restricted resource and event administration." },
];

export default function App() {
  return <Routes><Route element={<AppShell />}>{routes.map((route) => <Route key={route.path} path={route.path} element={<PlaceholderPage {...route} />} />)}</Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
