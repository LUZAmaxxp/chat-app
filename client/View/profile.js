document.addEventListener("DOMContentLoaded", function () {
  const toggleEditButton = document.getElementById("toggle-edit-mode");
  const editButtons = document.getElementById("edit-buttons");
  const cancelEditButton = document.getElementById("cancel-edit");
  const profileInfoForm = document.getElementById("profile-info-form");

  const usernameDisplay = document.getElementById("username-display");
  const usernameInput = document.getElementById("username-input");
  const emailDisplay = document.getElementById("email-display");
  const emailInput = document.getElementById("email-input");
  const createdAt = document.getElementById("created-at");
  const lastActive = document.getElementById("last-active");

  const friendCount = document.getElementById("friend-count");
  const pendingCount = document.getElementById("pending-count");

  let originalUsername = "";
  let originalEmail = "";

  function getToken() {
    return localStorage.getItem("token");
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function enableEditMode() {
    usernameDisplay.style.display = "none";
    emailDisplay.style.display = "none";

    usernameInput.style.display = "block";
    emailInput.style.display = "block";

    usernameInput.value = originalUsername;
    emailInput.value = originalEmail;

    editButtons.style.display = "block";
    toggleEditButton.style.display = "none";
  }

  function disableEditMode() {
    usernameDisplay.style.display = "block";
    emailDisplay.style.display = "block";

    usernameInput.style.display = "none";
    emailInput.style.display = "none";

    editButtons.style.display = "none";
    toggleEditButton.style.display = "block";
  }

  // Load user profile data
  function loadUserProfile() {
    // Fixed the function name here
    const token = getToken();

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
        // Update profile info
        usernameDisplay.textContent = data.username;
        emailDisplay.textContent = data.email;
        createdAt.textContent = formatDate(data.createdAt);
        lastActive.textContent = formatDate(data.lastActive);

        originalUsername = data.username;
        originalEmail = data.email;
        // Debugging

        friendCount.textContent = data.friends ? data.friends.length : 0;

        fetchFriendRequests();
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

  // Fetch friend requests
  function fetchFriendRequests() {
    const token = getToken();
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      return;
    }

    fetch(`https://chatapi-wrob.onrender.com/api/friend-requests/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load friend requests");
        }
        return response.json();
      })
      .then((data) => {
        pendingCount.textContent = data.length;
      })
      .catch((error) => {
        console.error("Error loading friend requests:", error);
      });
  }

  // Event Listeners

  // Toggle edit mode when clicking the edit button
  toggleEditButton.addEventListener("click", enableEditMode);

  // Cancel edit mode
  cancelEditButton.addEventListener("click", (e) => {
    e.preventDefault();
    disableEditMode();
  });

  // Handle profile info form submission
  profileInfoForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      window.location.href = "../index.html";
      return;
    }

    const updatedData = {
      username: usernameInput.value,
      email: emailInput.value,
    };

    fetch("https://chatapi-wrob.onrender.com/api/update-profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || "Failed to update profile");
          });
        }
        return response.json();
      })
      .then((data) => {
        // Update display values
        usernameDisplay.textContent = data.username;
        emailDisplay.textContent = data.email;

        // Update original values
        originalUsername = data.username;
        originalEmail = data.email;

        // Update navbar
        const navUsername = document.getElementById("nav-username");
        if (navUsername) {
          navUsername.textContent = data.username;
        }

        // Disable edit mode
        disableEditMode();

        // Show success message
        alert("Profile updated successfully");
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        alert(error.message);
      });
  });

  loadUserProfile();

  // Add event listener for view friends button
  document.getElementById("view-friends-btn").addEventListener("click", () => {
    window.location.href = "../friends.html";
  });

  // Add event listener for view requests button
  document.getElementById("view-requests-btn").addEventListener("click", () => {
    window.location.href = "../friends.html";
  });

  // Log out functionality
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "../index.html";
  });
});
