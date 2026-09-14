import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loading, Message, PageIntro } from "./ResourcesPage";
import { supabase } from "../lib/supabase";

export function EventsPage() {
  const [events, setEvents] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function loadEvents() {
    setStatus("loading");
    const [{ data: eventsData, error: eventsError }, { data: userData }] = await Promise.all([supabase.from("events").select("id, title, description, date, location, picture_url, likes").order("date", { ascending: true }), supabase.auth.getUser()]);
    if (eventsError) { setError("We could not load events right now. Please try again later."); setStatus("error"); return; }
    const currentUser = userData.user;
    setUser(currentUser);
    if (currentUser) {
      const { data: likes } = await supabase.from("event_likes").select("event_id").eq("user_id", currentUser.id);
      setLikedIds(new Set((likes ?? []).map((like) => like.event_id)));
    }
    setEvents(eventsData ?? []); setStatus("ready");
  }
  useEffect(() => { loadEvents(); }, []);

  async function toggleLike(eventId) {
    if (!user) { setError("Sign in to like an event."); return; }
    setError("");
    const { data, error: likeError } = await supabase.rpc("toggle_event_like", { event_id_input: eventId }).single();
    if (likeError || !data) { setError("We could not update your like. Please try again."); return; }
    setLikedIds((current) => { const next = new Set(current); data.liked ? next.add(eventId) : next.delete(eventId); return next; });
    setEvents((current) => current.map((event) => event.id === eventId ? { ...event, likes: data.likes } : event));
  }
  return <><PageIntro eyebrow="ATAS-LASU calendar" title="Find the next moment to show up." text="Discover upcoming association events and let the community know what you are looking forward to." /><section className="mx-auto max-w-7xl px-5 py-12">{error && <Message tone="error">{error} {!user && <Link className="font-semibold underline" to="/membership">Sign in</Link>}</Message>}{status === "loading" && <Loading label="Loading events…" />}{status === "error" && <Message tone="error">{error}</Message>}{status === "ready" && <div className="grid gap-7 lg:grid-cols-2">{events.length ? events.map((event) => <EventCard key={event.id} event={event} liked={likedIds.has(event.id)} onLike={() => toggleLike(event.id)} />) : <Message>No events have been posted yet. Check back soon.</Message>}</div>}</section></>;
}

function EventCard({ event, liked, onLike }) { return <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"><div className="grid sm:grid-cols-[.8fr_1.2fr]">{event.picture_url ? <img src={event.picture_url} alt="" className="h-56 w-full object-cover sm:h-full" /> : <div className="grid min-h-56 place-items-center bg-amber-100 font-display text-5xl text-amber-800">ATAS</div>}<div className="p-7"><p className="text-sm font-semibold text-amber-700">{event.date ? new Date(event.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Date to be announced"}</p><h2 className="mt-4 font-display text-3xl font-bold leading-tight">{event.title}</h2><p className="mt-4 leading-7 text-stone-600">{event.description || "More details coming soon."}</p>{event.location && <p className="mt-5 text-sm font-medium text-stone-700">{event.location}</p>}<button type="button" aria-pressed={liked} onClick={onLike} className={`mt-7 rounded-full px-4 py-2 text-sm font-semibold ${liked ? "bg-amber-400 text-stone-950" : "border border-stone-300 text-stone-800 hover:border-amber-600"}`}>{liked ? "♥ Liked" : "♡ Like"} <span className="ml-1">{event.likes ?? 0}</span></button></div></div></article>; }
