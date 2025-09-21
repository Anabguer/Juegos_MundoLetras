import React, { useEffect, useState } from 'react';
import { useGameStore } from '../core/store';
import { CellState } from '../types';

const GameGrid: React.FC<{
  grid: CellState[][];
  selectedCells: Array<{ row: number; col: number }>;
  onCellClick: (row: number, col: number) => void;
}> = ({ grid, selectedCells, onCellClick }) => {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  
  const getCellClass = (row: number, col: number, cell: CellState) => {
    const classes = ['grid-cell'];
    
    const isSelected = selectedCells.some(c => c.row === row && c.col === col);
    if (isSelected) classes.push('selected');
    
    if (cell.isWordPart) classes.push('found');
    if (cell.isFoggy && !cell.revealed) classes.push('foggy');
    if (cell.isGhost) classes.push('ghost');
    
    return classes.join(' ');
  };

  const getCellContent = (cell: CellState) => {
    if (cell.isFoggy && !cell.revealed) return '?';
    if (cell.isGhost && !cell.revealed) return cell.ghostTimer && (Date.now() - cell.ghostTimer) % 800 > 400 ? '?' : cell.letter;
    return cell.letter;
  };

  return (
    <div 
      className="game-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        maxWidth: `min(90vw, ${cols * 45}px)`,
      }}
    >
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={getCellClass(rowIndex, colIndex, cell)}
            onClick={() => onCellClick(rowIndex, colIndex)}
            style={{ fontSize: cols > 8 ? '0.9rem' : '1.1rem' }}
          >
            {getCellContent(cell)}
          </div>
        ))
      )}
    </div>
  );
};

const GameHUD: React.FC<{
  score: number;
  streak: number;
  timeRemaining: number | null;
  errorsCount: number;
  maxErrors: number | null;
  lives: number;
  coins: number;
  boosters: Record<string, number>;
  onBoosterUse: (type: string) => void;
  onPause: () => void;
}> = ({ 
  score, 
  streak, 
  timeRemaining, 
  errorsCount, 
  maxErrors, 
  lives, 
  coins, 
  boosters,
  onBoosterUse,
  onPause 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-hud">
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
        <div className="hud-item">
          <span>⚡</span>
          <span className="hud-value">{score}</span>
        </div>
        
        <div className="hud-item">
          <span>🔥</span>
          <span className="hud-value">{streak}</span>
        </div>
        
        {timeRemaining !== null && (
          <div className="hud-item">
            <span>⏱️</span>
            <span className="hud-value" style={{ color: timeRemaining < 30 ? '#dc2626' : undefined }}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
        
        {maxErrors !== null && (
          <div className="hud-item">
            <span>❌</span>
            <span className="hud-value">{errorsCount}/{maxErrors}</span>
          </div>
        )}
        
        {timeRemaining !== null && (
          <div className="hud-item">
            <span>💖</span>
            <span className="hud-value">{lives}</span>
          </div>
        )}
        
        <div className="hud-item">
          <span>💰</span>
          <span className="hud-value">{coins}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* Boosters */}
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onBoosterUse('pista')}
          disabled={boosters.pista <= 0 && coins < 10}
          title="Pista (10 monedas)"
        >
          💡 {boosters.pista}
        </button>
        
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onBoosterUse('revelar_letra')}
          disabled={boosters.revelar_letra <= 0 && coins < 15}
          title="Revelar letra (15 monedas)"
        >
          🔍 {boosters.revelar_letra}
        </button>
        
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onBoosterUse('quitar_niebla')}
          disabled={boosters.quitar_niebla <= 0 && coins < 20}
          title="Quitar niebla (20 monedas)"
        >
          🌪️ {boosters.quitar_niebla}
        </button>

        <button
          className="btn btn-sm btn-secondary"
          onClick={onPause}
        >
          ⏸️
        </button>
      </div>
    </div>
  );
};

