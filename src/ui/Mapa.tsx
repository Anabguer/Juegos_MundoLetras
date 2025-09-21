import React from 'react';
import { useUserStore, useGameStore } from '../core/store';
import { LEVEL_SEEDS, generateSeed } from '../data/seeds';
import { TEMAS_CONFIG } from '../config';

interface LevelNodeProps {
  levelId: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  stars: number;
  tema: string;
  onClick: () => void;
}

const LevelNode: React.FC<LevelNodeProps> = ({
  levelId,
  isUnlocked,
  isCompleted,
  stars,
  tema,
  onClick
}) => {
  const temaConfig = TEMAS_CONFIG[tema as keyof typeof TEMAS_CONFIG] || TEMAS_CONFIG.oceano;
  
  const nodeClass = [
    'level-node',
    isCompleted ? 'completed' : '',
    !isUnlocked ? 'locked' : '',
    levelId % 10 === 0 ? 'checkpoint' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={nodeClass}
      onClick={isUnlocked ? onClick : undefined}
      style={{
        borderColor: isCompleted ? '#16a34a' : isUnlocked ? temaConfig.color : undefined
      }}
    >
      <div className="level-number">{levelId}</div>
      <div className="level-theme" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
        {temaConfig.emoji}
      </div>
      {isCompleted && (
        <div className="level-stars">
          {[1, 2, 3].map(star => (
            <span 
              key={star} 
              className={`star ${star <= stars ? '' : 'empty'}`}
            >
              ⭐
            </span>
          ))}
        </div>
      )}
      {levelId % 10 === 0 && (
        <div style={{ 
          position: 'absolute', 
          top: -8, 
          right: -8, 
          background: '#fbbf24', 
          borderRadius: '50%',
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px'
        }}>
          🏁
        </div>
      )}
    </div>
  );
};

export default function Mapa() {
  const { progress } = useUserStore();
  const { loadLevel } = useGameStore();
  
  const maxUnlockedLevel = progress?.nivel_max || 1;
  
  // Generar niveles dinámicamente
  const levels = [];
  for (let i = 1; i <= Math.min(100, maxUnlockedLevel + 5); i++) {
    const seedData = LEVEL_SEEDS.find(s => s.id === i);
    const tema = seedData?.tema || (i <= 20 ? 'oceano' : 'bosque');
    
    levels.push({
      id: i,
      tema,
      isUnlocked: i <= maxUnlockedLevel,
      isCompleted: i < maxUnlockedLevel,
      stars: i < maxUnlockedLevel ? Math.floor(Math.random() * 3) + 1 : 0 // TODO: Obtener estrellas reales
    });
  }

  const handleLevelClick = (levelId: number) => {
    loadLevel(levelId);
    // Navegar a la pantalla de juego
    window.location.hash = '#/game';
  };

  return (
    <div className="screen">
      <header style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
          🔤 Mundo Letras
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0.5rem 0 0' }}>
          Nivel máximo: {maxUnlockedLevel} | Monedas: {progress?.monedas || 0} 💰
        </p>
      </header>

      <main className="level-map">
        <div className="level-nodes">
          {levels.map(level => (
            <LevelNode
              key={level.id}
              levelId={level.id}
              isUnlocked={level.isUnlocked}
              isCompleted={level.isCompleted}
              stars={level.stars}
              tema={level.tema}
              onClick={() => handleLevelClick(level.id)}
            />
          ))}
          
          {/* Indicador de más niveles */}
          {maxUnlockedLevel < 1000 && (
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '1rem',
              border: '3px dashed #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              opacity: 0.5
            }}>
              ⋯
            </div>
          )}
        </div>
      </main>

      <footer style={{ padding: '1rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.hash = '#/ranking'}
          >
            🏆 Ranking
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.hash = '#/settings'}
          >
            ⚙️ Ajustes
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.hash = '#/profile'}
          >
            👤 Perfil
          </button>
        </div>
      </footer>
    </div>
  );
}
