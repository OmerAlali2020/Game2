const gameShell = document.getElementById('game-shell');
const playerEl = document.getElementById('player');
const scoreEl = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScoreEl = document.getElementById('final-score');

const foods = ['🍕', '🍔', '🍎', '🍩', '🍟', '🍦'];

const state = {
  running: false,
  frameId: null,
  playerX: 0,
  foods: [],
  keys: {
    ArrowLeft: false,
    ArrowRight: false,
    a: false,
    d: false,
    A: false,
    D: false,
  },
  playerSpeed: 470,
  spawnTimer: 0,
  scoreTimer: 0,
  score: 0,
  totalTime: 0,
  lastTs: 0,
};

function getDimensions() {
  const shellRect = gameShell.getBoundingClientRect();
  const playerRect = playerEl.getBoundingClientRect();
  return {
    width: shellRect.width,
    height: shellRect.height,
    playerWidth: playerRect.width,
    playerHeight: playerRect.height,
    playerBottom: 12,
  };
}

function resetPlayer() {
  const { width, playerWidth } = getDimensions();
  state.playerX = (width - playerWidth) / 2;
  renderPlayer();
}

function renderPlayer() {
  playerEl.style.left = `${state.playerX}px`;
  playerEl.style.transform = 'none';
}

function clearFoods() {
  for (const food of state.foods) {
    food.el.remove();
  }
  state.foods = [];
}

function setOverlay(screen, visible) {
  screen.classList.toggle('visible', visible);
  screen.setAttribute('aria-hidden', String(!visible));
}

function startGame() {
  state.running = true;
  state.spawnTimer = 0;
  state.scoreTimer = 0;
  state.score = 0;
  state.totalTime = 0;
  state.lastTs = performance.now();

  clearFoods();
  resetPlayer();
  scoreEl.textContent = 'ניקוד: 0';

  setOverlay(startScreen, false);
  setOverlay(gameOverScreen, false);

  state.frameId = requestAnimationFrame(gameLoop);
}

function endGame() {
  state.running = false;
  cancelAnimationFrame(state.frameId);
  finalScoreEl.textContent = `ניקוד סופי: ${state.score}`;
  setOverlay(gameOverScreen, true);
}

function spawnFood() {
  const { width } = getDimensions();
  const foodEl = document.createElement('div');
  foodEl.className = 'food';
  foodEl.textContent = foods[Math.floor(Math.random() * foods.length)];
  gameShell.appendChild(foodEl);

  const foodWidth = foodEl.getBoundingClientRect().width;
  const x = Math.random() * (width - foodWidth);

  const item = {
    el: foodEl,
    x,
    y: -foodWidth - 20,
    size: foodWidth,
    speed: 170 + Math.min(state.totalTime * 5, 130),
  };

  state.foods.push(item);
  renderFood(item);
}

function renderFood(food) {
  food.el.style.left = `${food.x}px`;
  food.el.style.top = `${food.y}px`;
}

function getPlayerRect() {
  const { playerWidth, playerHeight, height, playerBottom } = getDimensions();
  return {
    left: state.playerX,
    right: state.playerX + playerWidth,
    top: height - playerBottom - playerHeight,
    bottom: height - playerBottom,
  };
}

function intersects(a, b) {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

function gameLoop(timestamp) {
  if (!state.running) return;

  const dt = (timestamp - state.lastTs) / 1000;
  state.lastTs = timestamp;
  state.totalTime += dt;

  const { width, height, playerWidth } = getDimensions();

  const movingLeft = state.keys.ArrowLeft || state.keys.a || state.keys.A;
  const movingRight = state.keys.ArrowRight || state.keys.d || state.keys.D;

  if (movingLeft && !movingRight) {
    state.playerX -= state.playerSpeed * dt;
  }

  if (movingRight && !movingLeft) {
    state.playerX += state.playerSpeed * dt;
  }

  state.playerX = Math.max(0, Math.min(width - playerWidth, state.playerX));
  renderPlayer();

  state.spawnTimer += dt;
  const spawnEvery = Math.max(0.45, 0.95 - state.totalTime * 0.01);
  if (state.spawnTimer >= spawnEvery) {
    state.spawnTimer = 0;
    spawnFood();
  }

  const playerRect = getPlayerRect();

  for (let i = state.foods.length - 1; i >= 0; i -= 1) {
    const food = state.foods[i];
    food.y += food.speed * dt;
    renderFood(food);

    const foodRect = {
      left: food.x,
      right: food.x + food.size,
      top: food.y,
      bottom: food.y + food.size,
    };

    if (intersects(playerRect, foodRect)) {
      endGame();
      return;
    }

    if (food.y > height + food.size) {
      food.el.remove();
      state.foods.splice(i, 1);
      state.score += 1;
      scoreEl.textContent = `ניקוד: ${state.score}`;
    }
  }

  state.scoreTimer += dt;
  if (state.scoreTimer >= 1) {
    state.score += 1;
    state.scoreTimer = 0;
    scoreEl.textContent = `ניקוד: ${state.score}`;
  }

  state.frameId = requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  if (event.key in state.keys) {
    state.keys[event.key] = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key in state.keys) {
    state.keys[event.key] = false;
    event.preventDefault();
  }
});

window.addEventListener('resize', () => {
  if (!state.running) {
    resetPlayer();
  }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

resetPlayer();
