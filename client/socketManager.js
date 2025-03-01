// socketManager.js
const socket = io("wss://chatapi-wrob.onrender.com");

function setupSocketListeners() {
  socket.on("connect", () => {
    console.log("Socket connected successfully:", socket.id);
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

  // Additional socket event listeners can be added here
}

export { socket, setupSocketListeners };
