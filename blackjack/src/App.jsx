import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = "https://sortalost.is-a.dev/bj_api";
const POLLING_INTERVAL = 2000;

const App = () => {
  // Game state
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState({ wins: 0, games: 0 });
  const [roomName, setRoomName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screen, setScreen] = useState('welcome');
  const [stats, setStats] = useState({ total: 0, in_game: 0, in_queue: 0 });

  // Card rendering
  const renderCard = (card) => {
    if (!card) return null;
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const suitSymbol = {
      'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠'
    }[suit] || suit;

    return (
      <div className="playing-card">
        <div className="card-top">{rank}</div>
        <div className="card-suit">{suitSymbol}</div>
        <div className="card-bottom">{rank}</div>
      </div>
    );
  };

  // API calls
  const fetchGameState = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/state`, {
        params: { room: roomName, player: playerId }
      });
      setGameState(response.data);
      
      if (response.data.status === 'finished') {
        handleGameOver(response.data.winner);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching game state');
    }
  }, [roomName, playerId]);

  const takeAction = async (action) => {
    try {
      setIsLoading(true);
      await axios.post(`${API_BASE}/action`, {
        room: roomName,
        player: playerId,
        move: action
      });
      await fetchGameState();
    } catch (err) {
      setError(err.response?.data?.error || 'Error taking action');
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE}/create_room`, {
        room: roomName,
        name: playerName
      });
      
      if (response.status === 200) {
        setPlayerId('p1');
        setScreen('waiting');
        startPolling();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating room');
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE}/join_room`, {
        room: roomName,
        name: playerName
      });
      
      if (response.status === 200) {
        setPlayerId('p2');
        setScreen('game');
        startPolling();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error joining room');
      setIsLoading(false);
    }
  };

  const playRandom = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE}/random_match`, {
        name: playerName
      });
      
      if (response.data.room) {
        setRoomName(response.data.room);
        setPlayerId(response.data.player);
        setScreen('game');
        startPolling();
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error finding random match');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleGameOver = (winner) => {
    setScore(prev => ({
      games: prev.games + 1,
      wins: winner === playerId ? prev.wins + 1 : prev.wins
    }));
    setScreen('game-over');
  };

  const resetGame = () => {
    setGameState(null);
    setRoomName('');
    setPlayerId('');
    setScreen('menu');
  };

  // Polling effect
  useEffect(() => {
    let intervalId;
    
    if (screen === 'game' || screen === 'waiting') {
      intervalId = setInterval(fetchGameState, POLLING_INTERVAL);
    }

    return () => clearInterval(intervalId);
  }, [screen, fetchGameState]);

  // Initial stats load
  useEffect(() => {
    fetchStats();
  }, []);

  const startPolling = () => {
    fetchGameState();
  };

  // Screens
  const renderWelcomeScreen = () => (
    <div className="screen welcome-screen">
      <h1 className="game-title">♠ BLACKJACK ♣</h1>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="form-input"
        />
        <button
          onClick={() => {
            if (playerName.trim()) {
              setScreen('menu');
              fetchStats();
            }
          }}
          className="btn btn-primary"
          disabled={!playerName.trim()}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderMenuScreen = () => (
    <div className="screen menu-screen">
      <h1 className="game-title">♠ BLACKJACK ♣</h1>
      <div className="player-info">
        <p>Welcome, <span className="highlight">{playerName}</span>!</p>
        <p>Your score: <span className="highlight">{score.wins}</span> wins of <span className="highlight">{score.games}</span> games</p>
      </div>
      
      <div className="stats">
        <p>Online players: <span className="highlight">{stats.total}</span></p>
        <p>In game: <span className="highlight">{stats.in_game}</span></p>
        <p>Waiting: <span className="highlight">{stats.in_queue}</span></p>
      </div>
      
      <div className="menu-options">
        <button onClick={() => playRandom()} className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Random Match'}
        </button>
        
        <div className="room-options">
          <input
            type="text"
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="form-input"
          />
          <div className="button-group">
            <button onClick={createRoom} className="btn btn-secondary" disabled={!roomName.trim()}>
              Create Room
            </button>
            <button onClick={joinRoom} className="btn btn-secondary" disabled={!roomName.trim()}>
              Join Room
            </button>
          </div>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );

  const renderWaitingScreen = () => (
    <div className="screen waiting-screen">
      <h2>Room: <span className="highlight">{roomName}</span></h2>
      <p>Waiting for opponent to join...</p>
      <div className="loading-animation"></div>
      <button onClick={resetGame} className="btn btn-secondary">
        Cancel
      </button>
    </div>
  );

  const renderGameScreen = () => (
    <div className="screen game-screen">
      <div className="game-header">
        <h2>{playerName} vs {gameState?.opponent_name || 'Opponent'}</h2>
        <p>Score: {score.wins}/{score.games}</p>
      </div>
      
      {gameState?.status === 'finished' ? (
        <div className="game-over-section">
          <h3 className={gameState.winner === playerId ? 'text-success' : 'text-danger'}>
            {gameState.winner === playerId ? 'YOU WIN!' : gameState.winner === 'draw' ? 'PUSH (Draw)' : 'YOU LOSE'}
          </h3>
          <button onClick={resetGame} className="btn btn-primary">
            Return to Menu
          </button>
        </div>
      ) : (
        <>
          <div className="hand-display">
            <h3>Your Hand (Value: {gameState?.your_value || '?'})</h3>
            <div className="cards-container">
              {gameState?.your_hand.map((card, index) => (
                <React.Fragment key={index}>
                  {renderCard(card)}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {gameState?.turn === playerId ? (
            <div className="action-buttons">
              <button onClick={() => takeAction('hit')} className="btn btn-primary" disabled={isLoading}>
                Hit
              </button>
              <button onClick={() => takeAction('stand')} className="btn btn-secondary" disabled={isLoading}>
                Stand
              </button>
            </div>
          ) : (
            <p className="waiting-text">Waiting for opponent's move...</p>
          )}
        </>
      )}
    </div>
  );

  // Main render
  return (
    <div className="app-container">
      {screen === 'welcome' && renderWelcomeScreen()}
      {screen === 'menu' && renderMenuScreen()}
      {screen === 'waiting' && renderWaitingScreen()}
      {screen === 'game' && renderGameScreen()}
      {screen === 'game-over' && renderGameScreen()}
      
      {isLoading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
    </div>
  );
};

export default App;
