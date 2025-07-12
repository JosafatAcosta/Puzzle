// Gamificación: Patologías asociadas a estrés y ansiedad (mobile-friendly, selección por toque)
// Eliminado drag & drop, ahora asociación por selección/clic

document.addEventListener('DOMContentLoaded', function() {
    // Game Variables
    let currentPlayer = 1;
    let score = 0;
    let timeLeft = 480; // 8 minutes in seconds
    let timer;
    let stagesCompleted = [false, false, false, false];
    let hintsUsed = [0, 0, 0, 0]; // hints used per stage
    let currentStage = 1;

    // Card data igual que antes (no cambiar)
    const stageData = { /* ... igual que antes ... */ };
    // --- Para ahorrar espacio, copia aquí el contenido de stageData actual --

    // DOM Elements
    const timeEl = document.getElementById('time');
    const scoreEl = document.getElementById('score');
    const nextBtn = document.getElementById('nextBtn');
    const hintBtn = document.getElementById('hintBtn');
    const restartBtn = document.getElementById('restartBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const installBtn = document.getElementById('installBtn');

    // Inicializa el juego
    initializeGame();

    function initializeGame() {
        startTimer();
        loadStage(1);
        updatePlayerDisplay();

        nextBtn.addEventListener('click', nextStage);
        hintBtn.addEventListener('click', giveHint);
        restartBtn.addEventListener('click', restartGame);
        shuffleBtn.addEventListener('click', shuffleCurrentStage);
        setupPWA();
    }

    function startTimer() {
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timer);
                endGame();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 120) {
            timeEl.style.background = 'rgba(231, 76, 60, 0.9)';
            timeEl.style.animation = 'pulse 1s infinite';
        }
    }

    function loadStage(stageNum) {
        // Oculta etapas
        for (let i = 1; i <= 4; i++) {
            const stage = document.getElementById(`stage${i}`);
            if (stage) stage.classList.add('hidden');
        }

        // Muestra actual
        const currentStageEl = document.getElementById(`stage${stageNum}`);
        if (currentStageEl) {
            currentStageEl.classList.remove('hidden');
            currentStage = stageNum;
            updateStageProgress();
            generatePuzzlePieces(stageNum);
            updateHintDisplay(stageNum);
        }
    }

    function updateStageProgress() {
        for (let i = 1; i <= 4; i++) {
            const indicator = document.getElementById(`indicator-${i}`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');
                if (i < currentStage) {
                    indicator.classList.add('completed');
                } else if (i === currentStage) {
                    indicator.classList.add('active');
                }
            }
        }
    }

    function generatePuzzlePieces(stageNum) {
        const container = document.getElementById(`pieces-container${stageNum}`);
        if (!container) return;

        container.innerHTML = '';
        const pieces = [...stageData[stageNum].pieces];
        shuffleArray(pieces);

        pieces.forEach((piece, index) => {
            const pieceEl = document.createElement('div');
            pieceEl.id = piece.id;
            pieceEl.className = 'puzzle-piece';
            pieceEl.setAttribute('data-category', piece.category);
            pieceEl.textContent = piece.text;
            pieceEl.setAttribute('draggable', 'true'); // ahora solo para lógica, no se usa drag

            container.appendChild(pieceEl);
        });

        updatePiecesRemaining(stageNum, pieces.length);
        // Zonas de drop: no necesitan listeners, el HTML ya tiene click handler
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Lógica para asociación por selección
    window.dropPuzzlePiece = function(pieceEl, dropZone, stageNum) {
        if (!pieceEl || !dropZone) return;

        const pieceCategory = pieceEl.getAttribute('data-category');
        const zoneCategory = dropZone.getAttribute('data-category');
        const isCorrect = pieceCategory === zoneCategory;

        if (isCorrect) {
            handleCorrectPlacement(pieceEl, dropZone, stageNum);
        } else {
            handleIncorrectPlacement(pieceEl, stageNum);
        }
    };

    function handleCorrectPlacement(piece, dropZone, stageNum) {
        dropZone.appendChild(piece);
        piece.classList.remove('dragging', 'selected');
        piece.setAttribute('draggable', 'false');
        piece.style.background = 'linear-gradient(135deg, #d5f5e3, #a8e6cf)';
        piece.style.border = '3px solid #27ae60';

        showFeedback(`¡Excelente! +${getPoints(stageNum)} puntos`, 'correct', stageNum);
        updateScore(getPoints(stageNum));
        switchPlayer(stageNum);

        const remainingPieces = document.querySelectorAll(`#pieces-container${stageNum} .puzzle-piece[draggable="true"]`).length;
        updatePiecesRemaining(stageNum, remainingPieces);

        checkStageCompletion(stageNum);
    }

    function handleIncorrectPlacement(piece, stageNum) {
        piece.classList.add('incorrect');
        setTimeout(() => {
            piece.classList.remove('incorrect');
        }, 600);

        showFeedback(`Incorrecto. -${Math.floor(getPoints(stageNum)/2)} puntos. ¡Intenta de nuevo!`, 'incorrect', stageNum);
        updateScore(-Math.floor(getPoints(stageNum)/2));
    }

    function getPoints(stageNum) {
        const pointsPerStage = [25, 35, 50, 75];
        return pointsPerStage[stageNum - 1] || 25;
    }

    function switchPlayer(stageNum) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updatePlayerDisplay(stageNum);
    }

    function updatePlayerDisplay(stageNum = currentStage) {
        const player1El = document.getElementById(`player1${stageNum > 1 ? '-s' + stageNum : ''}`);
        const player2El = document.getElementById(`player2${stageNum > 1 ? '-s' + stageNum : ''}`);

        if (player1El && player2El) {
            if (currentPlayer === 1) {
                player1El.classList.add('active');
                player2El.classList.remove('active');
            } else {
                player1El.classList.remove('active');
                player2El.classList.add('active');
            }
        }
    }

    function showFeedback(message, type, stageNum) {
        const feedbackEl = document.getElementById(`feedback${stageNum}`);
        if (feedbackEl) {
            feedbackEl.textContent = message;
            feedbackEl.className = 'feedback ' + type + '-feedback';

            setTimeout(() => {
                feedbackEl.textContent = '';
                feedbackEl.className = 'feedback';
            }, 4000);
        }
    }

    function updateScore(points) {
        score += points;
        scoreEl.textContent = score;
    }

    function updatePiecesRemaining(stageNum, count) {
        const counterEl = document.getElementById(`pieces-remaining${stageNum}`);
        if (counterEl) {
            counterEl.textContent = count;
        }
    }

    function updateHintDisplay(stageNum) {
        const hintsEl = document.getElementById(`hints-remaining${stageNum}`);
        if (hintsEl) {
            hintsEl.textContent = 3 - hintsUsed[stageNum - 1];
        }
    }

    function checkStageCompletion(stageNum) {
        const remainingPieces = document.querySelectorAll(`#pieces-container${stageNum} .puzzle-piece[draggable="true"]`);
        if (remainingPieces.length === 0) {
            stagesCompleted[stageNum - 1] = true;
            const bonusPoints = 50 + (stageNum * 25);
            showFeedback(`🎉 ¡Etapa ${stageNum} completada! +${bonusPoints} puntos de bono`, 'correct', stageNum);
            updateScore(bonusPoints);

            if (stageNum < 4) {
                nextBtn.disabled = false;
                nextBtn.classList.remove('hidden');
                nextBtn.textContent = `Ir a Etapa ${stageNum + 1} 🚀`;
            } else {
                nextBtn.textContent = 'Ver Resumen Final 🏆';
                nextBtn.disabled = false;
                nextBtn.classList.remove('hidden');
            }
            updateStageProgress();
        }
    }

    function nextStage() {
        if (currentStage < 4) {
            loadStage(currentStage + 1);
            nextBtn.disabled = true;
            nextBtn.classList.add('hidden');
        } else {
            showSummary();
        }
    }

    function giveHint() {
        const stageIndex = currentStage - 1;

        if (hintsUsed[stageIndex] >= 3) {
            showFeedback('❌ No quedan pistas disponibles para esta etapa', 'incorrect', currentStage);
            return;
        }

        const hint = stageData[currentStage].hints[hintsUsed[stageIndex]];
        showFeedback(`💡 Pista: ${hint}`, 'correct', currentStage);

        hintsUsed[stageIndex]++;
        updateHintDisplay(currentStage);
        updateScore(-10);
    }

    function shuffleCurrentStage() {
        generatePuzzlePieces(currentStage);
        showFeedback('🎲 ¡Cartas mezcladas aleatoriamente!', 'correct', currentStage);
    }

    function restartGame() {
        currentPlayer = 1;
        score = 0;
        timeLeft = 480;
        stagesCompleted = [false, false, false, false];
        hintsUsed = [0, 0, 0, 0];
        currentStage = 1;

        if (timer) clearInterval(timer);

        scoreEl.textContent = '0';
        nextBtn.classList.add('hidden');
        nextBtn.disabled = true;

        document.getElementById('summary').classList.add('hidden');

        initializeGame();

        showFeedback('🔄 Juego reiniciado. ¡A jugar!', 'correct', 1);
    }

    function showSummary() {
        document.getElementById(`stage${currentStage}`).classList.add('hidden');
        const summary = document.getElementById('summary');
        summary.classList.remove('hidden');

        nextBtn.classList.add('hidden');
        hintBtn.classList.add('hidden');
        shuffleBtn.classList.add('hidden');
        clearInterval(timer);
        const timeBonus = Math.max(0, timeLeft * 2);
        const finalScore = score + timeBonus;

        document.getElementById('final-score').textContent = `Puntaje Final: ${finalScore} puntos`;

        const performanceEl = document.getElementById('performance-breakdown');
        const totalHints = hintsUsed.reduce((a, b) => a + b, 0);
        const completionRate = stagesCompleted.filter(Boolean).length / 4 * 100;

        performanceEl.innerHTML = `
            <p>✅ <strong>Etapas completadas:</strong> ${stagesCompleted.filter(Boolean).length}/4 (${completionRate.toFixed(1)}%)</p>
            <p>💡 <strong>Pistas utilizadas:</strong> ${totalHints}/12</p>
            <p>⏱️ <strong>Tiempo restante:</strong> ${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}</p>
            <p>🏆 <strong>Bono temporal:</strong> +${timeBonus} puntos</p>
            <p>📊 <strong>Rendimiento:</strong> ${getPerformanceLevel(finalScore)}</p>
        `;
    }

    function getPerformanceLevel(finalScore) {
        if (finalScore >= 1000) return '🥇 Experto Clínico';
        if (finalScore >= 800) return '🥈 Avanzado';
        if (finalScore >= 600) return '🥉 Intermedio';
        if (finalScore >= 400) return '📚 Principiante';
        return '🎯 Necesita práctica';
    }

    function endGame() {
        showFeedback('⏰ ¡Tiempo agotado! Juego terminado.', 'incorrect', currentStage);
        setTimeout(showSummary, 2000);
    }

    function setupPWA() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'inline-block';
        });

        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(() => {
                    installBtn.style.display = 'none';
                    deferredPrompt = null;
                });
            }
        });
    }

    // CSS pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
});