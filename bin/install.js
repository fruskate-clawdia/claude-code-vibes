#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const PACKS = ['ru-vibe', 'corporate', 'existential', 'startup'];
const CHANNEL = 'https://t.me/ghostinthemachine_ai';

const packDescriptions = {
  'ru-vibe': '😤 Русский вайб — "Не торопи меня", "Мозгую"...',
  'corporate': '🏢 Корпоратный ад — "Синхронизирую ожидания", "Назначаю митинг по поводу митинга"...',
  'existential': '🌀 Экзистенциальный кризис — "Смотрю в бездну", "Бездна смотрит в меня"...',
  'startup': '🚀 Стартап-режим — "Пивотирую концепцию", "Считаю runway"...',
};

function printHelp() {
  console.log(`
👻 claude-code-vibes — замена спиннера Claude Code

Использование:
  npx claude-code-vibes              # установить ru-vibe (по умолчанию)
  npx claude-code-vibes [пак]        # установить конкретный пак
  npx claude-code-vibes all          # установить все паки вместе

Доступные паки:
  ru-vibe      ${packDescriptions['ru-vibe']}
  corporate    ${packDescriptions['corporate']}
  existential  ${packDescriptions['existential']}
  startup      ${packDescriptions['startup']}

Сделано Clawdia 👻 — ${CHANNEL}
`);
}

function loadPack(packName) {
  const packPath = path.join(__dirname, '..', 'packs', `${packName}.json`);
  if (!fs.existsSync(packPath)) {
    console.error(`❌ Пак "${packName}" не найден`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(packPath, 'utf8'));
}

function install(packName) {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  const claudeDir = path.join(os.homedir(), '.claude');

  // Create ~/.claude if not exists
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Load existing settings
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      console.warn('⚠️  Не удалось прочитать settings.json, создаю новый');
    }
  }

  // Load verbs
  let verbs = [];
  if (packName === 'all') {
    PACKS.forEach(p => {
      const pack = loadPack(p);
      verbs = verbs.concat(pack.verbs);
    });
    console.log(`\n✅ Установлены все паки (${verbs.length} фраз):\n`);
    PACKS.forEach(p => console.log(`   ${packDescriptions[p]}`));
  } else {
    const pack = loadPack(packName);
    verbs = pack.verbs;
    console.log(`\n✅ Установлен пак "${packName}" (${verbs.length} фраз):`);
    console.log(`   ${packDescriptions[packName]}`);
  }

  // Merge into settings
  settings.spinnerVerbs = {
    mode: 'replace',
    verbs: verbs,
  };

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

  console.log(`\n📁 Записано в: ${settingsPath}`);
  console.log(`\n🔄 Перезапусти Claude Code чтобы увидеть изменения`);
  console.log(`\n👻 Сделано Clawdia — подписывайся: ${CHANNEL}\n`);
}

// Main
const arg = process.argv[2];

if (arg === '--help' || arg === '-h') {
  printHelp();
  process.exit(0);
}

const packName = arg || 'ru-vibe';

if (packName !== 'all' && !PACKS.includes(packName)) {
  console.error(`❌ Неизвестный пак: "${packName}"`);
  console.error(`Доступные паки: ${PACKS.join(', ')}, all`);
  process.exit(1);
}

install(packName);
