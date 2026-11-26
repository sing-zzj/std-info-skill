#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const PKG = require('./package.json');
const SKILL_NAME = 'std-info';
const SRC = path.join(__dirname, 'skills', SKILL_NAME);

// 目标目录：agent 名 -> 相对 home 的技能目录
const TARGETS = {
  workbuddy: '.workbuddy/skills',
  'claude-code': '.claude/skills',
  codebuddy: '.codebuddy/skills',
  agents: '.agents/skills',
};
const ALL = Object.keys(TARGETS);
const DEFAULT_AGENT = 'workbuddy';

function usage() {
  console.log(`std-info-skill v${PKG.version}

用法:
  npx --yes github:sing-zzj/std-info-skill [选项]

选项:
  --agent <名称>   安装到哪个 agent，可重复或用逗号分隔
                   支持: ${ALL.join(' / ')} / all
                   默认: ${DEFAULT_AGENT}
  --list           列出支持的目标及路径
  --dry-run        只打印将要写入的路径，不实际复制
  --help           显示帮助

示例:
  npx --yes github:sing-zzj/std-info-skill
  npx --yes github:sing-zzj/std-info-skill --agent workbuddy --agent claude-code
  npx --yes github:sing-zzj/std-info-skill --agent all
  npx --yes github:sing-zzj/std-info-skill --agent workbuddy,codebuddy
`);
}

function parseArgs(argv) {
  const opts = { agents: [], list: false, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--list') opts.list = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--agent' || a === '-a') {
      const v = argv[++i];
      if (!v) throw new Error('--agent 缺少名称，可用 --list 查看支持的名称');
      opts.agents.push(...v.split(',').map(s => s.trim()).filter(Boolean));
    } else if (a.startsWith('--agent=')) {
      opts.agents.push(...a.slice(8).split(',').map(s => s.trim()).filter(Boolean));
    } else {
      throw new Error(`无法识别的参数: ${a}（用 --help 查看用法）`);
    }
  }
  return opts;
}

function resolveAgents(names) {
  if (!names.length) return [DEFAULT_AGENT];
  const out = [];
  for (const n of names) {
    if (n === 'all') {
      for (const a of ALL) if (!out.includes(a)) out.push(a);
    } else if (TARGETS[n]) {
      if (!out.includes(n)) out.push(n);
    } else {
      throw new Error(`不支持的 agent: ${n}（支持: ${ALL.join(' / ')} / all）`);
    }
  }
  return out;
}

function copySkill(targetDir) {
  const dest = path.join(targetDir, SKILL_NAME);
  fs.mkdirSync(dest, { recursive: true });
  // 只复制本包自带文件，不删除目标目录里已有的其他文件（加法安装/覆盖同名文件）
  fs.cpSync(SRC, dest, { recursive: true, force: true });
  const files = [];
  const walk = (dir, rel) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      const r = rel ? path.join(rel, ent.name) : ent.name;
      if (ent.isDirectory()) walk(p, r);
      else files.push(r);
    }
  };
  walk(dest, '');
  return { dest, files };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { usage(); return; }

  if (opts.list) {
    console.log(`支持的 agent 目标（基于 home: ${os.homedir()}）:`);
    for (const a of ALL) console.log(`  ${a.padEnd(12)} -> ${path.join(os.homedir(), TARGETS[a], SKILL_NAME)}`);
    return;
  }

  if (!fs.existsSync(path.join(SRC, 'SKILL.md'))) {
    throw new Error(`源技能文件缺失: ${path.join(SRC, 'SKILL.md')}`);
  }

  const agents = resolveAgents(opts.agents);
  console.log(`std-info-skill v${PKG.version} -> ${agents.join(', ')}`);

  for (const agent of agents) {
    const targetDir = path.join(os.homedir(), TARGETS[agent]);
    if (opts.dryRun) {
      console.log(`[dry-run] ${path.join(targetDir, SKILL_NAME)}`);
      continue;
    }
    const { dest, files } = copySkill(targetDir);
    console.log(`[OK] ${agent}: ${dest}`);
    console.log(`     文件: ${files.map(f => path.join(SKILL_NAME, f)).join(', ')}`);
  }
  console.log(opts.dryRun ? 'dry-run 完成，未写入任何文件。' : '安装完成。重新打开 agent 会话即可加载技能。');
}

try {
  main();
} catch (e) {
  console.error(`安装失败: ${e.message}`);
  process.exit(1);
}
