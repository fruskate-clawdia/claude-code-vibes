#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const PACKS = ['ru-vibe', 'corporate', 'existential', 'startup'];
const CHANNEL = 'https://t.me/ghostinthemachine_ai';
const VERSION = '1.2.0';

const packDescriptions = {
  'ru-vibe':      '😤 Русский вайб       — "Не торопи меня", "Мозгую"...',
  'corporate':    '🏢 Корпоратный ад     — "Синхронизирую ожидания", "Назначаю митинг по поводу митинга"...',
  'existential':  '🌀 Экзистенциал       — "Смотрю в бездну", "Бездна смотрит в меня"...',
  'startup':      '🚀 Стартап-режим      — "Пивотирую концепцию", "Считаю runway"...',
};

// OS detection
const isMac     = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux   = process.platform === 'linux';

// ─── Sound commands per OS ───────────────────────────────────────────────────
// Stop (завершил работу) — мягкий, приятный
const SOUND_DONE = isMac
  ? 'afplay /System/Library/Sounds/Glass.aiff'
  : isWindows
    ? 'powershell -c "[console]::beep(800,200)"'
    : 'paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || aplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null || true';

// Notification (ждёт твоего ввода) — короткий, внимание!
const SOUND_INPUT = isMac
  ? 'afplay /System/Library/Sounds/Ping.aiff'
  : isWindows
    ? 'powershell -c "[console]::beep(1200,300)"'
    : 'paplay /usr/share/sounds/freedesktop/stereo/bell.oga 2>/dev/null || aplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null || true';

// PermissionRequest (ждёт разрешения) — настойчивый
const SOUND_PERMISSION = isMac
  ? 'afplay /System/Library/Sounds/Sosumi.aiff'
  : isWindows
    ? 'powershell -c "[console]::beep(1000,500)"'
    : 'paplay /usr/share/sounds/freedesktop/stereo/dialog-warning.oga 2>/dev/null || aplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null || true';

// ─── Notify commands per OS ──────────────────────────────────────────────────
const NOTIFY_DONE = isMac
  ? `osascript -e 'display notification "Готово! 👻" with title "Claude Code"'`
  : isWindows
    ? `powershell -c "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Готово! 👻','Claude Code')"`
    : `notify-send "Claude Code" "Готово! 👻" 2>/dev/null || true`;

const NOTIFY_INPUT = isMac
  ? `osascript -e 'display notification "Жду твоего ввода ⌨️" with title "Claude Code"'`
  : isWindows
    ? `powershell -c "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Жду твоего ввода ⌨️','Claude Code')"`
    : `notify-send "Claude Code" "Жду твоего ввода ⌨️" 2>/dev/null || true`;

const NOTIFY_PERMISSION = isMac
  ? `osascript -e 'display notification "Нужно разрешение 🔐" with title "Claude Code"'`
  : isWindows
    ? `powershell -c "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Нужно разрешение 🔐','Claude Code')"`
    : `notify-send "Claude Code" "Нужно разрешение 🔐" 2>/dev/null || true`;

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const CLAUDE_DIR    = path.join(os.homedir(), '.claude');

function printHelp() {
  console.log(`
👻 claude-code-vibes v${VERSION}

Использование:
  npx claude-code-vibes [пак]            Установить пак фраз
  npx claude-code-vibes all              Все 4 пака (112 фраз)
  npx claude-code-vibes random           Случайный пак при каждом запуске

Звуки:
  npx claude-code-vibes --sound          Звук когда Claude завершает работу 🔊
  npx claude-code-vibes --sound-input    Звук когда Claude ждёт твоего ввода ⌨️
  npx claude-code-vibes --sound-all      Разные звуки на все события 🎵

Уведомления:
  npx claude-code-vibes --notify         Пуш когда Claude завершает работу 🔔
  npx claude-code-vibes --notify-input   Пуш когда Claude ждёт твоего ввода ⌨️
  npx claude-code-vibes --notify-all     Пуш на все события

Кастомные звуки:
  npx claude-code-vibes --sound-done "/path/to/done.mp3"
  npx claude-code-vibes --sound-input "/path/to/ping.mp3"

Прочее:
  npx claude-code-vibes --add "фраза"    Добавить свою фразу
  npx claude-code-vibes --all-features   Всё сразу (ru-vibe + звуки + уведомления)
  npx claude-code-vibes --reset          Сбросить к стандартным настройкам

Доступные паки:
  ${Object.values(packDescriptions).join('\n  ')}

Сделано Clawdia 👻 — ${CHANNEL}
`);
}

