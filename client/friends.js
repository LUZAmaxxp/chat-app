document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const query = document.getElementById("search-input").value;
      const response = await fetch(
        `https://chatapi-wrob.onrender.com/search?username=${query}`
      );
      const users = await response.json();

      const resultsList = document.getElementById("search-results");
      resultsList.innerHTML = "";

      users.forEach((user) => {
        const li = document.createElement("li");
        li.textContent = user.username;
        const addBtn = document.createElement("button");
        addBtn.textContent = "Add Friend";
        addBtn.onclick = async () => {
          await fetch("https://chatapi-wrob.onrender.com/add-friend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: localStorage.getItem("userId"),
              friendId: user._id,
            }),
          });
          alert("Friend request sent!");
        };
        li.appendChild(addBtn);
        resultsList.appendChild(li);
      });
    });
  }
});
