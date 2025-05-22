// membership.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://wcavsnxueqamhujawmjt.supabase.co"; // Replace
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYXZzbnh1ZXFhbWh1amF3bWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODE2MzUsImV4cCI6MjA2MzM1NzYzNX0.0EGiIUFViE7af0hC1pw8nSH83zMIbXnEwioAyDJogf0"; // Replace
const supabase = createClient(supabaseUrl, supabaseKey);

// Handle Sign Up
document
  .getElementById("membership-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const name = document.getElementById("name")?.value || ""; // If you have a name field

    // Password length check
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/public/user-dashboard.html`,
        data: { full_name: name },
      },
    });

    if (error) {
      // Check if the error is because the user already exists
      if (
        error.message &&
        (error.message.toLowerCase().includes("user already registered") ||
         error.message.toLowerCase().includes("already registered") ||
         error.message.toLowerCase().includes("user already exists") ||
         error.message.toLowerCase().includes("duplicate key"))
      ) {
        alert("This email has already been registered. Please log in or use a different email.");
        return;
      } else {
        alert("Signup failed: " + error.message);
        return;
      }
    }

    // Store extra profile info (like name, role)
    if (data.user) {
      await supabase.from("profiles").insert([
        {
          id: data.user.id,
          email,
          full_name: name,
          role: "user",
        },
      ]);
    }

    alert("Confirmation email sent! Please check your inbox.");
  });

// Handle Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login failed: " + error.message);
      return;
    }

    const user = data.user;
    if (!user.email_confirmed_at) {
      alert("Please verify your email before logging in.");
      return;
    }

    // Fetch role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      alert("Error fetching user profile.");
      return;
    }

    if (profile?.role === "admin") {
      window.location.href = "/public/admin-dashboard.html";
    } else {
      window.location.href = "/public/user-dashboard.html";
    }

  } catch (err) {
    console.error("Unexpected login error:", err);
    alert("Something went wrong. Please try again.");
  }
});
