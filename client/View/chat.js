// chat.js
import { socket } from "./socket.js";

async function loadChat() {
  const chatForm = document.getElementById("chat-form");
  if (!chatForm) return;

  const chatDisplay = document.querySelector(".chat-display");
  const userId = localStorage.getItem("userId");
  const friendId = localStorage.getItem("chatFriendId");
  const friendName = localStorage.getItem("chatFriendName");
  const messageInput = document.getElementById("message-input");

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

  const friendNameElement = document.getElementById("friend-name");
  if (friendNameElement && friendName) {
    friendNameElement.textContent = friendName;
  }

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

  if (messageInput) {
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

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();

    if (text) {
      socket.emit("stopTyping", { receiver: friendId });
      socket.emit("privateMessage", {
        receiver: friendId,
        text: text,
      });
      messageInput.value = "";
    }
  });
}

export { loadChat };
