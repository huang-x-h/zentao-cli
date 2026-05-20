import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CONFIG_DIR = path.join(os.homedir(), '.zentao-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

var _host = process.env.ZENTAO_HOST || '';
var _cookie = '';

try {
  if (fs.existsSync(CONFIG_FILE)) {
    var config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    _host = config.host || _host;
    _cookie = config.cookie || '';
  }
} catch (e) {}

function saveConfig() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ host: _host, cookie: _cookie }, null, 2));
}

async function api(module, method, params) {
  if (!_host) throw new Error('请先设置禅道地址：zentao-cli config set host http://your-zentao.com');
  if (!_cookie) throw new Error('请先登录：zentao-cli login <账号> <密码>');
  params = params || {};
  var url = new URL(_host + '/' + module + '-' + method + '.json');
  for (var k in params) { if (params[k] !== undefined && params[k] !== null && params[k] !== '') url.searchParams.set(k, params[k]); }
  var resp = await axios.get(url.toString(), { headers: { 'Cookie': _cookie }, timeout: 30000 });
  var data = resp.data;
  if (data.status !== 'success') throw new Error(data.message || 'API Error');
  return typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
}

export default {
  setHost: function(host) { _host = host.replace(/\/$/, ''); saveConfig(); },
  setCookie: function(cookie) { _cookie = cookie; saveConfig(); },
  
  login: async function(account, password) {
    var resp = await axios.post(
      _host + '/user-login.html',
      'account=' + encodeURIComponent(account) + '&password=' + encodeURIComponent(password),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, maxRedirects: 0, validateStatus: function(s) { return s >= 200 && s < 400; } }
    );
    var setCookie = resp.headers['set-cookie'];
    if (setCookie) { _cookie = setCookie.map(function(c) { return c.split(';')[0]; }).join('; '); saveConfig(); return { success: true }; }
    return { success: false };
  },

  listProducts: async function() {
    var data = await api('product', 'all');
    var products = data.products || {};
    return Object.keys(products).map(function(id) { return { id: id, name: products[id] }; });
  },

  listBuilds: async function(productId) {
    var data = await api('product', 'build-' + productId, {});
    var builds = data.builds || {};
    return Object.keys(builds).map(function(id) {
      var b = builds[id];
      return { id: b.id, name: b.name, product: b.product, date: b.date || '', creator: b.createdBy || '' };
    });
  },

  listReleases: async function(productId) {
    var data = await api('release', 'browse', { productID: productId });
    return data.releases || [];
  },

  listStories: async function(productId, options) {
    options = options || {};
    var data = await api('product', 'browse', { productID: productId });
    var stories = data.stories || {};
    var list = Object.keys(stories).map(function(key) {
      var s = stories[key];
      return { id: s.id, title: s.title, status: s.status, stage: s.stage, pri: s.pri, plan: (s.planTitle && typeof s.planTitle === 'object') ? Object.values(s.planTitle)[0] : (s.planTitle || ''), planId: s.plan || '', openedBy: s.openedBy || '' };
    });
    if (options.status) list = list.filter(function(s) { return s.status === options.status; });
    if (options.plan) list = list.filter(function(s) { return s.planId === options.plan; });
    return list;
  },

  listStoriesByBuild: async function(buildId, options) {
    options = options || {};
    var data = await api('story', 'browse', { build: buildId });
    var stories = data.stories || {};
    var list = Object.keys(stories).map(function(key) {
      var s = stories[key];
      return { id: s.id, title: s.title, status: s.status, stage: s.stage, pri: s.pri, openedBy: s.openedBy || '' };
    });
    if (options.status) list = list.filter(function(s) { return s.status === options.status; });
    return list;
  },

  getStory: async function(storyId) {
    var data = await api('story', 'view-' + storyId, {});
    var s = data.story || {};
    return {
      id: s.id,
      title: s.title,
      status: s.status,
      stage: s.stage,
      pri: s.pri,
      type: s.type,
      plan: (s.planTitle && typeof s.planTitle === 'object') ? Object.values(s.planTitle)[0] : (s.planTitle || ''),
      openedBy: s.openedBy || '',
      openedDate: s.openedDate || '',
      assignedTo: s.assignedTo || '',
      lastEditedBy: s.lastEditedBy || '',
      lastEditedDate: s.lastEditedDate || '',
      version: s.version || '',
      spec: s.spec || '',
      verify: s.verify || ''
    };
  },

  listBugs: async function(productId, options) {
    options = options || {};
    var data = await api('bug', 'browse-' + productId, {});
    var bugs = data.bugs || {};
    var list = Object.keys(bugs).map(function(key) {
      var b = bugs[key];
      return { id: b.id, title: b.title, severity: b.severity || '', pri: b.pri || '', status: b.status || '', type: b.type || '', openedBy: b.openedBy || '', assignedTo: b.assignedTo || '', openedDate: b.openedDate ? b.openedDate.substring(0, 10) : '' };
    });
    if (options.status) list = list.filter(function(b) { return b.status === options.status; });
    if (options.severity) list = list.filter(function(b) { return b.severity === options.severity; });
    if (options.type) list = list.filter(function(b) { return b.type === options.type; });
    return list;
  },

  listBugsByBuild: async function(buildId, options) {
    options = options || {};
    var data = await api('bug', 'browse-' + buildId, {});
    var bugs = data.bugs || {};
    var list = Object.keys(bugs).map(function(key) {
      var b = bugs[key];
      return { id: b.id, title: b.title, severity: b.severity || '', status: b.status || '', openedBy: b.openedBy || '', assignedTo: b.assignedTo || '' };
    });
    if (options.status) list = list.filter(function(b) { return b.status === options.status; });
    if (options.severity) list = list.filter(function(b) { return b.severity === options.severity; });
    return list;
  },

  getBug: async function(bugId) {
    var data = await api('bug', 'view-' + bugId, {});
    var b = data.bug || {};
    return {
      id: b.id,
      title: b.title,
      severity: b.severity || '',
      pri: b.pri || '',
      status: b.status || '',
      type: b.type || '',
      openedBy: b.openedBy || '',
      openedDate: b.openedDate || '',
      assignedTo: b.assignedTo || '',
      deadline: b.deadline || '',
      resolvedBy: b.resolvedBy || '',
      resolvedDate: b.resolvedDate || '',
      resolution: b.resolution || '',
      steps: b.steps || ''
    };
  },

  listProjects: async function() {
    var data = await api('project', 'index');
    return data.projects || [];
  },

  listTasks: async function(projectId, options) {
    options = options || {};
    var data = await api('project', 'task', { projectID: projectId });
    return data.tasks || [];
  },

  search: async function(keywords) {
    var data = await api('search', 'index', { words: keywords });
    return data.results || [];
  },

  getProductPlans: async function(productId) {
    var data = await api('product', 'browse', { productID: productId });
    var plans = data.plans || {};
    return Object.keys(plans).filter(function(id) { return id !== ''; }).map(function(id) {
      var p = plans[id];
      var match = p.match(/^(.+?)\s*\[([\d-]+)\s*~\s*([\d-]+)\]$/);
      return { id: id, name: match ? match[1] : p, startDate: match ? match[2] : '', endDate: match ? match[3] : '' };
    });
  },

  api: api
};
