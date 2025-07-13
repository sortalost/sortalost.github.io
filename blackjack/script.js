const baseUrl = '/bj_api';
let roomId = '';
let playerId = '';

document.getElementById('createRoomButton').addEventListener('click', createRoom);
document.getElementById('joinRoomButton').addEventListener('click', joinRoom);
document.getElementById('randomMatchButton').addEventListener('click', randomMatch);
document.getElementById('hitButton').addEventListener('click', () => playerAction('hit'));
document.getElementById('standButton').addEventListener('click', () => playerAction('stand'));

function showGameArea() {
    document.getElementById('gameArea').classList.remove('hidden');
    document.getElementById('roomArea').classList.add('hidden');
}

function createRoom() {
    const room = document.getElementById('roomInput').value;
    const name = document.getElementById('nameInput').value;

    fetch(`${baseUrl}/create_room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, name })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            roomId = room;
            playerId = 'p1';
            showGameArea();
            updateGameState();
        } else {
            alert(data.error);
        }
    });
}

function joinRoom() {
    const room = document.getElementById('roomInput').value;
    const name = document.getElementById('nameInput').value;

    fetch(`${baseUrl}/join_room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, name })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            roomId = room;
            playerId = 'p2';
            showGameArea();
            updateGameState();
        } else {
            alert(data.error);
        }
    });
}

function randomMatch() {
    const name = document.getElementById('nameInput').value;

    fetch(`${baseUrl}/random_match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    })
    .then(response => response.json())
    .then(data => {
        if (data.room) {
            roomId = data.room;
            playerId = data.player;
            showGameArea();
            updateGameState();
        } else {
            alert(data.status);
        }
    });
}

function playerAction(move) {
    fetch(`${baseUrl}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId, player: playerId, move })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            updateGameState();
        } else {
            alert(data.error);
        }
    });
}

function updateGameState() {
    fetch(`${baseUrl}/state?room=${roomId}&player=${playerId}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('status').innerText = `Status: ${data.status}`;
        document.getElementById('yourHand').innerText = `Your Hand: ${data.your_hand.join(', ')} (Value: ${data.your_value})`;
        document.getElementById('opponentHand').innerText = `Opponent's Hand: ${data.opponent_count} cards (Value: ${data.opponent_value})`;

        if (data.status === 'finished') {
            document.getElementById('status').innerText += ` - Winner: ${data.winner}`;
            document.getElementById('newGameButton').classList.remove('hidden');
        }
    });
}
