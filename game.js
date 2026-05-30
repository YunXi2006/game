/* =============================================
   詩仙回歸記 — 遊戲引擎
   ============================================= */

/* ── 遊戲狀態 ── */

const state = {
  clue:      0,
  sense:     0,
  favor:     0,
  timeLeft:  5,
  inventory: ['酒葫蘆'],
  current:   'scene_1_1'
};

/* ── 成就定義 ── */

const ACHIEVEMENTS = [
  {
    id:     'escape',
    name:   '脫籠之鵠',
    desc:   '完成了這段跨越千年的旅程',
    hidden: false,
    check:  () => true
  },
  {
    id:     'mirror',
    name:   '如鏡之新開',
    desc:   '收集了四條以上的關鍵線索',
    hidden: false,
    check:  () => state.clue >= 4
  },
  {
    id:     'favor',
    name:   '始知郊田之外',
    desc:   '以真摯的善意打動了現代人的心',
    hidden: true,
    check:  () => state.favor >= 3
  },
  {
    id:     'timelost',
    name:   '城居者未之知',
    desc:   '在時限耗盡後仍完成了回歸',
    hidden: true,
    check:  () => state.timeLeft <= 0
  },
  {
    id:     'sense',
    name:   '瀟然山石草木間',
    desc:   '以詩人的感知讀懂了這個陌生世界',
    hidden: true,
    check:  () => state.sense >= 5
  }
];

/* ── 音效系統 ── */

// 場景背景音樂對應（循環播放）
const AUDIO_BG = {
  scene_2lib_1:  'sound/library-ambient.m4a',
  scene_2lib_2a: 'sound/library-ambient.m4a',
  scene_2lib_2b: 'sound/library-ambient.m4a',
  scene_2lib_3:  'sound/library-ambient.m4a',
  scene_2lib_4a: 'sound/library-ambient.m4a',
  scene_2lib_4b: 'sound/library-ambient.m4a',
  scene_2lib_5:  'sound/library-ambient.m4a',
  scene_3lib_1:  'sound/library-ambient.m4a',
  scene_3lib_2a: 'sound/library-ambient.m4a',
  scene_3lib_2b: 'sound/library-ambient.m4a',
  scene_3lib_3:  'sound/library-ambient.m4a',
  scene_2rest_1: 'sound/cafeteria-music.m4a',
  scene_2rest_2a:'sound/cafeteria-music.m4a',
  scene_2rest_2b:'sound/cafeteria-music.m4a',
  scene_2rest_3: 'sound/cafeteria-music.m4a',
  scene_2rest_4a:'sound/cafeteria-music.m4a',
  scene_2rest_4b:'sound/cafeteria-music.m4a',
  scene_2rest_5: 'sound/cafeteria-music.m4a',
  scene_3rest_1: 'sound/cafeteria-music.m4a',
  scene_3rest_2a:'sound/cafeteria-music.m4a',
  scene_3rest_2b:'sound/cafeteria-music.m4a',
  scene_3rest_3: 'sound/cafeteria-music.m4a',
};

// 場景進入時的一次性音效
const AUDIO_SFX = {
  scene_1_1:    'sound/convenience-fridge.m4a',  // 第一次接觸現代世界
  scene_1_3:    'sound/convenience-chips.m4a',   // 撿起並翻看告示紙
  scene_2lib_1: 'sound/library-enter.m4a',       // 踏入圖書館的瞬間
  scene_2lib_3: 'sound/library-books.m4a',       // 取出遺卷查看
  scene_2lib_4a:'sound/library-chair.m4a',       // 與女學生並坐
  scene_2lib_4b:'sound/library-chair.m4a',       // 與老先生對坐
  scene_2rest_1:'sound/cafeteria-floor1.m4a',    // 踏入餐廳的喧嚷
  scene_2rest_3:'sound/cafeteria-chatter.m4a',   // 竊聽學生談話
  scene_2rest_4a:'sound/cafeteria-chatter.m4a',  // 加入學生對話
  scene_3lib_1: 'sound/library-books.m4a',       // 取出舊地圖
  scene_3lib_3: 'sound/library-computer.m4a',    // 閉館時的電腦聲
  scene_3rest_1:'sound/cafeteria-chatter.m4a',   // 昏暗餐廳中的孤獨身影
};

const BG_VOL  = 0.3;
const SFX_VOL = 0.55;

let bgAudio     = null;   // 背景音樂 HTMLAudioElement
let bgSrc       = '';     // 目前背景音樂路徑
let sfxAudio    = null;   // 音效 HTMLAudioElement
let bgFadeTimer = null;   // setInterval handle
let audioEnabled = false; // 首次用戶互動後才啟用
let audioMuted   = false;

function enableAudio() {
  audioEnabled = true;
}

function playSfx(src) {
  if (!audioEnabled || audioMuted) return;
  if (sfxAudio) { sfxAudio.pause(); sfxAudio = null; }
  sfxAudio = new Audio(src);
  sfxAudio.volume = SFX_VOL;
  sfxAudio.play().catch(() => {});
}

