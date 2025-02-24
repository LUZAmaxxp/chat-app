const socket = io("https://chatapi-wrob.onrender.com", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

// Utility function to show popup messages
function showPopup(message, type = "info") {
  const popup = document.getElementById("popup-modal");
  const messageBox = document.getElementById("popup-message");
  const closeButton = document.querySelector(".popup-close");

  messageBox.textContent = message;
  popup.className = `popup show ${type}`; // Add type for styling (info, success, error)

  // Hide on button click
  closeButton.onclick = () => {
    popup.classList.remove("show");
  };

  // Auto-hide after 3 seconds
  setTimeout(() => {
    popup.classList.remove("show");
  }, 3000);
}

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
          "https://chatapi-wrob.onrender.com/api/signup",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem("token", data.token); // Save token
          localStorage.setItem("userId", data.userId); // Save userId
          window.location.href = "friends.html";
        } else {
          showPopup(data.error || "Signup failed", "error");
        }
      } catch (error) {
        console.error("Network error:", error);
        showPopup("An error occurred. Please try again.", "error");
      }
    });
  }

  // Login Logic
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      try {
        const response = await fetch(
          "https://chatapi-wrob.onrender.com/api/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem("token", data.token); // Save token
          localStorage.setItem("userId", data.userId); // Save userId
          window.location.href = "friends.html";
        } else {
          showPopup(data.error || "Invalid email or password", "error");
        }
      } catch (error) {
        console.error("Network error:", error);
        showPopup("An error occurred. Please try again.", "error");
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
          `https://chatapi-wrob.onrender.com/api/search?username=${query}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const users = await response.json();
        const resultsList = document.getElementById("search-results");
        resultsList.innerHTML = "";

        users.forEach((user) => {
          const li = document.createElement("li");
          li.textContent = user.username;

          const addBtn = document.createElement("button");
          addBtn.textContent = "Add Friend";
          addBtn.onclick = async () => {
            try {
              const response = await fetch(
                "https://chatapi-wrob.onrender.com/api/send-request",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                  body: JSON.stringify({ receiverId: user._id }),
                }
              );
              if (response.ok) {
                showPopup("Friend request sent!", "success");
              } else {
                const data = await response.json();
                showPopup(data.error || "Failed to send request", "error");
              }
            } catch (error) {
              console.error("Failed to send friend request:", error);
              showPopup("Failed to send friend request.", "error");
            }
          };

          li.appendChild(addBtn);
          resultsList.appendChild(li);
        });
      } catch (error) {
        console.error("Search error:", error);
        showPopup("Failed to search for users.", "error");
      }
    });
  }

  // Load Friend Requests
  const friendRequestsList = document.getElementById("friend-requests");
  if (friendRequestsList) {
    try {
      const response = await fetch(
        `https://chatapi-wrob.onrender.com/api/friend-requests/${localStorage.getItem(
          "userId"
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch friend requests");
      }
      const friendRequests = await response.json();
      friendRequestsList.innerHTML = "";

      friendRequests.forEach((friend) => {
        const li = document.createElement("li");
        li.textContent = friend.username;

        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "Accept";
        acceptBtn.onclick = async () => {
          try {
            const response = await fetch(
              "https://chatapi-wrob.onrender.com/api/accept-request",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ friendId: friend._id }),
              }
            );
            if (response.ok) {
              showPopup("Friend request accepted!", "success");
              location.reload();
            } else {
              const data = await response.json();
              showPopup(data.error || "Failed to accept request", "error");
            }
          } catch (error) {
            console.error("Failed to accept friend request:", error);
            showPopup("Failed to accept friend request.", "error");
          }
        };

        li.appendChild(acceptBtn);
        friendRequestsList.appendChild(li);
      });
    } catch (error) {
      console.error("Error loading friend requests:", error);
      showPopup("Failed to load friend requests.", "error");
    }
  }

  // Chat Page Logic
  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
    const chatDisplay = document.querySelector(".chat-display");
    const userId = localStorage.getItem("userId");
    const friendId = localStorage.getItem("chatFriendId");

    // Join chat room
    socket.emit("joinChat", { userId, friendId });

    // Load chat history
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

    // Send message
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

    // Receive new message
    socket.on("privateMessage", (msg) => {
      const div = document.createElement("div");
      div.className = msg.sender === userId ? "my-message" : "friend-message";
      div.textContent = msg.text;
      chatDisplay.appendChild(div);
      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    });
  }
});
