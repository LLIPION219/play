let score = 0;
  const scoreEl = document.getElementById('score');

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playPop() {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(600, audioCtx.currentTime);
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o.stop(audioCtx.currentTime + 0.15);
  }

  function playCoinSound() {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(800, audioCtx.currentTime);
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    o.stop(audioCtx.currentTime + 0.2);
  }

  function playExplosionSound() {
    const bufferSize = 4096;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    whiteNoise.start();
    whiteNoise.stop(audioCtx.currentTime + 0.4);
  }

  function randomPosition() {
    const padding = 170;
    const x = Math.random() * (window.innerWidth - padding);
    const y = Math.random() * (window.innerHeight - padding);
    return {x, y};
  }

  function spawnItem() {
    const types = ['bubble', 'coin', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];

    const div = document.createElement('div');
    div.classList.add('item', type);
    const {x, y} = randomPosition();
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    document.body.appendChild(div);

    div.addEventListener('click', () => {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (type === 'bubble') {
        playPop();
        score += 1;
      } else if (type === 'coin') {
        playCoinSound();
        score += 2;
      } else if (type === 'bomb') {
        playExplosionSound();
        score -= 5;
      }
      scoreEl.textContent = 'Балів: ' + score;
      div.remove();
      spawnItem();
    });

    // Якщо не натиснуто протягом 3 сек — замінити
    setTimeout(() => {
      if (document.body.contains(div)) {
        div.remove();
        spawnItem();
      }
    }, 3000);
  }

  // Почати гру
  spawnItem();