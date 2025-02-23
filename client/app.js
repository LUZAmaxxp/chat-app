const socket = io("https://chatapi-wrob.onrender.com", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

// Signup Logic
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const response = await fetch("https://chatapi-wrob.onrender.com/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        window.location.href = "friends.html";
      } else {
        alert(data.error);
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
        localStorage.setItem("userId", data.userId);
        window.location.href = "friends.html"; // Redirect to friends page
      } else {
        alert("Invalid email or password. Please try again.");
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
        `https://chatapi-wrob.onrender.com/search?username=${query}`
      );
      const users = await response.json();

      const resultsList = document.getElementById("search-results");
      resultsList.innerHTML = "";
      users.forEach((user) => {
        if (query === user.username) {
          const li = document.createElement("li");
          li.textContent = user.username;
          const addBtn = document.createElement("button");
          addBtn.textContent = "Add Friend";
          addBtn.onclick = async () => {
            await fetch("https://chatapi-wrob.onrender.com/add-friend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: localStorage.getItem("userId"),
                friendId: user._id,
              }),
            });
            alert("Friend request sent!");
          };
          li.appendChild(addBtn);
          resultsList.appendChild(li);
        }
      });
    });
  }

  // Load Friends List
  const friendsList = document.getElementById("friends-list");
  if (friendsList) {
    (async () => {
      const response = await fetch(
        `https://chatapi-wrob.onrender.com/friends?userId=${localStorage.getItem(
          "userId"
        )}`
      );
      const friends = await response.json();
      friends.forEach((friend) => {
        const li = document.createElement("li");
        li.textContent = friend.username;
        li.onclick = () => {
          localStorage.setItem("chatFriendId", friend._id);
          localStorage.setItem("chatFriendName", friend.username);
          window.location.href = "chat.html";
        };
        friendsList.appendChild(li);
      });
    })();
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
