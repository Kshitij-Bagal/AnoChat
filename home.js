document.getElementById("create-room").addEventListener("click", () => {
    // Generate a random room ID
    const roomId = Math.random().toString(36).substring(2, 10);
    window.location.href = `chat.html?room=${roomId}`;
  });
  
  document.getElementById("join-room").addEventListener("click", () => {
    const roomId = document.getElementById("join-room-input").value.trim();
    if (roomId) {
      window.location.href = `chat.html?room=${roomId}`;
    } else {
      alert("Please enter a valid room ID.");
    }
  });
  