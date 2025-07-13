const API = "https://sortalost.is-a.dev/bj_api";
// let name = prompt("Enter your name") || "Player";
// document.getElementById("player-name").textContent = name;
let room = "", player = "";

function showGameUI() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
}

function goBackToMenu() {
  document.getElementById("game").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
}

function renderCards(hand) {
  return hand.map(c => `<div class='card'>${c}</div>`).join('');
}

function updateState() {
  fetch(`${API}/state?room=${room}&player=${player}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) return alert(data.error);
      document.getElementById("game-status").textContent =
        data.status === "finished"
          ? (data.winner === player ? "You Win!" : data.winner === "draw" ? "Draw!" : "You Lose!")
          : (data.turn === player ? "Your Turn" : "Opponent's Turn");

      document.getElementById("your-hand").innerHTML = renderCards(data.your_hand);
      document.getElementById("opponent-info").textContent =
        data.status === "finished" ? "Opponent Hand: " + data.opponent_hand.join(", ") : `${data.opponent_count} cards`;

      document.getElementById("actions").style.display =
        data.status === "playing" && data.turn === player ? "block" : "none";

      if (data.status !== "finished") setTimeout(updateState, 2000);
    });
}

function makeMove(move) {
  fetch(`${API}/action`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room, player, move })
  }).then(updateState);
}

function createRoom() {
  room = prompt("Room name?");
  player = "p1";
  fetch(`${API}/create_room`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room, name })
  }).then(() => {
    showGameUI();
    waitForOpponent();
  });
}

function joinRoom() {
  room = prompt("Room name?");
  player = "p2";
  fetch(`${API}/join_room`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room, name })
  }).then(() => {
    showGameUI();
    updateState();
  });
}

function waitForOpponent() {
  const poll = () => {
    fetch(`${API}/state?room=${room}&player=p1`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "playing") updateState();
        else setTimeout(poll, 2000);
      });
  };
  poll();
}

function randomMatch() {
  fetch(`${API}/random_match`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(res => res.json())
    .then(data => {
      if (data.error) return alert(data.error);
      room = data.room;
      player = data.player;
      showGameUI();
      updateState();
    });
}
