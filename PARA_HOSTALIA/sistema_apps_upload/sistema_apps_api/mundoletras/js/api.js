// Función para cambiar entre pestañas
function switchTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Desactivar todos los botones de pestaña
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(tabName + '-tab').classList.add('active');
    document.getElementById('tab-' + tabName).classList.add('active');
}

function showLogin() {
    const loginContent = document.getElementById('login-content');
    loginContent.innerHTML = `
        <!-- Pestañas -->
        <div class="tabs-container">
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('login')" id="tab-login">
                    🔑 Iniciar Sesión
                </button>
                <button class="tab-btn" onclick="switchTab('register')" id="tab-register">
                    📝 Registro
                </button>
            </div>
        </div>
        
        <!-- Contenido de pestañas -->
        <div class="tab-content">
            <!-- Pestaña de Login -->
            <div id="login-tab" class="tab-panel active">
                <div style="text-align: left;">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email:</label>
                        <input type="email" id="login-email" placeholder="tu@email.com" 
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 0.5rem; font-size: 16px;">
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Contraseña:</label>
                        <input type="password" id="login-password" placeholder="••••••••"
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 0.5rem; font-size: 16px;">
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="doLogin()">
                    🔑 Iniciar Sesión
                </button>
            </div>
            
            <!-- Pestaña de Registro -->
            <div id="register-tab" class="tab-panel">
                <div style="text-align: left;">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Nombre:</label>
                        <input type="text" id="register-name" placeholder="Tu nombre completo" 
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 0.5rem; font-size: 16px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Nick:</label>
                        <input type="text" id="register-nick" placeholder="Tu nick único" 
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 0.5rem; font-size: 16px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email:</label>
                        <input type="email" id="register-email" placeholder="tu@email.com" 
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 0.5rem; font-size: 16px;">
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Contraseña:</label>
                        <input type="password" id="register-password" placeholder="••••••••"
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 0.5rem; font-size: 16px;">
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="doRegister()">
                    📝 Crear Cuenta
                </button>
            </div>
        </div>
        
        <button class="btn btn-secondary" onclick="backToMainMenu()">
            ← Volver
        </button>
    `;
}

function showVerification(email, password) {
    const loginContent = document.getElementById('login-content');
    loginContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📧</div>
            <p style="margin-bottom: 0.5rem;">Código enviado a:</p>
            <p style="font-weight: bold; color: #fbbf24;">${email}</p>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; text-align: center;">Código de Verificación:</label>
            <input type="text" id="verify-code" placeholder="123456" maxlength="6"
                   style="width: 100%; padding: 0.75rem; border: none; border-radius: 0.5rem; font-size: 18px; text-align: center; letter-spacing: 0.2em;">
        </div>
        
        <button class="btn btn-primary" onclick="doVerify('${email}', '${password}')">
            ✅ Verificar Código
        </button>
        
        <button class="btn btn-secondary" onclick="backToMainMenu()">
            ← Volver
        </button>
    `;
}

async function doLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    showMessage('Iniciando sesión...', 'success');
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + 'auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            gameState.currentUser = {
                isGuest: false,
                key: data.data.user.usuario_aplicacion_key,
                ...data.data.user
            };

            showMessage('¡Bienvenido de vuelta! Iniciando juego...', 'success');
            setTimeout(async () => {
                await initGame();
                showScreen('game-screen');
            }, 1500);
        } else {
            showMessage(data.message || 'Error en el login', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Intenta de nuevo.', 'error');
    }
}

async function doRegister() {
    const name = document.getElementById('register-name').value;
    const nick = document.getElementById('register-nick').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!name || !nick || !email || !password) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (nick.includes(' ')) {
        showMessage('El nick no puede contener espacios', 'error');
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showMessage('Por favor introduce un email válido', 'error');
        return;
    }
    
    showMessage('Creando cuenta...', 'success');
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + 'auth.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                action: 'register',
                email: email,
                password: password,
                nombre: name,
                nick: nick
            })
        });
        
        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            showMessage('Error en la respuesta del servidor. Intenta de nuevo.', 'error');
            return;
        }

        if (!response.ok) {
            const errorMsg = data.message || 'Error desconocido en el registro';
            console.error('❌ Error del servidor:', errorMsg);
            showMessage(errorMsg, 'error');
            
            setTimeout(() => {
                showRegister();
            }, 2000);
            return;
        }

        if (data.success) {
            showMessage('¡Cuenta creada! Revisa tu email para el código de verificación.', 'success');
            setTimeout(() => {
                showVerification(email, password);
            }, 2000);
        } else {
            const errorMsg = data.message || 'Error desconocido en el registro';
            console.error('❌ Error del servidor:', errorMsg);
            showMessage(errorMsg, 'error');
            
            setTimeout(() => {
                showRegister();
            }, 2000);
        }
    } catch (error) {
        console.error('❌ Error en registro:', error);
        let errorMessage = 'Error de conexión. Intenta de nuevo.';
        
        if (error.message.includes('HTTP 500')) {
            errorMessage = 'Error del servidor. Intenta más tarde.';
        } else if (error.message.includes('HTTP 400')) {
            errorMessage = 'Datos inválidos. Revisa los campos.';
        } else if (error.message.includes('HTTP 409')) {
            errorMessage = 'Conflicto de datos. Revisa la información.';
        }
        
        showMessage(errorMessage, 'error');
        
        setTimeout(() => {
            showRegister();
        }, 2000);
    }
}

async function doVerify(email, password) {
    const code = document.getElementById('verify-code').value;
    
    if (!code || code.length !== 6) {
        showMessage('Por favor introduce el código de 6 dígitos', 'error');
        return;
    }
    
    showMessage('Verificando código...', 'success');
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + 'auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'verify',
                code: code
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('¡Cuenta verificada! Iniciando sesión...', 'success');
            
            setTimeout(async () => {
                const loginResponse = await fetch(CONFIG.API_BASE_URL + 'auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'login',
                        email: email,
                        password: password
                    })
                });
                
                const loginData = await loginResponse.json();
                
                if (loginData.success) {
                    gameState.currentUser = {
                        isGuest: false,
                        key: loginData.data.user.usuario_aplicacion_key,
                        ...loginData.data.user
                    };

                    await initGame();
                    showScreen('game-screen');
                }
            }, 1500);
        } else {
            showMessage(data.message || 'Código incorrecto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Intenta de nuevo.', 'error');
    }
}
// Mostrar ranking
function showRanking() {
    console.log('ðŸ† Mostrando ranking...');
    
    // Crear overlay de ranking
    const overlay = document.createElement('div');
    overlay.className = 'ranking-overlay';
    overlay.innerHTML = `
        <div class="ranking-content">
            <div class="ranking-header">
                <h2 class="ranking-title">ðŸ† Ranking Global</h2>
                <button class="ranking-close" onclick="closeRanking()">&times;</button>
            </div>
            <div class="ranking-list" id="ranking-list">
                <div class="ranking-loading">Cargando ranking...</div>
            </div>
            <div class="ranking-controls">
                <button class="ranking-btn" onclick="loadFullRanking()">Ver Top 50</button>
                <button class="ranking-btn" onclick="scrollToUserPosition()">Mi Posición</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Cargar ranking del usuario actual
    loadRanking();
}

