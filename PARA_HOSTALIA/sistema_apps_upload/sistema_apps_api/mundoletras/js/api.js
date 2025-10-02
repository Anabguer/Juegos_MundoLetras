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
    // Guardar la pantalla actual para poder regresar
    const currentActiveScreen = document.querySelector('.screen.active');
    if (currentActiveScreen) {
        gameState.previousScreen = currentActiveScreen.id;
    }
    const loginContent = document.getElementById('login-content');
    loginContent.innerHTML = `
        <!-- Pestañas -->
        <div class="tabs-container">
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('login')" id="tab-login">
                    Iniciar Sesión
                </button>
                <button class="tab-btn" onclick="switchTab('register')" id="tab-register">
                    Registro
                </button>
            </div>
        </div>
        
        <!-- Contenido de pestañas -->
        <div class="tab-content">
            <!-- Pestaña de Login -->
            <div id="login-tab" class="tab-panel active">
                <div style="text-align: left;">
                    <div class="form-field">
                        <label>Email:</label>
                        <input type="email" id="login-email" placeholder="tu@email.com">
                    </div>
                    <div class="form-field">
                        <label>Contraseña:</label>
                        <input type="password" id="login-password" placeholder="********************">
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="doLogin()" style="font-size: 1rem; padding: 1rem 1.5rem; width: auto; max-width: 280px; background: linear-gradient(145deg, #4ade80, #22c55e); border-radius: 20px; box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.2), -6px -6px 12px rgba(255, 255, 255, 0.1); border: none; color: white; font-weight: 600; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);">
                    ¡Empezar a Jugar!
                </button>
                
                <div style="text-align: center; margin-top: 1rem;">
                    <a href="#" onclick="showForgotPassword()" style="color: #fbbf24; text-decoration: none; font-size: 1rem;">
                        ¿He olvidado la contraseña?
                    </a>
                    <br>
                    <a href="#" onclick="clearSavedCredentials()" style="color: #ef4444; text-decoration: none; font-size: 1rem; margin-top: 0.5rem; display: inline-block;">
                        Borrar credenciales guardadas
                    </a>
                </div>
            </div>
            
            <!-- Pestaña de Registro -->
            <div id="register-tab" class="tab-panel">
                <div style="text-align: left;">
                    <div class="form-field">
                        <label>Nombre:</label>
                        <input type="text" id="register-name" placeholder="Tu nombre completo">
                    </div>
                    <div class="form-field">
                        <label>Nick:</label>
                        <input type="text" id="register-nick" placeholder="Tu nick único">
                    </div>
                    <div class="form-field">
                        <label>Email:</label>
                        <input type="email" id="register-email" placeholder="tu@email.com">
                    </div>
                    <div class="form-field">
                        <label>Contraseña:</label>
                        <input type="password" id="register-password" placeholder="************************">
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="doRegister()" style="font-size: 1rem; padding: 1rem 1.5rem; width: auto; max-width: 280px; background: linear-gradient(145deg, #a78bfa, #8b5cf6); border-radius: 20px; box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.2), -6px -6px 12px rgba(255, 255, 255, 0.1); border: none; color: white; font-weight: 600; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);">
                    ¡Crear mi Cuenta!
                </button>
            </div>
        </div>
        
        <button class="btn btn-secondary" onclick="backToMainMenu()" style="font-size: 0.9rem; padding: 0.8rem 1.2rem; width: auto; max-width: 220px; background: linear-gradient(145deg, #9ca3af, #6b7280); border-radius: 18px; box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.2), -4px -4px 8px rgba(255, 255, 255, 0.1); border: none; color: white; font-weight: 500; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);">
            Regresar al Inicio
        </button>
    `;
    
    // Cargar credenciales guardadas después de crear el HTML
    setTimeout(() => {
        loadSavedCredentials();
    }, 100);
}