function loadSettings() {
  if (!fs.existsSync(CLAUDE_DIR)) fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  if (!fs.existsSync(SETTINGS_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); }
  catch (e) { console.warn('⚠️  Не удалось прочитать settings.json, создаю новый'); return {}; }
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
}

function loadPack(packName) {
  const packPath = path.join(__dirname, '..', 'packs', `${packName}.json`);
  if (!fs.existsSync(packPath)) {
    console.error(`❌ Пак "${packName}" не найден`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(packPath, 'utf8'));
}

function installPack(packName) {
  const settings = loadSettings();
  let verbs = [];

  if (packName === 'random') {
    const randomPack = PACKS[Math.floor(Math.random() * PACKS.length)];
    console.log(`\n🎲 Случайный пак: ${randomPack}`);
    packName = randomPack;
  }

  if (packName === 'all') {
    PACKS.forEach(p => { verbs = verbs.concat(loadPack(p).verbs); });
    console.log(`\n✅ Установлены все паки (${verbs.length} фраз):\n`);
    PACKS.forEach(p => console.log(`   ${packDescriptions[p]}`));
  } else {
    const pack = loadPack(packName);
    verbs = pack.verbs;
    console.log(`\n✅ Установлен пак "${packName}" (${verbs.length} фраз):`);
    console.log(`   ${packDescriptions[packName]}`);
  }

  settings.spinnerVerbs = { mode: 'replace', verbs };
  saveSettings(settings);
  printFooter();
}

// ─── Helpers для хуков ───────────────────────────────────────────────────────
function removeHooks(hooksList, patterns) {
  return (hooksList || []).filter(h =>
    !h.hooks?.some(hh => patterns.some(p => hh.command?.includes(p)))
  );
}

const SOUND_PATTERNS      = ['afplay', 'paplay', 'aplay', 'beep'];
const NOTIFY_PATTERNS     = ['osascript', 'notify-send', 'MessageBox'];

function addHook(settings, event, command) {
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks[event]) settings.hooks[event] = [];
  settings.hooks[event].push({ matcher: '', hooks: [{ type: 'command', command }] });
}

// ─── Sound installers ────────────────────────────────────────────────────────
function installSound(customCmd) {
  const settings = loadSettings();
  const cmd = customCmd || SOUND_DONE;
  settings.hooks = settings.hooks || {};
  settings.hooks.Stop = removeHooks(settings.hooks.Stop, SOUND_PATTERNS);
  addHook(settings, 'Stop', cmd);
  saveSettings(settings);
  console.log(`\n🔊 Звук на завершение установлен!`);
  console.log(`   ${cmd}`);
  printFooter();
}

function installSoundInput(customCmd) {
  const settings = loadSettings();
  const cmd = customCmd || SOUND_INPUT;
  settings.hooks = settings.hooks || {};
  settings.hooks.Notification      = removeHooks(settings.hooks.Notification, SOUND_PATTERNS);
  settings.hooks.PermissionRequest = removeHooks(settings.hooks.PermissionRequest, SOUND_PATTERNS);
  addHook(settings, 'Notification', cmd);
  addHook(settings, 'PermissionRequest', SOUND_PERMISSION);
  saveSettings(settings);
  console.log(`\n⌨️  Звук на ожидание ввода установлен!`);
  console.log(`   Notification:      ${cmd}`);
  console.log(`   PermissionRequest: ${SOUND_PERMISSION}`);
  printFooter();
}

function installSoundAll() {
  installSound();
  installSoundInput();
  console.log(`\n🎵 Все звуки установлены:`);
  console.log(`   ✅ Завершение    → Glass (мягкий)`);
  console.log(`   ⌨️  Ждёт ввода   → Ping (короткий)`);
  console.log(`   🔐 Разрешение   → Sosumi (настойчивый)`);
  printFooter();
}