// Cerrar ranking
function closeRanking() {
    const overlay = document.querySelector('.ranking-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Cargar ranking
async function loadRanking() {
    try {
        if (!gameState.currentUser || gameState.currentUser.isGuest) {
            document.getElementById('ranking-list').innerHTML = `
                <div class="ranking-error">
                    <p>ðŸ‘¤ Solo usuarios registrados pueden ver el ranking</p>
                    <p>RegÃ­strate para competir con otros jugadores</p>
                </div>
            `;
            return;
        }
        
        console.log('ðŸ” Cargando ranking para:', gameState.currentUser.usuario_aplicacion_key);
        
        // Cargar contexto del usuario
        const userContext = await loadUserContext();
        if (!userContext.success) {
            throw new Error(userContext.message);
        }
        
        // Usar datos del contexto del usuario (incluye ranking con posición)
        const rankingResponse = await fetch(CONFIG.API_BASE_URL + 'ranking.php?action=full', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!rankingResponse.ok) {
            throw new Error(`HTTP ${rankingResponse.status}`);
        }
        
        const rankingData = await rankingResponse.json();
        console.log('ðŸ† Ranking cargado:', rankingData);
        
        if (rankingData.success) {
            // Pasar el usuario actual como contexto para la comparación
            const userContextForDisplay = {
                usuario_aplicacion_key: gameState.currentUser.usuario_aplicacion_key
            };
            displayRanking(rankingData.data, userContextForDisplay);
            // Actualizar controles para mostrar botones normales
            updateRankingControls(false);
        } else {
            throw new Error(rankingData.message);
        }
        
    } catch (error) {
        console.error('âŒ Error cargando ranking:', error);
        showRankingError(error.message);
    }
}

// Mostrar ranking
function displayRanking(ranking, userContext) {
    const list = document.getElementById('ranking-list');
    list.innerHTML = '';
    
    if (!ranking || ranking.length === 0) {
        list.innerHTML = '<div class="ranking-error">No hay datos de ranking disponibles</div>';
        return;
    }
    
    ranking.forEach((player, index) => {
        const item = createRankingItem(player, index + 1, userContext);
        list.appendChild(item);
    });
}

// Crear elemento de ranking
function createRankingItem(player, position, userContext) {
    const item = document.createElement('div');
    item.className = 'ranking-item';
    
    // Resaltar usuario actual
    console.log('🔍 Comparando usuario:', {
        playerKey: player.usuario_aplicacion_key,
        userContextKey: userContext?.usuario_aplicacion_key,
        match: userContext && player.usuario_aplicacion_key === userContext.usuario_aplicacion_key
    });
    
    if (userContext && player.usuario_aplicacion_key === userContext.usuario_aplicacion_key) {
        item.classList.add('current-user');
        console.log('✅ Usuario actual marcado:', player.nick || player.nombre);
    }
    
    // Icono de posiciÃ³n
    let positionIcon = position;
    if (position === 1) positionIcon = 'ðŸ¥‡';
    else if (position === 2) positionIcon = 'ðŸ¥ˆ';
    else if (position === 3) positionIcon = 'ðŸ¥‰';
    
    item.innerHTML = `
        <div class="ranking-position ${position <= 3 ? ['', 'gold', 'silver', 'bronze'][position] : ''}">${positionIcon}</div>
        <div class="ranking-player">
            <div class="ranking-name">${player.nick || player.nombre || 'Usuario'}</div>
            <div class="ranking-level">Nivel ${player.nivel_max || 1}</div>
        </div>
        <div class="ranking-stats">
            <div class="ranking-score">${player.puntuacion_total || 0} pts</div>
            <div class="ranking-date">${player.ultima_partida || 'N/A'}</div>
        </div>
    `;
    
    return item;
}

// Cargar ranking completo
async function loadFullRanking() {
    try {
        console.log('ðŸ” Cargando ranking completo...');
        
        const response = await fetch(CONFIG.API_BASE_URL + 'ranking.php?action=full', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('ðŸ” Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('ðŸ” Ranking completo data:', data);
        
        if (data.success) {
            // Pasar el usuario actual como contexto para la comparación
            const userContextForDisplay = {
                usuario_aplicacion_key: gameState.currentUser.usuario_aplicacion_key
            };
            displayRanking(data.data, userContextForDisplay);
            // Actualizar controles para mostrar botón "Actualizar"
            updateRankingControls(true);
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('âŒ Error cargando ranking completo:', error);
        showRankingError(error.message);
    }
}

// Cargar contexto del usuario
async function loadUserContext() {
    try {
        console.log('ðŸ” Cargando contexto del usuario:', gameState.currentUser.usuario_aplicacion_key);
        
        const response = await fetch(CONFIG.API_BASE_URL + 'ranking.php?action=user_context&user_key=' + encodeURIComponent(gameState.currentUser.usuario_aplicacion_key), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('ðŸ” Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('ðŸ” Response data:', data);
        
        return data;
        
    } catch (error) {
        console.error('âŒ Error cargando contexto:', error);
        return { success: false, message: error.message };
    }
}

// Mostrar error de ranking
function showRankingError(message) {
    const list = document.getElementById('ranking-list');
    list.innerHTML = `
        <div class="ranking-error">
            <p>âŒ Error cargando ranking</p>
            <p>${message}</p>
        </div>
    `;
}

// Probar conexiÃ³n de ranking
async function testRankingConnection() {
    try {
        console.log('ðŸ” Probando conexiÃ³n de ranking...');
        
        const response = await fetch(CONFIG.API_BASE_URL + 'ranking.php?action=test_sql', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('ðŸ” Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('ðŸ” Response data:', data);
        
        if (data.success) {
            showMessage('âœ… ConexiÃ³n exitosa', 'success');
        } else {
            showMessage('âŒ Error: ' + data.message, 'error');
        }
        
    } catch (error) {
        console.error('âŒ Error probando conexiÃ³n:', error);
        showMessage('âŒ Error de conexiÃ³n: ' + error.message, 'error');
    }
}

// Scroll a la posición del usuario
function scrollToUserPosition() {
    const currentUser = document.querySelector('.ranking-item.current-user');
    if (currentUser) {
        currentUser.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        showMessage('📍 Mostrando tu posición en el ranking', 'success');
    } else {
        showMessage('❌ No se encontró tu posición en el ranking', 'error');
    }
}

// Actualizar controles del ranking
function updateRankingControls(isFullRanking = false) {
    const controls = document.querySelector('.ranking-controls');
    if (controls) {
        if (isFullRanking) {
            // Mostrar botón "Actualizar" cuando se muestra el ranking completo
            controls.innerHTML = `
                <button class="ranking-btn" onclick="loadRanking()">🔄 Actualizar</button>
                <button class="ranking-btn" onclick="scrollToUserPosition()">📍 Mi Posición</button>
            `;
        } else {
            // Mostrar botones normales cuando se muestra el ranking del usuario
            controls.innerHTML = `
                <button class="ranking-btn" onclick="loadFullRanking()">Ver Top 50</button>
                <button class="ranking-btn" onclick="scrollToUserPosition()">📍 Mi Posición</button>
            `;
        }
    }
}
