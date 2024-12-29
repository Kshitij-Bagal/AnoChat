
// home.js
import { database } from './firebase.js';
import { ref, set, get, remove } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { createChatOverlay } from './chat.js';

// Function to generate a random 8-character room ID
function generateRoomId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let roomId = '';
  for (let i = 0; i < 8; i++) {
    roomId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return roomId;
}

// Function to create a room in Firebase and add its details (including expiration time)
function createRoomInDatabase(roomId, roomDuration) {
  const roomRef = ref(database, 'rooms/' + roomId);
  set(roomRef, {
    roomId: roomId,
    duration: roomDuration,
    createdAt: Date.now()
  }).then(() => {
    console.log("Room created successfully");
  }).catch((error) => {
    console.error("Error creating room:", error);
  });
}

// Function to check and delete expired rooms
function checkAndDeleteExpiredRooms() {
  const roomsRef = ref(database, 'rooms/');
  get(roomsRef).then((snapshot) => {
    if (snapshot.exists()) {
      const rooms = snapshot.val();
      Object.keys(rooms).forEach(roomId => {
        const room = rooms[roomId];
        const roomCreationTime = room.createdAt;
        const roomDuration = room.duration;

        // Check if the room has expired
        if (Date.now() - roomCreationTime >= roomDuration * 60000) {
          // Room has expired, delete it from Firebase
          remove(ref(database, 'rooms/' + roomId));
        }
      });
    }
  });
}

// Call this function periodically (e.g., every minute)
setInterval(checkAndDeleteExpiredRooms, 60000); // Every minute

// Event listener to create a room when the "Create Room" button is clicked
document.getElementById("create-room").addEventListener("click", () => {
  const roomDuration = parseInt(document.getElementById("room-duration").value.trim()); // Get room duration (in minutes)

  if (roomDuration > 0) {
    const roomId = generateRoomId(); // Generate a random room ID
    createRoomInDatabase(roomId, roomDuration); // Store room details in Firebase
    createChatOverlay(roomId, roomDuration); // Call to create the overlay and start the chat
  } else {
    alert("Please enter a valid room duration.");
  }
});









// // Handle room creation when user clicks the "Create Room" button
// document.getElementById("create-room").addEventListener("click", () => {
//   const roomId = document.getElementById("room-id").value.trim();
  
//   if (roomId) {
//     // Example duration for the room (e.g., 30 minutes)
//     const roomDuration = 30; // In minutes

//     // Create the chat overlay and start the chat
//     createChatOverlay(roomId, roomDuration);
//   } else {
//     alert("Please enter a valid room ID.");
//   }
// });

// // Function to create the chat overlay dynamically
// function createChatOverlay(roomId, roomDuration) {
//   // Prevent creating multiple overlays
//   if (document.getElementById("chat-overlay")) return;

//   const overlay = document.createElement("div");
//   overlay.id = "chat-overlay";
//   overlay.className = "overlay";

//   overlay.innerHTML = `
//     <div id="chat-container">
//       <div id="room-header">
//         <h3 id="room-title">Room: ${roomId}</h3>
//         <div id="room-timer">Timer</div>
//         <button id="close-room-button">Close Room</button>
//       </div>
//       <div id="messages-container"></div>
//       <div id="message-controls">
//         <input id="message-input" type="text" placeholder="Type a message">
//         <button id="send-message">Send</button>
//         <button id="send-file">File</button>
//         <input type="file" id="file-input" style="display:none">
//       </div>
//     </div>
//   `;

//   document.body.appendChild(overlay);

//   // Initialize the chat functionality
//   initializeChat(roomId, roomDuration);

//   // Attach event listener to Close Room button
//   document.getElementById("close-room-button").addEventListener("click", () => {
//     overlay.remove();
//   });

//   // Attach event listener to Send Message button
//   document.getElementById("send-message").addEventListener("click", sendMessage);

//   // Attach event listener to Send File button
//   document.getElementById("send-file").addEventListener("click", () => {
//     document.getElementById("file-input").click(); // Trigger file input click
//   });
// }

// // Function to send message
// function sendMessage() {
//   const messageInput = document.getElementById("message-input");
//   const message = messageInput.value.trim();

//   if (message) {
//     const roomId = document.getElementById("room-title").textContent.split(":")[1].trim();
//     const messagesRef = ref(database, `rooms/${roomId}/messages`);

//     // Push the new message to Firebase
//     push(messagesRef, {
//       content: message,
//       type: "text",
//       sender: "Anonymous", // You can replace with real user details
//       timestamp: serverTimestamp(),
//     });

//     messageInput.value = ''; // Clear the input
//   }
// }