const WordsList: React.FC<{
  remainingWords: string[];
  foundWords: Array<{ word: string; isMetaWord: boolean }>;
}> = ({ remainingWords, foundWords }) => {
  const allWords = [
    ...remainingWords.map(word => ({ word, found: false, isMetaWord: false })),
    ...foundWords.map(({ word, isMetaWord }) => ({ word, found: true, isMetaWord }))
  ].sort((a, b) => a.word.localeCompare(b.word));

  return (
    <div className="words-list">
      {allWords.map(({ word, found, isMetaWord }) => (
        <span 
          key={word}
          className={`word-item ${found ? 'found' : ''} ${isMetaWord ? 'meta' : ''}`}
        >
          {word}
        </span>
      ))}
    </div>
  );
};

export default function Juego() {
  const {
    currentLevel,
    grid,
    gameState,
    selectedCells,
    remainingWords,
    foundWords,
    score,
    streak,
    errorsCount,
    lives,
    timeRemaining,
    coins,
    boosters,
    selectCell,
    clearSelection,
    submitSelection,
    useBooster,
    startGame,
    pauseGame,
    resumeGame,
    tick,
    restartLevel,
    nextLevel
  } = useGameStore();

  const [isPaused, setIsPaused] = useState(false);

  // Timer effect
  useEffect(() => {
    if (gameState === 'RUNNING' && timeRemaining !== null) {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState, timeRemaining, tick]);

  // Auto-start cuando se carga el nivel
  useEffect(() => {
    if (gameState === 'READY') {
      startGame();
    }
  }, [gameState, startGame]);

  const handleCellClick = (row: number, col: number) => {
    selectCell(row, col);
  };

  const handleSubmit = () => {
    submitSelection();
  };

  const handleClear = () => {
    clearSelection();
  };

  const handlePause = () => {
    if (gameState === 'RUNNING') {
      pauseGame();
      setIsPaused(true);
    } else if (gameState === 'PAUSED') {
      resumeGame();
      setIsPaused(false);
    }
  };

  const handleBoosterUse = (type: string) => {
    useBooster(type as any);
  };

  if (!currentLevel) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Cargando nivel...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'COMPLETE_WIN' || gameState === 'COMPLETE_LOSE') {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {gameState === 'COMPLETE_WIN' ? '🎉' : '😔'}
          </div>
          
          <h2 style={{ marginBottom: '1rem' }}>
            {gameState === 'COMPLETE_WIN' ? '¡Nivel Completado!' : 'Nivel Fallido'}
          </h2>
          
          {gameState === 'COMPLETE_WIN' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="hud-item" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
                <span>Puntuación:</span>
                <span className="hud-value">{score}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                {[1, 2, 3].map(star => (
                  <span key={star} style={{ fontSize: '1.5rem', color: '#fbbf24' }}>
                    ⭐
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary"
              onClick={restartLevel}
            >
              🔄 Reintentar
            </button>
            
            {gameState === 'COMPLETE_WIN' && (
              <button 
                className="btn btn-primary"
                onClick={nextLevel}
              >
                ➡️ Siguiente
              </button>
            )}
            
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.hash = '#/map'}
            >
              🗺️ Mapa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      {/* Overlay de pausa */}
      {isPaused && (
        <div className="modal-overlay" onClick={handlePause}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Juego Pausado</h3>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p>Toca para continuar</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handlePause}>
                ▶️ Continuar
              </button>
              <button className="btn btn-secondary" onClick={() => window.location.hash = '#/map'}>
                🗺️ Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUD */}
      <GameHUD
        score={score}
        streak={streak}
        timeRemaining={timeRemaining}
        errorsCount={errorsCount}
        maxErrors={currentLevel.erroresMax}
        lives={lives}
        coins={coins}
        boosters={boosters}
        onBoosterUse={handleBoosterUse}
        onPause={handlePause}
      />

      {/* Grid principal */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <GameGrid
          grid={grid}
          selectedCells={selectedCells}
          onCellClick={handleCellClick}
        />
      </main>

      {/* Controles de selección */}
      <div style={{ padding: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button 
          className="btn btn-secondary"
          onClick={handleClear}
          disabled={selectedCells.length === 0}
        >
          🚫 Limpiar
        </button>
        
        <button 
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={selectedCells.length < 2}
        >
          ✅ Confirmar
        </button>
      </div>

      {/* Lista de palabras */}
      <WordsList
        remainingWords={remainingWords}
        foundWords={foundWords}
      />
    </div>
  );
}