function playBg(src) {
  if (!src) { stopBg(); return; }
  if (bgSrc === src && bgAudio && !bgAudio.paused) return; // 同一首不重播

  fadeOutBg(() => {
    bgSrc = src;
    bgAudio = new Audio(src);
    bgAudio.loop = true;
    bgAudio.volume = 0;
    bgAudio.muted = audioMuted;
    if (!audioMuted) {
      bgAudio.play().catch(() => {});
      fadeInBg();
    }
  });
}

function stopBg() {
  fadeOutBg(() => { bgSrc = ''; });
}

function fadeInBg() {
  clearInterval(bgFadeTimer);
  bgFadeTimer = setInterval(() => {
    if (!bgAudio) { clearInterval(bgFadeTimer); return; }
    bgAudio.volume = Math.min(BG_VOL, bgAudio.volume + 0.025);
    if (bgAudio.volume >= BG_VOL) clearInterval(bgFadeTimer);
  }, 50);
}

function fadeOutBg(callback) {
  if (!bgAudio) { callback && callback(); return; }
  clearInterval(bgFadeTimer);
  const dying = bgAudio;
  bgAudio = null;
  bgFadeTimer = setInterval(() => {
    dying.volume = Math.max(0, dying.volume - 0.04);
    if (dying.volume <= 0) {
      clearInterval(bgFadeTimer);
      dying.pause();
      callback && callback();
    }
  }, 50);
}

function updateAudio(sceneId) {
  if (!audioEnabled) return;
  playBg(AUDIO_BG[sceneId] || null);
  const sfx = AUDIO_SFX[sceneId];
  if (sfx) setTimeout(() => playSfx(sfx), 200); // 稍微延遲，配合場景淡入
}

function toggleMute() {
  audioMuted = !audioMuted;
  if (bgAudio)  bgAudio.muted  = audioMuted;
  if (sfxAudio) sfxAudio.muted = audioMuted;
  $('mute-btn').textContent = audioMuted ? '🔇' : '🔊';
}

/* ── 工具函數 ── */

function $(id) { return document.getElementById(id); }

function showToast(msg) {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = '✦ ' + msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showStatDelta(statKey, value) {
  const idMap = { clue:'stat-clue', sense:'stat-sense', favor:'stat-favor', timeLeft:'stat-timeleft' };
  const parent = $(idMap[statKey]);
  if (!parent) return;

  const el = document.createElement('div');
  el.className = 'stat-delta ' + (value > 0 ? 'positive' : 'negative');
  el.textContent = (value > 0 ? '+' : '') + value;
  parent.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function updateStatsUI() {
  $('val-clue').textContent     = state.clue;
  $('val-sense').textContent    = state.sense;
  $('val-favor').textContent    = state.favor;
  const tlEl = $('val-timeleft');
  tlEl.textContent              = state.timeLeft;
  tlEl.style.color              = state.timeLeft <= 0 ? 'var(--red)' : 'var(--gold)';
}

function flashStat(statKey) {
  const idMap = { clue:'val-clue', sense:'val-sense', favor:'val-favor', timeLeft:'val-timeleft' };
  const el = $(idMap[statKey]);
  if (!el) return;
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 400);
}

function updateInventoryUI() {
  const container = $('inventory-items');
  container.innerHTML = '';
  state.inventory.forEach(item => {
    const div = document.createElement('div');
    div.className = 'inventory-item';
    div.textContent = item;
    container.appendChild(div);
  });
}

function highlightNewItem(itemName) {
  const items = $('inventory-items').querySelectorAll('.inventory-item');
  items.forEach(el => {
    if (el.textContent === itemName) {
      el.classList.add('new');
      setTimeout(() => el.classList.remove('new'), 2500);
    }
  });
}

function updateProgress(act) {
  const pct = act * 20;
  $('progress-text').textContent    = ACT_NAMES[act] || '';
  $('progress-percent').textContent = pct + '%';
  $('progress-fill').style.width    = pct + '%';
}

/* ── 效果執行 ── */

function applyEffects(effects) {
  if (!effects || !effects.length) return;

  effects.forEach(e => {
    if (e.type === 'stat') {
      state[e.stat] += e.value;
      showStatDelta(e.stat, e.value);
      flashStat(e.stat);
      updateStatsUI();

    } else if (e.type === 'item') {
      if (!state.inventory.includes(e.item)) {
        state.inventory.push(e.item);
        updateInventoryUI();
        highlightNewItem(e.item);
        showToast('獲得道具：' + e.item);
      }
    }
  });
}

/* ── 場景渲染 ── */

function resolveText(sceneId, scene) {
  // scene_5_3a：依 clue 決定旁白豐富程度
  if (sceneId === 'scene_5_3a') {
    return state.clue >= 3
      ? '「舉頭望明月，低頭思故鄉。」第二句落下，藍光從石板縫隙中爆發，將整片廣場淹沒在白色的光芒裡。李白感到身體開始輕盈，像酒意上湧，像山風托舉，像月光把他一點一點地溶解。他在消失前的最後一刻，俯身在石台邊緣寫下幾個字——沒有筆，用指尖，蘸著殘餘的酒液。然後，白光吞沒了一切。'
      : '「舉頭望明月，低頭思故鄉。」話音未落，白光乍現。他走了，帶著這一天收集到的一切，回到了他的時代。';
  }
  return typeof scene.text === 'function' ? scene.text(state) : scene.text;
}

function resolveChoices(sceneId, scene) {
  // scene_5_1：依 favor 決定走向
  if (sceneId === 'scene_5_1') {
    return state.favor >= 2
      ? [{ text: '廣場入口傳來腳步聲……', next: 'scene_5_2a' }]
      : [{ text: '廣場裡只有他一個人……', next: 'scene_5_2b' }];
  }
  return (scene.choices || []).filter(c => !c.condition || c.condition(state));
}

function renderScene(sceneId) {
  state.current = sceneId;
  const scene = SCENES[sceneId];
  if (!scene) { console.error('找不到場景：', sceneId); return; }

  // 進入場景時執行效果
  applyEffects(scene.effects);

  updateProgress(scene.act);

  $('scene-act').textContent   = ACT_NAMES[scene.act] || '';
  $('scene-title').textContent = scene.title || '';
  $('scene-text').textContent  = resolveText(sceneId, scene);

  // 音效（在場景淡入後播放）
  updateAudio(sceneId);

  const choicesEl = $('choices-container');
  choicesEl.innerHTML = '';

  if (scene.isEnding) {
    stopBg();
    renderEndingPanel(choicesEl);
    return;
  }

  const choices = resolveChoices(sceneId, scene);
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      enableAudio(); // 首次互動後解除瀏覽器自動播放限制
      applyEffects(choice.effects);
      goToScene(choice.next);
    });
    choicesEl.appendChild(btn);
  });
}

