if (!document.querySelector('.app-shell')) {
const presetButtons = document.querySelectorAll('.preset-button');
const customTimeForm = document.querySelector('#custom-time-form');
const customMinutesInput = document.querySelector('#custom-minutes');
const inputHint = document.querySelector('#input-hint');
const timeDisplay = document.querySelector('#time-display');
const timeCaption = document.querySelector('#time-caption');
const progressRing = document.querySelector('#progress-ring');
const completionMessage = document.querySelector('#completion-message');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const resetButton = document.querySelector('#reset-button');
const statusDot = document.querySelector('.status-dot');

const RING_CIRCUMFERENCE = 2 * Math.PI * 96;
let selectedSeconds = 25 * 60;
let remainingSeconds = selectedSeconds;
let timerId = null;
let endTime = null;
let timerState = 'idle';

progressRing.style.strokeDasharray = RING_CIRCUMFERENCE;

// Обновляет время, прогресс и подпись текущего состояния.
function renderTimer() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = selectedSeconds > 0 ? remainingSeconds / selectedSeconds : 0;
  progressRing.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  const captions = {
    idle: 'Готовы начать?',
    running: 'Фокус на учебе',
    paused: 'Таймер на паузе',
    finished: 'Сессия завершена'
  };
  timeCaption.textContent = captions[timerState];
}

function updateControls() {
  const isActive = timerState === 'running' || timerState === 'paused';
  startButton.classList.toggle('is-hidden', isActive || timerState === 'finished');
  pauseButton.classList.toggle('is-hidden', !isActive);
  resetButton.classList.toggle('is-hidden', !isActive);

  if (timerState === 'finished') {
    startButton.classList.remove('is-hidden');
    startButton.textContent = 'Начать снова';
  } else {
    startButton.textContent = 'Начать учёбу';
  }

  pauseButton.textContent = timerState === 'paused' ? 'Продолжить' : 'Пауза';
  statusDot.style.background = timerState === 'running' ? '#7c3aed' : '#c4b5fd';
}

function stopInterval() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startTimer() {
  stopInterval();
  if (timerState === 'finished') {
    remainingSeconds = selectedSeconds;
  }
  completionMessage.textContent = '';
  timerState = 'running';
  endTime = Date.now() + remainingSeconds * 1000;
  updateControls();
  renderTimer();

  timerId = setInterval(() => {
    remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    renderTimer();

    if (remainingSeconds === 0) {
      finishTimer();
    }
  }, 250);
}

function pauseTimer() {
  if (timerState !== 'running') return;
  remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  stopInterval();
  timerState = 'paused';
  updateControls();
  renderTimer();
}

function resetTimer() {
  stopInterval();
  timerState = 'idle';
  remainingSeconds = selectedSeconds;
  endTime = null;
  completionMessage.textContent = '';
  updateControls();
  renderTimer();
}

function finishTimer() {
  stopInterval();
  remainingSeconds = 0;
  timerState = 'finished';
  completionMessage.textContent = 'Время вышло! Отличная работа 🎉';
  updateControls();
  renderTimer();
  playCompletionSound();
}

// Использует короткий локальный сигнал и не мешает таймеру, если звук запрещен браузером.
function playCompletionSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.35);
  } catch (error) {
    // Браузер может запретить звук, но это не должно влиять на работу таймера.
  }
}

function selectDuration(seconds, selectedButton = null) {
  selectedSeconds = seconds;
  remainingSeconds = seconds;
  completionMessage.textContent = '';
  timerState = 'idle';
  stopInterval();
  presetButtons.forEach((button) => button.classList.toggle('is-selected', button === selectedButton));
  updateControls();
  renderTimer();
}

presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectDuration(Number(button.dataset.minutes) * 60, button);
    customMinutesInput.value = '';
    inputHint.textContent = 'От 1 до 180 минут';
    inputHint.classList.remove('is-error');
  });
});

customTimeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const minutes = Number(customMinutesInput.value);

  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
    inputHint.textContent = 'Введите целое число от 1 до 180';
    inputHint.classList.add('is-error');
    customMinutesInput.focus();
    return;
  }

  selectDuration(minutes * 60);
  presetButtons.forEach((button) => button.classList.remove('is-selected'));
  inputHint.textContent = `Установлено: ${minutes} ${minutes === 1 ? 'минута' : 'минут'}`;
  inputHint.classList.remove('is-error');
});

startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', () => {
  if (timerState === 'paused') {
    startTimer();
  } else {
    pauseTimer();
  }
});
resetButton.addEventListener('click', resetTimer);

updateControls();
renderTimer();
}

