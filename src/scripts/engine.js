// Estado global do jogo
let GameState = {};

// Classe principal do jogo
class DetonaRalphGame {
  constructor() {
    this.initializeGameState();
    this.initializeGame();
    this.bindEvents();
  }

  initializeGameState() {
    GameState = {
      view: {
        squares: document.querySelectorAll(".square"),
        timeLeft: document.querySelector("#time-left"),
        score: document.querySelector("#score"),
        lives: document.querySelector("#lives"),
        startBtn: document.querySelector("#start-btn"),
        restartBtn: document.querySelector("#restart-btn"),
        gameOverModal: document.querySelector("#game-over-modal"),
        finalScoreValue: document.querySelector("#final-score-value"),
        playAgainBtn: document.querySelector("#play-again-btn"),
        viewRankingBtn: document.querySelector("#view-ranking-btn"),
        rankingModal: document.querySelector("#ranking-modal"),
        rankingTbody: document.querySelector("#ranking-tbody"),
        closeRankingBtn: document.querySelector("#close-ranking-btn"),
        clearRankingBtn: document.querySelector("#clear-ranking-btn"),
      },
      values: {
        gameVelocity: 1000,
        hitPosition: null,
        score: 0,
        currentTime: 60,
        lives: 3,
        isGameRunning: false,
        difficulty: 1,
      },
      actions: {
        timerId: null,
        countDownTimerId: null,
      },
    };
  }

  initializeGame() {
    this.resetGame();
    this.updateDisplay();
  }

  bindEvents() {
    // Eventos dos quadrados
    GameState.view.squares.forEach((square) => {
      square.addEventListener("click", (e) => this.handleSquareClick(e));
    });

    // Eventos dos botões
    GameState.view.startBtn.addEventListener("click", () => this.startGame());
    GameState.view.restartBtn.addEventListener("click", () =>
      this.restartGame()
    );
    GameState.view.playAgainBtn.addEventListener("click", () =>
      this.restartGame()
    );
    GameState.view.viewRankingBtn.addEventListener("click", () =>
      this.showRanking()
    );
    GameState.view.closeRankingBtn.addEventListener("click", () =>
      this.hideRanking()
    );
    GameState.view.clearRankingBtn.addEventListener("click", () =>
      this.clearRanking()
    );

    // Eventos de teclado para acessibilidade
    document.addEventListener("keydown", (e) => this.handleKeyPress(e));
  }

  startGame() {
    if (GameState.values.isGameRunning) return;

    GameState.values.isGameRunning = true;
    GameState.view.startBtn.disabled = true;
    GameState.view.startBtn.textContent = "Jogando...";

    this.startTimers();
  }

  startTimers() {
    GameState.actions.timerId = setInterval(
      () => this.randomSquare(),
      GameState.values.gameVelocity
    );
    GameState.actions.countDownTimerId = setInterval(
      () => this.countDown(),
      1000
    );
  }

  stopTimers() {
    if (GameState.actions.timerId) {
      clearInterval(GameState.actions.timerId);
      GameState.actions.timerId = null;
    }
    if (GameState.actions.countDownTimerId) {
      clearInterval(GameState.actions.countDownTimerId);
      GameState.actions.countDownTimerId = null;
    }
  }

  countDown() {
    GameState.values.currentTime--;
    this.updateDisplay();

    if (GameState.values.currentTime <= 0) {
      this.gameOver();
    }
  }

  randomSquare() {
    // Remove classe enemy de todos os quadrados
    GameState.view.squares.forEach((square) => {
      square.classList.remove("enemy");
    });

    // Seleciona quadrado aleatório
    const randomNumber = Math.floor(Math.random() * 9);
    const randomSquare = GameState.view.squares[randomNumber];
    randomSquare.classList.add("enemy");
    GameState.values.hitPosition = randomSquare.id;

    // Aumenta dificuldade progressivamente
    this.increaseDifficulty();
  }

  increaseDifficulty() {
    if (GameState.values.score > 0 && GameState.values.score % 10 === 0) {
      GameState.values.difficulty = Math.min(
        5,
        Math.floor(GameState.values.score / 10) + 1
      );
      GameState.values.gameVelocity = Math.max(
        300,
        1000 - GameState.values.difficulty * 100
      );

      // Reinicia timer com nova velocidade
      if (GameState.actions.timerId) {
        clearInterval(GameState.actions.timerId);
        GameState.actions.timerId = setInterval(
          () => this.randomSquare(),
          GameState.values.gameVelocity
        );
      }
    }
  }

  handleSquareClick(event) {
    if (!GameState.values.isGameRunning) return;

    const square = event.target;
    const squareId = square.id;

    if (squareId === GameState.values.hitPosition) {
      this.hitEnemy(square);
    } else {
      this.missHit(square);
    }
  }

  handleKeyPress(event) {
    if (!GameState.values.isGameRunning) return;

    const key = event.key;
    const squareNumber = parseInt(key);

    if (squareNumber >= 1 && squareNumber <= 9) {
      const square = document.getElementById(squareNumber.toString());
      if (square) {
        square.click();
      }
    }
  }

