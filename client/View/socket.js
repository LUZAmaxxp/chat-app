// socket.js
const socket = io("wss://chatapi-wrob.onrender.com");

function setupSocketListeners() {
  socket.on("connect", () => {
    console.log("Socket connected successfully:", socket.id);
    if (localStorage.getItem("userId")) {
      socket.emit("register", { userId: localStorage.getItem("userId") });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("friendRequest", (data) => {
    console.log("New friend request received:", data);
    showPopup(
      `You received a friend request from ${data.senderUsername}!`,
      "info"
    );
    if (document.getElementById("friend-requests")) {
      loadFriendRequests();
    }
  });

  // Add other socket event listeners here...
}

export { socket, setupSocketListeners };
