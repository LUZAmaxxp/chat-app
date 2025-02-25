const socket = io("wss://chatapi-wrob.onrender.com");

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
    console.log("Friend requests loaded:", friendRequests);

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
              socket.emit("friendRequestAccepted", {
                senderId: friend._id,
                receiverId: localStorage.getItem("userId"),
              });
              showPopup("Friend request accepted!", "success");
              loadFriendRequests(); // Reload the list instead of full page refresh
              loadFriendsList(); // Also reload friends list
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

// Setup socket event listeners
function setupSocketListeners() {
  // Listen for socket connection
  socket.on("connect", () => {
    console.log("Socket connected successfully:", socket.id);

    // After successful connection, emit a 'register' event with user ID
    // This helps the server associate this socket with the user
    if (localStorage.getItem("userId")) {
      socket.emit("register", { userId: localStorage.getItem("userId") });
      console.log(
        "Registered socket with user ID:",
        localStorage.getItem("userId")
      );
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  // Listen for new friend requests - UPDATED to listen for both event names
  // to ensure compatibility with your server implementation
  socket.on("friendRequest", (data) => {
    console.log("New friend request received:", data);
    showPopup("You received a new friend request!", "info");
    // Reload friend requests list if on the friends page
    if (document.getElementById("friend-requests")) {
      loadFriendRequests();
    }
  });

  socket.on("newFriendRequest", (data) => {
    console.log("New friend request received:", data);
    showPopup("You received a new friend request!", "info");
    // Reload friend requests list if on the friends page
    if (document.getElementById("friend-requests")) {
      loadFriendRequests();
    }
  });

  // Listen for accepted friend requests
  socket.on("friendRequestAccepted", (data) => {
    console.log("Friend request accepted:", data);
    showPopup("Friend request accepted!", "success");
    // Reload friends list if available
    if (document.getElementById("friends-list")) {
      loadFriendsList();
    }
  });

  // Listen for errors
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });
}

// Function to load friends list
async function loadFriendsList() {
  const friendsList = document.getElementById("friends-list");
  if (!friendsList) return;

  try {
    const response = await fetch(
      `https://chatapi-wrob.onrender.com/api/friends/${localStorage.getItem(
        "userId"
      )}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch friends");
    }

    const friends = await response.json();
    console.log("Friends loaded:", friends);

    friendsList.innerHTML = "";

    if (friends.length === 0) {
      friendsList.innerHTML = "<li>You don't have any friends yet.</li>";
    } else {
      friends.forEach((friend) => {
        const li = document.createElement("li");
        li.textContent = friend.username;

        const chatBtn = document.createElement("button");
        chatBtn.textContent = "Chat";
        chatBtn.onclick = () => {
          localStorage.setItem("chatFriendId", friend._id);
          localStorage.setItem("chatFriendName", friend.username);
          window.location.href = "chat.html";
        };

        li.appendChild(chatBtn);
        friendsList.appendChild(li);
      });
    }
  } catch (error) {
    console.error("Error loading friends:", error);
    showPopup("Failed to load friends list.", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Get token from localStorage
  const token = localStorage.getItem("token");

  if (token) {
    // Setup socket authentication
    socket.auth = { token };
    socket.connect();

    // Setup all socket event listeners
    setupSocketListeners();
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
        return;
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
                // Updated to include sender info as well
                socket.emit("friendRequest", {
                  receiverId: user._id,
                  senderId: localStorage.getItem("userId"),
                });
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

  if (document.getElementById("friend-requests")) {
    loadFriendRequests();
  }

  // Load Friends List on page load
  if (document.getElementById("friends-list")) {
    loadFriendsList();
  }

  // Chat Page Logic
  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
    const chatDisplay = document.querySelector(".chat-display");
    const userId = localStorage.getItem("userId");
    const friendId = localStorage.getItem("chatFriendId");
    const friendName = localStorage.getItem("chatFriendName");

    // Display friend name if available
    const friendNameElement = document.getElementById("friend-name");
    if (friendNameElement && friendName) {
      friendNameElement.textContent = friendName;
    }

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
      const text = msgInput.value;

      if (text) {
        socket.emit("privateMessage", {
          receiver: friendId,
          text: text,
        });

        // Optimistic UI update
        const div = document.createElement("div");
        div.className = "my-message";
        div.textContent = text;
        chatDisplay.appendChild(div);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;

        msgInput.value = "";
      }
    });

    socket.on("newMessage", (msg) => {
      console.log("New message received:", msg);
      const div = document.createElement("div");
      div.className = msg.sender === userId ? "my-message" : "friend-message";
      div.textContent = msg.text;
      chatDisplay.appendChild(div);
      chatDisplay.scrollTop = chatDisplay.scrollHeight;

      // Only show popup for messages from other friends (not the current chat)
      if (msg.sender !== friendId) {
        showPopup("New message from another friend!", "info");
      }
    });
  }
});
