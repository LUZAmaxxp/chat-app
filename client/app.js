const socket = io("https://chatapi-wrob.onrender.com", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

// Signup Logic
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
          localStorage.setItem("token", data.token); // Save token instead of userId
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

      const response = await fetch("https://chatapi-wrob.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token); // Save token
        window.location.href = "friends.html"; // Redirect to friends page
      } else {
        showPopup("Invalid email or password. Please try again.");
        console.log(data.error);
      }
    });
  }

  // Search Friends
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const query = document.getElementById("search-input").value;
      const response = await fetch(
        "https://chatapi-wrob.onrender.com/search?username=" + query,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const users = await response.json();

      const resultsList = document.getElementById("search-results");
      resultsList.innerHTML = "";
      users.forEach((user) => {
        if (user.username == query) {
          const li = document.createElement("li");
          li.textContent = user.username;
          const addBtn = document.createElement("button");
          addBtn.textContent = "Add Friend";
          addBtn.onclick = async () => {
            try {
              const response = await fetch(
                "https://chatapi-wrob.onrender.com/send-request",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`, // Include token
                  },
                  body: JSON.stringify({
                    senderId: localStorage.getItem("userId"),
                    receiverId: user._id,
                  }),
                }
              );
              if (response.status == 400) {
                showPopup("Friend request already sent!");
              } else if (response.status == 200) {
                showPopup("Friend request sent!");
              }
            } catch (error) {
              console.error("Failed to send friend request:", error);
              alert("Failed to send friend request.");
              return;
            }
          };

          li.appendChild(addBtn);
          resultsList.appendChild(li);
        } else if (user.username != query) {
          showPopup("No users found!");
        }
      });
    });
  }

  // Load Friends List
  const userId = localStorage.getItem("userId");
  const friendRequestsList = document.getElementById("friend-requests");

  if (friendRequestsList) {
    const response = await fetch(
      "https://chatapi-wrob.onrender.com/friend-requests/" + userId,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch friend requests:", response.statusText);
      return;
    }
    const friendRequests = await response.json();
    console.log("Friend Requests for user:", user.friendRequests);

    friendRequestsList.innerHTML = "";

    friendRequests.forEach((friend) => {
      const li = document.createElement("li");
      li.textContent = friend.username;

      const acceptBtn = document.createElement("button");
      acceptBtn.textContent = "Accept";
      acceptBtn.onclick = async () => {
        await fetch("https://chatapi-wrob.onrender.com/accept-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, friendId: friend._id }),
        });
        alert("Friend request accepted!");
        location.reload();
      };

      li.appendChild(acceptBtn);
      friendRequestsList.appendChild(li);
    });
  }

  // Chat Page Logic
  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
    document.getElementById("friend-name").textContent +=
      localStorage.getItem("chatFriendName");
    const chatDisplay = document.querySelector(".chat-display");
    const userId = localStorage.getItem("userId");
    const friendId = localStorage.getItem("chatFriendId");

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
  const popup = document.getElementById("popup-modal");
  const messageBox = document.getElementById("popup-message");
  const closeButton = document.querySelector(".popup-close");

  messageBox.textContent = message;
  popup.classList.add("show");

  // Hide on button click
  closeButton.onclick = () => {
    popup.classList.remove("show");
  };

  // Auto-hide after 3 seconds
  setTimeout(() => {
    popup.classList.remove("show");
  }, 3000);
}
// For dark theme
document.querySelector(".popup").classList.add("dark-theme");

// For success message
document.querySelector(".popup").classList.add("success");

// For error message
document.querySelector(".popup").classList.add("error");
