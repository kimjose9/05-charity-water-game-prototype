const gameBoard = document.querySelector("#gameBoard");
const gameScene = document.querySelector("#gameScene");
const activePath = document.querySelector("#activePath");
const dugPath = document.querySelector("#dugPath");
const waterPath = document.querySelector("#waterPath");
const canWater = document.querySelector("#canWater");
const scoreDisplay = document.querySelector("#score");
const gameMessage = document.querySelector("#gameMessage");
const progressFill = document.querySelector("#progressFill");
const progressTrack = document.querySelector("#progressTrack");
const resetButton = document.querySelector("#resetButton");

const goal = 10;
const spring = { x: 112, y: 207 };
const canOpening = { x: 625, y: 293 };
const rock = { x: 355, y: 307 };
let routePoints = [];
let isDigging = false;
let routeConnected = false;
let gameWon = false;
let score = 0;
let waterTimer;

function getBoardPoint(event) {
  const bounds = gameBoard.getBoundingClientRect();

  return {
    x: ((event.clientX - bounds.left) / bounds.width) * 720,
    y: ((event.clientY - bounds.top) / bounds.height) * 500
  };
}

function distanceBetween(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function drawSmoothPath(points) {
  if (points.length === 0) {
    return "";
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const midpointX = (points[index].x + points[index + 1].x) / 2;
    const midpointY = (points[index].y + points[index + 1].y) / 2;
    path += ` Q ${points[index].x} ${points[index].y} ${midpointX} ${midpointY}`;
  }

  if (points.length > 1) {
    const lastPoint = points[points.length - 1];
    path += ` T ${lastPoint.x} ${lastPoint.y}`;
  }

  return path;
}

function updateScore() {
  const fillPercent = Math.round((score / goal) * 100);

  scoreDisplay.textContent = score;
  canWater.style.height = `${fillPercent}%`;
  progressFill.style.width = `${fillPercent}%`;
  progressTrack.setAttribute("aria-valuenow", score);
}

function resetGame() {
  window.clearInterval(waterTimer);
  routePoints = [];
  isDigging = false;
  routeConnected = false;
  gameWon = false;
  score = 0;
  activePath.setAttribute("d", "");
  dugPath.setAttribute("d", "");
  waterPath.setAttribute("d", "");
  waterPath.classList.remove("flowing");
  canWater.style.height = "0";
  gameMessage.textContent = "Start at the spring and dig a tunnel to the can!";
  gameMessage.classList.remove("win-message", "mud-message");
  document.querySelectorAll(".confetti").forEach((piece) => piece.remove());
  updateScore();
}

function startDigging(event) {
  if (gameWon || event.button !== 0) {
    return;
  }

  const point = getBoardPoint(event);

  if (distanceBetween(point, spring) > 55) {
    gameMessage.textContent = "Start your tunnel at the water spring on the left.";
    gameMessage.classList.add("mud-message");
    return;
  }

  routePoints = [spring, point];
  isDigging = true;
  routeConnected = false;
  window.clearInterval(waterTimer);
  gameMessage.classList.remove("mud-message");
  gameMessage.textContent = "Keep digging through the earth to reach your can!";
  waterPath.setAttribute("d", "");
  activePath.setAttribute("d", drawSmoothPath(routePoints));
  gameBoard.setPointerCapture(event.pointerId);
}

function continueDigging(event) {
  if (!isDigging) {
    return;
  }

  const point = getBoardPoint(event);
  const previousPoint = routePoints[routePoints.length - 1];

  if (distanceBetween(point, previousPoint) < 5) {
    return;
  }

  routePoints.push(point);
  const path = drawSmoothPath(routePoints);
  activePath.setAttribute("d", path);
}

function stopDigging() {
  if (!isDigging) {
    return;
  }

  isDigging = false;
  activePath.setAttribute("d", "");

  if (routePoints.length < 3) {
    gameMessage.textContent = "Drag from the spring to carve a longer tunnel.";
    gameMessage.classList.add("mud-message");
    return;
  }

  const startPoint = routePoints[0];
  const endPoint = routePoints[routePoints.length - 1];
  const reachesSpring = distanceBetween(startPoint, spring) < 55;
  const reachesCan = distanceBetween(endPoint, canOpening) < 76;
  const hitsRock = routePoints.some((point) => distanceBetween(point, rock) < 42);

  dugPath.setAttribute("d", drawSmoothPath(routePoints));

  if (hitsRock) {
    gameMessage.textContent = "There’s a big rock in the way. Dig around it!";
    gameMessage.classList.add("mud-message");
    return;
  }

  if (!reachesSpring || !reachesCan) {
    gameMessage.textContent = "Your tunnel needs to connect the spring to the can. Try again!";
    gameMessage.classList.add("mud-message");
    return;
  }

  routeConnected = true;
  gameMessage.classList.remove("mud-message");
  gameMessage.textContent = "The water found your tunnel! Watch it fill the can.";
  waterPath.setAttribute("d", drawSmoothPath(routePoints));
  waterPath.classList.add("flowing");
  waterTimer = window.setInterval(collectWater, 720);
}

function collectWater() {
  if (!routeConnected || gameWon) {
    return;
  }

  score = Math.min(score + 1, goal);
  updateScore();

  if (score >= goal) {
    winGame();
  }
}

function winGame() {
  gameWon = true;
  window.clearInterval(waterTimer);
  gameMessage.textContent = "You did it! Clean water, drop by drop. 🎉";
  gameMessage.classList.add("win-message");
  makeConfetti();
}

function makeConfetti() {
  const colors = ["#ffc907", "#2e9df7", "#4fcb53", "#ff902a", "#8bd1cb"];

  for (let index = 0; index < 34; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    piece.style.setProperty("--confetti-tilt", `${Math.random() * 360}deg`);
    gameScene.append(piece);
    window.setTimeout(() => piece.remove(), 2600);
  }
}

gameBoard.addEventListener("pointerdown", startDigging);
gameBoard.addEventListener("pointermove", continueDigging);
gameBoard.addEventListener("pointerup", stopDigging);
gameBoard.addEventListener("pointercancel", stopDigging);
resetButton.addEventListener("click", resetGame);

gameBoard.addEventListener("contextmenu", (event) => event.preventDefault());
resetGame();
