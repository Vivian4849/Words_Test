/* ============================================================
 *  词表数据 / Word lists
 *  自动生成，请勿手改；要换词请重新生成本文件。
 *  顺序为固定随机（seed = 20261108），可复现，且与词表原顺序不同。
 * ============================================================ */

/* 练习词（不计分、不上传）—— 学生必然认识，用于熟悉流程 */
window.PRACTICE_WORDS = [
    { set: '练习', word: '你好',   pinyin: 'nǐ hǎo',      combo: '' },
    { set: '练习', word: '谢谢',   pinyin: 'xiè xie',     combo: '' },
    { set: '练习', word: '对不起', pinyin: 'duì bu qǐ',   combo: '' },
    { set: '练习', word: '没关系', pinyin: 'méi guān xi', combo: '' }
];

window.WORDS_BY_SET = {

  /* W1：P1(16) + 迁移真词(16) + 探测词(16) = 48 词 */
  w1: [
    { set: "迁移", word: "关于", pinyin: "guān yú", combo: "1+2" },
    { set: "P1", word: "出现", pinyin: "chū xiàn", combo: "1+4" },
    { set: "迁移", word: "所有", pinyin: "suǒ yǒu", combo: "3+3" },
    { set: "P1", word: "过去", pinyin: "guò qù", combo: "4+4" },
    { set: "P1", word: "当然", pinyin: "dāng rán", combo: "1+2" },
    { set: "迁移", word: "年级", pinyin: "nián jí", combo: "2+2" },
    { set: "P1", word: "学校", pinyin: "xué xiào", combo: "2+4" },
    { set: "P1", word: "管理", pinyin: "guǎn lǐ", combo: "3+3" },
    { set: "探测", word: "现在", pinyin: "xiàn zài", combo: "4+4" },
    { set: "迁移", word: "分钟", pinyin: "fēn zhōng", combo: "1+1" },
    { set: "迁移", word: "因此", pinyin: "yīn cǐ", combo: "1+3" },
    { set: "探测", word: "许多", pinyin: "xǔ duō", combo: "3+1" },
    { set: "P1", word: "比赛", pinyin: "bǐ sài", combo: "3+4" },
    { set: "探测", word: "别人", pinyin: "bié rén", combo: "2+2" },
    { set: "迁移", word: "努力", pinyin: "nǔ lì", combo: "3+4" },
    { set: "探测", word: "大家", pinyin: "dà jiā", combo: "4+1" },
    { set: "P1", word: "着急", pinyin: "zháo jí", combo: "2+2" },
    { set: "P1", word: "邻居", pinyin: "lín jū", combo: "2+1" },
    { set: "迁移", word: "放心", pinyin: "fàng xīn", combo: "4+1" },
    { set: "P1", word: "面包", pinyin: "miàn bāo", combo: "4+1" },
    { set: "迁移", word: "需要", pinyin: "xū yào", combo: "1+4" },
    { set: "P1", word: "提醒", pinyin: "tí xǐng", combo: "2+3" },
    { set: "迁移", word: "电影", pinyin: "diàn yǐng", combo: "4+3" },
    { set: "迁移", word: "太阳", pinyin: "tài yáng", combo: "4+2" },
    { set: "迁移", word: "旁边", pinyin: "páng biān", combo: "2+1" },
    { set: "迁移", word: "文化", pinyin: "wén huà", combo: "2+4" },
    { set: "探测", word: "工作", pinyin: "gōng zuò", combo: "1+4" },
    { set: "探测", word: "表演", pinyin: "biǎo yǎn", combo: "3+3" },
    { set: "探测", word: "发展", pinyin: "fā zhǎn", combo: "1+3" },
    { set: "探测", word: "声音", pinyin: "shēng yīn", combo: "1+1" },
    { set: "迁移", word: "运动", pinyin: "yùn dòng", combo: "4+4" },
    { set: "探测", word: "女人", pinyin: "nǚ rén", combo: "3+2" },
    { set: "迁移", word: "母亲", pinyin: "mǔ qīn", combo: "3+1" },
    { set: "探测", word: "历史", pinyin: "lì shǐ", combo: "4+3" },
    { set: "探测", word: "还是", pinyin: "hái shì", combo: "2+4" },
    { set: "探测", word: "问题", pinyin: "wèn tí", combo: "4+2" },
    { set: "P1", word: "方法", pinyin: "fāng fǎ", combo: "1+3" },
    { set: "P1", word: "数学", pinyin: "shù xué", combo: "4+2" },
    { set: "探测", word: "虽然", pinyin: "suī rán", combo: "1+2" },
    { set: "P1", word: "起床", pinyin: "qǐ chuáng", combo: "3+2" },
    { set: "P1", word: "或者", pinyin: "huò zhě", combo: "4+3" },
    { set: "P1", word: "担心", pinyin: "dān xīn", combo: "1+1" },
    { set: "探测", word: "主要", pinyin: "zhǔ yào", combo: "3+4" },
    { set: "P1", word: "小说", pinyin: "xiǎo shuō", combo: "3+1" },
    { set: "迁移", word: "即使", pinyin: "jí shǐ", combo: "2+3" },
    { set: "探测", word: "昨天", pinyin: "zuó tiān", combo: "2+1" },
    { set: "迁移", word: "以为", pinyin: "yǐ wéi", combo: "3+2" },
    { set: "探测", word: "结果", pinyin: "jié guǒ", combo: "2+3" }
  ],

  /* W8：P2(16) = 16 词 */
  w8: [
    { set: "P2", word: "成为", pinyin: "chéng wéi", combo: "2+2" },
    { set: "P2", word: "基础", pinyin: "jī chǔ", combo: "1+3" },
    { set: "P2", word: "终于", pinyin: "zhōng yú", combo: "1+2" },
    { set: "P2", word: "衬衫", pinyin: "chèn shān", combo: "4+1" },
    { set: "P2", word: "电脑", pinyin: "diàn nǎo", combo: "4+3" },
    { set: "P2", word: "热情", pinyin: "rè qíng", combo: "4+2" },
    { set: "P2", word: "感觉", pinyin: "gǎn jué", combo: "3+2" },
    { set: "P2", word: "总是", pinyin: "zǒng shì", combo: "3+4" },
    { set: "P2", word: "正在", pinyin: "zhèng zài", combo: "4+4" },
    { set: "P2", word: "中间", pinyin: "zhōng jiān", combo: "1+1" },
    { set: "P2", word: "首先", pinyin: "shǒu xiān", combo: "3+1" },
    { set: "P2", word: "烦恼", pinyin: "fán nǎo", combo: "2+3" },
    { set: "P2", word: "熊猫", pinyin: "xióng māo", combo: "2+1" },
    { set: "P2", word: "希望", pinyin: "xī wàng", combo: "1+4" },
    { set: "P2", word: "环境", pinyin: "huán jìng", combo: "2+4" },
    { set: "P2", word: "永远", pinyin: "yǒng yuǎn", combo: "3+3" }
  ]
};

window.SET_META = {
  w1: { code: 'W1', cn: '第一次（W1）', en: 'Session 1', count: 48 },
  w8: { code: 'W8', cn: '第二次（W8）', en: 'Session 2', count: 16 }
};
