// Initialize socket connection
const socket = io("wss://chatapi-wrob.onrender.com", {});

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const friendId = urlParams.get("friendId");

const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");

document.getElementById("friendName").innerText = friendId; // Replace with real name fetch

function loadMessages() {
  fetch(`/api/messages?friendId=${friendId}`)
    .then((response) => response.json())
    .then((data) => {
      chatMessages.innerHTML = "";
      data.forEach((msg) => {
        let li = document.createElement("li");
        li.textContent = `${msg.sender}: ${msg.text}`;
        chatMessages.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error loading messages:", error);
    });
}

/**
 * Send a message to the server
 */
function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("privateMessage", { friendId, text: message });
    messageInput.value = "";
  }
}

// Add event listener for Enter key
messageInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// Socket event listener for receiving messages
socket.on("receiveMessage", (data) => {
  let li = document.createElement("li");
  li.textContent = `${data.sender}: ${data.text}`;
  chatMessages.appendChild(li);

  // Auto scroll to bottom when new message arrives
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Load initial messages when page loads
loadMessages();
