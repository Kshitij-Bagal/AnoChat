import { ref, push, onChildAdded, remove, serverTimestamp, update, get } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { database } from "./firebase.js";

// Get room ID and duration from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");
const roomDuration = parseInt(urlParams.get("duration")) * 60 * 1000;  // Convert to milliseconds

// UI Elements
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const fileButton = document.getElementById("file-button");
const fileInput = document.getElementById("file-input");
const closeRoomButton = document.getElementById("close-room");
const roomNameElement = document.getElementById("room-name");
const roomTimerElement = document.getElementById("room-timer");

roomNameElement.textContent = `Room: ${roomId}`;

// Database References
const messagesRef = ref(database, `rooms/${roomId}/messages`);
const roomRef = ref(database, `rooms/${roomId}`);

// Function to get the user's IP address
async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;  // Return the user's IP address
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return "unknown";
  }
}

// Timer for room expiry
let roomExpirationTime = Date.now() + roomDuration; // Expiration time based on roomDuration
localStorage.setItem('roomExpirationTime', roomExpirationTime); // Store the expiration time in localStorage

// Function to handle room expiration
function handleRoomExpiration() {
  if (Date.now() >= roomExpirationTime) {
    update(roomRef, { active: false }).then(() => {
      alert("This room has expired and is now closed.");
      window.location.href = "/"; // Redirect to homepage
    }).catch((error) => {
      console.error("Error marking room as inactive:", error);
    });
  }
}

// Display countdown timer
function displayRoomTimer() {
  const countdownInterval = setInterval(() => {
    const remainingTime = roomExpirationTime - Date.now();

    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      roomTimerElement.textContent = "Room has expired.";
      handleRoomExpiration(); // Mark room as expired if the time is over
    } else {
      const minutesLeft = Math.floor(remainingTime / 1000 / 60);
      const secondsLeft = Math.floor((remainingTime / 1000) % 60);
      roomTimerElement.textContent = `Time remaining: ${minutesLeft} min ${secondsLeft} sec`;
    }
  }, 1000);
}

displayRoomTimer(); // Start the countdown timer

// Send message function
const sendMessage = async () => {
  const message = messageInput.value.trim();
  if (message) {
    const ipAddress = await getUserIP();  // Get the user's IP address

    // Push message to Firebase
    const messageRef = push(messagesRef, {
      content: message,
      type: "text",
      sender: ipAddress,  // Store IP address instead of "user"
      timestamp: serverTimestamp()
    });
    messageInput.value = "";

    // Set a timer for the message to hide and delete it after 1 minute
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageRef.key}`);
      if (messageElement) {
        messageElement.style.display = 'none'; // Hide the message
        messageElement.remove(); // Completely remove the message element from DOM
      }
    }, 1 * 60 * 1000); // Message will disappear and be removed after 1 minute
  }
};

// Send message on button click or Enter key press
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// File Upload functionality
fileButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    const ipAddress = await getUserIP();  // Get the user's IP address
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      push(messagesRef, {
        content: base64,
        type: "file",
        filename: file.name,
        sender: ipAddress,  // Store IP address instead of "user"
        timestamp: serverTimestamp()
      });
    };
    reader.readAsDataURL(file);
  }
});

// Listen for new messages and re-render after refresh
onChildAdded(messagesRef, (snapshot) => {
  const message = snapshot.val();
  const messageDiv = document.createElement("div");
  messageDiv.className = "message";
  messageDiv.id = `message-${snapshot.key}`; // Assign unique ID to each message

  if (message.sender !== "unknown") {  // Don't display messages from unknown IPs
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
      messageDiv.appendChild(link);
    }

    // Add timestamp to the message
    const timestampDiv = document.createElement("div");
    timestampDiv.className = "timestamp";
    const timestamp = new Date(message.timestamp);
    timestampDiv.textContent = timestamp.toLocaleTimeString();
    messageDiv.appendChild(timestampDiv);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Auto-delete message after 1 minute (as well as hiding it)
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${snapshot.key}`);
      if (messageElement) {
        messageElement.style.display = 'none'; // Hide the message
        messageElement.remove(); // Completely remove the message element from DOM
      }
    }, 0.5 * 60 * 1000); // Set to 1 minute
  }
});

// Close Room functionality
closeRoomButton.addEventListener("click", () => {
  const confirmation = confirm("Are you sure you want to close this room?");
  if (confirmation) {
    update(roomRef, { active: false }).then(() => {
      alert("Room closed.");
      window.location.href = "/"; // Redirect to homepage
    }).catch((error) => {
      alert("Error closing the room: " + error.message);
    });
  }
});
