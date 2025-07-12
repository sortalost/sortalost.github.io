import React, { useEffect, useState } from "react";
import "./App.css";

const API = "https://sortalost.is-a.dev/bj_api";

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [player, setPlayer] = useState("");
  const [room, setRoom] = useState("");
  const [gameState, setGameState] = useState(null);
  const [turn, setTurn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState({ wins: 0, games: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      if (room && player) fetchState();
    }, 2000);
    return () => clearInterval(interval);
  }, [room, player]);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API}/state?room=${room}&player=${player}`);
      const data = await res.json();
      setGameState(data);
      setTurn(data.turn === player);
    } catch (err) {
      setError("Failed to fetch game state.");
    }
  };

  const startGame = async () => {
    if (!playerName) return setError("Enter your name");
    const roomName = prompt("Enter room name");
    if (!roomName) return;
    setLoading(true);
    const res = await fetch(`${API}/create_room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: roomName, name: playerName }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setRoom(roomName);
      setPlayer("p1");
    } else {
      setError(data.error);
    }
  };

  const joinGame = async () => {
    if (!playerName) return setError("Enter your name");
    const roomName = prompt("Enter room name");
    if (!roomName) return;
    setLoading(true);
    const res = await fetch(`${API}/join_room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: roomName, name: playerName }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setRoom(roomName);
      setPlayer("p2");
    } else {
      setError(data.error);
    }
  };

  const sendAction = async (move) => {
    await fetch(`${API}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, player, move }),
    });
    fetchState();
  };

  const renderCards = (cards) => {
    return cards.map((card, idx) => (
      <div className="card" key={idx}>
        {card}
      </div>
    ));
  };

  const resetGame = () => {
    setRoom("");
    setPlayer("");
    setGameState(null);
    setError("");
  };

  const handleGameOver = () => {
    const win = gameState.winner;
    const newScore = { ...score, games: score.games + 1 };
    if (win === player) newScore.wins += 1;
    setScore(newScore);
  };

  useEffect(() => {
    if (gameState?.status === "finished") {
      handleGameOver();
    }
  }, [gameState?.status]);

  return (
    <div className="container">
      <h1>🃏 Online Blackjack</h1>

      {!room && (
        <div className="menu">
          <input
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button onClick={startGame} disabled={loading}>Create Room</button>
          <button onClick={joinGame} disabled={loading}>Join Room</button>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {room && gameState && (
        <div className="game">
          <div className="names">
            {gameState.your_name} vs {gameState.opponent_name}
          </div>
          <div className="score">
            Score: {score.wins}/{score.games}
          </div>

          <div className="hand">
            <h3>Your Hand ({gameState.your_value})</h3>
            <div className="cards">{renderCards(gameState.your_hand)}</div>
          </div>

          {gameState.status === "finished" && (
            <div className="result">
              <p>
                {gameState.winner === player
                  ? "You win!"
                  : gameState.winner === "draw"
                  ? "Push (Draw)"
                  : "You lose."}
              </p>
              <h4>Opponent's Hand ({gameState.opponent_value})</h4>
              <div className="cards">
                {renderCards(gameState.opponent_hand)}
              </div>
              <button onClick={resetGame}>Back to Menu</button>
            </div>
          )}

          {gameState.status === "playing" && (
            <div className="actions">
              {turn ? (
                <>
                  <button onClick={() => sendAction("hit")}>Hit</button>
                  <button onClick={() => sendAction("stand")}>Stand</button>
                </>
              ) : (
                <p>Waiting for opponent...</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
