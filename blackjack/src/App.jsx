import React, { useState, useEffect } from 'react';
import './App.css';

const API = 'https://sortalost.is-a.dev/bj_api';

function App() {
  const [name, setName] = useState(localStorage.getItem('bj_name') || '');
  const [room, setRoom] = useState('');
  const [player, setPlayer] = useState('');
  const [status, setStatus] = useState('menu');
  const [game, setGame] = useState(null);
  const [score, setScore] = useState({ wins: 0, games: 0 });
  const [queueMsgShown, setQueueMsgShown] = useState(false);

  const joinRoom = async (asPlayer1) => {
    try {
      if (asPlayer1) {
        const res = await fetch(`${API}/create_room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room, name })
        });
        if (!res.ok) throw await res.json();
        setPlayer('p1');
      } else {
        const res = await fetch(`${API}/join_room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room, name })
        });
        if (!res.ok) throw await res.json();
        setPlayer('p2');
      }
      setStatus('game');
    } catch (err) {
      alert(err.error || 'Error joining room');
    }
  };

  const playWithRandom = async () => {
    setStatus('searching');
    while (true) {
      const res = await fetch(`${API}/random_match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.room) {
        setRoom(data.room);
        setPlayer(data.player);
        setStatus('game');
        return;
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  useEffect(() => {
    let interval;
    if (status === 'game') {
      interval = setInterval(async () => {
        const res = await fetch(`${API}/state?room=${room}&player=${player}`);
        const data = await res.json();
        setGame(data);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, room, player]);

  const makeMove = async (move) => {
    await fetch(`${API}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, player, move })
    });
  };

  if (status === 'menu') {
    return (
      <div className="App">
        <h1>🃏 Blackjack WAN</h1>
        <input placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Room Name" value={room} onChange={e => setRoom(e.target.value)} />
        <div className="button-row">
          <button onClick={() => {
            if (name.trim()) {
              localStorage.setItem('bj_name', name);
              joinRoom(true);
            }
          }}>Create Room</button>
          <button onClick={() => {
            if (name.trim()) {
              localStorage.setItem('bj_name', name);
              joinRoom(false);
            }
          }}>Join Room</button>
          <button onClick={() => {
            if (name.trim()) {
              localStorage.setItem('bj_name', name);
              playWithRandom();
            }
          }}>Play with Random</button>
        </div>
        <p className="score">Score: {score.wins}/{score.games}</p>
      </div>
    );
  }

  if (status === 'searching') {
    return (
      <div className="App">
        <h2>🔍 Waiting in queue for random match...</h2>
      </div>
    );
  }

  if (!game) return <div className="App">Loading game...</div>;

  return (
    <div className="App">
      <h2>{game.your_name} vs {game.opponent_name}</h2>
      <p>Score: {score.wins}/{score.games}</p>
      <p>Your hand: {game.your_hand.join(', ')} (value: {game.your_value})</p>
      {/* <p>Opponent cards: {game.opponent_count} {game.opponent_value !== undefined ? `(value: ${game.opponent_value})` : ''}</p> */}

      {game.status === 'finished' ? (
        <>
          <p>Opponent's hand: {game.opponent_hand.join(', ')}</p>
          <p>
            Result: {
              game.winner === player ? '🎉 You Win!' :
              game.winner === 'draw' ? '🤝 Draw' :
              '😞 You Lose'
            }
          </p>
          <button onClick={() => {
            setStatus('menu');
            setRoom('');
            setGame(null);
          }}>Return to Menu</button>
          {game.winner === player && setScore(s => ({ wins: s.wins + 1, games: s.games + 1 }))}
          {game.winner !== player && setScore(s => ({ ...s, games: s.games + 1 }))}
        </>
      ) : (
        game.turn === player ? (
          <>
            <button onClick={() => makeMove('hit')}>Hit</button>
            <button onClick={() => makeMove('stand')}>Stand</button>
          </>
        ) : <p>⏳ Waiting for opponent...</p>
      )}
    </div>
  );
}

export default App;
