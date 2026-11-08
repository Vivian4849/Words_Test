/**
 * ============================================================
 *  ToneViz · 认词核查 · Google Apps Script 接收端
 * ============================================================
 *  作用：接收网页提交的 JSON，写进这个脚本所属的 Google 表格。
 *
 *  部署步骤（约 5 分钟）：
 *   1. 打开 https://sheets.new 新建一个空白表格，命名如「认词核查数据」。
 *   2. 菜单：扩展程序 → Apps Script。
 *   3. 删掉编辑器里原有的全部内容，把本文件整段粘贴进去，保存（Ctrl+S）。
 *   4. 点上方「运行」，选择函数 setup，授权（第一次会要求授权，走完即可）。
 *      —— 这一步会建好两张表：「提交记录」「逐题明细」。
 *   5. 右上角「部署」→「新建部署」→ 类型选「Web 应用」。
 *        说明：wordcheck
 *        执行身份：我
 *        谁可以访问：任何人      ← 必须是「任何人」，否则学生提交会被拒
 *   6. 复制生成的「Web 应用网址」（以 /exec 结尾），填进网站的 assets/config.js：
 *        GAS_URL: 'https://script.google.com/macros/s/AKfycb.../exec'
 *   7. 浏览器直接打开那个 /exec 网址，应看到 "endpoint is running" —— 说明通了。
 *
 *  注意：每次修改本文件后，都要「部署」→「管理部署」→ 编辑 → 版本选「新版本」，
 *        否则线上运行的还是旧代码。
 * ============================================================
 */

/* 与 assets/config.js 里的 GAS_TOKEN 必须完全一致。改成你自己的随机字符串。 */
var TOKEN = 'toneviz-wc-2026';

var SH_SUBMIT = '提交记录';
var SH_ITEMS  = '逐题明细';

var HEAD_SUBMIT = [
  '提交时间', 'session', '测试集', '姓名', '班级', '母语', '学号后两位',
  '题数', '认识数', '不认识数', '未作答数', '用时(秒)', '时区', '浏览器', '原始JSON'
];

var HEAD_ITEMS = [
  'session', '提交时间', '姓名', '班级', '测试集', '题号', '词表', '汉字',
  '拼音', '声调组合', '认识', '意思', '状态', '反应时(秒)', '计分', '意思判定'
];


/* ============================================================
 *  一次性初始化：建表 + 表头
 * ============================================================ */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getSheet_(ss, SH_SUBMIT, HEAD_SUBMIT);
  getSheet_(ss, SH_ITEMS, HEAD_ITEMS);
  SpreadsheetApp.getUi().alert('已建好两张表：' + SH_SUBMIT + ' / ' + SH_ITEMS);
}


/* ============================================================
 *  接收提交
 * ============================================================ */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return out_({ ok: false, error: 'busy' });
  }

  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    if (!raw) return out_({ ok: false, error: 'empty body' });

    var body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      return out_({ ok: false, error: 'bad json' });
    }

    var token = body.token || (e.parameter && e.parameter.token) || '';
    if (TOKEN && token !== TOKEN) return out_({ ok: false, error: 'bad token' });

    var p = body.payload || body;
    if (!p || !p.session) return out_({ ok: false, error: 'no payload' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var shS = getSheet_(ss, SH_SUBMIT, HEAD_SUBMIT);
    var shI = getSheet_(ss, SH_ITEMS, HEAD_ITEMS);

    var answers = p.answers || [];
    var yes = 0, no = 0, none = 0;
    for (var i = 0; i < answers.length; i++) {
      var k = answers[i].known;
      if (k === 'yes') yes++;
      else if (k === 'no') no++;
      else none++;
    }

    /* ---- 汇总表：一个 session 一行，重复提交则覆盖 ---- */
    var rowS = [
      p.ts || '', p.session || '', p.set || '', p.name || '', p.cls || '',
      p.native || '', p.sid || '', answers.length, yes, no, none,
      p.durationSec || '', p.tz || '', p.ua || '', JSON.stringify(p)
    ];

    var replaced = false;
    var lastS = shS.getLastRow();
    if (lastS > 1) {
      var ids = shS.getRange(2, 2, lastS - 1, 1).getValues();
      for (var r = 0; r < ids.length; r++) {
        if (String(ids[r][0]) === String(p.session)) {
          shS.getRange(r + 2, 1, 1, HEAD_SUBMIT.length).setValues([rowS]);
          replaced = true;
          break;
        }
      }
    }
    if (!replaced) {
      shS.appendRow(rowS);
    }

    /* ---- 明细表：一个 session 只写一次 ---- */
    var exists = false;
    var lastI = shI.getLastRow();
    if (lastI > 1) {
      var cols = shI.getRange(2, 1, lastI - 1, 1).getValues();
      for (var c = 0; c < cols.length; c++) {
        if (String(cols[c][0]) === String(p.session)) { exists = true; break; }
      }
    }

    if (!exists && answers.length) {
      var rows = [];
      for (var a = 0; a < answers.length; a++) {
        var x = answers[a];
        var score = (x.known === 'yes' && x.meaning) ? 1 : 0;
        rows.push([
          p.session || '', p.ts || '', p.name || '', p.cls || '', p.set || '',
          x.n || (a + 1), x.set || '', x.word || '', x.pinyin || '',
          x.combo || '', x.known || '', x.meaning || '',
          x.status || '', x.rt || '', score,
          score ? '' : (x.known === 'yes' ? '写了意思待人工判' : '')
        ]);
      }
      shI.getRange(shI.getLastRow() + 1, 1, rows.length, HEAD_ITEMS.length).setValues(rows);
    }

    return out_({ ok: true, session: p.session, items: answers.length });

  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}


/* ============================================================
 *  用浏览器打开 /exec 时可用来自检
 * ============================================================ */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var msg = 'ToneViz word-check endpoint is running.\n' +
            'Spreadsheet: ' + ss.getName() + '\n' +
            '提交记录行数: ' + Math.max(0, ss.getSheetByName(SH_SUBMIT) ? ss.getSheetByName(SH_SUBMIT).getLastRow() - 1 : 0) + '\n' +
            '逐题明细行数: ' + Math.max(0, ss.getSheetByName(SH_ITEMS) ? ss.getSheetByName(SH_ITEMS).getLastRow() - 1 : 0);
  return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
}


/* ============================================================
 *  小工具
 * ============================================================ */
function getSheet_(ss, name, head) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]);
    sh.getRange(1, 1, 1, head.length)
      .setFontWeight('bold')
      .setBackground('#1F4E79')
      .setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);
  }
  return sh;
}

function out_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
