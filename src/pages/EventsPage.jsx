import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { supabase } from "../lib/supabase";
import { Loading, Message, PageIntro } from "./ResourcesPage";

const pageSize = 6;

export function EventsPage() {
  const [events, setEvents] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function loadEvents() {
    setStatus("loading");
    const [{ data: eventData, error: eventError }, { data: userData }] = await Promise.all([
      supabase.from("events").select("id, title, description, date, location, picture_url, likes").order("date", { ascending: true }),
      supabase.auth.getUser(),
    ]);
    if (eventError) { setError("We could not load events right now. Please try again later."); setStatus("error"); return; }
    setUser(userData.user);
    if (userData.user) {
      const { data: likes } = await supabase.from("event_likes").select("event_id").eq("user_id", userData.user.id);
      setLikedIds(new Set((likes ?? []).map((like) => like.event_id)));
    }
    setEvents(eventData ?? []);
    setPage(1);
    setStatus("ready");
  }

  useEffect(() => { loadEvents(); }, []);
  const pageCount = Math.max(1, Math.ceil(events.length / pageSize));
  const visibleEvents = events.slice((page - 1) * pageSize, page * pageSize);

  async function toggleLike(eventId) {
    if (!user) { setError("Sign in to like an event."); return; }
    setError("");
    const { data, error: likeError } = await supabase.rpc("toggle_event_like", { event_id_input: eventId }).single();
    if (likeError || !data) { setError("We could not update your like. Please try again."); return; }
    setLikedIds((current) => { const next = new Set(current); data.liked ? next.add(eventId) : next.delete(eventId); return next; });
    setEvents((current) => current.map((event) => event.id === eventId ? { ...event, likes: data.likes } : event));
  }

  return <><PageIntro eyebrow="ATAS-LASU calendar" title="Find the next moment to show up." text="Discover upcoming association events and let the community know what you are looking forward to." /><section className="mx-auto max-w-7xl px-6 py-14">{error && <Message tone="error">{error} {!user && <Link className="font-semibold underline" to="/membership">Sign in</Link>}</Message>}{status === "loading" && <Loading label="Loading events..." />}{status === "error" && <Message tone="error">{error}</Message>}{status === "ready" && (events.length ? <><div className="grid gap-6 lg:grid-cols-2">{visibleEvents.map((event) => <EventCard key={event.id} event={event} liked={likedIds.has(event.id)} onLike={() => toggleLike(event.id)} />)}</div><Pagination page={page} pageCount={pageCount} onChange={setPage} /></> : <Message>No events have been posted yet. Check back soon.</Message>)}</section></>;
}

function EventCard({ event, liked, onLike }) {
  const date = event.date ? new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Date to be announced";
  return <article className="stage-card overflow-hidden"><div className="grid sm:grid-cols-[.8fr_1.2fr]">{event.picture_url ? <img src={event.picture_url} alt="" className="h-60 w-full object-cover sm:h-full" /> : <div className="grid min-h-60 place-items-center bg-surface-container-high font-display text-5xl text-theatre-amber">ATAS</div>}<div className="p-7"><p className="text-xs font-semibold uppercase tracking-[.1em] text-theatre-amber">{date}</p><h2 className="mt-4 font-display text-4xl leading-[.95] text-chalk-cream">{event.title}</h2><p className="mt-4 leading-7 text-chalk-cream/80">{event.description || "More details coming soon."}</p>{event.location && <p className="mt-5 text-sm font-medium text-chalk-cream/90">{event.location}</p>}<button type="button" aria-pressed={liked} onClick={onLike} className={`mt-7 border px-4 py-2 text-sm font-semibold transition ${liked ? "border-theatre-amber bg-theatre-amber text-stage-obsidian" : "border-line-subtle text-chalk-cream hover:border-theatre-amber hover:text-theatre-amber"}`}>{liked ? "♥ Liked" : "♡ Like"} <span className="ml-1">{event.likes ?? 0}</span></button></div></div></article>;
}
