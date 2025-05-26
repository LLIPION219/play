// Основні змінні
let score = 0, coins = 0, level = 1, lives = 1;
let bombHits = 0, maxBombHits = 5;
let doubleScoreActive = false, freezeActive = false;
let freezeTimeout = null, doubleTimeout = null;
let gamePaused = false;

const bubble = document.getElementById('bubble');
const coin = document.getElementById('coin');
const bomb = document.getElementById('bomb');

const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');

const shopBtn = document.getElementById('shop-btn');
const shop = document.getElementById('shop');
const closeShopBtn = document.getElementById('close-shop');
const buyButtons = document.querySelectorAll('.buy-btn');

const pauseBtn = document.getElementById('pause-btn');
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Функції звуків (як раніше)
function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g);
  g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.3, audioCtx.currentTime);

  switch (type) {
    case 'pop':
      o.type = 'sine';
      o.frequency.setValueAtTime(500, audioCtx.currentTime);
      break;
    case 'coin':
      o.type = 'triangle';
      o.frequency.setValueAtTime(800, audioCtx.currentTime);
      break;
    case 'bomb':
      o.type = 'square';
      o.frequency.setValueAtTime(150, audioCtx.currentTime);
      break;
  }
  o.start();
  o.frequency.exponentialRampToValueAtTime(type === 'bomb' ? 50 : 1200, audioCtx.currentTime + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  o.stop(audioCtx.currentTime + 0.15);
}

// Рандомна позиція з врахуванням розміру елемента
function randomPosition(size = 80) {
  const padding = 20;
  const x = Math.random() * (window.innerWidth - size - padding);
  const y = Math.random() * (window.innerHeight - size - padding);
  return { x, y };
}

// Плавно перемістити елемент і анімувати появу
function moveAndShow(el, size = 80) {
  if (gamePaused) return;

  // Спочатку показати елемент (opacity 1)
  el.style.opacity = '1';

  // Встановити нову позицію
  const pos = randomPosition(size);
  el.style.left = pos.x + 'px';
  el.style.top = pos.y + 'px';
}

// Плавно сховати елемент (opacity 0)
function hideElement(el) {
  el.style.opacity = '0';
}

// Оновлення статистики на екрані
function updateStats() {
  scoreEl.textContent = score;
  coinsEl.textContent = coins;
  levelEl.textContent = level;
  livesEl.textContent = lives;
}

// Підвищення рівня
function levelUp() {
  level++;
  if (level === 20) maxBombHits = 5;
  else if (level === 40) maxBombHits = 2;
  else if (level === 60) maxBombHits = 0;
  bombHits = 0;
  updateStats();
  saveProgress();
}

// Збереження прогресу
function saveProgress() {
  localStorage.setItem('chillclick', JSON.stringify({
    score, coins, level, lives, bombHits, doubleScoreActive, freezeActive
  }));
}

// Завантаження прогресу
function loadProgress() {
  const data = JSON.parse(localStorage.getItem('chillclick'));
  if (data) {
    ({ score, coins, level, lives, bombHits, doubleScoreActive, freezeActive } = data);
    updateStats();
  }
}

// Скидання гри (коли закінчуються життя)
function resetGame() {
  if (lives > 0) {
    lives--;
    bombHits = 0;
    alert('Ви використали життя, гра продовжується!');
  } else {
    alert(`Гра закінчена!\nРекорд: ${score}\nПройдено рівнів: ${level}`);
    score = 0; coins = 0; level = 1; lives = 1;
    bombHits = 0; doubleScoreActive = false; freezeActive = false;
  }
  updateStats();
  saveProgress();
}

// Активує бонуси з магазину
function applyBonus(item) {
  if (item === 'freeze') {
    freezeActive = true;
    clearTimeout(freezeTimeout);
    freezeTimeout = setTimeout(() => {
      freezeActive = false;
    }, 5000);
  } else if (item === 'double') {
    doubleScoreActive = true;
    clearTimeout(doubleTimeout);
    doubleTimeout = setTimeout(() => {
      doubleScoreActive = false;
    }, 10000);
  } else if (item === 'star') {
    score += 10;
    coins += 10;
  }
  updateStats();
  saveProgress();
}

// Пауза і відновлення гри
function togglePause(state) {
  gamePaused = state;
  pauseMenu.classList.toggle('hidden', !state);
  if (!state) {
    // Запустити рух обʼєктів, якщо не заморожено
    if (!freezeActive) {
      startMovement();
    }
  }
}

// Обробка кліків

bubble.addEventListener('click', () => {
  if (gamePaused) return;
  playSound('pop');
  score += doubleScoreActive ? 2 : 1;
  if (score % 10 === 0) levelUp();
  updateStats();
  moveAndShow(bubble, 80);
  saveProgress();
});

coin.addEventListener('click', () => {
  if (gamePaused || freezeActive) return;
  playSound('coin');
  coins++;
  score += doubleScoreActive ? 4 : 2;
  updateStats();
  moveAndShow(coin, 80);
  saveProgress();
});

bomb.addEventListener('click', () => {
  if (gamePaused || freezeActive) return;
  playSound('bomb');
  score -= 5;
  bombHits++;
  if (bombHits > maxBombHits) {
    resetGame();
  }
  updateStats();
  moveAndShow(bomb, 80);
  saveProgress();
});

// Кнопки магазину
shopBtn.addEventListener('click', () => {
  shop.classList.remove('hidden');
});

closeShopBtn.addEventListener('click', () => {
  shop.classList.add('hidden');
});

buyButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.dataset.item;
    const cost = Number(btn.dataset.cost);
    if (coins >= cost) {
      coins -= cost;
      applyBonus(item);
      alert(`Ви купили: ${btn.textContent}`);
      shop.classList.add('hidden');
      updateStats();
      saveProgress();
    } else {
      alert('Недостатньо монет для покупки!');
    }
  });
});

// Пауза та відновлення
pauseBtn.addEventListener('click', () => {
  togglePause(true);
});

resumeBtn.addEventListener('click', () => {
  togglePause(false);
});

// Циклічний рух обʼєктів з різною затримкою
let bubbleInterval, coinInterval, bombInterval;

function startMovement() {
  if (bubbleInterval) clearInterval(bubbleInterval);
  if (coinInterval) clearInterval(coinInterval);
  if (bombInterval) clearInterval(bombInterval);

  // Запустити цикл появи та руху для bubble
  moveAndShow(bubble, 80);
  bubbleInterval = setInterval(() => {
    moveAndShow(bubble, 80);
  }, 3000);

  // Для coin (якщо не заморожено)
  if (!freezeActive) {
    moveAndShow(coin, 80);
    coinInterval = setInterval(() => {
      moveAndShow(coin, 80);
    }, 4500);
  } else {
    hideElement(coin);
  }

  // Для bomb (якщо не заморожено)
  if (!freezeActive) {
    moveAndShow(bomb, 80);
    bombInterval = setInterval(() => {
      moveAndShow(bomb, 80);
    }, 5000);
  } else {
    hideElement(bomb);
  }
}

// Ініціалізація гри
function init() {
  loadProgress();
  updateStats();
  startMovement();
}

init();
