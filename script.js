/* Elements */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreboard = document.getElementById('scoreboard');
const menu = document.getElementById('menu');

/* D-Pad buttons */
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

/* Game config */
const BOX = 20;                         // grid cell size
const SPEED_MS = {                      // ms per tick (lower= faster)
  easy: 180,
  normal: 120,
  hard: 70
};
const ESCALATE_THRESHOLD = {            // length thresholds to escalate speed
  toNormal: 8,   // >=8 segments => normal
  toHard: 16     // >=16 segments => hard
};

/* State */
let themeChoice = null;
let wrapChoice = null;
let diffChoice = null;

let cols = 0, rows = 0;
let snake = [];
let food = null;
let dir = 'RIGHT';   // default to move automatically to the right
let score = 0;
let highScore = 0;
let intervalId = null;
let currentMs = SPEED_MS.normal;  // actual tick speed
let currentSpeedLevel = 'normal';
let gameColors = { bg: '#000', snake: '#0f0', food: '#f00' };

/* responsive canvas sizing */
function resizeCanvas() {
  // fill available viewport
  canvas.width = Math.max(BOX * 10, window.innerWidth);
  canvas.height = Math.max(BOX * 10, window.innerHeight - 120); // leave room for menu/score UI
  // compute grid counts
  cols = Math.floor(canvas.width / BOX);
  rows = Math.floor(canvas.height / BOX);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* UI: menu button wiring */
document.querySelectorAll('.theme-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    themeChoice = btn.dataset.theme;
    maybeStart();
  })
);
document.querySelectorAll('.wrap-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wrap-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    wrapChoice = (btn.dataset.wrap === 'true');
    maybeStart();
  })
);
document.querySelectorAll('.diff-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    diffChoice = btn.dataset.diff;
    maybeStart();
  })
);

/* Start when user has picked theme, wrap and difficulty */
function maybeStart() {
  if (themeChoice && wrapChoice !== null && diffChoice) {
    menu.classList.add('hidden');
    scoreboard.style.display = 'block';
    canvas.style.display = 'block'; // Make canvas visible
    document.getElementById('dpad').style.display = window.innerWidth <= 900 ? 'block' : 'none';
    startNewGame();
  }
}

/* Place food on grid not overlapping snake */
function placeFood() {
  // ensure up-to-date grid sizes in case of resize
  cols = Math.floor(canvas.width / BOX);
  rows = Math.floor(canvas.height / BOX);

  let fx, fy;
  let tries = 0;
  do {
    fx = Math.floor(Math.random() * cols) * BOX;
    fy = Math.floor(Math.random() * rows) * BOX;
    tries++;
    // avoid infinite loop — if snake fills most of board, break
    if (tries > 500) break;
  } while (snake.some(s => s.x === fx && s.y === fy));

  food = { x: fx, y: fy };
}

/* Setup / Reset */
function startNewGame() {
  resizeCanvas();
  // colors
  if (themeChoice === 'classic') { 
    gameColors = { bg: 'lightblue', snake: 'green', food: 'red' }; 
  } else if (themeChoice === 'night') {   
    gameColors = { bg: 'black', snake: 'white', food: 'yellow' }; 
  } else if (themeChoice === 'neon') {    
    gameColors = { bg: 'purple', snake: 'lime', food: 'cyan' }; 
  } else {
    gameColors = { bg: '#000', snake: '#0f0', food: '#f00' };
  }

  // grid start
  cols = Math.floor(canvas.width / BOX);
  rows = Math.floor(canvas.height / BOX);

  // initial snake: center-ish
  const startX = Math.floor(cols/2) * BOX;
  const startY = Math.floor(rows/2) * BOX;
  snake = [{ x: startX, y: startY }];

  // default direction (auto move)
  dir = 'RIGHT';

  // score
  score = 0;
  highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;

  // set initial speed according to chosen difficulty
  currentSpeedLevel = diffChoice;                // 'easy'|'normal'|'hard'
  currentMs = SPEED_MS[currentSpeedLevel];

  // Place initial food
  placeFood();

  // attach controls
  attachControls();

  // start tick
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(gameTick, currentMs);

  // update scoreboard now
  updateScoreboard();
  
  // Draw initial scene
  drawScene();
}

/* Update scoreboard display */
function updateScoreboard() {
  scoreboard.textContent = `Score: ${score * 10} | High Score: ${highScore * 10}`;
}

