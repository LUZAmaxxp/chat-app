document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      const response = await fetch(
        "https://chatapi-wrob.onrender.com/api/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        window.location.href = "chat.html"; // Redirect to chat page
      } else {
        alert("Login failed");
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("signupUsername").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;

      const response = await fetch(
        "https://chatapi-wrob.onrender.com/api/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Sign-up successful, please login.");
        window.location.href = "chat.html";
      } else {
        alert("Sign-up failed");
      }
    });
  }
});
document.querySelector("button").classList.add("loading");
// Remove it when done loading
document.querySelector("button").classList.remove("loading");