function showForgotPassword() {
    // Verificar si ya existe el modal
    const existingModal = document.getElementById('forgot-password-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Crear modal de olvido de contraseña
    const modal = document.createElement('div');
    modal.id = 'forgot-password-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Recuperar Contraseña</h3>
                <button class="modal-close" onclick="closeForgotPasswordModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="text-align: center; margin-bottom: 1.5rem; color: #666;">
                    Introduce tu email y te enviaremos un código para cambiar tu contraseña
                </p>
                <div class="form-field">
                    <label>Email:</label>
                    <input type="email" id="forgot-email" placeholder="tu@email.com">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeForgotPasswordModal()">
                    Cancelar
                </button>
                <button class="btn btn-primary" onclick="sendPasswordReset()">
                    📧 Enviar Código
                </button>
            </div>
        </div>
    `;
    
    // Añadir el modal al final del body para asegurar que esté encima
    document.body.appendChild(modal);
    
    // Añadir listener para cerrar con ESC
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            closeForgotPasswordModal();
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
        modal.remove();
    }
}

async function sendPasswordReset() {
    const email = document.getElementById('forgot-email').value;
    
    if (!email) {
        showMessage('Por favor introduce tu email', 'error');
        return;
    }
    
    try {
        const response = await fetch('sistema_apps_api/mundoletras/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'forgot_password',
                email: email
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeForgotPasswordModal();
            showMessage('Código enviado. Revisa tu email.', 'success');
            // Mostrar formulario de cambio de contraseña
            showPasswordResetForm(email);
        } else {
            showMessage(data.message || 'Error enviando el código', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión. Intenta de nuevo.', 'error');
    }
}

function showPasswordResetForm(email) {
    const loginContent = document.getElementById('login-content');
    loginContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔐</div>
            <p style="margin-bottom: 0.5rem;">Código enviado a:</p>
            <p style="font-weight: bold; color: #fbbf24;">${email}</p>
        </div>
        
        <div class="form-field" style="margin-bottom: 1rem;">
            <label>Código de Verificación:</label>
            <input type="text" id="reset-code" placeholder="123456" maxlength="6"
                   style="font-size: 18px; text-align: center; letter-spacing: 0.2em;">
        </div>
        
        <div class="form-field" style="margin-bottom: 1rem;">
            <label>Nueva Contraseña:</label>
            <input type="password" id="new-password" placeholder="Nueva contraseña">
        </div>
        
        <div class="form-field" style="margin-bottom: 1.5rem;">
            <label>Confirmar Contraseña:</label>
            <input type="password" id="confirm-password" placeholder="Confirmar contraseña">
        </div>
        
        <button class="btn btn-primary" onclick="doPasswordReset('${email}')" style="font-size: 1rem; padding: 0.8rem 1.2rem; width: auto; max-width: 250px; background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3); border: 2px solid #fbbf24;">
            ¡Restablecer Contraseña!
        </button>
        
        <button class="btn btn-secondary" onclick="backToMainMenu()" style="font-size: 0.9rem; padding: 0.7rem 1rem; width: auto; max-width: 200px; background: linear-gradient(135deg, #6b7280, #4b5563); box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3); border: 2px solid #9ca3af;">
            Regresar al Inicio
        </button>
    `;
}

async function doPasswordReset(email) {
    const code = document.getElementById('reset-code').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!code || !newPassword || !confirmPassword) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        const response = await fetch('sistema_apps_api/mundoletras/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'reset_password',
                email: email,
                code: code,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            setTimeout(() => {
                backToMainMenu();
            }, 2000);
        } else {
            showMessage(data.message || 'Error cambiando la contraseña', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión. Intenta de nuevo.', 'error');
    }
}

function showVerification(email, password) {
    const loginContent = document.getElementById('login-content');
    loginContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📧</div>
            <p style="margin-bottom: 0.5rem;">Código enviado a:</p>
            <p style="font-weight: bold; color: #fbbf24;">${email}</p>
        </div>
        
        <div class="form-field" style="margin-bottom: 1.5rem;">
            <label style="text-align: center;">Código de Verificación:</label>
            <input type="text" id="verify-code" placeholder="123456" maxlength="6"
                   style="font-size: 18px; text-align: center; letter-spacing: 0.2em;">
        </div>
        
        <button class="btn btn-primary" onclick="doVerify('${email}', '${password}')" style="font-size: 1rem; padding: 0.8rem 1.2rem; width: auto; max-width: 250px; background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); border: 2px solid #34d399;">
            ¡Verificar y Jugar!
        </button>
        
        <button class="btn btn-secondary" onclick="backToMainMenu()" style="font-size: 0.9rem; padding: 0.7rem 1rem; width: auto; max-width: 200px; background: linear-gradient(135deg, #6b7280, #4b5563); box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3); border: 2px solid #9ca3af;">
            Regresar al Inicio
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

            // Siempre guardar las credenciales del usuario
            saveUserCredentials(email, password);

            setTimeout(async () => {
                await initGame();
                showScreen('game-screen');
            }, 1500);
        } else {
            showMessage(data.message || 'Error en el login', 'error');
        }
    } catch (error) {
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
            showMessage('Error en la respuesta del servidor. Intenta de nuevo.', 'error');
            return;
        }

        if (!response.ok) {
            const errorMsg = data.message || 'Error desconocido en el registro';
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
            showMessage(errorMsg, 'error');
            
            setTimeout(() => {
                showRegister();
            }, 2000);
        }
    } catch (error) {
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
        showMessage('Por favor introduce el código de 6 dí­gitos', 'error');
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
        showMessage('Error de conexión. Intenta de nuevo.', 'error');
    }
}
// Mostrar ranking
function showRanking() {
    
    // Crear overlay de ranking
    const overlay = document.createElement('div');
    overlay.className = 'ranking-overlay';
    overlay.innerHTML = `
        <div class="ranking-content">
            <div class="ranking-header">
                <h2 class="ranking-title">🥇 Ranking Global</h2>
                <button class="ranking-close" onclick="closeRanking()" title="Cerrar">&times;</button>
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

// Cargar ranking para usuarios guest
async function loadGuestRanking() {
    try {
        // Obtener ranking completo
        const response = await fetch(CONFIG.API_BASE_URL + 'ranking.php?action=full', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const rankingData = await response.json();
        
        if (rankingData.success) {
            const list = document.getElementById('ranking-list');
            
            // Solo limpiar si no hay información de guest
            if (!list.querySelector('.ranking-guest-info')) {
                list.innerHTML = '';
                
                // Crear información del usuario guest
                const guestInfo = document.createElement('div');
                guestInfo.className = 'ranking-guest-info';
                guestInfo.innerHTML = `
                    <div class="ranking-item guest-user">
                        <div class="ranking-position">👤</div>
                        <div class="ranking-player">
                            <div class="ranking-name">Invitado</div>
                            <div class="ranking-level">Nivel ${gameState.currentLevel || 1}</div>
                        </div>
                        <div class="ranking-stats">
                            <div class="ranking-score">${gameState.totalCoins || 50} 💰</div>
                        </div>
                    </div>
                `;
                list.appendChild(guestInfo);
                
                // Crear mensaje de registro
                const guestMessage = document.createElement('div');
                guestMessage.className = 'ranking-guest-message';
                guestMessage.innerHTML = `
                    <p>🔓 Para participar en el ranking y competir con otros jugadores</p>
                    <p>debes registrarte creando una cuenta</p>
                `;
                list.appendChild(guestMessage);
            } else {
                // Actualizar información del guest si ya existe
                const guestUser = list.querySelector('.ranking-item.guest-user');
                if (guestUser) {
                    const levelElement = guestUser.querySelector('.ranking-level');
                    const scoreElement = guestUser.querySelector('.ranking-score');
                    if (levelElement) levelElement.textContent = `Nivel ${gameState.currentLevel || 1}`;
                    if (scoreElement) scoreElement.textContent = `${gameState.totalCoins || 50} 💰`;
                }
            }
            
            // Mostrar el ranking de usuarios registrados
            displayRanking(rankingData.data, null);
            
            // Actualizar controles para guest
            updateRankingControlsForGuest();
        } else {
            throw new Error(rankingData.message);
        }
        
    } catch (error) {
        showRankingError(error.message);
    }
}

// Cargar ranking
async function loadRanking() {
    try {
        if (!gameState.currentUser || gameState.currentUser.isGuest) {
            await loadGuestRanking();
            return;
        }
        
        
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
        showRankingError(error.message);
    }
}

// Mostrar ranking
function displayRanking(ranking, userContext) {
    const list = document.getElementById('ranking-list');
    
    // Si no hay contexto de usuario (guest), limpiar solo los elementos de ranking
    if (!userContext) {
        // Eliminar solo los elementos de ranking existentes, mantener guest-info y guest-message
        const existingRankingItems = list.querySelectorAll('.ranking-item:not(.guest-user)');
        existingRankingItems.forEach(item => item.remove());
    } else {
        // Para usuarios registrados, limpiar todo
    list.innerHTML = '';
    }
    
    if (!ranking || ranking.length === 0) {
        if (!userContext) {
            // Para guest, no mostrar error si ya hay información de guest
            if (!list.querySelector('.ranking-guest-info')) {
                list.innerHTML = '<div class="ranking-error">No hay datos de ranking disponibles</div>';
            }
        } else {
        list.innerHTML = '<div class="ranking-error">No hay datos de ranking disponibles</div>';
        }
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
    if (userContext && player.usuario_aplicacion_key === userContext.usuario_aplicacion_key) {
        item.classList.add('current-user');
    }
    
    // Icono de posición
    let positionIcon = position;
    if (position === 1) positionIcon = '🥇';
    else if (position === 2) positionIcon = '🥈';
    else if (position === 3) positionIcon = '🥉';
    
    item.innerHTML = `
        <div class="ranking-position ${position <= 3 ? ['', 'oro', 'plata', 'bronce'][position] : ''}">${positionIcon}</div>
        <div class="ranking-player">
            <div class="ranking-name">${player.nick || player.nombre || 'Usuario'}</div>
            <div class="ranking-level">Nivel ${player.nivel_max || 1}</div>
        </div>
        <div class="ranking-stats">
            <div class="ranking-score">${player.monedas || 50} 💰</div>
        </div>
    `;
    
    return item;
}

// Cargar ranking completo
async function loadFullRanking() {
    try {
        
        const response = await fetch(CONFIG.API_BASE_URL + 'ranking.php?action=full', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Si es usuario guest, mantener la lógica de guest
            if (!gameState.currentUser || gameState.currentUser.isGuest) {
                // Para guest, solo mostrar el ranking completo sin cambiar controles
                displayRanking(data.data, null);
                // Mantener controles de guest
                updateRankingControlsForGuest();
            } else {
                // Para usuarios registrados, usar la lógica normal
            const userContextForDisplay = {
                usuario_aplicacion_key: gameState.currentUser.usuario_aplicacion_key
            };
            displayRanking(data.data, userContextForDisplay);
            // Actualizar controles para mostrar botón "Actualizar"
            updateRankingControls(true);
            }
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        showRankingError(error.message);
    }
}

// Cargar contexto del usuario
async function loadUserContext() {
    try {
        
        const response = await fetch(CONFIG.API_BASE_URL + 'ranking.php?action=user_context&user_key=' + encodeURIComponent(gameState.currentUser.usuario_aplicacion_key), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        return data;
        
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Mostrar error de ranking
function showRankingError(message) {
    const list = document.getElementById('ranking-list');
    list.innerHTML = `
        <div class="ranking-error">
            <p>Error cargando ranking</p>
            <p>${message}</p>
        </div>
    `;
}

// Probar conexiÃƒÂ³n de ranking
async function testRankingConnection() {
    try {
        
        const response = await fetch(CONFIG.API_BASE_URL + 'ranking.php?action=test_sql', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Conexión exitosa', 'success');
        } else {
            showMessage('Error: ' + data.message, 'error');
        }
        
    } catch (error) {
        showMessage('Error de conexión: ' + error.message, 'error');
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
        showMessage('Mostrando tu posición en el ranking', 'success');
    } else {
        showMessage('No se encontró tu posición en el ranking', 'error');
    }
}

// Actualizar controles del ranking para usuarios guest
function updateRankingControlsForGuest() {
    const controls = document.querySelector('.ranking-controls');
    if (controls) {
        controls.innerHTML = `
            <button class="ranking-btn" onclick="loadFullRanking()">Ver Top 50</button>
            <button class="ranking-btn" onclick="loadGuestRanking()">Actualizar</button>
        `;
    }
}

// Función para salir de la aplicación APK
function exitApp() {
    showExitModal();
}

// Mostrar modal personalizado para salir
function showExitModal() {
    const modal = document.createElement('div');
    modal.className = 'exit-modal-overlay';
    modal.innerHTML = `
        <div class="exit-modal">
            <div class="exit-modal-header">
                <h3>🚪 Salir de la aplicación</h3>
            </div>
            <div class="exit-modal-body">
                <p>¿Estás seguro de que quieres salir de Mundo Letras?</p>
            </div>
            <div class="exit-modal-footer">
                <button class="exit-btn-cancel" onclick="closeExitModal()" style="font-size: 0.9rem; padding: 0.7rem 1rem; width: auto; max-width: 180px; background: linear-gradient(135deg, #6b7280, #4b5563); box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3); border: 2px solid #9ca3af;">
                    Seguir Jugando
                </button>
                <button class="exit-btn-confirm" onclick="confirmExit()" style="font-size: 0.9rem; padding: 0.7rem 1rem; width: auto; max-width: 180px; background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); border: 2px solid #f87171;">
                    Salir del Juego
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar con ESC
    document.addEventListener('keydown', handleExitModalKeydown);
}

