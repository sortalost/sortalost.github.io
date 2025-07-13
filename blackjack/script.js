const API_BASE_URL = "https://sortalost.is-a.dev/bj_api";
let roomName = "";
let playerId = "";
let playerName = "";

document.getElementById("createRoomBtn").addEventListener("click", createRoom);
document.getElementById("joinRoomBtn").addEventListener("click", joinRoom);
document.getElementById("randomMatchBtn").addEventListener("click", randomMatch);
document.getElementById("hitBtn").addEventListener("click", () => makeMove("hit"));
document.getElementById("standBtn").addEventListener("click", () => makeMove("stand"));

function showGame() {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
}

function hideGame() {
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("game").classList.add("hidden");
}

async function createRoom() {
    playerName = document.getElementById("playerName").value;
    roomName = prompt("Enter room name:");
    if (!roomName) return;

    const response = await fetch(`${API_BASE_URL}/create_room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, name: playerName })
    });

    if (response.ok) {
        playerId = "p1";
        showGame();
        document.getElementById("roomInfo").innerText = `Room: ${roomName} | You: ${playerName}`;
        pollGameState();
    } else {
        alert("Error creating room: " + (await response.json()).message);
    }
}

async function joinRoom() {
    playerName = document.getElementById("playerName").value;
    roomName = prompt("Enter room name:");
    if (!roomName) return;

    const response = await fetch(`${API_BASE_URL}/join_room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, name: playerName })
    });

    if (response.ok) {
        playerId = "p2";
        showGame();
        document.getElementById("roomInfo").innerText = `Room: ${roomName} | You: ${playerName}`;
        pollGameState();
    } else {
        alert("Error joining room: " + (await response.json()).message);
    }
}

async function randomMatch() {
    playerName = document.getElementById("playerName").value;

    const response = await fetch(`${API_BASE_URL}/random_match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName })
    });

    if (response.ok) {
        const data = await response.json();
        roomName = data.room;
        playerId = data.player;
        showGame();
        document.getElementById("roomInfo").innerText = `Room: ${roomName} | You: ${playerName}`;
        pollGameState();
    } else {
        alert("Error finding match: " + (await response.json()).message);
    }
}

async function makeMove(move) {
    const response = await fetch(`${API_BASE_URL}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, player: playerId, move: move })
    });

    if (response.ok) {
        pollGameState();
    } else {
        alert("Error making move: " + (await response.json()).message);
    }
}

async function pollGameState() {
    const response = await fetch(`${API_BASE_URL}/state?room=${roomName}&player=${playerId}`);
    const state = await response.json();

    document.getElementById("yourHand").innerText = `Your Hand: ${state.your_hand.join(", ")} (Value: ${state.your_value})`;
    document.getElementById("opponentHand").innerText = `Opponent Hand: ${state.opponent_count} cards (Value: ${state.opponent_value})`;
    document.getElementById("status").innerText = `Status: ${state.status}`;

    if (state.status === "finished") {
        const winner = state.winner === playerId ? "You win!" : state.winner === "draw" ? "It's a draw!" : "You lose!";
        alert(winner);
        hideGame();
    } else {
        setTimeout(pollGameState, 2000); // Poll every 2 seconds
    }
}