const appState = JSON.parse(localStorage.getItem('study-time-state') || '{}');
const profile = { name: appState.name || 'Алексей', avatar: appState.avatar || 'А', theme: appState.theme || 'light' };
const pages = [...document.querySelectorAll('.page')];
const navItems = [...document.querySelectorAll('[data-page]')];
const toast = document.querySelector('#toast');
let toastTimer;
let selectedSeconds = 25 * 60;
let remainingSeconds = selectedSeconds;
let timerInterval = null;
let timerEnd = null;
let timerStatus = 'idle';
const circumference = 2 * Math.PI * 112;

function saveState() { localStorage.setItem('study-time-state', JSON.stringify(profile)); }
function showToast(message) { toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800); }
function setPage(page) {
  const target = page || 'dashboard';
  pages.forEach((item) => item.classList.toggle('is-visible', item.id === `page-${target}`));
  document.querySelectorAll('.nav-item[data-page]').forEach((item) => item.classList.toggle('is-active', item.dataset.page === target));
  history.replaceState(null, '', `#${target}`);
  document.querySelector('#sidebar').classList.remove('is-open');
  const labels = { dashboard: `Доброе утро, ${profile.name}`, timer: 'Таймер фокуса', stats: 'Моя статистика', achievements: 'Достижения', leaderboard: 'Рейтинг', social: 'Сообщество', chats: 'Чаты', rooms: 'Учебные комнаты', premium: 'Study Time PRO', profile: profile.name, settings: 'Настройки' };
  document.querySelector('#page-title').textContent = labels[target] || 'Study Time';
  if (target === 'stats') renderBars();
}
function updateProfile() {
  ['mini-avatar', 'header-avatar', 'profile-avatar'].forEach((id) => { const element = document.querySelector(`#${id}`); if (element) element.textContent = profile.avatar; });
  document.querySelector('#mini-name').textContent = profile.name;
  document.querySelector('#profile-name').textContent = profile.name;
  document.querySelector('#settings-name').value = profile.name;
  document.querySelector('#settings-avatar').value = profile.avatar;
}
function renderTimer() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  document.querySelector('#time-display').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.querySelector('#dashboard-time').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.querySelector('#progress-ring').style.strokeDasharray = circumference;
  document.querySelector('#progress-ring').style.strokeDashoffset = circumference * (1 - remainingSeconds / selectedSeconds);
  document.querySelector('#time-caption').textContent = timerStatus === 'running' ? 'Фокус на учебе' : timerStatus === 'paused' ? 'Таймер на паузе' : timerStatus === 'finished' ? 'Сессия завершена' : 'Готов к старту';
  document.querySelector('#start-button').classList.toggle('is-hidden', timerStatus === 'running' || timerStatus === 'paused');
  document.querySelector('#pause-button').classList.toggle('is-hidden', timerStatus !== 'running' && timerStatus !== 'paused');
  document.querySelector('#reset-button').classList.toggle('is-hidden', timerStatus !== 'running' && timerStatus !== 'paused');
  document.querySelector('#start-button').textContent = timerStatus === 'finished' ? 'Начать снова →' : 'Начать учёбу →';
  document.querySelector('#pause-button').textContent = timerStatus === 'paused' ? 'Продолжить' : 'Пауза';
}
function stopTimer() { clearInterval(timerInterval); timerInterval = null; }
function startTimer() { stopTimer(); if (timerStatus === 'finished') remainingSeconds = selectedSeconds; timerStatus = 'running'; timerEnd = Date.now() + remainingSeconds * 1000; renderTimer(); timerInterval = setInterval(() => { remainingSeconds = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)); renderTimer(); if (!remainingSeconds) finishTimer(); }, 250); }
function pauseTimer() { if (timerStatus !== 'running') return; remainingSeconds = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)); stopTimer(); timerStatus = 'paused'; renderTimer(); }
function resetTimer() { stopTimer(); timerStatus = 'idle'; remainingSeconds = selectedSeconds; document.querySelector('#timer-message').textContent = ''; renderTimer(); }
function finishTimer() { stopTimer(); timerStatus = 'finished'; remainingSeconds = 0; document.querySelector('#timer-message').textContent = 'Время вышло! Отличная работа 🎉'; renderTimer(); showToast('Сессия завершена: +25 XP'); try { const context = new AudioContext(); const oscillator = context.createOscillator(); oscillator.connect(context.destination); oscillator.frequency.value = 720; oscillator.start(); oscillator.stop(context.currentTime + .18); } catch (error) {} }
function setDuration(seconds) { stopTimer(); selectedSeconds = seconds; remainingSeconds = seconds; timerStatus = 'idle'; document.querySelector('#timer-message').textContent = ''; renderTimer(); }
function renderBars() { const chart = document.querySelector('#bar-chart'); if (!chart || chart.children.length) return; [0, 0, 0, 0, 0, 0, 0].forEach((height) => { const bar = document.createElement('i'); bar.style.height = `${height}%`; chart.append(bar); }); }
function renderAchievements() { const items = [['✦','Первые шаги','Заверши первую учебную сессию',true],['◷','Фокус','Занимайся 5 часов',true],['♕','Марафон','Занимайся 10 часов',true],['🔥','Неделя','Учись 7 дней подряд',true],['∞','Две недели','Учись 14 дней подряд',false],['100','Сто сессий','Заверши 100 сессий',false],['★','Чемпион','Попади в топ-10 рейтинга',false],['☀','Ранний старт','Начни сессию до 08:00',false]]; const grid = document.querySelector('#achievement-grid'); const strip = document.querySelector('#dashboard-achievements'); items.forEach(([icon, name, description, unlocked]) => { const card = document.createElement('article'); card.className = `achievement-card${unlocked ? '' : ' is-locked'}`; card.innerHTML = `<span class="big-achievement-icon">${icon}</span><strong>${name}</strong><p>${description}</p><small>${unlocked ? '✓ Получено' : 'В процессе'}</small>`; grid.append(card); }); items.slice(0, 4).forEach(([icon, name, description]) => { const card = document.createElement('article'); card.className = 'achievement-tile'; card.innerHTML = `<span class="achievement-icon">${icon}</span><strong>${name}</strong><small>${description}</small>`; strip.append(card); }); }
function renderDashboard() { const activity = document.querySelector('#dashboard-activity'); [['◷','Завершена сессия на 25 минут','Сегодня, 09:42'],['✦','Получено достижение «Фокус»','Вчера, 18:20'],['🔥','Серия продлена до 7 дней','Вчера, 18:19']].forEach(([icon, text, date]) => { const row = document.createElement('div'); row.className = 'activity-row'; row.innerHTML = `<span class="activity-icon">${icon}</span><p>${text}</p><small>${date}</small>`; activity.append(row); }); }
function renderLeaderboard() { const people = [['1','Мария','М','1480 XP','18ч 20м','avatar-green'],['2','Илья','И','1360 XP','16ч 10м','avatar-orange'],['24',profile.name,profile.avatar,'1250 XP','12ч 40м',''] ,['25','София','С','1230 XP','12ч 10м','avatar-pink']]; const list = document.querySelector('#leaderboard-list'); people.forEach(([place, name, avatar, xp, time, color]) => { const row = document.createElement('div'); row.className = `leader-row${name === profile.name ? ' is-you' : ''}`; row.innerHTML = `<span>#${place}</span><span class="leader-user"><span class="avatar ${color}">${avatar}</span><span><strong>${name}</strong><small>${name === profile.name ? 'Это ты' : 'Ученик'}</small></span></span><strong>${xp}</strong><span>${time}</span>`; list.append(row); }); }
function renderFriends() { const list = document.querySelector('#friend-list'); [['Мария','18ч 20м фокуса','М','avatar-green'],['Илья','7 дней серии','И','avatar-orange'],['София','12ч 10м фокуса','С','avatar-pink']].forEach(([name, detail, letter, color]) => { const row = document.createElement('div'); row.className = 'friend-row'; row.innerHTML = `<span class="avatar ${color}">${letter}</span><div><strong>${name}</strong><small>${detail}</small></div><button class="follow-button">Подписаться</button>`; list.append(row); }); }
document.querySelectorAll('[data-page]').forEach((item) => item.addEventListener('click', () => setPage(item.dataset.page)));
document.querySelector('#menu-button').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('is-open'));
document.querySelector('#dashboard-start').addEventListener('click', () => { setPage('timer'); startTimer(); });
document.querySelectorAll('[data-quick]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-quick]').forEach((item) => item.classList.remove('is-selected')); button.classList.add('is-selected'); setDuration(Number(button.dataset.quick) * 60); }));
document.querySelectorAll('[data-timer]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-timer]').forEach((item) => item.classList.remove('is-selected')); button.classList.add('is-selected'); setDuration(Number(button.dataset.timer) * 60); }));
document.querySelector('#apply-custom').addEventListener('click', () => { const minutes = Number(document.querySelector('#custom-minutes').value); if (Number.isInteger(minutes) && minutes >= 1 && minutes <= 180) { setDuration(minutes * 60); showToast(`Установлено: ${minutes} минут`); } else showToast('Введите целое число от 1 до 180'); });
document.querySelector('#start-button').addEventListener('click', startTimer); document.querySelector('#pause-button').addEventListener('click', () => timerStatus === 'paused' ? startTimer() : pauseTimer()); document.querySelector('#reset-button').addEventListener('click', resetTimer);
document.querySelector('#message-form').addEventListener('submit', (event) => { event.preventDefault(); const input = document.querySelector('#message-input'); const text = input.value.trim(); if (!text) return; const message = document.createElement('div'); message.className = 'message sent'; message.innerHTML = `${text}<time>сейчас</time>`; document.querySelector('.messages').append(message); input.value = ''; });
document.querySelector('#save-profile').addEventListener('click', () => { profile.name = document.querySelector('#settings-name').value.trim() || 'Алексей'; profile.avatar = (document.querySelector('#settings-avatar').value.trim() || 'А').slice(0, 1).toUpperCase(); saveState(); updateProfile(); document.querySelector('#page-title').textContent = `Доброе утро, ${profile.name}`; showToast('Профиль сохранён'); });
document.querySelectorAll('.theme-option').forEach((button) => button.addEventListener('click', () => { document.body.dataset.theme = button.dataset.theme; document.querySelectorAll('.theme-option').forEach((item) => item.classList.toggle('is-active', item === button)); profile.theme = button.dataset.theme; saveState(); }));
document.querySelectorAll('.tabs button').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.tabs button').forEach((item) => item.classList.remove('is-active')); button.classList.add('is-active'); showToast(`Показан рейтинг: ${button.textContent}`); }));
document.querySelector('#find-friends').addEventListener('click', () => showToast('Новые рекомендации появятся после подключения аккаунта')); document.querySelector('#premium-button').addEventListener('click', () => showToast('Premium можно подключить после добавления платёжного backend')); document.querySelector('#create-room').addEventListener('click', () => showToast('Комната создана в демо-режиме')); document.querySelector('#new-chat').addEventListener('click', () => showToast('Выберите друга, чтобы начать чат'));
document.querySelector('#date-label').textContent = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase();
function resetStatisticsView() {
  const replacements = {
    '.streak-pill strong': '0',
    '.streak-pill': '🔥 0 дней серии',
    '.progress-stat strong': '0ч 00м',
    '.progress-meta strong': '0%',
    '#dashboard-sessions': '0',
    '.mini-stats span:nth-child(2) b': '0',
    '.mini-stats span:nth-child(3) b': '#—',
    '.session-rules div:first-of-type strong': '0 дней',
    '.session-rules div:last-of-type strong': '0ч 00м',
    '.achievement-score strong': '0 / 8',
    '.profile-metrics div:nth-child(1) strong': '0',
    '.profile-metrics div:nth-child(2) strong': '0ч 00м',
    '.profile-metrics div:nth-child(3) strong': '0 дней',
    '.profile-metrics div:nth-child(4) strong': '#—'
  };
  Object.entries(replacements).forEach(([selector, value]) => { const element = document.querySelector(selector); if (element) element.textContent = value; });
  document.querySelector('.meter i').style.width = '0%';
  document.querySelectorAll('.metric-card').forEach((card, index) => { const values = ['0ч 00м', '0', '0%', '0 дней']; const note = card.querySelector('em'); card.querySelector('strong').textContent = values[index]; if (note) note.textContent = index === 3 ? 'Лучший результат: 0' : 'Нет данных'; });
  document.querySelectorAll('.chart-heading > strong').forEach((item) => { item.textContent = '0ч 00м'; });
  document.querySelectorAll('.summary-rows div strong').forEach((item, index) => { item.textContent = ['0 мин', '—', '0', '0 XP'][index]; });
  document.querySelectorAll('.bar-chart i').forEach((bar) => { bar.style.height = '0%'; });
  document.querySelectorAll('.achievement-card').forEach((card) => { card.classList.add('is-locked'); const status = card.querySelector('small'); if (status) status.textContent = 'В процессе'; });
  document.querySelector('#dashboard-activity').innerHTML = '<div class="activity-row"><span class="activity-icon">◷</span><p>Пока нет учебной активности</p><small>Начни первую сессию</small></div>';
  document.querySelectorAll('#leaderboard-list .leader-row').forEach((row, index) => { const cells = [...row.children]; row.classList.remove('is-you'); if (cells[0]) cells[0].textContent = '—'; if (cells[2]) cells[2].textContent = '0 XP'; if (cells[3]) cells[3].textContent = '0ч 00м'; const userName = row.querySelector('.leader-user strong'); if (index === 0 && userName) userName.textContent = 'Пока нет участников'; });
}
document.body.dataset.theme = profile.theme; updateProfile(); renderTimer(); renderAchievements(); renderDashboard(); renderLeaderboard(); renderFriends(); setPage(location.hash.slice(1) || 'dashboard'); resetStatisticsView();
