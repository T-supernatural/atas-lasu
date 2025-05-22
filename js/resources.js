// File: ../js/resources.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://wcavsnxueqamhujawmjt.supabase.co"; // Replace
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYXZzbnh1ZXFhbWh1amF3bWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODE2MzUsImV4cCI6MjA2MzM1NzYzNX0.0EGiIUFViE7af0hC1pw8nSH83zMIbXnEwioAyDJogf0"; // Replace
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM elements
const resourceList = document.getElementById("resources-list");
const searchInput = document.getElementById("resource-search");

// Fetch and display resources
async function fetchResources() {
  const { data, error } = await supabase
    .from("resources")
    .select("id, title, description, url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching resources:", error);
    resourceList.innerHTML = `<p class='text-red-500'>Error loading resources.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    resourceList.innerHTML = `<p class='text-gray-600'>No resources found.</p>`;
    return;
  }

  displayResources(data);

  // Search functionality
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = data.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
    displayResources(filtered);
  });
}

// Display resources in the DOM
function displayResources(resources) {
  resourceList.innerHTML = "";

  resources.forEach((res) => {
    const card = document.createElement("div");
    card.className =
      "bg-white p-4 shadow-md rounded-md hover:shadow-lg transition-all duration-300";
    card.innerHTML = `
      <h3 class="text-lg font-semibold text-amber-700 mb-2">${res.title}</h3>
      <p class="text-sm text-gray-700 mb-3 line-clamp-3">${res.description}</p>
      <div class="flex gap-3">
        <a href="${res.url}" target="_blank" class="text-blue-500 hover:text-blue-700 underline">Preview</a>
        <a href="#" class="text-green-500 hover:text-green-700 underline download-link" data-url="${res.url}">Download</a>
      </div>
      <p class="text-xs text-gray-500 mt-3">Uploaded on: ${new Date(
        res.created_at
      ).toLocaleDateString()}</p>
    `;
    resourceList.appendChild(card);

    // Attach download handler
    const downloadBtn = card.querySelector(".download-link");
    downloadBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // Extract the file path from the public URL
      // Example: https://project.supabase.co/storage/v1/object/public/resources/myfile.pdf
      const match = res.url.match(/\/public\/resources\/(.+)$/);
      if (!match) {
        alert("Invalid file URL.");
        return;
      }
      const filePath = match[1]; // This is the path inside the bucket
      // Generate a signed URL with download option
      const { data, error } = await supabase.storage
        .from("resources")
        .createSignedUrl(filePath, 60, { download: true });
      if (error) {
        alert("Could not generate download link.");
        return;
      }
      window.location.href = data.signedUrl;
    });
  });
}

// Initialize
fetchResources();
