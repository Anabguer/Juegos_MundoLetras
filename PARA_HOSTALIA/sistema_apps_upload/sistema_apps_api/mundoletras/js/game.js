// ConfiguraciÃ³n del juego
const CONFIG = {
    API_BASE_URL: 'https://colisan.com/sistema_apps_upload/sistema_apps_api/mundoletras/',
    GRID_SIZE: 6,
    MAX_ERRORS: 10
};

// Estado del juego
let gameState = {
    currentUser: null,
    currentLevel: 1,
    score: 0,
    streak: 0,
    coins: 50,
    selectedCells: [],
    foundWords: [],
    currentGrid: [],
    currentWords: ['MAR', 'ALGA', 'CORAL', 'PECES'],
    activeMechanics: [],
    originalGrid: [],
    revealedCells: [],
    hiddenWords: [],
    soundEnabled: true,
    wordTimers: {},
    dynamicTimer: null,
    dynamicTimerInterval: null,
    wordTimerInterval: null,
    levelExpired: false,
    failedAttempts: 0
};

// Funciones de navegaciÃ³n bÃ¡sicas
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
    }
}

function startAsGuest() {
    gameState.currentUser = {
        isGuest: true,
        name: 'Invitado',
        key: 'guest_' + Date.now()
    };
    
    showMessage('Â¡Bienvenido! Iniciando juego...', 'success');
    setTimeout(async () => {
        try {
            await initGame();
            showScreen('game-screen');
        } catch (error) {
            showMessage('Error iniciando el juego. Intenta de nuevo.', 'error');
        }
    }, 1500);
}

function backToMainMenu() {
    const loginContent = document.getElementById('login-content');
    loginContent.innerHTML = `
        <button class="btn btn-primary" onclick="startAsGuest()">
            ðŸ‘¤ Jugar como Invitado
        </button>
        <button class="btn btn-secondary" onclick="showLogin()">
            ðŸ” Identificarse
        </button>
    `;
}

function backToMenu() {
    if (gameState.currentUser && !gameState.currentUser.isGuest) {
        // Si estÃ¡ logueado, hacer logout
        logout();
    } else {
        // Si es invitado, volver al menÃº
        showScreen('login-screen');
    }
}

function logout() {
    gameState.currentUser = null;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.streak = 0;
    gameState.coins = 50;
    gameState.selectedCells = [];
    gameState.foundWords = [];
    
    showMessage('SesiÃ³n cerrada. Volviendo al menÃº...', 'success');
    setTimeout(() => {
        showScreen('login-screen');
    }, 1500);
}

// Funciones de mensajes
function showMessage(text, type = 'success') {
    const container = document.getElementById('message-container');
    container.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 3000);
}

// Funciones de sonido bÃ¡sicas
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundControl = document.getElementById('sound-control');
    if (gameState.soundEnabled) {
        soundControl.textContent = 'ðŸ”Š';
        soundControl.classList.remove('muted');
        playSound('toggle');
    } else {
        soundControl.textContent = 'ðŸ”‡';
        soundControl.classList.add('muted');
    }
}

function playSound(type) {
    if (!gameState.soundEnabled) return;
    
    try {
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const ctx = window.audioContext;
        
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        
        switch(type) {
            case 'word':
                const wordOscillator = ctx.createOscillator();
                const wordGain = ctx.createGain();
                wordOscillator.connect(wordGain);
                wordGain.connect(ctx.destination);
                wordOscillator.frequency.setValueAtTime(800, ctx.currentTime);
                wordOscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                wordGain.gain.setValueAtTime(0.1, ctx.currentTime);
                wordGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                wordOscillator.start(ctx.currentTime);
                wordOscillator.stop(ctx.currentTime + 0.3);
                break;
                
            case 'level':
                const levelOscillator = ctx.createOscillator();
                const levelGain = ctx.createGain();
                levelOscillator.connect(levelGain);
                levelGain.connect(ctx.destination);
                levelOscillator.frequency.setValueAtTime(523, ctx.currentTime);
                levelOscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
                levelOscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.4);
                levelGain.gain.setValueAtTime(0.15, ctx.currentTime);
                levelGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
                levelOscillator.start(ctx.currentTime);
                levelOscillator.stop(ctx.currentTime + 0.6);
                break;
                
            case 'coin':
                const coinOscillator = ctx.createOscillator();
                const coinGain = ctx.createGain();
                coinOscillator.connect(coinGain);
                coinGain.connect(ctx.destination);
                coinOscillator.frequency.setValueAtTime(1000, ctx.currentTime);
                coinOscillator.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
                coinGain.gain.setValueAtTime(0.1, ctx.currentTime);
                coinGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                coinOscillator.start(ctx.currentTime);
                coinOscillator.stop(ctx.currentTime + 0.2);
                break;
                
            case 'toggle':
                const toggleOscillator = ctx.createOscillator();
                const toggleGain = ctx.createGain();
                toggleOscillator.connect(toggleGain);
                toggleGain.connect(ctx.destination);
                toggleOscillator.frequency.setValueAtTime(400, ctx.currentTime);
                toggleGain.gain.setValueAtTime(0.05, ctx.currentTime);
                toggleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                toggleOscillator.start(ctx.currentTime);
                toggleOscillator.stop(ctx.currentTime + 0.1);
                break;
        }
    } catch (error) {
    }
}


