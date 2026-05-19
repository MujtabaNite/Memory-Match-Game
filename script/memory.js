/* Memory Game with sounds + background music + mute control */

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
const particlesContainer = document.getElementById("particles-container");

const emojis = ["🐼","🦊","🐯","🦁","🐧","🐸","🐵","🐙"]; // Animal-themed emojis
let cards = [];
let flippedCards = [];
let matchedCount = 0;
let moves = 0;
let time = 0;
let timer = null;
let musicStarted = false;
let isMuted = false;

// Audio objects (graceful fallback if missing)
const audioFlip = new Audio("Audios_Videos/flip.mp3");
const audioMatch = new Audio("Audios_Videos/match.mp3");
const audioWrong = new Audio("Audios_Videos/wrong.mp3");
const audioBg = new Audio("Audios_Videos/bg-music.mp3");
audioBg.loop = true;
audioBg.volume = 0.35;

function playSound(audio) {
  if (!audio) return;
  if (isMuted) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(e => {
        // Suppress play error
    });
  } catch (e) { }
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

  cards.forEach((emoji, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.emoji = emoji;
    card.dataset.index = index;

    const inner = document.createElement("div");
    inner.className = "inner";

    const front = document.createElement("div");
    front.className = "face front";

    const back = document.createElement("div");
    back.className = "face back";
    back.textContent = emoji; 

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener("click", onCardClick);
    
    // Add 3D hover effect
    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    
    gameContainer.appendChild(card);
  });
}

function handleMouseMove(e) {
  const card = e.currentTarget;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
  
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const rotateX = ((y - centerY) / centerY) * -15; // Max 15deg
  const rotateY = ((x - centerX) / centerX) * 15;
  
  const inner = card.querySelector('.inner');
  inner.style.transition = 'none';
  inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

function handleMouseLeave(e) {
  const card = e.currentTarget;
  const inner = card.querySelector('.inner');
  inner.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
  if (!card.classList.contains("flipped") && !card.classList.contains("matched")) {
    inner.style.transform = `rotateX(0deg) rotateY(0deg)`;
  }
}

function ensureMusicStarted() {
  if (!musicStarted) {
    musicStarted = true;
    if (!isMuted) {
      try { audioBg.play().catch(e=>{}); } catch (e) {}
    }
  }
}

function onCardClick(e) {
  ensureMusicStarted();

  const card = e.currentTarget;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
  if (flippedCards.length === 2) return;

  const inner = card.querySelector('.inner');
  
  // Reset inline styles (added by 3D hover) so CSS transitions can handle the flip
  inner.style.transition = '';
  inner.style.transform = '';
  
  // Force a browser reflow so the transition reset applies BEFORE the flip class is added
  void inner.offsetWidth; 

  card.classList.add("flipped");
  
  playSound(audioFlip);

  flippedCards.push(card);

  if (flippedCards.length === 1 && moves === 0 && time === 0) {
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
    // Matched
    setTimeout(() => {
      c1.classList.add("matched");
      c2.classList.add("matched");
      playSound(audioMatch);
      createParticles(c1);
      createParticles(c2);
      
      matchedCount += 2;
      flippedCards = [];

      if (matchedCount === cards.length) {
        stopTimer();
        setTimeout(showWinModal, 600);
      }
    }, 400); // slight delay for visual processing
  } else {
    // Not match
    playSound(audioWrong);
    
    // Add shake animation
    c1.style.animation = 'shake 0.4s ease-in-out';
    c2.style.animation = 'shake 0.4s ease-in-out';
    
    setTimeout(() => {
      c1.style.animation = '';
      c2.style.animation = '';
      c1.classList.remove("flipped");
      c2.classList.remove("flipped");
      flippedCards = [];
    }, 1000);
  }
}

// Particle effect on match
function createParticles(element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const colors = ['#00f0ff', '#10b981', '#ff007f', '#ffffff'];
  
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = centerX + 'px';
    particle.style.top = centerY + 'px';
    
    particlesContainer.appendChild(particle);
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = 50 + Math.random() * 100;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    
    particle.animate([
      { transform: `translate(-50%, -50%) scale(1)`, opacity: 1 },
      { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
    ], {
      duration: 600 + Math.random() * 400,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => particle.remove();
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
    triggerVictoryParticles();
  } else {
    newBestText.style.display = "none";
  }

  modal.classList.add("active");
  if (!isMuted) playSound(audioMatch);
}

function triggerVictoryParticles() {
  let count = 0;
  const interval = setInterval(() => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.backgroundColor = '#ff007f';
    particle.style.width = '12px';
    particle.style.height = '12px';
    
    particlesContainer.appendChild(particle);
    
    particle.animate([
      { transform: `translateY(0) scale(1)`, opacity: 1 },
      { transform: `translateY(-100px) scale(0)`, opacity: 0 }
    ], {
      duration: 1000,
      easing: 'ease-out'
    }).onfinish = () => particle.remove();
    
    count++;
    if(count > 30) clearInterval(interval);
  }, 50);
}

function updateBestDisplay() {
  const currentBest = localStorage.getItem("memory-best-time");
  bestText.textContent = currentBest || "--";
}

function startGame() {
  buildBoard();
  startTimer();
  movesText.textContent = moves;
  timeText.textContent = time;
}

function toggleMute() {
  isMuted = !isMuted;
  if (isMuted) {
    audioBg.pause();
    muteBtn.textContent = "🔇";
    muteBtn.style.opacity = "0.5";
  } else {
    muteBtn.textContent = "🔊";
    muteBtn.style.opacity = "1";
    if (musicStarted) {
      try { audioBg.play().catch(e=>{}); } catch (e) {}
    }
  }
}

restartBtn.addEventListener("click", () => {
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

updateBestDisplay();
buildBoard();
