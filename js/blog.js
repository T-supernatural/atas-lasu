import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://wcavsnxueqamhujawmjt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYXZzbnh1ZXFhbWh1amF3bWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODE2MzUsImV4cCI6MjA2MzM1NzYzNX0.0EGiIUFViE7af0hC1pw8nSH83zMIbXnEwioAyDJogf0";
const supabase = createClient(supabaseUrl, supabaseKey);

const eventsContainer = document.getElementById("eventsContainer");

// Fetch and display events
async function loadEvents() {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error loading events:", error);
    eventsContainer.innerHTML = `<p class="text-red-500">Failed to load events.</p>`;
    return;
  }

  eventsContainer.innerHTML = ""; // Clear old content

  events.forEach((event) => {
    const card = document.createElement("div");
    card.className = "bg-gray-50 p-6 rounded-xl shadow";

    card.innerHTML = `
      ${event.picture_url ? `<img src="${event.picture_url}" alt="${event.title}" class="rounded-lg mb-4 object-cover mx-auto" style="width:300px;height:300px;">` : ""}
      <h2 class="text-xl font-bold text-amber-600 mb-2">${event.title}</h2>
      <p class="text-sm text-gray-600 mb-2">${event.description}</p>
      <div class="flex flex-wrap gap-4 items-center justify-between mt-4">
        <span class="text-sm text-gray-500">${event.date ? new Date(event.date).toLocaleDateString() : ""}</span>
        <span class="text-sm text-gray-500">${event.location ? event.location : ""}</span>
        <button data-id="${event.id}" class="like-button flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800">
          ❤️ <span>${event.likes ?? 0}</span>
        </button>
      </div>
    `;
    eventsContainer.appendChild(card);
  });

  // Attach event listeners to like buttons
  document.querySelectorAll(".like-button").forEach((button) => {
    button.addEventListener("click", () => handleLike(button));
  });
}

async function handleLike(button) {
  const eventId = button.getAttribute("data-id");
  const user = await getCurrentUser();
  if (!user) return alert("You must be logged in to like an event.");

  // Check if user already liked this event
  const { data: existing, error: likeCheckError } = await supabase
    .from("event_likes")
    .select("*")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) return alert("You already liked this event.");

  // Insert into event_likes table
  const { error: insertError } = await supabase
    .from("event_likes")
    .insert([{ user_id: user.id, event_id: eventId }]);

  if (insertError) return console.error("Like insert failed:", insertError);

  // Atomically increment likes in events table
  const { error: updateError } = await supabase.rpc("increment_event_likes", { event_id_input: eventId });

  if (updateError) return console.error("Failed to update likes:", updateError);

  // Reload events to reflect changes
  loadEvents();
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return data?.user || null;
}

// Run on load
document.addEventListener("DOMContentLoaded", loadEvents);
