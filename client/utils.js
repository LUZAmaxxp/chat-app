// utils.js
function showPopup(message, type = "info") {
  const popup = document.getElementById("popup-modal");
  const messageBox = document.getElementById("popup-message");
  const closeButton = document.querySelector(".popup-close");

  messageBox.textContent = message;
  popup.className = `popup show ${type}`;

  closeButton.onclick = () => {
    popup.classList.remove("show");
  };

  setTimeout(() => {
    popup.classList.remove("show");
  }, 3000);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export { showPopup, debounce };
