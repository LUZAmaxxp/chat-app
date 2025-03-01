// main.js
import { socket, setupSocketListeners } from "./socket.js";
import { loadFriendRequests } from "./friendRequests.js";
import { loadFriendsList } from "./friendsList.js";
import { loadChat } from "./chat.js";
import { loadUserProfile } from "./userProfile.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (
    !token &&
    !window.location.pathname.includes("index.html") &&
    !window.location.pathname.includes("login.html") &&
    !window.location.pathname.includes("signup.html")
  ) {
    window.location.href = "index.html";
    return;
  }

  if (token) {
    socket.auth = { token };
    socket.connect();
    setupSocketListeners();
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("chatFriendId");
      localStorage.removeItem("chatFriendName");
      window.location.href = "../index.html";
    });
  }

  if (document.getElementById("friend-requests")) {
    loadFriendRequests();
  }

  if (document.getElementById("friends-list")) {
    loadFriendsList();
  }

  if (document.getElementById("chat-form")) {
    loadChat();
  }

  loadUserProfile();
});