// Cerrar modal de salida
function closeExitModal() {
    const modal = document.querySelector('.exit-modal-overlay');
    if (modal) {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleExitModalKeydown);
    }
}

// Confirmar salida
function confirmExit() {
    closeExitModal();
    
    // Para aplicaciones APK (Android Studio nativo)
    if (window.Android && window.Android.exitApp) {
        // Android Studio nativo con JavaScript Interface
        window.Android.exitApp();
    } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        // Capacitor
        window.Capacitor.Plugins.App.exitApp();
    } else if (window.cordova && window.cordova.plugins && window.cordova.plugins.exitApp) {
        // Cordova
        window.cordova.plugins.exitApp();
    } else if (window.navigator && window.navigator.app && window.navigator.app.exitApp) {
        // PhoneGap
        window.navigator.app.exitApp();
    } else {
        // Fallback para navegador web - cerrar ventana
        if (window.close) {
            window.close();
        } else {
            // Si no se puede cerrar la ventana, mostrar mensaje
            alert('No se puede cerrar la aplicación desde el navegador. Usa el botón atrás del dispositivo.');
        }
    }
}

// Manejador de teclado para el modal de salida
function handleExitModalKeydown(event) {
    if (event.key === 'Escape') {
        closeExitModal();
    }
}

// Actualizar controles del ranking
function updateRankingControls(isFullRanking = false) {
    const controls = document.querySelector('.ranking-controls');
    if (controls) {
        if (isFullRanking) {
            // Mostrar botón "Actualizar" cuando se muestra el ranking completo
            controls.innerHTML = `
                <button class="ranking-btn" onclick="loadRanking()">Actualizar</button>
                <button class="ranking-btn" onclick="scrollToUserPosition()">Mi Posición</button>
            `;
        } else {
            // Mostrar botones normales cuando se muestra el ranking del usuario
            controls.innerHTML = `
                <button class="ranking-btn" onclick="loadFullRanking()">Ver Top 50</button>
                <button class="ranking-btn" onclick="scrollToUserPosition()">Mi Posición</button>
            `;
        }
    }
}