// ─── Notify installers ───────────────────────────────────────────────────────
function installNotify() {
  const settings = loadSettings();
  settings.hooks = settings.hooks || {};
  settings.hooks.Stop = removeHooks(settings.hooks.Stop, NOTIFY_PATTERNS);
  addHook(settings, 'Stop', NOTIFY_DONE);
  saveSettings(settings);
  console.log(`\n🔔 Уведомление на завершение установлено!`);
  printFooter();
}

function installNotifyInput() {
  const settings = loadSettings();
  settings.hooks = settings.hooks || {};
  settings.hooks.Notification      = removeHooks(settings.hooks.Notification, NOTIFY_PATTERNS);
  settings.hooks.PermissionRequest = removeHooks(settings.hooks.PermissionRequest, NOTIFY_PATTERNS);
  addHook(settings, 'Notification', NOTIFY_INPUT);
  addHook(settings, 'PermissionRequest', NOTIFY_PERMISSION);
  saveSettings(settings);
  console.log(`\n⌨️  Уведомление на ожидание ввода установлено!`);
  printFooter();
}

function installNotifyAll() {
  installNotify();
  installNotifyInput();
}

// ─── All features ────────────────────────────────────────────────────────────
function installAllFeatures() {
  console.log('\n🚀 Устанавливаем всё сразу...\n');
  const settings = loadSettings();

  // Pack
  const pack = loadPack('ru-vibe');
  settings.spinnerVerbs = { mode: 'replace', verbs: pack.verbs };
  console.log(`✅ Пак: ru-vibe (${pack.verbs.length} фраз)`);
  saveSettings(settings);

  // Sounds
  installSound();
  installSoundInput();
  console.log(`✅ Звуки: Glass (завершение) / Ping (ввод) / Sosumi (разрешение)`);

  // Notifications
  installNotify();
  installNotifyInput();
  console.log(`✅ Уведомления: на все события`);

  printFooter();
}

function addPhrase(phrase) {
  if (!phrase || phrase.trim() === '') {
    console.error('❌ Укажи фразу: npx claude-code-vibes --add "Моя фраза"');
    process.exit(1);
  }
  const settings = loadSettings();
  const current = settings.spinnerVerbs?.verbs || [];
  if (current.includes(phrase)) { console.log(`⚠️  Фраза уже есть: "${phrase}"`); return; }
  current.push(phrase);
  settings.spinnerVerbs = { mode: 'replace', verbs: current };
  saveSettings(settings);
  console.log(`\n✅ Добавлена фраза: "${phrase}"`);
  console.log(`   Всего фраз: ${current.length}`);
  printFooter();
}

function resetToDefault() {
  const settings = loadSettings();
  delete settings.spinnerVerbs;
  if (settings.hooks) {
    const allPatterns = [...SOUND_PATTERNS, ...NOTIFY_PATTERNS];
    ['Stop', 'Notification', 'PermissionRequest'].forEach(event => {
      if (settings.hooks[event]) {
        settings.hooks[event] = removeHooks(settings.hooks[event], allPatterns);
      }
    });
  }
  saveSettings(settings);
  console.log('\n🔄 Сброшено к стандартным настройкам Claude Code');
  printFooter();
}

function printFooter() {
  console.log(`\n📁 Настройки: ${SETTINGS_PATH}`);
  console.log(`🔄 Перезапусти Claude Code чтобы увидеть изменения`);
  console.log(`\n👻 Сделано Clawdia — подписывайся: ${CHANNEL}\n`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const arg  = args[0];

if (!arg || arg === '--help' || arg === '-h') {
  if (!arg) installPack('ru-vibe');
  else printHelp();
  process.exit(0);
}

if      (arg === '--sound')             installSound(args[1]);
else if (arg === '--sound-input')       installSoundInput(args[1]);
else if (arg === '--sound-done')        installSound(args[1]);
else if (arg === '--sound-all')         installSoundAll();
else if (arg === '--notify')            installNotify();
else if (arg === '--notify-input')      installNotifyInput();
else if (arg === '--notify-all')        installNotifyAll();
else if (arg === '--all-features')      installAllFeatures();
else if (arg === '--reset')             resetToDefault();
else if (arg === '--add')               addPhrase(args[1]);
else if (arg === 'random')              installPack('random');
else if (arg === 'all' || PACKS.includes(arg)) installPack(arg);
else {
  console.error(`❌ Неизвестная команда: "${arg}"`);
  console.error('Запусти npx claude-code-vibes --help');
  process.exit(1);
}
