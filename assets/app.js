/* ============================================================
 *  汉语词语认识情况调查 · 主逻辑
 *  纯前端，无依赖，可直接部署到 GitHub Pages。
 * ============================================================ */
(function () {
  'use strict';

  var CFG = window.APP_CONFIG || {};
  var ALL = window.WORDS_BY_SET || {};
  var PRACTICE = window.PRACTICE_WORDS || [];

  var LS_REC = 'tv_wc_records_v1';
  var LS_DRAFT = 'tv_wc_draft_v1';
  var RING_R = 19;
  var RING_C = 2 * Math.PI * RING_R;

  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ---------------- 状态 ---------------- */
  var S = {
    setKey: 'w1',
    meta: null,
    phase: 'practice',      // practice | main
    items: [],
    idx: 0,
    answers: [],
    known: null,
    locked: true,
    deadline: 0,
    clockTotal: 30000,
    timerId: null,
    itemStart: 0,
    profile: null,
    session: '',
    startedAt: 0
  };

  /* ---------------- 工具 ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function nowISO() {
    var d = new Date();
    var off = -d.getTimezoneOffset();
    var sign = off >= 0 ? '+' : '-';
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
      sign + pad(Math.floor(Math.abs(off) / 60)) + ':' + pad(Math.abs(off) % 60);
  }

  function stamp() {
    var d = new Date();
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function newSession() {
    var code = (S.meta && S.meta.code) || 'WC';
    return code + '-' + Date.now().toString(36).toUpperCase() + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function show(id) {
    $$('.screen').forEach(function (el) {
      el.classList.toggle('is-active', el.id === id);
    });
    window.scrollTo(0, 0);
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    var params = new URLSearchParams(window.location.search);

    // 教师面板
    if (params.get('admin') === '1') {
      initAdmin();
      return;
    }

    // 测试集
    var setKey = (params.get('set') || CFG.DEFAULT_SET || 'w1').toLowerCase();
    if (!ALL[setKey] || !ALL[setKey].length) setKey = 'w1';
    S.setKey = setKey;
    S.meta = (window.SET_META || {})[setKey] || { code: setKey.toUpperCase(), count: (ALL[setKey] || []).length };

    // 标签
    var label = $('set-label');
    if (label) {
      label.textContent = '本次测试：' + (S.meta.cn || S.meta.code) +
        ' · ' + (ALL[setKey] || []).length + ' 个词 / ' +
        (S.meta.en || '') + ' · ' + (ALL[setKey] || []).length + ' words';
    }

    bindEvents();
    maybeResume();
  }

  /* ---------------- 事件 ---------------- */
  function bindEvents() {
    $('btn-start').addEventListener('click', onStartClick);
    $('btn-practice-start').addEventListener('click', startPractice);
    $('btn-main-start').addEventListener('click', startMain);
    $('btn-next').addEventListener('click', onNextClick);

    // 二选一
    $('choices').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-ans]') : null;
      if (!btn || S.locked) return;
      chooseAnswer(btn.getAttribute('data-ans'));
    });

    // 填空里按回车 = 下一题
    $('in-meaning').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        onNextClick();
      }
    });

    // 母语「其他」
    $('in-native').addEventListener('change', function () {
      var isOther = $('in-native').value === '其他';
      $('field-native-other').classList.toggle('is-hidden', !isOther);
      if (isOther) setTimeout(function () { $('in-native-other').focus(); }, 60);
    });

    // 离开保护
    window.addEventListener('beforeunload', function (e) {
      if (S.phase === 'main' && S.startedAt && S.idx < S.items.length) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    });

    // 学生下载
    var dl = $('btn-download');
    if (dl) {
      if (!CFG.ALLOW_STUDENT_DOWNLOAD) dl.classList.add('is-hidden');
      dl.addEventListener('click', function () {
        var rec = S.finalRecord;
        if (!rec) return;
        downloadJSON('my-answers-' + (rec.name || 'student') + '-' + stamp() + '.json', [rec]);
      });
    }
  }

  /* ---------------- 表单校验 ---------------- */
  function onStartClick() {
    var name = ($('in-name').value || '').trim();
    var cls = $('in-class').value;
    var nativeSel = $('in-native').value;
    var nativeOther = ($('in-native-other').value || '').trim();
    var sid = ($('in-sid').value || '').trim();

    clearErrors();
    var bad = false;

    if (!name) { markError('in-name'); bad = true; }
    if (!cls) { markError('in-class'); bad = true; }
    if (!nativeSel) { markError('in-native'); bad = true; }
    if (nativeSel === '其他' && !nativeOther) { markError('in-native-other'); bad = true; }

    if (bad) {
      var first = document.querySelector('.field.has-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    S.profile = {
      name: name,
      cls: cls,
      native: nativeSel === '其他' ? (nativeOther || '其他') : nativeSel,
      sid: sid
    };

    show('s-practice-intro');
  }

  function markError(id) {
    var el = $(id);
    if (!el) return;
    var field = el.closest('.field');
    if (field) field.classList.add('has-error');
  }

  function clearErrors() {
    $$('.field.has-error').forEach(function (f) { f.classList.remove('has-error'); });
  }

  /* ---------------- 流程 ---------------- */
  function startPractice() {
    S.phase = 'practice';
    S.items = PRACTICE.slice();
    S.idx = 0;
    S.answers = [];
    S.startedAt = 0;
    show('s-item');
    renderItem();
  }

  function showMainIntro() {
    var n = (ALL[S.setKey] || []).length;
    var sec = CFG.SECONDS_PER_ITEM || 30;

    $('main-badge').textContent = (S.meta.code || '') + ' · 正式测试 / Main test';
    $('main-title').textContent = '练习结束，现在开始正式部分';
    $('main-count').textContent = n;
    $('main-count-en').textContent = n + ' words, ' + sec + ' seconds each, then it moves on automatically.';

    var who = $('main-who');
    if (who && S.profile) {
      who.textContent = S.profile.name + ' · ' + S.profile.cls +
        (S.profile.sid ? ' · ' + S.profile.sid : '') + ' · ' + S.profile.native;
    }

    var stats = $('main-stats');
    if (stats) {
      stats.innerHTML =
        '<div class="stat"><b>' + n + '</b><span>个词 / words</span></div>' +
        '<div class="stat"><b>' + sec + '<i>s</i></b><span>每题 / each</span></div>' +
        '<div class="stat"><b>约 ' + Math.max(5, Math.round(n * 12 / 60)) + '<i>分</i></b><span>预计用时 / est.</span></div>';
    }
    show('s-main-intro');
  }

  function startMain() {
    S.phase = 'main';
    S.items = (ALL[S.setKey] || []).slice();
    S.idx = 0;
    S.answers = [];
    S.startedAt = Date.now();
    S.session = newSession();
    show('s-item');
    renderItem();
  }

  function renderItem() {
    var it = S.items[S.idx];
    if (!it) return;

    S.known = null;
    S.locked = false;

    $('word').textContent = it.word;
    $('pinyin').textContent = it.pinyin || '';

    var inp = $('in-meaning');
    inp.value = '';
    inp.blur();

    $('ask').classList.remove('is-hidden');
    $('choices').classList.remove('is-hidden');
    $('meaning').classList.add('is-hidden');

    var total = S.items.length;
    $('hud-step').textContent = (S.idx + 1) + ' / ' + total;

    var tag = $('hud-tag');
    if (S.phase === 'practice') {
      tag.textContent = '练习 / Practice';
      tag.classList.remove('is-main');
    } else {
      tag.textContent = (S.meta.code || '') + ' · 正式 / Main';
      tag.classList.add('is-main');
    }

    $('hud-bar').style.width = Math.round((S.idx / total) * 100) + '%';

    startTimer();
  }

  /* ---------------- 计时 ---------------- */
  function startTimer() {
    stopTimer();
    S.itemStart = Date.now();
    S.clockTotal = (CFG.SECONDS_PER_ITEM || 30) * 1000;
    S.deadline = S.itemStart + S.clockTotal;
    paintClock();
    S.timerId = setInterval(function () {
      paintClock();
      if (Date.now() >= S.deadline) commit('timeout');
    }, 100);
  }

  function stopTimer() {
    if (S.timerId) { clearInterval(S.timerId); S.timerId = null; }
  }

  function paintClock() {
    var left = Math.max(0, S.deadline - Date.now());
    var sec = Math.ceil(left / 1000);
    var num = $('clock-num');
    if (num.textContent !== String(sec)) num.textContent = sec;

    var ring = $('ring');
    ring.style.strokeDasharray = RING_C.toFixed(2);
    ring.style.strokeDashoffset = (RING_C * (1 - left / S.clockTotal)).toFixed(2);

    $('clock').classList.toggle('is-urgent', left <= 10000);
  }

  /* ---------------- 作答 ---------------- */
  function chooseAnswer(ans) {
    if (ans === 'yes') {
      S.known = 'yes';
      $('ask').classList.add('is-hidden');
      $('choices').classList.add('is-hidden');
      $('meaning').classList.remove('is-hidden');
      setTimeout(function () { $('in-meaning').focus(); }, 80);
    } else {
      S.known = 'no';
      commit('answered');
    }
  }

  function onNextClick() {
    if (S.locked) return;
    if (S.known !== 'yes') return;
    commit('answered');
  }

  function commit(status) {
    if (S.locked) return;
    S.locked = true;
    stopTimer();

    var it = S.items[S.idx];
    var raw = $('in-meaning').value || '';

    S.answers.push({
      n: S.idx + 1,
      set: it.set || '',
      word: it.word,
      pinyin: it.pinyin || '',
      combo: it.combo || '',
      known: S.known || 'none',
      meaning: raw.replace(/\s+/g, ' ').trim(),
      status: status,
      rt: Math.round((Date.now() - S.itemStart) / 100) / 10
    });

    if (S.phase === 'main') draftSave();

    var delay = status === 'timeout' ? 40 : 140;
    setTimeout(advance, delay);
  }

  function advance() {
    S.idx++;
    if (S.idx >= S.items.length) {
      if (S.phase === 'practice') {
        stopTimer();
        showMainIntro();
      } else {
        finish();
      }
      return;
    }
    renderItem();
  }

  /* ---------------- 收尾 ---------------- */
  function finish() {
    stopTimer();
    show('s-done');

    var rec = buildRecord();
    S.finalRecord = rec;

    localPush(rec);
    draftClear();
    renderSummary(rec);

    var statusEl = $('status-line');
    statusEl.className = 'status';
    statusEl.innerHTML = '正在提交，请稍候…<span class="en">Sending your answers…</span>';

    if (CFG.ALLOW_STUDENT_DOWNLOAD) $('btn-download').classList.remove('is-hidden');

    send(rec).then(function (res) {
      renderStatus(res, rec);
      rec.__sent = !!res.ok;
      rec.__mode = res.mode;
      localPush(rec);
    });
  }

  function buildRecord() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
    return {
      v: 1,
      session: S.session,
      ts: nowISO(),
      tz: tz,
      set: (S.meta && S.meta.code) || S.setKey.toUpperCase(),
      setKey: S.setKey,
      name: (S.profile && S.profile.name) || '',
      cls: (S.profile && S.profile.cls) || '',
      native: (S.profile && S.profile.native) || '',
      sid: (S.profile && S.profile.sid) || '',
      n: S.answers.length,
      durationSec: Math.round((Date.now() - S.startedAt) / 1000),
      ua: navigator.userAgent,
      answers: S.answers
    };
  }

  function renderSummary(rec) {
    var yes = 0, no = 0, none = 0;
    rec.answers.forEach(function (a) {
      if (a.known === 'yes') yes++;
      else if (a.known === 'no') no++;
      else none++;
    });
    var box = $('summary');
    if (!box) return;
    box.innerHTML =
      '<div class="cell"><b>' + rec.answers.length + '</b><span>题数 / items</span></div>' +
      '<div class="cell"><b>' + yes + '</b><span>认识 / known</span></div>' +
      '<div class="cell"><b>' + (no + none) + '</b><span>不熟 / unknown</span></div>';
  }

  function renderStatus(res, rec) {
    var el = $('status-line');
    var icon = $('done-icon');
    var title = $('done-title');
    var sub = $('done-sub');
    var foot = $('done-foot');

    if (res.ok) {
      el.className = 'status ok';
      el.innerHTML = '答案已发送。<span class="en">Your answers have been sent.</span>';
      title.textContent = '已完成，谢谢！';
      sub.textContent = 'All done. Thank you!';
      foot.innerHTML = '现在可以关闭页面了。 / You may close this page now.<br>' +
        '<span style="opacity:.8">如需备份，可点上方按钮下载。 / You may download a copy for backup.</span>';
    } else if (res.reason === 'no-url' || res.reason === 'no-form' || res.mode === 'offline') {
      el.className = 'status warn';
      el.innerHTML = '本次未连线上传（老师未配置提交地址）。<br>请点下面按钮下载答案，发给老师。' +
        '<span class="en">Upload is not configured. Please download your answers and send the file to your teacher.</span>';
      icon.classList.add('is-warn');
      icon.textContent = '!';
      title.textContent = '已完成，请下载答案';
      sub.textContent = 'Finished — please download your answers';
      foot.innerHTML = '点下方按钮 → 保存文件 → 发给老师。<br>' +
        '<span style="opacity:.8">Tap the button, save the file, send it to your teacher.</span>';
      if (CFG.ALLOW_STUDENT_DOWNLOAD) $('btn-download').classList.remove('is-hidden');
    } else {
      el.className = 'status err';
      el.innerHTML = '自动上传失败（网络无法访问提交服务器）。<br>请点下面按钮下载答案，发给老师。' +
        '<span class="en">Automatic upload failed. Please download your answers and send the file to your teacher.</span>';
      icon.classList.add('is-warn');
      icon.textContent = '!';
      title.textContent = '已完成，请下载答案';
      sub.textContent = 'Finished — please download your answers';
      foot.innerHTML = '点下方按钮 → 保存文件 → 发给老师。<br>' +
        '<span style="opacity:.8">Tap the button, save the file, send it to your teacher.</span>';
      if (CFG.ALLOW_STUDENT_DOWNLOAD) $('btn-download').classList.remove('is-hidden');
    }
  }

  /* ---------------- 提交 ---------------- */
  function send(rec) {
    var p = CFG.PROVIDER;

    if (!p || p === 'none') {
      return Promise.resolve({ ok: false, mode: 'offline', reason: 'no-url' });
    }

    var url, body, headers;

    if (p === 'gas') {
      if (!CFG.GAS_URL) return Promise.resolve({ ok: false, mode: 'offline', reason: 'no-url' });
      url = CFG.GAS_URL;
      body = JSON.stringify({ token: CFG.GAS_TOKEN || '', payload: rec });
      headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    } else if (p === 'gform') {
      if (!CFG.GFORM_ID) return Promise.resolve({ ok: false, mode: 'offline', reason: 'no-form' });
      var E = CFG.GFORM_ENTRIES || {};
      var u = new URLSearchParams();
      if (E.name) u.append(E.name, rec.name);
      if (E.cls) u.append(E.cls, rec.cls);
      if (E.native) u.append(E.native, rec.native);
      if (E.sid) u.append(E.sid, rec.sid || '');
      if (E.set) u.append(E.set, rec.set);
      if (E.payload) u.append(E.payload, JSON.stringify(rec));
      url = 'https://docs.google.com/forms/d/e/' + CFG.GFORM_ID + '/formResponse';
      body = u.toString();
      headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    } else {
      return Promise.resolve({ ok: false, mode: 'offline', reason: 'no-url' });
    }

    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, CFG.SEND_TIMEOUT_MS || 12000);

    return fetch(url, {
      method: 'POST',
      mode: 'no-cors',          // 不需要读响应，只要请求能到达
      cache: 'no-store',
      headers: headers,
      body: body,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function () {
      clearTimeout(to);
      return { ok: true, mode: 'sent' };
    }).catch(function (err) {
      clearTimeout(to);
      return { ok: false, mode: 'fail', reason: (err && err.name) || 'network' };
    });
  }

  /* ---------------- 本地存储 ---------------- */
  function localRead() {
    try {
      var a = JSON.parse(localStorage.getItem(LS_REC) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }

  function localWrite(arr) {
    try { localStorage.setItem(LS_REC, JSON.stringify(arr)); } catch (e) {}
  }

  function localPush(rec) {
    var a = localRead();
    for (var i = 0; i < a.length; i++) {
      if (a[i].session === rec.session) { a[i] = rec; localWrite(a); return; }
    }
    a.push(rec);
    localWrite(a);
  }

  function draftSave() {
    try {
      localStorage.setItem(LS_DRAFT, JSON.stringify({
        t: Date.now(),
        setKey: S.setKey,
        session: S.session,
        profile: S.profile,
        answers: S.answers,
        idx: S.idx
      }));
    } catch (e) {}
  }

  function draftClear() {
    try { localStorage.removeItem(LS_DRAFT); } catch (e) {}
  }

  function draftLoad() {
    try {
      var raw = localStorage.getItem(LS_DRAFT);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || !d.answers || !d.answers.length) return null;
      var total = (ALL[d.setKey] || []).length;
      if (!total || d.answers.length >= total) return null;
      if (Date.now() - d.t > 6 * 3600 * 1000) return null;   // 6 小时后失效
      return d;
    } catch (e) { return null; }
  }

  /* ---------------- 断点续答 ---------------- */
  function maybeResume() {
    var d = draftLoad();
    if (!d) return;

    var total = (ALL[d.setKey] || []).length;
    var box = document.createElement('div');
    box.className = 'notice';
    box.style.cssText = 'border-left-color:#2E7BC4;background:#EAF2FA;border-color:#C9DAEF;color:#1F4E79';
    box.innerHTML =
      '<b>检测到未完成的记录 / Unfinished record found</b>' +
      '已答 ' + d.answers.length + ' / ' + total + ' 题' +
      (d.profile && d.profile.name ? '（' + esc(d.profile.name) + '）' : '') +
      '<div style="margin-top:11px;display:flex;gap:8px">' +
      '<button type="button" class="btn btn-sm btn-primary" id="btn-resume" style="flex:1 1 0;height:46px;gap:0">' +
      '<span style="font-size:14px">继续</span><span class="btn-sub">Resume</span></button>' +
      '<button type="button" class="btn btn-sm btn-outline" id="btn-restart" style="flex:1 1 0;height:46px;gap:0">' +
      '<span style="font-size:14px">重新开始</span><span class="btn-sub">Restart</span></button>' +
      '</div>';

    var anchor = document.querySelector('#s-welcome .form');
    anchor.parentNode.insertBefore(box, anchor);

    $('btn-resume').addEventListener('click', function () {
      if (d.setKey !== S.setKey) {
        // 草稿属于另一个测试集，切换到它
        S.setKey = d.setKey;
        S.meta = (window.SET_META || {})[d.setKey] || { code: d.setKey.toUpperCase() };
      }
      S.profile = d.profile || null;
      S.session = d.session;
      S.answers = d.answers || [];
      S.idx = S.answers.length;
      S.phase = 'main';
      S.items = (ALL[S.setKey] || []).slice();
      S.startedAt = Date.now();
      show('s-item');
      renderItem();
    });

    $('btn-restart').addEventListener('click', function () {
      draftClear();
      box.remove();
    });
  }

  /* ---------------- 下载 ---------------- */
  function downloadText(filename, text, mime, withBom) {
    var blob = new Blob([withBom ? '\ufeff' + text : text], { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 400);
  }

  function downloadJSON(filename, data) {
    downloadText(filename, JSON.stringify(data, null, 1), 'application/json', false);
  }

  /* ---------------- 教师面板 ---------------- */
  function initAdmin() {
    show('s-admin');
    renderAdmin();

    $('btn-exp-json').addEventListener('click', function () {
      var all = localRead();
      if (!all.length) { alert('本机暂无记录 / No records'); return; }
      downloadJSON('wordcheck-records-' + stamp() + '.json', all);
    });

    $('btn-exp-csv').addEventListener('click', function () {
      var all = localRead();
      if (!all.length) { alert('本机暂无记录 / No records'); return; }
      downloadText('wordcheck-items-' + stamp() + '.csv', buildCSV(all), 'text/csv', true);
    });

    $('btn-merge').addEventListener('click', function () { $('file-merge').click(); });

    $('file-merge').addEventListener('change', function (ev) {
      var files = Array.prototype.slice.call(ev.target.files || []);
      if (!files.length) return;
      var added = 0, dup = 0, pending = files.length;

      files.forEach(function (f) {
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var data = JSON.parse(String(reader.result));
            var arr = Array.isArray(data) ? data : [data];
            var cur = localRead();
            arr.forEach(function (r) {
              if (!r || !r.session) return;
              var found = false;
              for (var i = 0; i < cur.length; i++) {
                if (cur[i].session === r.session) { cur[i] = r; found = true; dup++; break; }
              }
              if (!found) { cur.push(r); added++; }
            });
            localWrite(cur);
          } catch (e) {
            alert('文件无法解析 / Cannot read: ' + f.name);
          }
          if (--pending === 0) {
            renderAdmin();
            alert('导入完成：新增 ' + added + ' 条，重复覆盖 ' + dup + ' 条。');
          }
        };
        reader.readAsText(f);
      });
      ev.target.value = '';
    });

    $('btn-clear').addEventListener('click', function () {
      if (!confirm('确定清空本机所有记录？此操作不可撤销。\nClear all records on this device? This cannot be undone.')) return;
      localWrite([]);
      draftClear();
      renderAdmin();
    });
  }

  function renderAdmin() {
    var list = localRead();
    var box = $('admin-list');
    if (!list.length) {
      box.innerHTML = '<div class="admin-empty">本机暂无记录。 / No records on this device.</div>';
      return;
    }
    list.sort(function (a, b) { return String(a.ts || '').localeCompare(String(b.ts || '')); });

    var html = '';
    list.forEach(function (r) {
      var ok = r.__sent !== false;
      var yes = 0;
      (r.answers || []).forEach(function (a) { if (a.known === 'yes') yes++; });
      html += '<div class="admin-row">' +
        '<span class="dot' + (ok ? '' : ' fail') + '" title="' + (ok ? 'sent' : 'not sent') + '"></span>' +
        '<span class="who">' + esc(r.name || '—') + '</span>' +
        '<span class="meta">' + esc(r.cls || '') + ' · ' + esc(r.set || '') +
        ' · ' + (r.answers ? r.answers.length : 0) + ' 词 · 认识 ' + yes +
        ' · ' + esc(String(r.ts || '').replace('T', ' ').slice(5, 16)) +
        ' · ' + esc(r.session || '') + '</span>' +
        '</div>';
    });
    box.innerHTML = html;
  }

  function cell(v) {
    var s = (v == null ? '' : String(v));
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function buildCSV(records) {
    var head = ['session', 'timestamp', 'test_set', 'name', 'class', 'native', 'sid',
      'item_no', 'word_set', 'word', 'pinyin', 'tone_combo',
      'known', 'meaning', 'status', 'rt_sec', 'scale_points'];
    var rows = [head.join(',')];

    records.forEach(function (r) {
      (r.answers || []).forEach(function (a) {
        // 0 = 不计入（选不认识 / 未作答）；1 = 选认识且写了意思（意思是否正确需人工判）
        var pts = (a.known === 'yes' && a.meaning) ? 1 : 0;
        rows.push([
          cell(r.session), cell(r.ts), cell(r.set), cell(r.name), cell(r.cls),
          cell(r.native), cell(r.sid), cell(a.n), cell(a.set), cell(a.word),
          cell(a.pinyin), cell(a.combo), cell(a.known), cell(a.meaning),
          cell(a.status), cell(a.rt), pts
        ].join(','));
      });
    });
    return rows.join('\r\n');
  }

  /* ---------------- go ---------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