// Guardar credenciales del usuario
function saveUserCredentials(email, password) {
    const credentials = {
        email: email,
        password: password,
        timestamp: Date.now()
    };
    localStorage.setItem('mundo_letras_user_credentials', JSON.stringify(credentials));
}

// Cargar credenciales del usuario
function loadUserCredentials() {
    try {
        const saved = localStorage.getItem('mundo_letras_user_credentials');
        
        if (saved) {
            const credentials = JSON.parse(saved);
            
            // Verificar que los datos no sean muy antiguos (máximo 30 días)
            const daysSinceSave = (Date.now() - credentials.timestamp) / (1000 * 60 * 60 * 24);
            
            if (daysSinceSave > 30) {
                clearUserCredentials();
                return null;
            }
            
            return credentials;
        }
    } catch (error) {
        clearUserCredentials();
    }
    return null;
}

// Limpiar credenciales del usuario
function clearUserCredentials() {
    localStorage.removeItem('mundo_letras_user_credentials');
}

// Borrar credenciales guardadas
function clearSavedCredentials() {
    // Borrar credenciales directamente sin confirmación
    clearUserCredentials();
    
    
    // Limpiar los campos del formulario
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
}

// Cargar datos guardados al mostrar el login
function loadSavedCredentials() {
    const credentials = loadUserCredentials();
    
    if (credentials) {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        
        if (emailInput) {
            emailInput.value = credentials.email;
        }
        if (passwordInput) {
            passwordInput.value = credentials.password;
        }
    }
}

