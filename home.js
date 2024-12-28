import { ref, get, remove, set, update } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { database } from "./firebase.js";

// Reference to the rooms in Firebase
const roomsRef = ref(database, "rooms");

// Reference to the element that will show the active room count
const roomCountElement = document.getElementById("room-count");

// Function to count active rooms and delete inactive ones
const countAndDeleteInactiveRooms = async () => {
  try {
    const snapshot = await get(roomsRef);
    if (snapshot.exists()) {
      let activeRoomCount = 0;
      snapshot.forEach((roomSnapshot) => {
        const room = roomSnapshot.val();
        const roomId = roomSnapshot.key;
        
        if (room.Inactive) {
          // If the room is inactive, delete it
          remove(ref(database, `rooms/${roomId}`))
            .then(() => {
              console.log(`Room ${roomId} has been deleted as it is inactive.`);
            })
            .catch((error) => {
              console.error("Error deleting room:", error);
            });         
        }
      });
      roomCountElement.textContent = activeRoomCount;
    } else {
      roomCountElement.textContent = 0;
    }
  } catch (error) {
    console.error("Error fetching rooms:", error);
    roomCountElement.textContent = "Error";
  }
};

// Call the function to update room count and delete inactive rooms on page load
countAndDeleteInactiveRooms();

// Set an interval to periodically check for inactive rooms and delete them
setInterval(countAndDeleteInactiveRooms, 30000); // Updates every 30 seconds

const createRoomButton = document.getElementById("create-room");

createRoomButton.addEventListener("click", () => {
  const roomId = generateRoomId();  // Generate a unique room ID (you can customize this logic)
  const roomDuration = prompt("Enter room duration (in minutes):");

  // Reference to Firebase database for the new room
  const roomRef = ref(database, `rooms/${roomId}`);
  
  // Create room data
  const roomData = {
    createdAt: Date.now(), // Store the room's creation time
    duration: parseInt(roomDuration) * 60 * 1000, // Convert to milliseconds
    active: true, // Room is active by default
  };

  // Push new room data into Firebase
  set(roomRef, roomData).then(() => {
    alert(`Room created! Room ID: ${roomId}`);

    // Redirect to the dynamic chat page with the roomId and duration as URL parameters
    window.location.href = `/chat.html?room=${roomId}&duration=${roomDuration}`;
  }).catch(error => {
    console.error("Error creating room:", error);
    alert("Failed to create room. Please try again.");
  });
});

// Generate a random room ID
function generateRoomId() {
  return 'room-' + Math.random().toString(36).substr(2, 9);
}
  
document.getElementById("join-room").addEventListener("click", () => {
  const roomId = document.getElementById("join-room-input").value.trim();
  if (roomId) {
    window.location.href = `chat.html?room=${roomId}`;
  } else {
    alert("Please enter a valid room ID.");
  }
});
