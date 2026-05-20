#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import client from '../src/client.js';

const program = new Command();

function output(data, format) {
  format = format || 'json';
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else if (format === 'table') {
    if (Array.isArray(data) && data.length > 0) {
      const keys = Object.keys(data[0]);
      const widths = keys.map(k => Math.max(k.length, ...data.map(d => String(d[k] || '').length)));
      console.log(keys.map((k, i) => k.padEnd(widths[i])).join(' | '));
      console.log(widths.map(w => '-'.repeat(w)).join('-+-'));
      data.forEach(row => {
        console.log(keys.map((k, i) => String(row[k] || '').padEnd(widths[i])).join(' | '));
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

program.command('config').description('config')
  .argument('<action>', 'set/get/list')
  .argument('[key]', 'key')
  .argument('[value]', 'value')
  .action(async (action, key, value) => {
    if (action === 'set') {
      if (!key || !value) { console.error('Usage: zentao config set <key> <value>'); process.exit(1); }
      if (key === 'host') { client.setHost(value); console.log('Host: ' + value); }
      else if (key === 'cookie') { client.setCookie(value); console.log('Cookie saved'); }
      else { console.error('Unknown: ' + key); process.exit(1); }
    } else if (action === 'get') {
      if (key === 'host') console.log(client.host);
      else if (key === 'cookie') console.log(client.cookie ? '***' : '');
      else console.log({ host: client.host, hasCookie: !!client.cookie });
    } else {
      console.log('Host: ' + client.host);
      console.log('Cookie: ' + (client.cookie ? '***' : 'not set'));
    }
  });

program.command('login').description('login')
  .argument('<account>', 'account')
  .argument('<password>', 'password')
  .action(async (account, password) => {
    try {
      const result = await client.login(account, password);
      console.log(result.success ? 'OK' : 'FAILED');
      if (!result.success) process.exit(1);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('products').description('products')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (opts) => {
    try {
      const products = await client.listProducts();
      output(products, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('plans').description('plans')
  .argument('[productId]', 'product ID')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (productId, opts) => {
    try {
      if (!productId) { console.error('productId required'); process.exit(1); }
      const plans = await client.getProductPlans(productId);
      output(plans, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('builds').description('builds')
  .argument('[productId]', 'product ID')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (productId, opts) => {
    try {
      if (!productId) { console.error('productId required'); process.exit(1); }
      const builds = await client.listBuilds(productId);
      output(builds, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('releases').description('releases')
  .argument('[productId]', 'product ID')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (productId, opts) => {
    try {
      if (!productId) { console.error('productId required'); process.exit(1); }
      const releases = await client.listReleases(productId);
      output(releases, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('stories').description('stories')
  .argument('[productId]', 'product ID')
  .option('-b, --build <id>', 'build ID')
  .option('-s, --status <status>', 'status')
  .option('-p, --plan <planId>', 'plan ID')
  .option('-o, --openedBy <name>', 'opened by user')
  .option('-t, --taskCount <count>', 'task count filter')
  .option('-l, --limit <n>', 'limit', '100')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (productId, opts) => {
    try {
      let stories;
      if (opts.build) {
        stories = await client.listStoriesByBuild(opts.build, { limit: opts.limit });
      } else if (productId) {
        stories = await client.listStories(productId, { status: opts.status, plan: opts.plan, openedBy: opts.openedBy });
        if (opts.taskCount !== undefined) {
          const taskCountFilter = parseInt(opts.taskCount);
          stories = await Promise.all(stories.map(async function(s) {
            try { var tasks = await client.getStoryTasks(s.id); s.taskCount = Object.keys(tasks).length; } catch (e) { s.taskCount = 0; }
            return s;
          }));
          stories = stories.filter(function(s) { return s.taskCount === taskCountFilter; });
        }
      } else {
        console.error('productId or --build required'); process.exit(1);
      }
      output(stories, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('bugs').description('bugs')
  .option('-p, --product <id>', 'product ID')
  .option('-b, --build <id>', 'build ID')
  .option('-s, --status <status>', 'status')
  .option('-v, --severity <level>', 'severity 1-4')
  .option('-t, --type <type>', 'type')
  .option('-l, --limit <n>', 'limit', '100')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (opts) => {
    try {
      let bugs;
      if (opts.build) {
        bugs = await client.listBugsByBuild(opts.build, { limit: opts.limit });
      } else if (opts.product) {
        bugs = await client.listBugs(opts.product, {
          status: opts.status,
          severity: opts.severity,
          type: opts.type
        });
      } else {
        console.error('-p <productId> required'); process.exit(1);
      }
      output(bugs, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('projects').description('projects')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (opts) => {
    try {
      const projects = await client.listProjects();
      output(projects, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('tasks').description('tasks')
  .argument('[projectId]', 'project ID')
  .option('-s, --status <status>', 'status')
  .option('-a, --assignee <name>', 'assignee')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (projectId, opts) => {
    try {
      const tasks = await client.listTasks(projectId, { status: opts.status, assignee: opts.assignee });
      output(tasks, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('search').description('search')
  .argument('<keywords>', 'keywords')
  .action(async (keywords) => {
    try {
      const results = await client.search(keywords);
      output(results, 'json');
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.option('-H, --host <url>', 'host')
  .option('-c, --cookie <cookie>', 'cookie')
  .option('-f, --format <json|table>', 'format', 'json')
  .hook('preAction', (thisCmd) => {
    const opts = thisCmd.opts();
    if (opts.host) client.setHost(opts.host);
    if (opts.cookie) client.setCookie(opts.cookie);
  });

program.on('--help', () => {
  console.log('\nUsage:');
  console.log('  zentao login user pass');
  console.log('  zentao products');
  console.log('  zentao plans 368');
  console.log('  zentao stories 368 --status active --plan 1707');
  console.log('  zentao bugs -p 368 --status active --severity 1');
  console.log('  zentao search "keyword"');
});

program.parse();
