document.addEventListener("DOMContentLoaded", () => {
  fetchFriends();
});

function fetchFriends() {
  fetch("/api/friends")
    .then((response) => response.json())
    .then((data) => {
      const friendsList = document.getElementById("friendsList");
      const friendSelect = document.getElementById("friendSelect");
      friendsList.innerHTML = "";
      friendSelect.innerHTML = "";

      data.forEach((friend) => {
        let li = document.createElement("li");
        li.textContent = friend.name;
        friendsList.appendChild(li);

        let option = document.createElement("option");
        option.value = friend.id;
        option.textContent = friend.name;
        friendSelect.appendChild(option);
      });
    })
    .catch((error) => console.error("Error fetching friends:", error));
}

function searchFriend() {
  const query = document.getElementById("searchFriend").value;
  fetch(`/api/search-friends?query=${query}`)
    .then((response) => response.json())
    .then((data) => {
      alert(data.message || "Friend search complete.");
      fetchFriends();
    })
    .catch((error) => console.error("Error searching for friends:", error));
}

function startChat() {
  const button = document.querySelector("#friendSelect + button");
  button.classList.add("loading");

  setTimeout(() => button.classList.remove("loading"), 2000);
  const selectedFriend = document.getElementById("friendSelect").value;
  if (selectedFriend) {
    window.location.href = `discussion.html?friendId=${selectedFriend}`;
  } else {
    alert("Please select a friend to chat with.");
  }
}
