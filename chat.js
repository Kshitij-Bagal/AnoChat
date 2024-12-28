// Import Firebase modules (make sure the paths match)
import { ref, push, onChildAdded, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { database } from "./firebase.js";

// Get the room ID from the URL parameters
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");

// UI Elements
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const fileButton = document.getElementById("file-button");
const fileInput = document.getElementById("file-input");
document.getElementById("room-name").textContent = `Room: ${roomId}`;

// Database Reference
const messagesRef = ref(database, `rooms/${roomId}/messages`);

// Send Message
sendButton.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (message) {
    push(messagesRef, {
      content: message,
      type: "text",
      sender: "user", // Mark sender as user
      timestamp: serverTimestamp()
    });
    messageInput.value = "";
  }
});

// File Upload
fileButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      push(messagesRef, {
        content: base64,
        type: "file",
        filename: file.name,
        sender: "user", // Mark sender as user
        timestamp: serverTimestamp()
      });
    };
    reader.readAsDataURL(file);
  }
});

// Listen for Messages
onChildAdded(messagesRef, (snapshot) => {
  const message = snapshot.val();
  const messageDiv = document.createElement("div");
  messageDiv.className = "message";

  // Differentiate between sent and received messages
  if (message.sender === "user") {
    messageDiv.classList.add("sent");
  } else {
    messageDiv.classList.add("received");
  }

  if (message.type === "text") {
    messageDiv.textContent = message.content;
  } else if (message.type === "file") {
    const link = document.createElement("a");
    link.href = message.content;
    link.textContent = `Download ${message.filename}`;
    link.download = message.filename;
    link.target = "_blank";
    messageDiv.appendChild(link);
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Auto-delete after 5 minutes
  setTimeout(() => {
    remove(ref(database, `rooms/${roomId}/messages/${snapshot.key}`));
  }, 5 * 60 * 1000);
});
