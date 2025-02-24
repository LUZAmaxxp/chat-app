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

// Function to load friend requests
async function loadFriendRequests() {
  const friendRequestsList = document.getElementById("friend-requests");
  if (!friendRequestsList) return;

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
    console.log(friendRequests);

    friendRequestsList.innerHTML = "";

    if (friendRequests.length === 0) {
      friendRequestsList.innerHTML =
        "<li>No friend requests at this time.</li>";
    }
    if (friendRequests.length > 0) {
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
              // Emit socket event when accepting friend request
              socket.emit("friendRequestAccepted", { senderId: friend._id });
              showPopup("Friend request accepted!", "success");
              loadFriendRequests(); // Reload the list instead of full page refresh
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
    }
  } catch (error) {
    console.error("Error loading friend requests:", error);
    showPopup("Failed to load friend requests.", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Get token from localStorage and setup socket authentication
  const token = localStorage.getItem("token");

  if (token) {
    // Setup socket authentication
    socket.auth = { token };
    socket.connect();

    // Listen for new friend requests
    socket.on("newFriendRequest", (data) => {
      showPopup("You received a new friend request!", "info");
      // Reload friend requests list if on the friends page
      if (document.getElementById("friend-requests")) {
        loadFriendRequests();
      }
    });

    // Listen for accepted friend requests
    socket.on("friendRequestAccepted", (data) => {
      showPopup("Friend request accepted!", "success");
    });
  }

  // Signup Logic
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
      if (!query.trim()) {
        showPopup("Please enter a search term", "error");
      }

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

        if (users.length === 0) {
          resultsList.innerHTML = "<li>No users found</li>";
          return;
        }

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
                // Emit socket event for real-time notification
                socket.emit("friendRequest", { receiverId: user._id });
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

  // Load Friend Requests on page load
  if (document.getElementById("friend-requests")) {
    loadFriendRequests();
  }

  // Chat Page Logic
  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
    const chatDisplay = document.querySelector(".chat-display");
    const userId = localStorage.getItem("userId");
    const friendId = localStorage.getItem("chatFriendId");

    // Load initial messages
    try {
      const response = await fetch(
        `https://chatapi-wrob.onrender.com/api/messages/${friendId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const messages = await response.json();
        chatDisplay.innerHTML = "";

        messages.forEach((msg) => {
          const div = document.createElement("div");
          div.className =
            msg.sender === userId ? "my-message" : "friend-message";
          div.textContent = msg.text;
          chatDisplay.appendChild(div);
        });

        chatDisplay.scrollTop = chatDisplay.scrollHeight;
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      showPopup("Failed to load chat history.", "error");
    }

    // Send message
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const msgInput = document.getElementById("message-input");
      if (msgInput.value.trim()) {
        socket.emit("privateMessage", {
          receiver: friendId,
          text: msgInput.value,
        });

        // Optimistic UI update
        const div = document.createElement("div");
        div.className = "my-message";
        div.textContent = msgInput.value;
        chatDisplay.appendChild(div);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;

        msgInput.value = "";
      }
    });

    // Receive new message
    socket.on("newMessage", (msg) => {
      // Only add the message if it's from our friend and not our own message that we already added
      if (
        msg.sender !== userId ||
        !document.querySelector(`.my-message:contains('${msg.text}')`)
      ) {
        const div = document.createElement("div");
        div.className = msg.sender === userId ? "my-message" : "friend-message";
        div.textContent = msg.text;
        chatDisplay.appendChild(div);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
      }
    });
  }
});
