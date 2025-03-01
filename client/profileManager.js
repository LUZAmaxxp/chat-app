// profileManager.js
import { fetchWithAuth } from "./apiService.js";

async function loadUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  const profileData = await fetchWithAuth(
    "https://chatapi-wrob.onrender.com/api/user-profile"
  );
  return profileData;
}

async function updateUserProfile(updatedData) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  const response = await fetchWithAuth(
    "https://chatapi-wrob.onrender.com/api/update-profile",
    {
      method: "PUT",
      body: JSON.stringify(updatedData),
    }
  );
  return response;
}

export { loadUserProfile, updateUserProfile };
