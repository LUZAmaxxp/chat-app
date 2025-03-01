// userProfile.js
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
      document.getElementById("nav-username").textContent = data.username;
      document.getElementById("nav-profile-image").src = "../assets/images.png";
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

export { loadUserProfile };
