/* Memory Game with sounds + background music + mute control
   Place audio files in ../Audio and Video/ as:
     - flip.mp3
     - match.mp3
     - wrong.mp3
     - bg-music.mp3
*/

const gameContainer = document.getElementById("game");
const timeText = document.getElementById("time");
const movesText = document.getElementById("moves");
const restartBtn = document.getElementById("restart");
const muteBtn = document.getElementById("mute");
const bestText = document.getElementById("best");

// Modal elements
const modal = document.getElementById("modal");
const finalTimeText = document.getElementById("final-time");
const finalMovesText = document.getElementById("final-moves");
const newBestText = document.getElementById("new-best");
const modalRestartBtn = document.getElementById("modal-restart");

const emojis = ["🐼","👀","🍒","🍇","🫠","🥺","🐍","🤨"]; // 8 pairs -> 16 cards
let cards = [];
let flippedCards = [];
let matchedCount = 0;
let moves = 0;
let time = 0;
let timer = null;
let musicStarted = false;
let isMuted = false;

// audio objects (paths relative to memory.html)
const audioFlip = new Audio("Audios_Videos/flip.mp3");
const audioMatch = new Audio("Audios_Videos/match.mp3");
const audioWrong = new Audio("Audios_Videos/wrong.mp3");
const audioBg = new Audio("Audios_Videos/bg-music.mp3");
audioBg.loop = true;
audioBg.volume = 0.35;

// ensure quick-replay by resetting currentTime before each play
function playSound(audio) {
  if (!audio) return;
  if (isMuted) return;
  try {
    audio.currentTime = 0;
    audio.play();
  } catch (e) {
    // browsers may block autoplay until user interacts — ignore
  }
}

// Fisher-Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function startTimer() {
  clearInterval(timer);
  time = 0;
  timeText.textContent = time;
  timer = setInterval(() => {
    time++;
    timeText.textContent = time;
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function buildBoard() {
  gameContainer.innerHTML = "";
  cards = [...emojis, ...emojis];
  shuffle(cards);
  matchedCount = 0;
  moves = 0;
  flippedCards = [];
  movesText.textContent = moves;
  timeText.textContent = time;

  // create card elements
  cards.forEach((emoji, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.emoji = emoji;
    card.dataset.index = index;

    const inner = document.createElement("div");
    inner.className = "inner";

    const front = document.createElement("div");
    front.className = "face front";
    front.textContent = ""; // hidden face

    const back = document.createElement("div");
    back.className = "face back";
    back.textContent = emoji; // visible when flipped

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener("click", onCardClick);
    gameContainer.appendChild(card);
  });
}

function ensureMusicStarted() {
  // start background music once after first user interaction if not muted
  if (!musicStarted) {
    musicStarted = true;
    if (!isMuted) {
      try { audioBg.play(); } catch (e) {}
    }
  }
}

function onCardClick(e) {
  ensureMusicStarted();

  const card = e.currentTarget;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
  if (flippedCards.length === 2) return;

  // flip visual
  card.classList.add("flipped");
  playSound(audioFlip);

  flippedCards.push(card);

  if (flippedCards.length === 1 && moves === 0 && time === 0) {
    // start timer on first move
    startTimer();
  }

  if (flippedCards.length === 2) {
    moves++;
    movesText.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [c1, c2] = flippedCards;
  if (!c1 || !c2) return;

  const e1 = c1.dataset.emoji;
  const e2 = c2.dataset.emoji;

  if (e1 === e2) {
    // matched
    c1.classList.add("matched");
    c2.classList.add("matched");
    playSound(audioMatch);
    matchedCount += 2;
    flippedCards = [];

    if (matchedCount === cards.length) {
      stopTimer();
      showWinModal();
    }
  } else {
    // not match
    playSound(audioWrong);
    setTimeout(() => {
      c1.classList.remove("flipped");
      c2.classList.remove("flipped");
      flippedCards = [];
    }, 700);
  }
}

function showWinModal() {
  finalTimeText.textContent = time;
  finalMovesText.textContent = moves;

  const currentBest = localStorage.getItem("memory-best-time");
  if (!currentBest || time < parseInt(currentBest)) {
    localStorage.setItem("memory-best-time", time);
    newBestText.style.display = "block";
    updateBestDisplay();
  } else {
    newBestText.style.display = "none";
  }

  setTimeout(() => {
    modal.classList.add("active");
    if (!isMuted) playSound(audioMatch);
  }, 500);
}

function updateBestDisplay() {
  const currentBest = localStorage.getItem("memory-best-time");
  bestText.textContent = currentBest || "--";
}

// restart logic
function startGame() {
  // stop music? keep playing if already started
  buildBoard();
  startTimer();
  // reset moves/time display
  movesText.textContent = moves;
  timeText.textContent = time;
}

// mute/unmute
function toggleMute() {
  isMuted = !isMuted;
  if (isMuted) {
    audioBg.pause();
    muteBtn.textContent = "🔇";
  } else {
    muteBtn.textContent = "🔊";
    // start bg if previously started
    if (musicStarted) {
      try { audioBg.play(); } catch (e) {}
    }
  }
}

// wire up
restartBtn.addEventListener("click", () => {
  // restart game and reset timer/board
  stopTimer();
  time = 0;
  moves = 0;
  startGame();
});

muteBtn.addEventListener("click", toggleMute);

modalRestartBtn.addEventListener("click", () => {
  modal.classList.remove("active");
  startGame();
});

// initialize
updateBestDisplay();
buildBoard();