  hitEnemy(square) {
    GameState.values.score++;
    GameState.values.hitPosition = null;

    // Efeito visual
    square.classList.add("hit");
    setTimeout(() => square.classList.remove("hit"), 300);

    this.playSound("hit");
    this.updateDisplay();
  }

  missHit(square) {
    GameState.values.lives--;
    this.updateDisplay();

    if (GameState.values.lives <= 0) {
      this.gameOver();
    }
  }

  playSound(audioName) {
    try {
      const audio = new Audio(`./src/audios/${audioName}.m4a`);
      audio.volume = 0.2;
      audio.play().catch((e) => console.log("Erro ao reproduzir áudio:", e));
    } catch (error) {
      console.log("Erro ao carregar áudio:", error);
    }
  }

  updateDisplay() {
    GameState.view.timeLeft.textContent = GameState.values.currentTime;
    GameState.view.score.textContent = GameState.values.score;
    GameState.view.lives.textContent = `x${GameState.values.lives}`;
  }

  gameOver() {
    GameState.values.isGameRunning = false;
    this.stopTimers();

    // Salva a pontuação no ranking
    this.saveScore(GameState.values.score);

    // Atualiza modal
    GameState.view.finalScoreValue.textContent = GameState.values.score;
    GameState.view.gameOverModal.classList.add("show");
    GameState.view.gameOverModal.setAttribute("aria-hidden", "false");

    // Reabilita botão de iniciar
    GameState.view.startBtn.disabled = false;
    GameState.view.startBtn.textContent = "Iniciar Jogo";
  }

  restartGame() {
    this.resetGame();
    this.updateDisplay();
    this.hideModal();
  }

  resetGame() {
    GameState.values.score = 0;
    GameState.values.currentTime = 60;
    GameState.values.lives = 3;
    GameState.values.hitPosition = null;
    GameState.values.isGameRunning = false;
    GameState.values.difficulty = 1;
    GameState.values.gameVelocity = 1000;

    // Remove classes dos quadrados
    GameState.view.squares.forEach((square) => {
      square.classList.remove("enemy", "hit");
    });

    // Reabilita botão de iniciar
    GameState.view.startBtn.disabled = false;
    GameState.view.startBtn.textContent = "Iniciar Jogo";
  }

  hideModal() {
    GameState.view.gameOverModal.classList.remove("show");
    GameState.view.gameOverModal.setAttribute("aria-hidden", "true");
  }

  // Sistema de Ranking
  saveScore(score) {
    const playerName = prompt("Digite seu nome para o ranking:", "Jogador");
    if (!playerName || playerName.trim() === "") return;

    const rankingData = {
      name: playerName.trim(),
      score: score,
      date: new Date().toLocaleDateString("pt-BR"),
      timestamp: Date.now(),
    };

    let rankings = this.getRankings();
    rankings.push(rankingData);

    // Ordena por pontuação (maior primeiro) e mantém apenas os 10 melhores
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 10);

    localStorage.setItem("detonaRalphRanking", JSON.stringify(rankings));
  }

  getRankings() {
    const stored = localStorage.getItem("detonaRalphRanking");
    return stored ? JSON.parse(stored) : [];
  }

  showRanking() {
    this.hideModal();
    this.renderRanking();
    GameState.view.rankingModal.classList.add("show");
    GameState.view.rankingModal.setAttribute("aria-hidden", "false");
  }

  hideRanking() {
    GameState.view.rankingModal.classList.remove("show");
    GameState.view.rankingModal.setAttribute("aria-hidden", "true");
  }

  renderRanking() {
    const rankings = this.getRankings();
    const tbody = GameState.view.rankingTbody;

    if (rankings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="no-ranking">
            Nenhuma pontuação salva ainda!<br>
            Jogue para aparecer no ranking! 🎮
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rankings
      .map(
        (ranking, index) => `
      <tr>
        <td class="position">${this.getPositionIcon(index + 1)} ${
          index + 1
        }º</td>
        <td>${ranking.name}</td>
        <td class="score">${ranking.score}</td>
        <td class="date">${ranking.date}</td>
      </tr>
    `
      )
      .join("");
  }

  getPositionIcon(position) {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏅";
    }
  }

  clearRanking() {
    if (
      confirm(
        "Tem certeza que deseja limpar todo o ranking? Esta ação não pode ser desfeita."
      )
    ) {
      localStorage.removeItem("detonaRalphRanking");
      this.renderRanking();
    }
  }
}

// Inicialização do jogo quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  new DetonaRalphGame();
});

// Funções de compatibilidade (para manter funcionalidade existente)
function countDown() {
  // Mantida para compatibilidade, mas não é mais usada
}

function playSound(audioName) {
  // Mantida para compatibilidade, mas não é mais usada
}

function randomSquare() {
  // Mantida para compatibilidade, mas não é mais usada
}

function addListenerHitBox() {
  // Mantida para compatibilidade, mas não é mais usada
}

function initialize() {
  // Mantida para compatibilidade, mas não é mais usada
}
