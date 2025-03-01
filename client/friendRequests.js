// friendRequests.js
import { socket } from "./socket.js";

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
            socket.emit("friendRequestAccepted", {
              senderId: friend._id,
              receiverId: localStorage.getItem("userId"),
            });
            showPopup("Friend request accepted!", "success");
            loadFriendRequests();
            loadFriendsList();
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

export { loadFriendRequests };
