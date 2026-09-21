// ESTADO DO JOGO
let gameState = {
  coins: 0,
  baseClickPower: 1,
  multiplier: 1,
  coinsPerSecond: 0,
  tierIndex: 0,
  combo: 1,
  selectedSkinColor: null
};

let lastClickTime = 0;
let comboTimer = null;

const pokeballImgUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";

// GERADOR DE EFEITOS SONOROS (WEB AUDIO API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'click') {
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } else if (type === 'crit') {
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } else if (type === 'golden') {
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  }
}

// EVOLUÇÕES DA POKEBALL PRINCIPAL
const pokeballs = [
  { name: "Pokeball Clássica", badge: "Comum", color: "#ef4444", req: 0 },
  { name: "Great Ball", badge: "Incomum", color: "#3b82f6", req: 200 },
  { name: "Ultra Ball", badge: "Rara", color: "#eab308", req: 2000 },
  { name: "Master Ball", badge: "Lendária", color: "#a855f7", req: 15000 },
  { name: "Safari Ball", badge: "Épica", color: "#22c55e", req: 80000 },
  { name: "Ultra Beast Ball", badge: "Mítica", color: "#06b6d4", req: 300000 },
  { name: "Luxury Ball", badge: "Luxo", color: "#1e293b", req: 1200000 },
  { name: "Master Gold Ball", badge: "Suprema", color: "#f59e0b", req: 5000000 }
];

// SKINS DESBLOQUEÁVEIS
const skins = [
  { name: "Vermelha Padrão", color: "#ef4444" },
  { name: "Azul Neon", color: "#06b6d4" },
  { name: "Rosa Amor", color: "#ec4899" },
  { name: "Sombria", color: "#334155" },
  { name: "Verde Esmeralda", color: "#10b981" },
  { name: "Dourada Reluzente", color: "#f59e0b" }
];