function goToScene(sceneId) {
  const card = $('scene-card');
  card.classList.add('fade-out');

  setTimeout(() => {
    renderScene(sceneId);
    card.classList.remove('fade-out');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 380);
}

/* ── 結局面板 ── */

function renderEndingPanel(container) {
  const regretHTML = state.timeLeft <= 0
    ? `<div class="ending-regret">
        時限已盡。李白在這個陌生的時代多留了太久，一路奔走，倉皇回歸。
        他沒有來得及好好道別，沒有來得及細細感受這個世界的奇異之處。
        但他終究回去了——帶著遺憾，也帶著一份說不清楚的眷戀。
       </div>`
    : '';

  const achHTML = ACHIEVEMENTS.map(a => {
    const unlocked = a.check();
    const showName = unlocked || !a.hidden;
    return `
      <div class="achievement">
        <div class="ach-icon ${unlocked ? '' : 'locked'}">${unlocked ? '◆' : '◇'}</div>
        <div>
          <div class="ach-name ${unlocked ? '' : 'locked'}">${showName ? a.name : '???'}</div>
          <div class="ach-desc">${unlocked ? a.desc : (a.hidden ? '隱藏成就' : a.desc)}</div>
        </div>
      </div>`;
  }).join('');

  const tlColor = state.timeLeft <= 0 ? 'var(--red)' : 'var(--gold)';

  container.innerHTML = `
    <div class="ending-card">
      <div class="ending-title">詩仙回歸記</div>
      <div class="ending-sep">── 終 ──</div>

      ${regretHTML}

      <div class="stats-summary">
        <div class="stat-sum-item">
          <div class="stat-sum-label">線索數</div>
          <div class="stat-sum-value">${state.clue}</div>
        </div>
        <div class="stat-sum-item">
          <div class="stat-sum-label">感官值</div>
          <div class="stat-sum-value">${state.sense}</div>
        </div>
        <div class="stat-sum-item">
          <div class="stat-sum-label">好感度</div>
          <div class="stat-sum-value">${state.favor}</div>
        </div>
        <div class="stat-sum-item">
          <div class="stat-sum-label">剩餘時限</div>
          <div class="stat-sum-value" style="color:${tlColor}">${state.timeLeft}</div>
        </div>
      </div>

      <div class="achievements-title">成就解鎖</div>
      ${achHTML}

      <button class="restart-btn" id="restart-btn">重新開始</button>
    </div>`;

  document.getElementById('restart-btn').addEventListener('click', restartGame);
}

/* ── 重新開始 ── */

function restartGame() {
  // 停止所有音效
  stopBg();
  if (sfxAudio) { sfxAudio.pause(); sfxAudio = null; }
  bgSrc = '';

  state.clue      = 0;
  state.sense     = 0;
  state.favor     = 0;
  state.timeLeft  = 5;
  state.inventory = ['酒葫蘆'];
  state.current   = 'scene_1_1';

  updateStatsUI();
  updateInventoryUI();
  goToScene('scene_1_1');
}

/* ── 啟動 ── */

updateStatsUI();
updateInventoryUI();
renderScene('scene_1_1');

$('mute-btn').addEventListener('click', toggleMute);
