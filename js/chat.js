import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://wcavsnxueqamhujawmjt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYXZzbnh1ZXFhbWh1amF3bWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODE2MzUsImV4cCI6MjA2MzM1NzYzNX0.0EGiIUFViE7af0hC1pw8nSH83zMIbXnEwioAyDJogf0";
const supabase = createClient(supabaseUrl, supabaseKey);

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatHeader = document.getElementById("chat-header");
const typingIndicator = document.getElementById("typing-indicator");
const onlineSpan = document.querySelector(".text-blue-200");

let currentUser = null;
let onlineUsers = new Set();

async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.username ||
    "Guest"
  );
}

async function loadMessages() {
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .order("timestamp", { ascending: true });

  if (error) {
    chatBox.innerHTML = `<p class="text-red-500">Failed to load messages.</p>`;
    return;
  }

  chatBox.innerHTML = "";
  messages.forEach(displayMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function displayMessage(msg) {
  const isMine = msg.user_id === currentUser?.id;
  const wrapper = document.createElement("div");
  wrapper.className = `flex ${isMine ? "justify-end" : "justify-start"} mb-3`;
  wrapper.setAttribute("data-msg-id", msg.id);

  const bubble = document.createElement("div");
  bubble.className = `max-w-[70%] p-3 rounded-lg text-sm shadow ${
    isMine ? "bg-blue-100 text-right" : "bg-gray-100"
  }`;

  bubble.innerHTML = `
    <div class="font-semibold text-gray-800 text-left">${msg.username}</div>
    <div class="text-gray-700 mt-1">${msg.content}</div>
    <div class="text-xs text-gray-500 mt-1">${msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ""}</div>
  `;

  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = chatInput.value.trim();
  if (!content) return;

  const user = currentUser;
  if (!user) return alert("You must be logged in to chat.");

  const username = getDisplayName(user);

  // Optimistically add to UI
  const tempMsg = {
    id: Date.now(), // temporary id
    user_id: user.id,
    username,
    content,
    timestamp: new Date().toISOString(),
  };
  displayMessage(tempMsg);

  chatInput.value = "";

  const { error } = await supabase
    .from("messages")
    .insert([{ content, username, user_id: user.id }]);
  // Optionally: reload messages if error, or rely on realtime for update
});

chatBox.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const msgId = e.target.dataset.id;
    await supabase.from("messages").delete().eq("id", msgId);
    // Optionally remove from DOM immediately:
    // e.target.closest(".flex").remove();
    // Or call loadMessages() to refresh
  }
});

// --- Typing indicator using Supabase Realtime broadcast ---

// Broadcast typing event to others via Supabase Realtime
function broadcastTyping(name) {
  supabase.channel('typing')
    .send({
      type: 'broadcast',
      event: 'typing',
      payload: { name }
    });
}

// Typing indicator (show actual user's name and broadcast to others)
chatInput.addEventListener("input", () => {
  if (!currentUser) return;
  const name = getDisplayName(currentUser);
  broadcastTyping(name); // Broadcast to others
  typingIndicator.textContent = `🎭 ${name} is typing...`;
  typingIndicator.classList.remove("hidden");
  clearTimeout(window.typingTimeout);
  window.typingTimeout = setTimeout(() => {
    typingIndicator.classList.add("hidden");
  }, 1000);
});

// Listen for typing events from other users via Supabase Realtime
supabase.channel('typing')
  .on('broadcast', { event: 'typing' }, (payload) => {
    const name = payload.payload.name;
    if (name !== getDisplayName(currentUser)) {
      typingIndicator.textContent = `🎭 ${name} is typing...`;
      typingIndicator.classList.remove("hidden");
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        typingIndicator.classList.add("hidden");
      }, 1000);
    }
  })
  .subscribe();

// --- End typing indicator section ---

// Realtime listeners
function subscribeToRealtime() {
  supabase
    .channel("public:messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        displayMessage(payload.new);
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "messages" },
      (payload) => {
        // Remove the deleted message from the DOM
        const msgDiv = chatBox.querySelector(
          `[data-msg-id="${payload.old.id}"]`
        );
        if (msgDiv) msgDiv.remove();
      }
    )
    .subscribe();
}

// Online user tracking (simple, not perfect)
function trackOnlineUsers() {
  // Use localStorage + window events for demo
  const updateOnline = () => {
    localStorage.setItem("atas-chat-online", Date.now());
    window.dispatchEvent(new Event("atas-chat-ping"));
  };
  setInterval(updateOnline, 5000);
  updateOnline();

  window.addEventListener("atas-chat-ping", () => {
    onlineUsers.add(currentUser?.id || "guest");
    onlineSpan.textContent = `Online: ${onlineUsers.size}`;
  });

  // Count users with recent ping
  setInterval(() => {
    let count = 0;
    for (let key in localStorage) {
      if (key.startsWith("atas-chat-online")) {
        const last = parseInt(localStorage.getItem(key));
        if (Date.now() - last < 15000) count++;
      }
    }
    onlineSpan.textContent = `Online: ${count}`;
  }, 5000);
}

// Init
(async () => {
  currentUser = await getCurrentUser();
  chatHeader.textContent = `Welcome to ATAS-LASU`;
  await loadMessages();
  subscribeToRealtime();
  trackOnlineUsers();
})();
