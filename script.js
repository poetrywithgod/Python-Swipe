const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreboard = document.getElementById("scoreboard");

let themeChoice = null;
let wrapChoice = null;
let box = 20; // grid size
let snake, food, direction, score, highScore, gameLoop;

// Resize canvas dynamically
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ===== MENU SETUP =====
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    themeChoice = btn.dataset.theme;
    maybeStartGame();
  });
});

document.querySelectorAll(".wrap-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".wrap-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    wrapChoice = btn.dataset.wrap === "true";
    maybeStartGame();
  });
});

function maybeStartGame() {
  if (themeChoice && wrapChoice !== null) {
    startGame();
  }
}

// ===== GAME SETUP =====
function startGame() {
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  scoreboard.style.display = "block";

  // Theme colors
  let bg, snakeColor, foodColor;
  if (themeChoice === "classic") {
    bg = "lightblue"; snakeColor = "green"; foodColor = "red";
  } else if (themeChoice === "night") {
    bg = "black"; snakeColor = "white"; foodColor = "yellow";
  } else if (themeChoice === "neon") {
    bg = "purple"; snakeColor = "lime"; foodColor = "cyan";
  } else {
    bg = "black"; snakeColor = "green"; foodColor = "red";
  }

  // Game state
  snake = [{x: 9 * box, y: 10 * box}];
  direction = null;
  food = {
    x: Math.floor(Math.random() * (canvas.width/box)) * box,
    y: Math.floor(Math.random() * (canvas.height/box)) * box
  };
  score = 0;
  highScore = parseInt(localStorage.getItem("snakeHighScore")) || 0;

  function draw() {
    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Snake
    for (let i = 0; i < snake.length; i++) {
      ctx.fillStyle = (i === 0) ? snakeColor : "white";
      ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }

    // Food
    ctx.fillStyle = foodColor;
    ctx.fillRect(food.x, food.y, box, box);

    // Movement
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;
    if (direction === "LEFT") snakeX -= box;
    if (direction === "UP") snakeY -= box;
    if (direction === "RIGHT") snakeX += box;
    if (direction === "DOWN") snakeY += box;

    // Wrap / Border collision
    if (wrapChoice) {
      if (snakeX < 0) snakeX = canvas.width - box;
      if (snakeX >= canvas.width) snakeX = 0;
      if (snakeY < 0) snakeY = canvas.height - box;
      if (snakeY >= canvas.height) snakeY = 0;
    } else {
      if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height) {
        clearInterval(gameLoop);
        alert("Game Over!");
        return location.reload();
      }
    }

    // Check food
    if (snakeX === food.x && snakeY === food.y) {
      score++;
      food = {
        x: Math.floor(Math.random() * (canvas.width/box)) * box,
        y: Math.floor(Math.random() * (canvas.height/box)) * box
      };
    } else {
      snake.pop();
    }

    // New head
    const newHead = {x: snakeX, y: snakeY};

    // Self collision
    for (let seg of snake) {
      if (newHead.x === seg.x && newHead.y === seg.y) {
        clearInterval(gameLoop);
        alert("Game Over!");
        return location.reload();
      }
    }

    snake.unshift(newHead);

    // Scoreboard
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snakeHighScore", highScore);
    }
    scoreboard.textContent = `Score: ${score} | High Score: ${highScore}`;
  }

  gameLoop = setInterval(draw, 100);
}

// ===== CONTROLS =====
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
});

// Mobile D-pad
document.getElementById("btn-up").addEventListener("click", () => { if (direction !== "DOWN") direction = "UP"; });
document.getElementById("btn-down").addEventListener("click", () => { if (direction !== "UP") direction = "DOWN"; });
document.getElementById("btn-left").addEventListener("click", () => { if (direction !== "RIGHT") direction = "LEFT"; });
document.getElementById("btn-right").addEventListener("click", () => { if (direction !== "LEFT") direction = "RIGHT"; });

// Swipe controls
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
});
canvas.addEventListener("touchend", e => {
  const t = e.changedTouches[0];
  let dx = t.clientX - touchStartX;
  let dy = t.clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && direction !== "LEFT") direction = "RIGHT";
    else if (dx < 0 && direction !== "RIGHT") direction = "LEFT";
  } else {
    if (dy > 0 && direction !== "UP") direction = "DOWN";
    else if (dy < 0 && direction !== "DOWN") direction = "UP";
  }
});
