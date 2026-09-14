import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const channelName = "atas-community-chat";

export function ChatPage() {
  const [user, setUser] = useState(undefined);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingNames, setTypingNames] = useState([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const chatEnd = useRef(null);
  const typingTimer = useRef(null);
  const channelRef = useRef(null);
  const displayName = useMemo(() => user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "ATAS member", [user]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    let active = true;
    async function startChat() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!active) return;
      setUser(currentUser ?? null);
      if (!currentUser) return;
      const { data, error: loadError } = await supabase.from("messages").select("id, user_id, username, content, timestamp").order("timestamp", { ascending: true });
      if (!active) return;
      if (loadError) { setError("We could not load the conversation. Please refresh and try again."); return; }
      setMessages(data ?? []);
      const channel = supabase.channel(channelName, { config: { presence: { key: currentUser.id } } });
      channelRef.current = channel;
      channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, ({ new: message }) => setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]));
      channel.on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, ({ old }) => setMessages((current) => current.filter((message) => message.id !== old.id)));
      channel.on("presence", { event: "sync" }, () => { const state = channel.presenceState(); setOnlineCount(Object.keys(state).length); });
      channel.on("broadcast", { event: "typing" }, ({ payload }) => { if (payload.userId === currentUser.id) return; setTypingNames((current) => [...new Set([...current, payload.name])]); window.setTimeout(() => setTypingNames((current) => current.filter((name) => name !== payload.name)), 1400); });
      channel.subscribe(async (status) => { if (status === "SUBSCRIBED") await channel.track({ name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "ATAS member", online_at: new Date().toISOString() }); });
    }
    startChat();
    return () => { active = false; if (typingTimer.current) window.clearTimeout(typingTimer.current); if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  function announceTyping() {
    if (!channelRef.current || !user) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: user.id, name: displayName } });
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = text.trim();
    if (!content || !user || sending) return;
    setSending(true); setError("");
    const { error: sendError } = await supabase.from("messages").insert({ content, username: displayName, user_id: user.id });
    if (sendError) setError("Your message could not be sent. Please try again."); else setText("");
    setSending(false);
  }

  async function deleteMessage(messageId) {
    const { error: deleteError } = await supabase.from("messages").delete().eq("id", messageId).eq("user_id", user.id);
    if (deleteError) setError("That message could not be deleted. Please try again.");
  }

  if (user === undefined) return <ChatFrame><p className="animate-pulse text-stone-500">Preparing the conversation…</p></ChatFrame>;
  if (!user) return <ChatFrame><div className="max-w-xl py-16"><p className="text-sm font-bold uppercase tracking-[.2em] text-amber-700">Members only</p><h1 className="mt-4 font-display text-5xl font-bold">The conversation starts when you join.</h1><p className="mt-5 text-lg leading-8 text-stone-600">Sign in to take part in the ATAS-LASU community chat.</p><Link to="/membership" className="mt-8 inline-block rounded-full bg-stone-950 px-5 py-3 font-semibold text-white">Sign in to chat</Link></div></ChatFrame>;
  return <ChatFrame><div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 sm:px-7"><div><p className="font-display text-2xl font-bold">Community chat</p><p className="mt-1 text-sm text-stone-500"><span className="mr-2 inline-block size-2 rounded-full bg-emerald-500" />{onlineCount} online now</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Member space</span></div><div className="h-[52vh] min-h-96 overflow-y-auto px-5 py-6 sm:px-7">{error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{messages.length === 0 ? <p className="py-16 text-center text-stone-500">No messages yet. Start the conversation.</p> : <div className="space-y-5">{messages.map((message) => <Message key={message.id} message={message} mine={message.user_id === user.id} onDelete={() => deleteMessage(message.id)} />)}</div>}<div ref={chatEnd} /></div>{typingNames.length > 0 && <p aria-live="polite" className="border-t border-stone-100 px-5 py-2 text-sm italic text-stone-500">{typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing…</p>}<form onSubmit={sendMessage} className="flex gap-3 border-t border-stone-200 p-4 sm:p-5"><label className="sr-only" htmlFor="message">Message</label><input id="message" value={text} onChange={(event) => { setText(event.target.value); announceTyping(); }} maxLength="2000" placeholder="Share something with the community" className="min-w-0 flex-1 rounded-full border border-stone-300 px-5 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" /><button disabled={sending || !text.trim()} className="rounded-full bg-stone-950 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Send</button></form></ChatFrame>;
}

function ChatFrame({ children }) { return <section className="bg-stone-200 px-5 py-10 sm:py-16"><div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">{children}</div></section>; }
function Message({ message, mine, onDelete }) { const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; return <article className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${mine ? "bg-amber-400 text-stone-950" : "bg-stone-100 text-stone-900"}`}><div className="flex items-baseline gap-3"><p className="font-semibold">{message.username || "ATAS member"}</p><time className="text-xs opacity-60">{time}</time></div><p className="mt-2 whitespace-pre-wrap break-words leading-6">{message.content}</p>{mine && <button type="button" onClick={onDelete} className="mt-2 text-xs font-medium underline opacity-70 hover:opacity-100">Delete</button>}</div></article>; }
