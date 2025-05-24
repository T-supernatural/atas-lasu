import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://wcavsnxueqamhujawmjt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYXZzbnh1ZXFhbWh1amF3bWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODE2MzUsImV4cCI6MjA2MzM1NzYzNX0.0EGiIUFViE7af0hC1pw8nSH83zMIbXnEwioAyDJogf0";
const supabase = createClient(supabaseUrl, supabaseKey);

// Handle Sign Up
document
  .getElementById("membership-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const name = document.getElementById("name")?.value || "";

    // Use current domain for redirect
    const baseUrl = window.location.origin;

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
      // Robust duplicate email check
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("unique") ||
        msg.includes("exists") ||
        msg.includes("registered")
      ) {
        alert(
          "This email has already been registered. Please log in or use a different email."
        );
        return;
      } else {
        alert("Signup failed: " + error.message);
        return;
      }
    }

    // Only insert profile if user is new
    if (data.user) {
      // Check if profile already exists to avoid duplicate error
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        await supabase.from("profiles").insert([
          {
            id: data.user.id,
            email,
            full_name: name,
            role: "user",
          },
        ]);
      }
    }

    alert(
      "Confirmation email sent! Please check your inbox and click the link to complete registration."
    );
    // No redirect here; redirect happens after email confirmation via emailRedirectTo
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
