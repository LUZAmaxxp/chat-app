const socket = io("wss://chatapi-wrob.onrender.com");

function showPopup(message, type = "info") {
  const popup = document.getElementById("popup-modal");
  const messageBox = document.getElementById("popup-message");
  const closeButton = document.querySelector(".popup-close");

  messageBox.textContent = message;
  popup.className = `popup show ${type}`;

  // Hide on button click
  closeButton.onclick = () => {
    popup.classList.remove("show");
  };

  setTimeout(() => {
    popup.classList.remove("show");
  }, 3000);
}

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
      return;
    }

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

  // Listen for new friend requests - listen for both event names
  // to ensure compatibility with the server implementation
  socket.on("friendRequest", (data) => {
    console.log("New friend request received:", data);
    showPopup(
      `You received a friend request from ${data.senderUsername}!`,
      "info"
    );
    // Reload friend requests list if on the friends page
    if (document.getElementById("friend-requests")) {
      loadFriendRequests();
    }
  });

  socket.on("newFriendRequest", (data) => {
    console.log("New friend request received (newFriendRequest):", data);
    showPopup(
      `You received a friend request from ${data.senderUsername}!`,
      "info"
    );
    // Reload friend requests list if on the friends page
    if (document.getElementById("friend-requests")) {
      loadFriendRequests();
    }
  });

  // Listen for accepted friend requests
  socket.on("friendRequestAccepted", (data) => {
    console.log("Friend request accepted:", data);
    showPopup(
      `${data.accepterUsername} accepted your friend request!`,
      "success"
    );
    // Reload friends list if available
    if (document.getElementById("friends-list")) {
      loadFriendsList();
    }
  });

  // Listen for new messages
  socket.on("newMessage", (msg) => {
    console.log("New message received:", msg);

    // Get the current chat friend ID
    const currentChatFriendId = localStorage.getItem("chatFriendId");

    // Handle message in chat display if we're in a chat and it's from the current friend
    const chatDisplay = document.querySelector(".chat-display");
    if (chatDisplay) {
      // If we're in a chat with the sender or receiver of this message
      if (
        (msg.sender === currentChatFriendId && !msg.isSentByMe) ||
        (msg.receiver === currentChatFriendId && msg.isSentByMe)
      ) {
        const div = document.createElement("div");
        div.className = msg.isSentByMe ? "my-message" : "friend-message";
        div.textContent = msg.text;
        chatDisplay.appendChild(div);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
      } else if (!msg.isSentByMe) {
        // It's a message from someone we're not currently chatting with
        showPopup("New message from another friend!", "info");
      }
    } else if (!msg.isSentByMe) {
      // We're not in any chat, show notification for any new message
      showPopup("You received a new message!", "info");
    }
  });

  // Listen for typing indicators
  socket.on("userTyping", (data) => {
    console.log("User typing:", data);
    const typingIndicator = document.getElementById("typing-indicator");
    if (
      typingIndicator &&
      data.userId === localStorage.getItem("chatFriendId")
    ) {
      typingIndicator.textContent = "Typing...";
      typingIndicator.style.display = "block";
    }
  });

  socket.on("userStoppedTyping", (data) => {
    console.log("User stopped typing:", data);
    const typingIndicator = document.getElementById("typing-indicator");
    if (
      typingIndicator &&
      data.userId === localStorage.getItem("chatFriendId")
    ) {
      typingIndicator.style.display = "none";
    }
  });

  // Listen for online/offline status
  socket.on("userOnline", (data) => {
    console.log("User online:", data);
    updateFriendStatus(data.userId, "online");
  });

  socket.on("userOffline", (data) => {
    console.log("User offline:", data);
    updateFriendStatus(data.userId, "offline");
  });

  // Listen for errors
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    showPopup(
      "Connection error. Please check your internet connection.",
      "error"
    );
  });

  socket.on("messageError", (data) => {
    console.error("Message error:", data);
    showPopup(data.error || "Failed to send message", "error");
  });
}

