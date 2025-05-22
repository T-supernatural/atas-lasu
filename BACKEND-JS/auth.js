import { supabase } from "../js/supabase.js";

const loginForm = document.getElementById("loginForm");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const { user, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return alert(error.message);
  alert("Logged in!");
  window.location.href = "blog.html"; // or wherever you redirect
});