/* Move + draw each tick */
function gameTick() {
  // compute next head pos
  let headX = snake[0].x;
  let headY = snake[0].y;
  if (dir === 'LEFT') headX -= BOX;
  else if (dir === 'RIGHT') headX += BOX;
  else if (dir === 'UP') headY -= BOX;
  else if (dir === 'DOWN') headY += BOX;

  // wrap or collision
  if (wrapChoice) {
    if (headX < 0) headX = (cols - 1) * BOX;
    if (headX >= cols * BOX) headX = 0;
    if (headY < 0) headY = (rows - 1) * BOX;
    if (headY >= rows * BOX) headY = 0;
  } else {
    if (headX < 0 || headX >= cols * BOX || headY < 0 || headY >= rows * BOX) {
      return gameOver();
    }
  }

  // check self collision (before adding new head)
  for (let seg of snake) {
    if (seg.x === headX && seg.y === headY) {
      return gameOver();
    }
  }

  const ate = (headX === food.x && headY === food.y);

  // add new head
  snake.unshift({ x: headX, y: headY });

  if (ate) {
    // increase score and leave tail (growth)
    score += 1; // count number of foods eaten
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHighScore', highScore);
    }
    placeFood();
    // update scoreboard (display as *10 to match previous semantics)
    updateScoreboard();
  } else {
    // no food: remove tail (normal movement)
    snake.pop();
  }

  // dynamic speed escalation: escalate only towards faster speeds
  maybeEscalateSpeed();

  // draw everything
  drawScene();
}

/* escalate speed depending on current snake length */
function maybeEscalateSpeed() {
  const length = snake.length;

  // if already at hard, nothing to do
  if (currentSpeedLevel === 'hard') return;

  // decide target level based on thresholds
  let target = currentSpeedLevel;
  if (length >= ESCALATE_THRESHOLD.toHard) target = 'hard';
  else if (length >= ESCALATE_THRESHOLD.toNormal) target = 'normal';
  else target = diffChoice; // keep user's chosen base if below thresholds

  // But don't move to a slower level (only escalate to faster)
  const order = ['easy','normal','hard'];
  const idxCurrent = order.indexOf(currentSpeedLevel);
  const idxTarget = order.indexOf(target);
  if (idxTarget > idxCurrent) { // target is faster
    currentSpeedLevel = target;
    const newMs = SPEED_MS[currentSpeedLevel];
    if (newMs !== currentMs) {
      currentMs = newMs;
      // restart interval with new speed
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(gameTick, currentMs);
    }
  }
}

/* draw background, food, snake and scoreboard */
function drawScene() {
  // background
  ctx.fillStyle = gameColors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // food
  ctx.fillStyle = gameColors.food;
  ctx.fillRect(food.x, food.y, BOX, BOX);

  // snake
  for (let i=0;i<snake.length;i++) {
    ctx.fillStyle = gameColors.snake;
    ctx.fillRect(snake[i].x, snake[i].y, BOX, BOX);
    
    // Add border to snake segments for better visibility
    ctx.strokeStyle = gameColors.bg;
    ctx.strokeRect(snake[i].x, snake[i].y, BOX, BOX);
  }

  // update scoreboard text (show numeric points as 10*foods)
  scoreboard.textContent = `Score: ${score * 10} | High Score: ${highScore * 10}`;
}

/* Game over behavior */
function gameOver() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  // simple modal/alert for now
  setTimeout(() => { // small delay so last frame finishes
    if (confirm(`Game Over!\nYour score: ${score * 10}\nPlay again?`)) {
      // restart with same options
      startNewGame();
    } else {
      // send back to menu
      location.reload();
    }
  }, 50);
}

/* Controls wiring */
function attachControls() {
  // Keyboard
  document.onkeydown = function(e) {
    const key = e.key;
    if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && dir !== 'RIGHT') dir = 'LEFT';
    else if ((key === 'ArrowUp' || key === 'w' || key === 'W') && dir !== 'DOWN') dir = 'UP';
    else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && dir !== 'LEFT') dir = 'RIGHT';
    else if ((key === 'ArrowDown' || key === 's' || key === 'S') && dir !== 'UP') dir = 'DOWN';
  };

  // D-pad clicks (mobile)
  btnUp.onclick = ()=> { if (dir !== 'DOWN') dir = 'UP'; };
  btnDown.onclick = ()=> { if (dir !== 'UP') dir = 'DOWN'; };
  btnLeft.onclick = ()=> { if (dir !== 'RIGHT') dir = 'LEFT'; };
  btnRight.onclick = ()=> { if (dir !== 'LEFT') dir = 'RIGHT'; };

  // Swipe detection
  let startX = 0, startY = 0;
  canvas.ontouchstart = (e) => {
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
  };
  canvas.ontouchend = (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30 && dir !== 'LEFT') dir = 'RIGHT';
      else if (dx < -30 && dir !== 'RIGHT') dir = 'LEFT';
    } else {
      if (dy > 30 && dir !== 'UP') dir = 'DOWN';
      else if (dy < -30 && dir !== 'DOWN') dir = 'UP';
    }
  };
}

// Initialize the page
scoreboard.style.display = 'none';