#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const PACKS = ['ru-vibe', 'corporate', 'existential', 'startup'];
const CHANNEL = 'https://t.me/ghostinthemachine_ai';

const packDescriptions = {
  'ru-vibe':      '😤 Русский вайб       — "Не торопи меня", "Мозгую"...',
  'corporate':    '🏢 Корпоратный ад     — "Синхронизирую ожидания", "Назначаю митинг по поводу митинга"...',
  'existential':  '🌀 Экзистенциал       — "Смотрю в бездну", "Бездна смотрит в меня"...',
  'startup':      '🚀 Стартап-режим      — "Пивотирую концепцию", "Считаю runway"...',
};

// OS detection
const isMac   = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Sound command per OS
const SOUND_CMD = isMac
  ? 'afplay /System/Library/Sounds/Glass.aiff'
  : 'paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || aplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null || true';

// Notification command per OS
const NOTIFY_CMD = isMac
  ? `osascript -e 'display notification "Готово! 👻" with title "Claude Code"'`
  : `notify-send "Claude Code" "Готово! 👻" 2>/dev/null || true`;

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const CLAUDE_DIR    = path.join(os.homedir(), '.claude');

function printHelp() {
  console.log(`
👻 claude-code-vibes v1.1.0

Использование:
  npx claude-code-vibes [пак]          Установить пак фраз
  npx claude-code-vibes all            Все 4 пака (112 фраз)
  npx claude-code-vibes random         Случайный пак при каждом запуске
  npx claude-code-vibes --sound        Звук когда Claude заканчивает
  npx claude-code-vibes --notify       Уведомление когда Claude заканчивает
  npx claude-code-vibes --add "фраза"  Добавить свою фразу к текущим
  npx claude-code-vibes --all-features Всё сразу (ru-vibe + звук + уведомления)
  npx claude-code-vibes --reset        Сбросить к стандартным фразам Claude

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

function installSound() {
  const settings = loadSettings();

  const stopHook = {
    matcher: '',
    hooks: [{ type: 'command', command: SOUND_CMD }]
  };

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.Stop) settings.hooks.Stop = [];

  // Remove existing sound hooks to avoid duplicates
  settings.hooks.Stop = settings.hooks.Stop.filter(h =>
    !h.hooks?.some(hh => hh.command?.includes('afplay') || hh.command?.includes('paplay') || hh.command?.includes('aplay'))
  );
  settings.hooks.Stop.push(stopHook);

  saveSettings(settings);
  console.log(`\n🔊 Звуковой хук установлен!`);
  console.log(`   Команда: ${SOUND_CMD}`);
  printFooter();
}

function installNotify() {
  const settings = loadSettings();

  const notifyHook = {
    matcher: '',
    hooks: [{ type: 'command', command: NOTIFY_CMD }]
  };

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.Stop) settings.hooks.Stop = [];

  // Remove existing notify hooks to avoid duplicates
  settings.hooks.Stop = settings.hooks.Stop.filter(h =>
    !h.hooks?.some(hh => hh.command?.includes('osascript') || hh.command?.includes('notify-send'))
  );
  settings.hooks.Stop.push(notifyHook);

  saveSettings(settings);
  console.log(`\n🔔 Хук уведомлений установлен!`);
  console.log(`   Команда: ${NOTIFY_CMD}`);
  printFooter();
}

function addPhrase(phrase) {
  if (!phrase || phrase.trim() === '') {
    console.error('❌ Укажи фразу: npx claude-code-vibes --add "Моя фраза"');
    process.exit(1);
  }

  const settings = loadSettings();
  const current = settings.spinnerVerbs?.verbs || [];

  if (current.includes(phrase)) {
    console.log(`⚠️  Фраза уже есть: "${phrase}"`);
    return;
  }

  current.push(phrase);
  settings.spinnerVerbs = { mode: 'replace', verbs: current };
  saveSettings(settings);

  console.log(`\n✅ Добавлена фраза: "${phrase}"`);
  console.log(`   Всего фраз: ${current.length}`);
  printFooter();
}

function installAllFeatures() {
  console.log('\n🚀 Устанавливаем всё сразу...\n');
  const settings = loadSettings();

  // Pack
  const pack = loadPack('ru-vibe');
  settings.spinnerVerbs = { mode: 'replace', verbs: pack.verbs };
  console.log(`✅ Пак: ru-vibe (${pack.verbs.length} фраз)`);

  // Sound
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.Stop) settings.hooks.Stop = [];
  settings.hooks.Stop = settings.hooks.Stop.filter(h =>
    !h.hooks?.some(hh => hh.command?.includes('afplay') || hh.command?.includes('paplay'))
  );
  settings.hooks.Stop.push({ matcher: '', hooks: [{ type: 'command', command: SOUND_CMD }] });
  console.log(`✅ Звук: установлен`);

  // Notify
  settings.hooks.Stop = settings.hooks.Stop.filter(h =>
    !h.hooks?.some(hh => hh.command?.includes('osascript') || hh.command?.includes('notify-send'))
  );
  settings.hooks.Stop.push({ matcher: '', hooks: [{ type: 'command', command: NOTIFY_CMD }] });
  console.log(`✅ Уведомления: установлены`);

  saveSettings(settings);
  printFooter();
}

function resetToDefault() {
  const settings = loadSettings();
  delete settings.spinnerVerbs;
  // Remove our hooks
  if (settings.hooks?.Stop) {
    settings.hooks.Stop = settings.hooks.Stop.filter(h =>
      !h.hooks?.some(hh =>
        hh.command?.includes('afplay') ||
        hh.command?.includes('paplay') ||
        hh.command?.includes('osascript') ||
        hh.command?.includes('notify-send')
      )
    );
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

// ─── Main ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const arg  = args[0];

if (!arg || arg === '--help' || arg === '-h') {
  if (!arg) installPack('ru-vibe');
  else printHelp();
  process.exit(0);
}

if (arg === '--sound')        installSound();
else if (arg === '--notify')  installNotify();
else if (arg === '--all-features') installAllFeatures();
else if (arg === '--reset')   resetToDefault();
else if (arg === '--add')     addPhrase(args[1]);
else if (arg === 'random')    installPack('random');
else if (arg === 'all' || PACKS.includes(arg)) installPack(arg);
else {
  console.error(`❌ Неизвестная команда: "${arg}"`);
  console.error('Запусти npx claude-code-vibes --help');
  process.exit(1);
}
