/* ============================================================
 *  配置 / Configuration
 *  这是唯一需要你手动修改的文件。
 *  This is the ONLY file you need to edit.
 * ============================================================ */

window.APP_CONFIG = {

  /* 每个词的作答时限（秒）。改这里即可全站生效。
     Seconds allowed per word. */
  SECONDS_PER_ITEM: 30,

  /* 提交方式 / Submission provider
   *   'gas'   → Google Apps Script 写入 Google 表格（推荐 / recommended）
   *   'gform' → 直接提交到 Google Forms（字段长度有限，仅备选）
   *   'none'  → 不上传，只在学生手机本地保存，由老师回收文件
   */
  PROVIDER: 'gas',

  /* ---- 方式一：Google Apps Script（推荐）----
   * 部署后把 /exec 结尾的完整网址填到 GAS_URL。
   * GAS_TOKEN 必须与 Code.gs 里的 TOKEN 完全一致。 */
  GAS_URL: '',
  GAS_TOKEN: 'toneviz-wc-2026',

  /* ---- 方式二：Google Forms（备选）----
   * GFORM_ID 是表单链接里 /d/e/ 与 /viewform 之间的那段。
   * 每个 entry.xxxxx 要在表单「获取预填链接」里查到。
   * payload 字段必须是「段落 / Paragraph」类型。 */
  GFORM_ID: '',
  GFORM_ENTRIES: {
    name:    '',   // entry.1111111111
    cls:     '',   // entry.2222222222
    native:  '',   // entry.3333333333
    sid:     '',   // entry.4444444444
    set:     '',   // entry.5555555555
    payload: ''    // entry.6666666666  ← 段落类型
  },

  /* 默认测试集：'w1' 或 'w8'。
     网址加 ?set=w8 可覆盖，方便一个网站生成两个链接。 */
  DEFAULT_SET: 'w1',

  /* 网络请求超时（毫秒）。超过即判定为「发送失败」，会提示学生下载备份。 */
  SEND_TIMEOUT_MS: 12000,

  /* 学生可在结束页下载自己的答案文件，作为断网时的备份。 */
  ALLOW_STUDENT_DOWNLOAD: true
};
