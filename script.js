
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

  let score = 0, coins = 0, level = 1, lives = 1;
  let maxBombHits = 5, bombHits = 0;
  let doubleScoreActive = false, freezeActive = false;
  let freezeTimeout = null, doubleTimeout = null;
  let gamePaused = false;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playSound(type) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    switch (type) {
      case 'pop': o.type = 'sine'; o.frequency.setValueAtTime(500, audioCtx.currentTime); break;
      case 'coin': o.type = 'triangle'; o.frequency.setValueAtTime(800, audioCtx.currentTime); break;
      case 'bomb': o.type = 'square'; o.frequency.setValueAtTime(150, audioCtx.currentTime); break;
    }
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(type === 'bomb' ? 50 : 1500, audioCtx.currentTime + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    o.stop(audioCtx.currentTime + 0.35);
  }

  function randomPosition(size) {
    const padding = 150;
    const x = Math.random() * (window.innerWidth - size - padding);
    const y = Math.random() * (window.innerHeight - size - padding);
    return { x, y };
  }

  function moveElement(el, size) {
    const pos = randomPosition(size);
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
  }

  function updateStats() {
    scoreEl.textContent = score;
    coinsEl.textContent = coins;
    levelEl.textContent = level;
    livesEl.textContent = lives;
  }

  function levelUp() {
    level++;
    if (level === 20) maxBombHits = 5;
    else if (level === 40) maxBombHits = 2;
    else if (level === 60) maxBombHits = 0;
    bombHits = 0;
    updateStats();
  }

  function saveProgress() {
    localStorage.setItem('chillclick', JSON.stringify({ score, coins, level, lives, bombHits, doubleScoreActive, freezeActive }));
  }

  function loadProgress() {
    const data = JSON.parse(localStorage.getItem('chillclick'));
    if (data) {
      ({ score, coins, level, lives, bombHits, doubleScoreActive, freezeActive } = data);
      updateStats();
    }
  }

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

  function applyBonus(item) {
    if (item === 'freeze') {
      freezeActive = true;
      clearTimeout(freezeTimeout);
      freezeTimeout = setTimeout(() => freezeActive = false, 5000);
    } else if (item === 'double') {
      doubleScoreActive = true;
      clearTimeout(doubleTimeout);
      doubleTimeout = setTimeout(() => doubleScoreActive = false, 10000);
    } else if (item === 'star') {
      score += 10;
      coins += 10;
    }
    updateStats();
    saveProgress();
  }

  function togglePause(state) {
    gamePaused = state;
    pauseMenu.classList.toggle('hidden', !state);
    if (!state) moveAll();
  }

  function moveAll() {
    if (gamePaused) return;
    moveElement(bubble, 100);
    if (!freezeActive) {
      moveElement(coin, 80);
      moveElement(bomb, 80);
    }
    setTimeout(moveAll, Math.max(500, 2000 - level * 30));
  }

  // Події
  bubble.addEventListener('click', () => {
    if (gamePaused) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playSound('pop');
    score += doubleScoreActive ? 2 : 1;
    if (score % 10 === 0) levelUp();
    updateStats();
    moveElement(bubble, 100);
    saveProgress();
  });

  coin.addEventListener('click', () => {
    if (gamePaused || freezeActive) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playSound('coin');
    coins++;
    score += doubleScoreActive ? 4 : 2;
    updateStats();
    moveElement(coin, 80);
    saveProgress();
  });

  bomb.addEventListener('click', () => {
    if (gamePaused || freezeActive) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playSound('bomb');
    score = Math.max(0, score - 5);
    bombHits++;
    if (level >= 20 && bombHits > maxBombHits) resetGame();
    updateStats();
    moveElement(bomb, 80);
    saveProgress();
  });

  shopBtn.addEventListener('click', () => {
    shop.classList.remove('hidden');
    playSound('pop');
  });

  closeShopBtn.addEventListener('click', () => shop.classList.add('hidden'));

  buyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cost = +btn.dataset.cost;
      const item = btn.dataset.item;
      if (coins >= cost) {
        coins -= cost;
        applyBonus(item);
        alert(`Куплено: ${btn.textContent}`);
      } else {
        alert('Недостатньо монет!');
      }
      updateStats();
      saveProgress();
    });
  });

  pauseBtn.addEventListener('click', () => togglePause(true));
  resumeBtn.addEventListener('click', () => togglePause(false));

  // Старт
  loadProgress();
  updateStats();
  moveAll();