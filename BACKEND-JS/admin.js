import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Only show admin form if this is true
const isAdmin = false;
const adminForm = document.getElementById("adminForm");
if (!isAdmin && adminForm) adminForm.style.display = "none";

// Form Elements
const form = document.getElementById("submissionForm");
const titleInput = document.getElementById("titleInput");
const imageInput = document.getElementById("imageInput");
const dateInput = document.getElementById("dateInput");
const descInput = document.getElementById("descInput");
const typeSelect = document.getElementById("typeSelect");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = typeSelect.value;
  const collectionRef = collection(db, type); // "blogs" or "events"

  const newPost = {
    title: titleInput.value,
    image: imageInput.value,
    date: dateInput.value,
    content: descInput.value,
    createdAt: serverTimestamp(),
  };

  try {
    await addDoc(collectionRef, newPost);
    alert(`✅ ${type.slice(0, -1).toUpperCase()} submitted successfully!`);
    form.reset();
  } catch (err) {
    console.error("❌ Submission failed:", err);
    alert("Something went wrong. Try again.");
  }
});