// UPGRADES BASE AMPLIADOS
const upgrades = [
  { id: "click1", name: "Clique Duplo", isDoubleBall: true, desc: "+1 por Clique Base", cost: 15, cpc: 1, cps: 0, count: 0, mult: 1.4 },
  { id: "auto1", name: "Pikachu Ajudante", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png", desc: "+1 por Segundo", cost: 50, cpc: 0, cps: 1, count: 0, mult: 1.35 },
  { id: "click2", name: "Luva de Captura", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/power-bracer.png", desc: "+5 por Clique Base", cost: 150, cpc: 5, cps: 0, count: 0, mult: 1.5 },
  { id: "auto2", name: "Centro Pokémon", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-potion.png", desc: "+8 por Segundo", cost: 400, cpc: 0, cps: 8, count: 0, mult: 1.4 },
  { id: "click3", name: "Arremesso Perfeito", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/scope-lens.png", desc: "+25 por Clique Base", cost: 1200, cpc: 25, cps: 0, count: 0, mult: 1.6 },
  { id: "auto3", name: "Charizard de Elite", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png", desc: "+40 por Segundo", cost: 3000, cpc: 0, cps: 40, count: 0, mult: 1.5 },
  { id: "click4", name: "Mewtwo Telepático", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png", desc: "+100 por Clique Base", cost: 10000, cpc: 100, cps: 0, count: 0, mult: 1.65 },
  { id: "auto4", name: "Fábrica Silph Co.", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/up-grade.png", desc: "+250 por Segundo", cost: 35000, cpc: 0, cps: 250, count: 0, mult: 1.55 },
  { id: "auto5", name: "Rayquaza Lendário", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png", desc: "+1,200 por Segundo", cost: 150000, cpc: 0, cps: 1200, count: 0, mult: 1.6 }
];

// MULTIPLICADORES DE POKEBALL AMPLIADOS
const multiplierUpgrades = [
  { id: "m_great", name: "Super Ball Boost", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png", desc: "Multiplica cliques por 2x", cost: 500, factor: 2, bought: false },
  { id: "m_ultra", name: "Ultra Ball Boost", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png", desc: "Multiplica cliques por 2x (Total 4x)", cost: 3500, factor: 2, bought: false },
  { id: "m_master", name: "Master Ball Boost", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png", desc: "Multiplica cliques por 2x (Total 8x)", cost: 25000, factor: 2, bought: false },
  { id: "m_safari", name: "Safari Ball Boost", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/safari-ball.png", desc: "Multiplica cliques por 2x (Total 16x)", cost: 150000, factor: 2, bought: false },
  { id: "m_gold", name: "Master Gold Boost", icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luxury-ball.png", desc: "Multiplica cliques por 3x (Total 48x)", cost: 1000000, factor: 3, bought: false }
];

// ELEMENTOS DOM
const gameContainer = document.getElementById("game-container");
const pokeballBtn = document.getElementById("pokeball-btn");
const pokeballTopBg = document.getElementById("pokeball-top-bg");
const lblCoins = document.getElementById("lbl-coins");
const lblCpc = document.getElementById("lbl-cpc");
const lblCps = document.getElementById("lbl-cps");
const lblBadge = document.getElementById("lbl-badge");
const lblBallName = document.getElementById("lbl-ball-name");
const lblCombo = document.getElementById("lbl-combo");
const upgradesContainer = document.getElementById("upgrades-container");
const multipliersContainer = document.getElementById("multipliers-container");
const skinsContainer = document.getElementById("skins-container");

// ABAS DO PAINEL DA LOJA
function switchTab(tabName) {
  document.getElementById("tab-upgrades").classList.add("hidden");
  document.getElementById("tab-multipliers").classList.add("hidden");
  document.getElementById("tab-skins").classList.add("hidden");
  
  document.getElementById("tab-upgrades-btn").classList.remove("active");
  document.getElementById("tab-multipliers-btn").classList.remove("active");
  document.getElementById("tab-skins-btn").classList.remove("active");

  document.getElementById(`tab-${tabName}`).classList.remove("hidden");
  document.getElementById(`tab-${tabName}-btn`).classList.add("active");
}

function getTotalClickPower() {
  return Math.floor(gameState.baseClickPower * gameState.multiplier * gameState.combo);
}

// EVENTO DE CLIQUE DA POKEBALL PRINCIPAL
pokeballBtn.addEventListener("pointerdown", (e) => {
  const now = Date.now();
  if (now - lastClickTime < 300) {
    gameState.combo = Math.min(3.0, parseFloat((gameState.combo + 0.1).toFixed(1)));
  }
  lastClickTime = now;

  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    gameState.combo = 1.0;
    updateUI();
  }, 1000);

  // CHANCE DE CAPTURA CRÍTICA (10% DE CHANCE PARA 5X DE GANHO)
  const isCrit = Math.random() < 0.10;
  let power = getTotalClickPower();
  if (isCrit) {
    power *= 5;
    playSound('crit');
  } else {
    playSound('click');
  }

  gameState.coins += power;

  createFloatingText(e, power, isCrit);
  checkEvolution();
  updateUI();
});

function createFloatingText(event, power, isCrit = false) {
  const rect = pokeballBtn.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const floatEl = document.createElement("div");
  floatEl.className = `float-text ${isCrit ? 'crit' : ''}`;
  floatEl.innerHTML = `<span class="mario-coin" style="width:14px; height:18px;"></span>+${power}${isCrit ? ' CRIT!' : ''}`;
  floatEl.style.left = `${x}px`;
  floatEl.style.top = `${y}px`;

  const angle = Math.random() * Math.PI * 2;
  const distance = 70 + Math.random() * 50;

  floatEl.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
  floatEl.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

  pokeballBtn.appendChild(floatEl);
  setTimeout(() => floatEl.remove(), 800);
}

// MECÂNICA DA POKEBALL DOURADA SURPRESA (SHINY)
function spawnGoldenBall() {
  const golden = document.createElement("div");
  golden.className = "golden-ball";
  golden.style.top = `${Math.random() * 70 + 15}%`;
  golden.style.left = `${Math.random() * 70 + 15}%`;

  golden.addEventListener("click", () => {
    const reward = Math.max(50, Math.floor(getTotalClickPower() * 20));
    gameState.coins += reward;
    playSound('golden');
    golden.remove();
    updateUI();
  });

  gameContainer.appendChild(golden);
  setTimeout(() => golden.remove(), 5000);
}

setInterval(() => {
  if (Math.random() < 0.3) spawnGoldenBall();
}, 45000);

function checkEvolution() {
  if (!gameState.selectedSkinColor && gameState.tierIndex + 1 < pokeballs.length) {
    const nextTier = pokeballs[gameState.tierIndex + 1];
    if (gameState.coins >= nextTier.req) {
      gameState.tierIndex++;
      const current = pokeballs[gameState.tierIndex];
      lblBadge.innerText = current.badge;
      lblBadge.style.background = current.color;
      lblBallName.innerText = current.name;
      pokeballTopBg.style.background = current.color;
    }
  }
}

function applySkin(color) {
  gameState.selectedSkinColor = color;
  pokeballTopBg.style.background = color;
}

function buyUpgrade(index) {
  const upg = upgrades[index];
  if (gameState.coins >= upg.cost) {
    gameState.coins -= upg.cost;
    upg.count++;
    gameState.baseClickPower += upg.cpc;
    gameState.coinsPerSecond += upg.cps;
    upg.cost = Math.floor(upg.cost * upg.mult);

    renderUpgrades();
    checkEvolution();
    updateUI();
  }
}

function buyMultiplier(index) {
  const upg = multiplierUpgrades[index];
  if (!upg.bought && gameState.coins >= upg.cost) {
    gameState.coins -= upg.cost;
    upg.bought = true;
    gameState.multiplier *= upg.factor;

    renderMultipliers();
    checkEvolution();
    updateUI();
  }
}

function renderUpgrades() {
  upgradesContainer.innerHTML = "";
  upgrades.forEach((upg, idx) => {
    const card = document.createElement("div");
    card.className = "upgrade-card";

    let iconHTML = `<img src="${upg.icon}" class="upgrade-icon-img">`;
    if (upg.isDoubleBall) {
      iconHTML = `
        <div class="double-pokeball-icon">
          <img src="${pokeballImgUrl}" class="bg-ball">
          <img src="${pokeballImgUrl}" class="fg-ball">
        </div>`;
    }

    card.innerHTML = `
      <div class="upgrade-info">
        ${iconHTML}
        <div class="upgrade-details">
          <span class="upgrade-name">${upg.name} (${upg.count})</span>
          <span class="upgrade-desc">${upg.desc}</span>
        </div>
      </div>
      <button class="buy-btn" id="btn-upg-${idx}" onclick="buyUpgrade(${idx})">
        <span class="mario-coin" style="width:12px; height:16px;"></span>
        ${upg.cost.toLocaleString()}
      </button>`;
    upgradesContainer.appendChild(card);
  });
}

function renderMultipliers() {
  multipliersContainer.innerHTML = "";
  multiplierUpgrades.forEach((upg, idx) => {
    const card = document.createElement("div");
    card.className = "upgrade-card";
    card.innerHTML = `
      <div class="upgrade-info">
        <img src="${upg.icon}" class="upgrade-icon-img">
        <div class="upgrade-details">
          <span class="upgrade-name">${upg.name}</span>
          <span class="upgrade-desc">${upg.desc}</span>
        </div>
      </div>
      <button class="buy-btn" id="btn-mult-${idx}" onclick="buyMultiplier(${idx})">
        ${upg.bought ? 'COMPRADO' : `<span class="mario-coin" style="width:12px; height:16px;"></span> ${upg.cost.toLocaleString()}`}
      </button>`;
    multipliersContainer.appendChild(card);
  });
}

function renderSkins() {
  skinsContainer.innerHTML = "";
  skins.forEach((sk) => {
    const card = document.createElement("div");
    card.className = "upgrade-card";
    card.innerHTML = `
      <div class="upgrade-info">
        <div style="width:30px; height:30px; border-radius:50%; background:${sk.color}; border:2px solid #fff;"></div>
        <div class="upgrade-details">
          <span class="upgrade-name">${sk.name}</span>
        </div>
      </div>
      <button class="buy-btn" onclick="applySkin('${sk.color}')">Equipar</button>`;
    skinsContainer.appendChild(card);
  });
}

function updateUI() {
  lblCoins.innerText = Math.floor(gameState.coins).toLocaleString();
  lblCpc.innerText = `+${getTotalClickPower()}`;
  lblCps.innerText = `${gameState.coinsPerSecond}/s`;
  lblCombo.innerText = `Combo: ${gameState.combo.toFixed(1)}x`;

  upgrades.forEach((upg, idx) => {
    const btn = document.getElementById(`btn-upg-${idx}`);
    if (btn) btn.disabled = gameState.coins < upg.cost;
  });

  multiplierUpgrades.forEach((upg, idx) => {
    const btn = document.getElementById(`btn-mult-${idx}`);
    if (btn) btn.disabled = upg.bought || gameState.coins < upg.cost;
  });
}

setInterval(() => {
  if (gameState.coinsPerSecond > 0) {
    gameState.coins += gameState.coinsPerSecond / 10;
    checkEvolution();
    updateUI();
  }
}, 100);

renderUpgrades();
renderMultipliers();
renderSkins();
updateUI();