// Function to update friend's online status in UI
function updateFriendStatus(friendId, status) {
  // Find all elements representing this friend in the friends list
  const friendElements = document.querySelectorAll(
    `[data-friend-id="${friendId}"]`
  );

  friendElements.forEach((element) => {
    // Find or create the status indicator
    let statusIndicator = element.querySelector(".status-indicator");
    if (!statusIndicator) {
      statusIndicator = document.createElement("span");
      statusIndicator.className = "status-indicator";
      element.appendChild(statusIndicator);
    }

    // Update the status
    statusIndicator.className = `status-indicator ${status}`;
    statusIndicator.title = status === "online" ? "Online" : "Offline";
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
        li.setAttribute("data-friend-id", friend._id);

        // Create a container for username and status
        const userInfo = document.createElement("div");
        userInfo.className = "friend-info";

        // Username text
        const username = document.createElement("span");
        username.textContent = friend.username;
        userInfo.appendChild(username);

        // Status indicator
        const statusIndicator = document.createElement("span");
        statusIndicator.className = "status-indicator";
        // Set initial status based on lastActive (if within last 5 minutes, consider online)
        const isRecentlyActive =
          new Date(friend.lastActive) > new Date(Date.now() - 5 * 60 * 1000);
        statusIndicator.classList.add(isRecentlyActive ? "online" : "offline");
        statusIndicator.title = isRecentlyActive ? "Online" : "Offline";
        userInfo.appendChild(statusIndicator);

        li.appendChild(userInfo);

        const chatBtn = document.createElement("button");
        chatBtn.textContent = "Chat";
        chatBtn.onclick = () => {
          localStorage.setItem("chatFriendId", friend._id);
          localStorage.setItem("chatFriendName", friend.username);
          window.location.href = "./chat.html";
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

// Add debounce function for typing indicator
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  // Get token from localStorage
  const token = localStorage.getItem("token");

  // Check if user is logged in, redirect if not
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
    // Setup socket authentication
    socket.auth = { token };
    socket.connect();

    // Setup all socket event listeners
    setupSocketListeners();
  }

  // Add logout functionality
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

          // Setup socket after login
          socket.auth = { token: data.token };
          socket.connect();
          setupSocketListeners();

          window.location.href = "./friends.html";
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

          // Setup socket after login
          socket.auth = { token: data.token };
          socket.connect();
          setupSocketListeners();

          window.location.href = "./Html/friends.html";
        } else {
          showPopup(data.error || "Invalid email or password", "error");
          setTimeout(() => {
            window.location.href = "./Html/signup.html";
          }, 6000);
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

  // Load Friend Requests on page load
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
    const messageInput = document.getElementById("message-input");

    // Create typing indicator element if it doesn't exist
    if (!document.getElementById("typing-indicator")) {
      const typingIndicator = document.createElement("div");
      typingIndicator.id = "typing-indicator";
      typingIndicator.className = "typing-indicator";
      typingIndicator.style.display = "none";
      typingIndicator.textContent = "Typing...";
      chatDisplay.parentNode.insertBefore(
        typingIndicator,
        chatDisplay.nextSibling
      );
    }

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
          div.className = msg.isSentByMe ? "my-message" : "friend-message";
          div.textContent = msg.text;
          chatDisplay.appendChild(div);
        });

        chatDisplay.scrollTop = chatDisplay.scrollHeight;
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      showPopup("Failed to load chat history.", "error");
    }

    // Typing indicator logic
    if (messageInput) {
      // Setup debounced typing events
      const emitTyping = () => {
        socket.emit("typing", { receiver: friendId });
      };

      const emitStopTyping = debounce(() => {
        socket.emit("stopTyping", { receiver: friendId });
      }, 1000);

      messageInput.addEventListener("input", () => {
        emitTyping();
        emitStopTyping();
      });

      messageInput.addEventListener("blur", () => {
        emitStopTyping();
      });
    }

    // Send message
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = messageInput.value.trim();

      if (text) {
        // Emit stop typing immediately when sending
        socket.emit("stopTyping", { receiver: friendId });

        socket.emit("privateMessage", {
          receiver: friendId,
          text: text,
        });

        // Don't add to UI here - wait for server confirmation via newMessage event

        messageInput.value = "";
      }
    });
  }
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const navbarLinks = document.getElementById("navbar-links");
  const profileSection = document.getElementById("profile-section");
  const profileDropdown = document.getElementById("profile-dropdown");
  const logoutLink = document.getElementById("logout-link");

  // Toggle mobile menu
  mobileMenuToggle.addEventListener("click", () => {
    navbarLinks.classList.toggle("active");
  });

  // Toggle profile dropdown
  profileSection.addEventListener("click", (e) => {
    profileDropdown.classList.toggle("active");
    e.stopPropagation();
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!profileSection.contains(e.target)) {
      profileDropdown.classList.remove("active");
    }
  });

  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "../index.html";
  });

  function loadUserProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "../index.html";
      return;
    }

    fetch("https://chatapi-wrob.onrender.com/api/user-profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Profile Data:", data); // Debugging
        document.getElementById("nav-username").textContent = data.username;
        document.getElementById("nav-profile-image").src =
          "../assets/images.png";
      })
      .catch((error) => {
        console.error("Error loading profile:", error);
        if (error.message.includes("401")) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          window.location.href = "../index.html";
        }
      });
  }
  document.addEventListener("DOMContentLoaded", function () {
    // Mobile menu toggle
    const mobileMenuButton = document.querySelector(".mobile-menu-button");
    const navbarLinks = document.querySelector(".navbar-links");

    mobileMenuButton.addEventListener("click", function () {
      this.classList.toggle("active");
      navbarLinks.classList.toggle("active");
    });

    // Profile dropdown toggle
    const profileSection = document.querySelector(".profile-section");
    const profileDropdown = document.querySelector(".profile-dropdown");

    profileSection.addEventListener("click", function (event) {
      event.stopPropagation();
      profileDropdown.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function () {
      profileDropdown.classList.remove("active");
    });
  });

  // Load profile on page load
  loadUserProfile();
});