// Función inteligente para jugar
function smartPlay() {
    // Verificar si hay un usuario logueado en gameState
    if (gameState.currentUser && !gameState.currentUser.isGuest) {
        // Usuario logueado - ir directamente al juego
        setTimeout(async () => {
            try {
                await initGame();
                showScreen('game-screen');
            } catch (error) {
                // Error silencioso - jugar como invitado
                startAsGuest();
            }
        }, 100);
    } else {
        // Verificar si hay credenciales guardadas
        const credentials = loadUserCredentials();
        
        if (credentials && credentials.email && credentials.password) {
            // Hay credenciales guardadas - intentar login automático
            doLoginWithCredentials(credentials.email, credentials.password);
        } else {
            // No hay credenciales - jugar como invitado
            startAsGuest();
        }
    }
}

// Función para hacer login automático con credenciales guardadas
function doLoginWithCredentials(email, password) {
    // Crear un timeout de 5 segundos para el fetch
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    // Hacer la petición de login con timeout
    Promise.race([
        fetch(CONFIG.API_BASE_URL + 'auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: password
            })
        }),
        timeoutPromise
    ])
    .then(response => {
        if (!response.ok) {
            throw new Error('Server error');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Login exitoso
            // Establecer el usuario en gameState
            gameState.currentUser = {
                id: data.data.user.usuario_aplicacion_id,
                usuario_aplicacion_key: data.data.user.usuario_aplicacion_key,
                email: data.data.user.email,
                nombre: data.data.user.nombre,
                isGuest: false
            };
            
            // Ir directamente al juego
            setTimeout(async () => {
                try {
                    await initGame();
                    showScreen('game-screen');
                } catch (error) {
                    // Error silencioso - jugar como invitado
                    startAsGuest();
                }
            }, 1000);
            
        } else {
            // Login fallido - limpiar credenciales y jugar como invitado
            // Limpiar credenciales inválidas
            clearUserCredentials();
            
            // Jugar como invitado
            startAsGuest();
        }
    })
    .catch(error => {
        // En caso de error (timeout, 502, red, etc.), jugar como invitado silenciosamente
        // Error silencioso - el usuario no necesita ver esto
        startAsGuest();
    });
}


