// chat.js
import { database } from './firebase.js'; // Import Firebase database
import { ref, push, onChildAdded, serverTimestamp, update, remove } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Function to create the chat overlay dynamically when creating a room
export function createChatOverlay(roomId, roomDurationInMinutes) {
    if (document.getElementById("chat-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "chat-overlay";
    overlay.className = "overlay";

    // Convert the given duration from minutes to seconds
    let roomDurationInSeconds = roomDurationInMinutes * 60;

    overlay.innerHTML = `
      <div id="chat-container">
        <div id="room-header">
          <h3 id="room-title">Room: ${roomId}</h3>
          <div id="room-timer">${formatTime(roomDurationInSeconds)}</div>
          <button id="close-room-button">Close Room</button>
        </div>
        <div id="messages-container"></div>
        <div id="message-controls">
          <input id="message-input" type="text" placeholder="Type a message">
          <button class='c-button' id="send-message">Send</button>
          <button class='c-button' id="send-file">File</button>
          <input type="file" id="file-input" style="display:none">
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    initializeChat(roomId, roomDurationInSeconds);

    // Start the countdown timer and update the display
    let timerInterval = setInterval(() => {
        if (roomDurationInSeconds > 0) {
            roomDurationInSeconds--;
            document.getElementById("room-timer").textContent = formatTime(roomDurationInSeconds);
            updateRoomDuration(roomId, roomDurationInSeconds);
        } else {
            clearInterval(timerInterval);
            alert("Room time expired!");
            removeRoomFromDatabase(roomId);  // Automatically remove the room from Firebase when expired
            overlay.remove();
        }
    }, 1000); // Update every second (1,000ms)

    document.getElementById("close-room-button").addEventListener("click", () => {
        clearInterval(timerInterval); // Stop the countdown when the room is closed
        overlay.remove();
    });
}

// Helper function to format the remaining time in minutes and seconds
function formatTime(durationInSeconds) {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Function to update the room's remaining time in Firebase
function updateRoomDuration(roomId, roomDurationInSeconds) {
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, {
        duration: roomDurationInSeconds
    });
}

// Function to remove the room from Firebase when expired
function removeRoomFromDatabase(roomId) {
    const roomRef = ref(database, `rooms/${roomId}`);
    remove(roomRef);
}

// Function to initialize chat in both create and join cases
function initializeChat(roomId) {
    const messagesContainer = document.getElementById("messages-container");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-message");
    const fileButton = document.getElementById("send-file");
    const fileInput = document.getElementById("file-input");

    // Reference to the Firebase messages for the specific room
    const messagesRef = ref(database, `rooms/${roomId}/messages`);

    // Listen for new messages in the room
    onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val();
        renderMessage(snapshot.key, message);
    });

    // Function to render the received message
    function renderMessage(key, message) {
        const messageDiv = document.createElement("div");
        messageDiv.className = "message";
        messageDiv.id = `message-${key}`;

        if (message.type === "text") {
            messageDiv.textContent = `${message.sender}: ${message.content}`;
        } else if (message.type === "file") {
            const link = document.createElement("a");
            link.href = message.content; // Use Base64 content as the link
            link.download = message.filename; // Set filename for download
            link.textContent = `Download ${message.filename}`;
            messageDiv.appendChild(link);
        }

        const timestampDiv = document.createElement("div");
        timestampDiv.className = "timestamp";
        timestampDiv.textContent = new Date(message.timestamp).toLocaleTimeString();
        messageDiv.appendChild(timestampDiv);

        // Add delete button for the message
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            removeMessageFromDatabase(key);  // Remove from Firebase
            messageDiv.remove();  // Remove from DOM
        });

        messageDiv.appendChild(deleteButton);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Auto-remove message after 1 minute
        setTimeout(() => {
            const messageElement = document.getElementById(`message-${key}`);
            if (messageElement) {
                messageElement.remove();
                removeMessageFromDatabase(key); // Ensure message is also removed from Firebase
            }
        }, 60000);
    }

    // Function to remove message from Firebase
    function removeMessageFromDatabase(messageKey) {
        const messageRef = ref(database, `rooms/${roomId}/messages/${messageKey}`);
        remove(messageRef);
    }

    // Function to send message when the user clicks the Send button
    sendButton.addEventListener("click", () => {
        const message = messageInput.value.trim();

        if (message) {
            push(messagesRef, {
                content: message,
                type: "text",
                sender: "Anonymous", // Replace with actual sender info if needed
                timestamp: serverTimestamp(),
            });

            messageInput.value = ''; // Clear the input field
        }
    });

    // Handle file upload using Base64 encoding
    fileButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result; // Get Base64 encoded file content
                push(messagesRef, {
                    content: base64, // Store Base64 data
                    type: "file",
                    filename: file.name,
                    sender: "Anonymous", // Replace with actual sender if needed
                    timestamp: serverTimestamp(),
                });
            };
            reader.readAsDataURL(file); // Convert file to Base64
        }
    });
}
