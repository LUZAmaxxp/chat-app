// friendManager.js
import { fetchWithAuth } from "./apiService.js";

async function loadFriendRequests() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const friendRequests = await fetchWithAuth(
    `https://chatapi-wrob.onrender.com/api/friend-requests/${userId}`
  );
  return friendRequests;
}

async function loadFriendsList() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const friends = await fetchWithAuth(
    `https://chatapi-wrob.onrender.com/api/friends/${userId}`
  );
  return friends;
}

export { loadFriendRequests, loadFriendsList };
