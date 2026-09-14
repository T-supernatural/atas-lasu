import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResources() {
      const { data, error: loadError } = await supabase.from("resources").select("id, title, description, url, tags, created_at").order("created_at", { ascending: false });
      if (loadError) { setError("We could not load resources right now. Please try again later."); setStatus("error"); return; }
      setResources(data ?? []); setStatus("ready");
    }
    loadResources();
  }, []);

  const filteredResources = useMemo(() => resources.filter((resource) => `${resource.title} ${resource.description ?? ""} ${(resource.tags ?? []).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [resources, query]);
  return <><PageIntro eyebrow="Member library" title="Resources for the work behind the work." text="Search materials shared by the ATAS-LASU community—from study support to creative references." /><section className="mx-auto max-w-7xl px-5 py-12"><label className="sr-only" htmlFor="resource-search">Search resources</label><input id="resource-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources" className="w-full rounded-xl border border-stone-300 bg-white px-5 py-4 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" />{status === "loading" && <Loading label="Loading resources…" />}{status === "error" && <Message tone="error">{error}</Message>}{status === "ready" && <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredResources.length ? filteredResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />) : <Message>No resources match that search yet.</Message>}</div>}</section></>;
}

function ResourceCard({ resource }) {
  const tags = Array.isArray(resource.tags) ? resource.tags : typeof resource.tags === "string" ? resource.tags.split(",").map((tag) => tag.trim()) : [];
  return <article className="flex min-h-64 flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><div><p className="text-sm text-stone-500">Added {resource.created_at ? new Date(resource.created_at).toLocaleDateString() : "recently"}</p><h2 className="mt-4 font-display text-3xl font-bold leading-tight">{resource.title}</h2><p className="mt-4 leading-7 text-stone-600">{resource.description || "No description has been added yet."}</p></div><div className="mt-auto pt-6">{tags.length > 0 && <div className="mb-5 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">{tag}</span>)}</div>}<a href={resource.url} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">Open resource <span aria-hidden="true" className="ml-2">↗</span></a></div></article>;
}

export function PageIntro({ eyebrow, title, text }) { return <section className="bg-stone-950 px-5 py-16 text-white"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-[.22em] text-amber-300">{eyebrow}</p><h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-tight sm:text-6xl">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">{text}</p></div></section>; }
export function Loading({ label }) { return <p className="mt-10 animate-pulse text-stone-600">{label}</p>; }
export function Message({ children, tone }) { return <p role={tone === "error" ? "alert" : "status"} className={`mt-10 rounded-xl p-5 ${tone === "error" ? "bg-red-50 text-red-800" : "bg-stone-100 text-stone-600"}`}>{children}</p>; }
