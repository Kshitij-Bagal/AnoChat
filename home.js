
//home.js
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
function createRoomInDatabase(roomId, roomDuration, roomType, password = null) {
  const roomRef = ref(database, 'rooms/' + roomId);
  return set(roomRef, {
    roomId: roomId,
    duration: roomDuration,
    createdAt: Date.now(),
    type: roomType,
    password: roomType === "private" ? password : null
  });
}

// Function to check and delete expired rooms
function checkAndDeleteExpiredRooms() {
  const roomsRef = ref(database, 'rooms/');
  get(roomsRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const rooms = snapshot.val();
        Object.keys(rooms).forEach((roomId) => {
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
    })
    .catch((error) => console.error("Error checking rooms:", error));
}

// Call this function periodically (e.g., every minute)
setInterval(checkAndDeleteExpiredRooms, 60000); // Every minute
// Toggle fields based on room type
document.getElementById("room-type").addEventListener("change", (event) => {
  const roomType = event.target.value;
  if (roomType === "public") {
    document.getElementById("public-room-fields").style.display = "block";
    document.getElementById("private-room-fields").style.display = "none";
  } else if (roomType === "private") {
    document.getElementById("public-room-fields").style.display = "none";
    document.getElementById("private-room-fields").style.display = "block";
  }
});

// Event listener to create a room when the "Create Room" button is clicked
document.getElementById("create-room").addEventListener("click", (event) => {
  event.preventDefault(); // Prevent default form submission
  try {
    const roomType = document.getElementById("room-type").value;
    const roomDuration = parseInt(document.getElementById("room-duration").value.trim()); // Get room duration (in minutes)

    if (roomDuration > 0) {
      if (roomType === "public") {
        const publicRoomName = document.getElementById("public-room-name").value.trim();
        if (publicRoomName) {
          const roomRef = ref(database, `rooms/${publicRoomName}`);
          get(roomRef)
            .then((snapshot) => {
              if (snapshot.exists()) {
                alert("A public room with this name already exists. Please choose a different name.");
              } else {
                return createRoomInDatabase(publicRoomName, roomDuration, "public");
              }
            })
            .then(() => {
              createChatOverlay(publicRoomName, roomDuration); // Start the chat
            })
            .catch((error) => console.error("Error creating public room:", error));
        } else {
          alert("Please enter a valid room name.");
        }
      } else if (roomType === "private") {
        const roomId = generateRoomId(); // Generate a random room ID
        const password = document.getElementById("private-room-password").value.trim();
        if (password) {
          createRoomInDatabase(roomId, roomDuration, "private", password)
            .then(() => {
              createChatOverlay(roomId, roomDuration); // Start the chat
            })
            .catch((error) => console.error("Error creating private room:", error));
        } else {
          alert("Please enter a password for the private room.");
        }
      }
    } else {
      alert("Please enter a valid room duration.");
    }
  } catch (error) {
    console.error("Error creating room:", error);
  }
});

// Event listener to join a room when the "Join Room" button is clicked
document.getElementById("join-room-button").addEventListener("click", (event) => {
  event.preventDefault(); // Prevent default form submission
  const roomIdOrName = document.getElementById("join-room-id").value.trim();

  if (roomIdOrName) {
    const roomRef = ref(database, `rooms/${roomIdOrName}`);
    get(roomRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const room = snapshot.val();
          if (room.type === "private") {
            const password = prompt("This is a private room. Please enter the password:");
            if (password === room.password) {
              createChatOverlay(room.roomId, room.duration); // Join the private chat
            } else {
              alert("Incorrect password. Access denied.");
            }
          } else {
            createChatOverlay(room.roomId, room.duration); // Join the public chat
          }
        } else {
          alert("Room not found or has expired.");
        }
      })
      .catch((error) => console.error("Error joining room:", error));
  } else {
    alert("Please enter a valid Room ID or Name.");
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
