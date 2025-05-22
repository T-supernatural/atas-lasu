import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://wcavsnxueqamhujawmjt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYXZzbnh1ZXFhbWh1amF3bWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODE2MzUsImV4cCI6MjA2MzM1NzYzNX0.0EGiIUFViE7af0hC1pw8nSH83zMIbXnEwioAyDJogf0";
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
  AOS.init();

  const logoutBtn = document.getElementById("logoutBtn");
  const modal = document.getElementById("adminModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalForm = document.getElementById("modalForm");
  const modalSubmitBtn = document.getElementById("modalSubmitBtn");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const fileInputWrapper = document.getElementById("fileInputWrapper");
  const pictureInputWrapper = document.getElementById("pictureInputWrapper");
  const pictureInput = document.getElementById("pictureInput");
  const descriptionInputWrapper = document.getElementById("descriptionInputWrapper");
  const descriptionInput = document.getElementById("descriptionInput");
  const dateInputWrapper = document.getElementById("dateInputWrapper");
  const dateInput = document.getElementById("dateInput");
  const tagsInputWrapper = document.getElementById("tagsInputWrapper");
  const tagsInput = document.getElementById("tagsInput");

  let locationInputWrapper = document.getElementById("locationInputWrapper");
  let locationInput = document.getElementById("locationInput");
  if (!locationInputWrapper) {
    locationInputWrapper = document.createElement("div");
    locationInputWrapper.id = "locationInputWrapper";
    locationInputWrapper.className = "";
    locationInputWrapper.innerHTML = `
      <label for="locationInput" class="block font-medium mb-1">Location <span class="text-red-600">*</span></label>
      <input type="text" id="locationInput" name="location" placeholder="Enter event location" required
        class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    `;
    dateInputWrapper.after(locationInputWrapper);
    locationInput = document.getElementById("locationInput");
  }

  let currentMode = "create"; // or 'edit'
  let currentType = ""; // 'resource', 'blog', 'event'
  let currentEditId = null;

  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../index.html";
  });

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function openModal(type, mode = "create", item = null) {
    currentType = type;
    currentMode = mode;
    currentEditId = item ? item.id : null;

    modalTitle.textContent = `${
      mode === "create" ? (type === "event" ? "Post New" : "Upload New") : "Edit"
    } ${capitalize(type)}`;
    modalForm.reset();

    fileInputWrapper.style.display = "none";
    tagsInputWrapper.style.display = "none";
    pictureInputWrapper.style.display = "none";
    dateInputWrapper.style.display = "none";
    descriptionInputWrapper.style.display = "none";
    locationInputWrapper.style.display = "none";

    if (type === "resource") {
      fileInputWrapper.style.display = "block";
      tagsInputWrapper.style.display = "block";
      descriptionInputWrapper.style.display = "block";
      descriptionInput.required = true;
      tagsInput.required = false;
      dateInput.required = false;
      locationInput.required = false;
      pictureInput.required = false;
    } else if (type === "blog") {
      descriptionInputWrapper.style.display = "block";
      tagsInputWrapper.style.display = "block";
      descriptionInput.required = true;
      tagsInput.required = false;
      dateInput.required = false;
      locationInput.required = false;
      pictureInput.required = false;
    } else if (type === "event") {
      pictureInputWrapper.style.display = "block";
      dateInputWrapper.style.display = "block";
      descriptionInputWrapper.style.display = "block";
      locationInputWrapper.style.display = "block";
      descriptionInput.required = true;
      dateInput.required = true;
      locationInput.required = true;
      pictureInput.required = true;
      tagsInput.required = false;
    }

    if (mode === "edit" && item) {
      modalForm.elements["title"].value = item.title || "";
      descriptionInput.value = item.description || "";
      dateInput.value = item.date ? item.date.slice(0, 10) : "";
      tagsInput.value = item.tags ? item.tags.join(", ") : "";
      locationInput.value = item.location || "";
    }

    modal.classList.remove("hidden");
  }

  modalCloseBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document
    .getElementById("uploadResourceBtn")
    .addEventListener("click", () => openModal("resource"));
  document
    .getElementById("uploadEventBtn")
    .addEventListener("click", () => openModal("event"));

  modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = modalForm.elements["title"].value.trim();
    const description = descriptionInput.value.trim();
    const date = dateInput.value;
    const file = modalForm.elements["file"]?.files[0];
    const tags = tagsInput.value.trim();
    const picture = pictureInput.files[0];
    const location = locationInput.value.trim();

    if (!title) {
      alert("Please fill in the title.");
      return;
    }
    if (currentType === "resource" && currentMode === "create" && !file) {
      alert("Please select a file to upload.");
      return;
    }
    if (currentType === "event" && (!date || !location || !picture)) {
      alert("Please fill in all required fields for the event.");
      return;
    }

    try {
      if (currentType === "resource") {
        if (currentMode === "create") {
          const filePath = `resources/${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("resources").upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from("resources")
            .getPublicUrl(uploadData.path);

          const fileUrl = publicUrlData.publicUrl;

          const insertData = {
            title,
            description,
            url: fileUrl,
          };

          if (tags) insertData.tags = tags.split(",").map((t) => t.trim());

          const { error: insertError } = await supabase
            .from("resources")
            .insert([insertData]);
          if (insertError) throw insertError;
        } else if (currentMode === "edit") {
          const updateData = { title, description };
          if (tags) updateData.tags = tags.split(",").map((t) => t.trim());
          else updateData.tags = null;

          const { error: updateError } = await supabase
            .from("resources")
            .update(updateData)
            .eq("id", currentEditId);
          if (updateError) throw updateError;
        }
      } else if (currentType === "blog") {
        const insertData = { title, description, tags };
        if (tags) insertData.tags = tags.split(",").map((t) => t.trim());
        else insertData.tags = null;

        if (currentMode === "create") {
          const { error } = await supabase.from("blogs").insert([insertData]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("blogs")
            .update(insertData)
            .eq("id", currentEditId);
          if (error) throw error;
        }
      } else if (currentType === "event") {
        let pictureUrl = "";
        if (picture) {
          const picturePath = `events/${Date.now()}_${picture.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("events")
            .upload(picturePath, picture);
          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from("events")
            .getPublicUrl(uploadData.path);
          pictureUrl = publicUrlData.publicUrl;
        }

        const insertData = {
          title,
          description,
          date,
          location,
          picture_url: pictureUrl,
        };

        if (currentMode === "create") {
          const { error } = await supabase.from("events").insert([insertData]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("events")
            .update(insertData)
            .eq("id", currentEditId);
          if (error) throw error;
        }
      }

      alert(
        `${capitalize(currentType)} ${
          currentMode === "create" ? "created" : "updated"
        } successfully!`
      );
      modal.classList.add("hidden");
      loadAllData();
    } catch (err) {
      console.error(err);
      alert(
        `Failed to ${
          currentMode === "create" ? "create" : "update"
        } ${currentType}: ${err.message || JSON.stringify(err)}`
      );
    }
  });

  async function deleteItem(type, id, fileUrl) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      if (type === "resource" && fileUrl) {
        const filePath = fileUrl.split("/storage/v1/object/public/")[1];
        const { error: deleteFileError } = await supabase.storage
          .from("resources")
          .remove([filePath]);
        if (deleteFileError) throw deleteFileError;
      }

      const { error } = await supabase
        .from(type + "s")
        .delete()
        .eq("id", id);
      if (error) throw error;

      alert(`${capitalize(type)} deleted successfully.`);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert(`Failed to delete ${type}: ${err.message}`);
    }
  }

  function renderList(response, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!response || !response.data || response.data.length === 0) {
      container.innerHTML = `<li class="py-2 text-gray-500">No ${type}s found.</li>`;
      return;
    }

    response.data.forEach((item) => {
      const li = document.createElement("li");
      li.className =
        "py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200";

      let content = "";

      if (type === "resource") {
        // Ensure tags is an array before calling join
        let tagsArr = [];
        if (Array.isArray(item.tags)) {
          tagsArr = item.tags;
        } else if (typeof item.tags === "string" && item.tags.trim() !== "") {
          tagsArr = item.tags.split(",").map(t => t.trim());
        }
        const tagsHtml =
          tagsArr.length > 0
            ? `<p class="text-sm text-gray-500 mt-1">Tags: ${tagsArr.join(", ")}</p>`
            : "";
        content = `
          <a href="${
            item.url
          }" target="_blank" class="text-blue-600 underline">${item.title}</a>
          <p class="text-gray-700">${item.description || ""}</p>
          ${tagsHtml}
        `;
      } else if (type === "blog") {
        const tagsHtml =
          item.tags && item.tags.length > 0
            ? `<p class="text-sm text-gray-500 mt-1">Tags: ${item.tags.join(
                ", "
              )}</p>`
            : "";
        content = `
          <h3 class="font-semibold text-lg">${item.title}</h3>
          <p class="text-gray-700">${item.description || ""}</p>
          ${tagsHtml}
        `;
      } else if (type === "event") {
        content = `
          <h3 class="font-semibold text-lg">${item.title}</h3>
          <p class="text-gray-700">${item.description || ""}</p>
          <p class="text-sm text-gray-500">Date: ${
            item.date ? new Date(item.date).toLocaleDateString() : "N/A"
          }</p>
          <p class="text-sm text-gray-500">Location: ${
            item.location || "N/A"
          }</p>
          ${
            item.picture_url
              ? `<img src="${item.picture_url}" alt="Event Picture" class="mt-2 rounded max-h-32" />`
              : ""
          }
        `;
      }

      li.innerHTML = `
        <div class="flex-1">${content}</div>
        <div class="mt-2 md:mt-0 flex gap-2">
          <button class="edit-btn px-3 py-1 text-white bg-amber-600 rounded hover:bg-amber-700">Edit</button>
          <button class="delete-btn px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700">Delete</button>
        </div>
      `;

      // Attach event listeners
      li.querySelector(".edit-btn").addEventListener("click", () => openModal(type, "edit", item));
      li.querySelector(".delete-btn").addEventListener("click", () => deleteItem(type, item.id, item.url ? item.url : null));

      container.appendChild(li);
    });
  }

  async function loadAllData() {
    try {
      const resourcesRes = await supabase
        .from("resources")
        .select("*")
        .order("id", { ascending: false });
      const eventsRes = await supabase
        .from("events")
        .select("*")
        .order("id", { ascending: false });

      renderList(resourcesRes, "resourceList", "resource");
      renderList(eventsRes, "eventList", "event");
    } catch (err) {
      console.error(err);
      alert("Failed to load data: " + err.message);
    }
  }

  loadAllData();
});
