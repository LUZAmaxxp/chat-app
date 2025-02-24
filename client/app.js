const socket = io("https://chatapi-wrob.onrender.com", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

document.addEventListener("DOMContentLoaded", async () => {
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch(
          "https://chatapi-wrob.onrender.com/signup",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userId", data.userId);
          window.location.href = "friends.html";
        } else {
          showPopup(data.error);
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("An error occurred. Please try again.");
      }
    });
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      try {
        const response = await fetch(
          "https://chatapi-wrob.onrender.com/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userId", data.userId);
          window.location.href = "friends.html";
        } else {
          showPopup("Invalid email or password. Please try again.");
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("An error occurred. Please try again.");
      }
    });
  }

  // Search Friends
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const query = document.getElementById("search-input").value;
      try {
        const response = await fetch(
          "https://chatapi-wrob.onrender.com/search?username=" + query,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const users = await response.json();

        const resultsList = document.getElementById("search-results");
        resultsList.innerHTML = "";

        if (users.length === 0) {
          showPopup("No users found!");
          return;
        }

        users.forEach((user) => {
          const li = document.createElement("li");
          li.textContent = user.username;
          const addBtn = document.createElement("button");
          addBtn.textContent = "Add Friend";
          addBtn.onclick = async () => {
            await fetch("https://chatapi-wrob.onrender.com/send-request", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                senderId: localStorage.getItem("userId"),
                receiverId: user._id,
              }),
            });
            showPopup("Friend request sent!");
          };
          li.appendChild(addBtn);
          resultsList.appendChild(li);
        });
      } catch (error) {
        console.error("Error searching users:", error);
      }
    });
  }

  // Chat Page
  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
    const chatDisplay = document.querySelector(".chat-display");
    const userId = localStorage.getItem("userId");
    const friendId = localStorage.getItem("chatFriendId");
    if (!friendId) {
      showPopup("Friend ID not found! Please select a friend first.");
      return;
    }

    socket.emit("joinChat", { userId, friendId });

    socket.on("chatHistory", (messages) => {
      chatDisplay.innerHTML = "";
      messages.forEach((msg) => {
        const div = document.createElement("div");
        div.className = msg.sender === userId ? "my-message" : "friend-message";
        div.textContent = msg.text;
        chatDisplay.appendChild(div);
      });
      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    });

    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const msgInput = document.getElementById("message-input");
      if (msgInput.value.trim()) {
        socket.emit("privateMessage", {
          sender: userId,
          receiver: friendId,
          text: msgInput.value,
        });
        msgInput.value = "";
      }
    });

    socket.on("privateMessage", (msg) => {
      const div = document.createElement("div");
      div.className = msg.sender === userId ? "my-message" : "friend-message";
      div.textContent = msg.text;
      chatDisplay.appendChild(div);
      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    });
  }
});

function showPopup(message) {
  alert(message);
}
