const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let themeChoice = null;
let wrapChoice = null;
let snakeColor, foodColor, bgColor;

// Resize canvas to fit screen
function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth - 20, 600);
  canvas.height = Math.min(window.innerHeight - 20, 600);
}
window.addEventListener("resize", resizeCanvas);

document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    themeChoice = btn.dataset.theme;
    maybeStart();
  });
});

document.querySelectorAll(".wrap-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".wrap-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    wrapChoice = btn.dataset.wrap === "true";
    maybeStart();
  });
});

function maybeStart() {
  if (themeChoice && wrapChoice !== null) {
    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
    resizeCanvas();
    startGame();
  }
}

// ==================== GAME ======================
let snake, food, dx, dy, score, highScore, box;

function startGame() {
  if (themeChoice === "classic") {
    bgColor = "lightblue"; snakeColor = "green"; foodColor = "red";
  } else if (themeChoice === "night") {
    bgColor = "black"; snakeColor = "white"; foodColor = "yellow";
  } else if (themeChoice === "neon") {
    bgColor = "purple"; snakeColor = "lime"; foodColor = "cyan";
  } else {
    bgColor = "black"; snakeColor = "green"; foodColor = "red";
  }

  box = 20;
  snake = [{ x: 9 * box, y: 10 * box }];
  food = {
    x: Math.floor(Math.random() * (canvas.width / box)) * box,
    y: Math.floor(Math.random() * (canvas.height / box)) * box
  };
  dx = box; dy = 0;
  score = 0;
  highScore = localStorage.getItem("snakeHighScore") || 0;

  document.addEventListener("keydown", direction);
  addSwipeControls();

  gameLoop();
}

function direction(event) {
  if (event.key === "ArrowUp" && dy === 0) { dx = 0; dy = -box; }
  else if (event.key === "ArrowDown" && dy === 0) { dx = 0; dy = box; }
  else if (event.key === "ArrowLeft" && dx === 0) { dx = -box; dy = 0; }
  else if (event.key === "ArrowRight" && dx === 0) { dx = box; dy = 0; }
}

function addSwipeControls() {
  let startX, startY;
  canvas.addEventListener("touchstart", e => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  });
  canvas.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    const dxSwipe = touch.clientX - startX;
    const dySwipe = touch.clientY - startY;
    if (Math.abs(dxSwipe) > Math.abs(dySwipe)) {
      if (dxSwipe > 30 && dx === 0) { dx = box; dy = 0; }
      else if (dxSwipe < -30 && dx === 0) { dx = -box; dy = 0; }
    } else {
      if (dySwipe > 30 && dy === 0) { dx = 0; dy = box; }
      else if (dySwipe < -30 && dy === 0) { dx = 0; dy = -box; }
    }
  });
}

function draw() {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = foodColor;
  ctx.fillRect(food.x, food.y, box, box);

  ctx.fillStyle = snakeColor;
  for (let s of snake) {
    ctx.fillRect(s.x, s.y, box, box);
  }

  ctx.fillStyle = "white";
  ctx.font = "20px Courier";
  ctx.fillText(`Score: ${score}  High Score: ${highScore}`, 10, 20);
}

function gameLoop() {
  draw();

  // Move snake
  let headX = snake[0].x + dx;
  let headY = snake[0].y + dy;

  // Wrap or collision
  if (wrapChoice) {
    if (headX >= canvas.width) headX = 0;
    if (headX < 0) headX = canvas.width - box;
    if (headY >= canvas.height) headY = 0;
    if (headY < 0) headY = canvas.height - box;
  } else {
    if (headX < 0 || headX >= canvas.width || headY < 0 || headY >= canvas.height) {
      return resetGame();
    }
  }

  // Food collision
  if (headX === food.x && headY === food.y) {
    score += 10;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snakeHighScore", highScore);
    }
    food = {
      x: Math.floor(Math.random() * (canvas.width / box)) * box,
      y: Math.floor(Math.random() * (canvas.height / box)) * box
    };
  } else {
    snake.pop();
  }

  let newHead = { x: headX, y: headY };

  // Self collision
  for (let s of snake) {
    if (newHead.x === s.x && newHead.y === s.y) {
      return resetGame();
    }
  }

  snake.unshift(newHead);
  setTimeout(gameLoop, 100);
}

function resetGame() {
  alert("Game Over! Your score: " + score);
  startGame();
}
