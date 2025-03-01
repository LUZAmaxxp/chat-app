// friendsList.js
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
    friendsList.innerHTML = "";

    if (friends.length === 0) {
      friendsList.innerHTML = "<li>You don't have any friends yet.</li>";
    } else {
      friends.forEach((friend) => {
        const li = document.createElement("li");
        li.setAttribute("data-friend-id", friend._id);

        const userInfo = document.createElement("div");
        userInfo.className = "friend-info";

        const username = document.createElement("span");
        username.textContent = friend.username;
        userInfo.appendChild(username);

        const statusIndicator = document.createElement("span");
        statusIndicator.className = "status-indicator";
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

export { loadFriendsList };
