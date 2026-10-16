/* Next Shore · 彼岸 — structured data + pure scoring functions.
 * Everything user-facing is {zh, en}. Figures are approximate on purpose;
 * always check the official links. Nothing here is legal or migration advice. */
window.NS = (function () {
  const T = (zh, en) => ({ zh, en });

  /* ---------- Axes of the growth map ---------- */
  const AXES = [
    { id: "english", label: T("英语", "English") },
    { id: "skills", label: T("专业技能", "Skills") },
    { id: "experience", label: T("工作经验", "Experience") },
    { id: "runway", label: T("资金缓冲", "Runway") },
    { id: "flex", label: T("灵活度", "Flexibility") },
  ];

  /* ---------- Assessment steps ----------
   * type: single | multi. Each option may carry `v` (a value used by scoring). */
  const STEPS = [
    {
      id: "english", title: T("你的英语，诚实地说", "Your English, honestly"),
      hint: T("不用考虑证书，按日常真实状态选。括号里是大致对应的雅思区间。", "Ignore certificates — pick your everyday reality. Brackets show a rough IELTS range."),
      questions: [{ id: "english", type: "single", options: [
        { id: "e1", v: 15, label: T("能看懂简单内容，开口很吃力", "I read simple things; speaking is hard"), sub: T("约 雅思 4.5 以下", "≈ IELTS below 4.5") },
        { id: "e2", v: 35, label: T("能读文档、写邮件，口语慢且紧张", "I read docs and write emails; speaking is slow"), sub: T("约 雅思 5–5.5", "≈ IELTS 5–5.5") },
        { id: "e3", v: 58, label: T("能开会、能讲清楚工作，但常卡壳", "I can join meetings and explain my work, with pauses"), sub: T("约 雅思 6–6.5", "≈ IELTS 6–6.5") },
        { id: "e4", v: 78, label: T("工作沟通自如，偶尔表达不够地道", "Comfortable at work, occasionally not idiomatic"), sub: T("约 雅思 7–7.5", "≈ IELTS 7–7.5") },
        { id: "e5", v: 93, label: T("接近母语，能谈判、能闲聊", "Near-native; I negotiate and small-talk easily"), sub: T("约 雅思 8+", "≈ IELTS 8+") },
      ]}],
    },
    {
      id: "education", title: T("学历与专业", "Education & field"),
      hint: T("很多国家先看学历和专业是否对口，再看别的。", "Many systems check degree level and field before anything else."),
      questions: [
        { id: "edu", type: "single", label: T("最高学历", "Highest qualification"), options: [
          { id: "hs", v: 25, label: T("高中 / 中专", "High school / vocational secondary") },
          { id: "dip", v: 45, label: T("大专 / 职业资格证", "Diploma / trade certificate") },
          { id: "ba", v: 65, label: T("本科", "Bachelor's") },
          { id: "ma", v: 78, label: T("硕士", "Master's") },
          { id: "phd", v: 88, label: T("博士", "PhD") },
        ]},
        { id: "field", type: "single", label: T("专业 / 工作领域", "Field of study / work"), options: [
          { id: "it", v: 16, label: T("软件 / IT", "Software / IT") },
          { id: "eng", v: 16, label: T("工程（机械、电气、土木等）", "Engineering") },
          { id: "health", v: 20, label: T("医疗 / 护理", "Healthcare / nursing") },
          { id: "acct", v: 8, label: T("会计 / 金融", "Accounting / finance") },
          { id: "edu", v: 9, label: T("教育", "Education") },
          { id: "trades", v: 17, label: T("技工（电工、焊工、厨师等）", "Trades (electrician, welder, chef…)") },
          { id: "design", v: 4, label: T("设计 / 市场", "Design / marketing") },
          { id: "hosp", v: 2, label: T("酒店 / 服务业", "Hospitality / service") },
          { id: "other", v: 3, label: T("其他", "Other") },
        ]},
      ],
    },
    {
      id: "work", title: T("工作经验", "Work experience"),
      hint: T("移民系统只认“和你申请的职业相关”的经验。", "Migration systems mostly count experience relevant to the job you apply under."),
      questions: [
        { id: "years", type: "single", label: T("工作年限", "Years working"), options: [
          { id: "y0", v: 10, label: T("不到 1 年", "Under 1 year") },
          { id: "y1", v: 30, label: T("1–2 年", "1–2 years") },
          { id: "y2", v: 50, label: T("2–3 年", "2–3 years") },
          { id: "y3", v: 70, label: T("3–5 年", "3–5 years") },
          { id: "y5", v: 85, label: T("5 年以上", "5+ years") },
        ]},
        { id: "relevance", type: "single", label: T("工作和专业的相关度", "How related is your job to your field?"), options: [
          { id: "high", v: 1, label: T("高度相关，一直在同一领域", "Closely — same field throughout") },
          { id: "some", v: 0.8, label: T("部分相关，换过方向", "Partly — I've shifted direction") },
          { id: "low", v: 0.55, label: T("基本不相关", "Mostly unrelated") },
        ]},
      ],
    },
    {
      id: "age", title: T("年龄段", "Age range"),
      hint: T("年龄在打分制国家里很重要，但它不是全部。", "Age matters a lot in points systems, but it isn't everything."),
      questions: [{ id: "age", type: "single", options: [
        { id: "a1", v: 1.0, label: T("18–24", "18–24") },
        { id: "a2", v: 1.0, label: T("25–29", "25–29") },
        { id: "a3", v: 0.96, label: T("30–34", "30–34") },
        { id: "a4", v: 0.88, label: T("35–39", "35–39") },
        { id: "a5", v: 0.75, label: T("40 以上", "40+") },
      ]}],
    },
    {
      id: "willing", title: T("你愿意付出什么", "What are you willing to do?"),
      hint: T("可多选。愿意“退一步”的人，路通常更多。", "Pick any. People open to a step back usually have more routes."),
      questions: [{ id: "willing", type: "multi", options: [
        { id: "study", v: 22, label: T("再读一个学位或课程", "Study again (degree or course)") },
        { id: "retrain", v: 20, label: T("转到更紧缺的职业方向", "Retrain toward an in-demand job") },
        { id: "stepback", v: 20, label: T("暂时降职、降薪重新开始", "Take a temporary step back in title or pay") },
        { id: "language", v: 15, label: T("学一门非英语的语言（德语、日语等）", "Learn a non-English language (German, Japanese…)") },
        { id: "regional", v: 13, label: T("先去偏远或非热门城市", "Start in a regional / less popular city") },
      ]}],
    },
    {
      id: "runway", title: T("资金缓冲", "Financial runway"),
      hint: T("不是投资资金。是指不赚钱的情况下，你能撑多久：找工作、适应、读书。", "Not investment money. How long could you support yourself while job-hunting, adapting or studying?"),
      questions: [{ id: "runway", type: "single", options: [
        { id: "r0", v: 10, label: T("不到 3 个月", "Under 3 months") },
        { id: "r1", v: 32, label: T("3–6 个月", "3–6 months") },
        { id: "r2", v: 55, label: T("6–12 个月", "6–12 months") },
        { id: "r3", v: 78, label: T("12–24 个月（够读一个短学位）", "12–24 months (enough for a short degree)") },
        { id: "r4", v: 95, label: T("24 个月以上", "24+ months") },
      ]}],
    },
    {
      id: "life", title: T("你在乎什么，能承受多少不确定", "What you value, and how much uncertainty you can take"),
      hint: T("优先项用来给国家排序，不影响你的雷达图。", "Priorities only re-rank countries; they don't change your radar."),
      questions: [
        { id: "prio", type: "multi", label: T("生活优先项（可多选）", "Life priorities (pick any)"), options: [
          { id: "growth", label: T("职业发展", "Career growth") },
          { id: "balance", label: T("工作生活平衡", "Work–life balance") },
          { id: "safety", label: T("安全", "Safety") },
          { id: "climate", label: T("气候温和", "Mild climate") },
          { id: "asia", label: T("离亚洲 / 家近", "Close to Asia / home") },
          { id: "cost", label: T("生活成本可控", "Manageable cost of living") },
        ]},
        { id: "risk", type: "single", label: T("风险承受度", "Risk tolerance"), options: [
          { id: "low", v: 0, label: T("低：我需要比较确定的路", "Low: I need a fairly certain path") },
          { id: "mid", v: 12, label: T("中：可以接受一两年的不确定", "Medium: a year or two of uncertainty is fine") },
          { id: "high", v: 24, label: T("高：失败了也能接受回来", "High: I'm OK coming back if it fails") },
        ]},
      ],
    },
  ];

  /* ---------- Scoring (pure) ---------- */
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
  const opt = (qid, oid) => {
    for (const s of STEPS) for (const q of s.questions) if (q.id === qid) return q.options.find((o) => o.id === oid);
  };
  const val = (a, qid, d = 0) => (a[qid] && opt(qid, a[qid]) ? opt(qid, a[qid]).v : d);

  /** answers -> {english, skills, experience, runway, flex}; unanswered axes stay low. */
  function scoreAxes(a) {
    const english = val(a, "english", 0);
    // Skills = degree level weighted + demand bonus for the field (0–20, doubled).
    const skills = a.edu || a.field ? clamp(val(a, "edu", 20) * 0.7 + val(a, "field", 0) * 2) : 0;
    // Experience = years × relevance multiplier.
    const experience = a.years ? clamp(val(a, "years") * val(a, "relevance", 0.8)) : 0;
    const runway = val(a, "runway", 0);
    // Flexibility = base + each willingness + risk tolerance.
    const w = (a.willing || []).reduce((s, id) => s + (opt("willing", id) || { v: 0 }).v, 0);
    const flex = a.willing || a.risk ? clamp(10 + w + val(a, "risk", 0)) : 0;
    return { english, skills, experience, runway, flex };
  }

  /** Weighted readiness 0–100, adjusted by age (points systems penalise 35+). */
  function readiness(s, a) {
    const raw = s.english * 0.3 + s.skills * 0.25 + s.experience * 0.2 + s.runway * 0.1 + s.flex * 0.15;
    return clamp(raw * val(a, "age", 1));
  }

  /* ---------- Result archetypes ---------- (checked in order; first match wins) */
  const ARCHETYPES = [
    {
      id: "ready", test: (s, r) => r >= 66 && s.english >= 70 && s.skills >= 55 && s.experience >= 55,
      effort: 2, years: T("约 1–2 年", "≈ 1–2 years"),
      title: T("已经接近可以申请了", "You're close to ready — start concrete applications"),
      summary: T("你的英语、技能和经验已经达到很多技能类路线的门槛。接下来拼的是执行：考出成绩、做职业评估、认真投简历。", "Your English, skills and experience already meet many skilled-route thresholds. What's left is execution: test scores, skills assessment, and serious job applications."),
      steps: [
        T("3 个月内考出正式雅思/PTE，目标比最低线高 0.5–1 分", "Within 3 months, sit IELTS/PTE and aim 0.5–1 band above the minimum"),
        T("选 2 个目标国，按其职业清单做学历/职业评估", "Pick 2 target countries and get your degree/skills assessed against their lists"),
        T("把简历改成目标国格式，每周定量投递海外岗位", "Rewrite your CV for the target market and apply abroad on a weekly quota"),
        T("准备好 6–12 个月的生活费作为落地缓冲", "Hold 6–12 months of living costs as a landing buffer"),
      ],
      timeline: [T("考试与评估", "Tests & assessments"), T("提交申请 / 获得 offer", "Apply / land an offer"), T("落地与站稳", "Land and settle")],
    },
    {
      id: "skilledSoon", test: (s, r) => r >= 50 && s.english >= 50 && s.skills >= 58,
      effort: 3, years: T("约 2–3 年", "≈ 2–3 years"),
      title: T("再积累 1–2 年对口经验，加上更好的英语，技能移民就现实了", "1–2 more years of relevant experience plus better English makes a skilled pathway realistic"),
      summary: T("你的基础是对的，差的是“厚度”：打分制系统里，英语每高一档、经验每多一年，分数都会明显变化。", "Your foundation is right; what's missing is depth. In points systems, each English band and each extra year of experience moves the score noticeably."),
      steps: [
        T("留在本专业，争取更对口、更有分量的项目", "Stay in your field and seek more relevant, heavier projects"),
        T("英语从“能用”提升到“自如”：每周 5 小时，12 个月目标雅思 7", "Lift English from usable to fluent: 5 hrs/week, aim IELTS 7 in 12 months"),
        T("用官方打分计算器每半年算一次自己的分", "Re-check your score on official calculators every 6 months"),
        T("同时存钱，目标 12 个月生活费", "Save toward 12 months of living costs"),
      ],
      timeline: [T("英语提升 + 稳定工作", "English + steady work"), T("经验满年限、考出分数", "Hit experience years, get scores"), T("递交技能类申请", "File skilled applications")],
    },
    {
      id: "studyRoute", test: (s) => s.runway >= 55 && s.flex >= 45,
      effort: 4, years: T("约 2–4 年", "≈ 2–4 years"),
      title: T("直接技能移民现在较难，更实际的是定向留学或雇主担保", "Direct skilled migration is hard right now; a targeted study or employer-sponsored route is more practical"),
      summary: T("你的分数还不够直接申请，但你有资金缓冲和灵活度。选一个就业好的专业读书转工签，或先进入有海外岗位的公司，是更稳的路。", "Your score isn't high enough to apply directly, but you have runway and flexibility. Studying an employable field that leads to a work visa, or joining a company with overseas roles, is the steadier route."),
      steps: [
        T("只选毕业后有工签、且本地缺人的专业，不选“好申请”的专业", "Choose a course with a post-study work visa and real local demand — not just an easy admit"),
        T("申请前查清该国毕业工签的最新规则（近年变动频繁）", "Check the latest post-study work rules before applying — they change often"),
        T("或者：投外企 / 有海外办公室的公司，争取内部调动", "Or: join a multinational with offices abroad and aim for an internal transfer"),
        T("把资金算清楚：学费 + 生活费 + 6 个月找工作缓冲", "Budget honestly: tuition + living + 6 months of job-search buffer"),
      ],
      timeline: [T("英语 + 选校选专业", "English + choose course"), T("读书 + 实习 / 兼职", "Study + internships"), T("毕业工签 → 长期居留", "Graduate visa → long-term residency")],
    },
    {
      id: "pivot", test: (s) => s.english >= 55 && s.skills < 58,
      effort: 4, years: T("约 2–4 年", "≈ 2–4 years"),
      title: T("英语不是问题，专业方向才是关键", "English isn't your bottleneck — your field is"),
      summary: T("你的英语已经有基础，但目前的专业在大多数国家需求不大。转向紧缺方向（IT、护理、技工、工程等）会让门一下子变多。", "Your English is workable, but your current field has thin demand abroad. Pivoting toward a shortage area (IT, nursing, trades, engineering) opens many more doors."),
      steps: [
        T("对照目标国紧缺职业清单，找 1–2 个和你背景最近的方向", "Compare shortage lists and find 1–2 jobs closest to your background"),
        T("用 6–12 个月做一个可验证的转型：证书、作品集或实际项目", "Spend 6–12 months on a verifiable pivot: certificate, portfolio or real project"),
        T("在国内先拿到这个新方向的第一份工作，积累 1–2 年", "Get your first job in the new direction at home and build 1–2 years"),
        T("然后再走技能类或雇主担保路线", "Then move to skilled or employer-sponsored routes"),
      ],
      timeline: [T("选方向 + 学习", "Choose direction + learn"), T("新方向的第一份工作", "First job in the new field"), T("技能 / 雇主担保申请", "Skilled / sponsored applications")],
    },
    {
      id: "explore", test: () => true,
      effort: 5, years: T("约 3–4 年", "≈ 3–4 years"),
      title: T("你还在早期探索期：先把英语和技能打牢", "You're in early exploration — build English and skills first"),
      summary: T("现在申请任何路线都会很吃力，这很正常，不代表不可能。接下来 1–2 年的重点不是研究签证，而是让自己变得“可被雇佣”。", "Any route would be a struggle right now — that's normal, not a verdict. The next 1–2 years are about becoming employable abroad, not about researching visas."),
      steps: [
        T("英语每天 45 分钟，先把听说练到能开会", "45 minutes of English daily — get listening and speaking to meeting level first"),
        T("在一个方向深耕，最好是海外也缺人的方向", "Go deep in one field, ideally one that's short-staffed abroad"),
        T("每月固定存一笔钱，先存到 6 个月生活费", "Save a fixed amount monthly; first target 6 months of costs"),
        T("一年后回来重新测一次，看雷达图怎么变", "Retake this in a year and watch your radar change"),
      ],
      timeline: [T("英语 + 存钱", "English + savings"), T("技能深耕 / 转型", "Deepen or pivot skills"), T("重新评估，选定路线", "Reassess and pick a route")],
    },
  ];

  /* Gap explanations per axis — used in "What would it take for me?" */
  const GAP_TEXT = {
    english: T("英语是你最需要补的。大多数技能类路线要求约雅思 6–7，英语每提高一档，打分制国家都会明显加分。", "English is your biggest gap. Most skilled routes want roughly IELTS 6–7, and every band adds meaningful points."),
    skills: T("专业竞争力偏弱：学历层次或专业方向在海外需求不大。考虑紧缺方向或补一个对口资格。", "Your professional profile is thin abroad: degree level or field has limited demand. Consider a shortage field or a relevant qualification."),
    experience: T("对口经验不足。很多路线要求 1–3 年以上和申请职业直接相关的经验。", "Not enough relevant experience. Many routes want 1–3+ years directly tied to the nominated job."),
    runway: T("资金缓冲太薄。出国后前 3–6 个月通常没有稳定收入，留学路线还要付学费。", "Your runway is thin. The first 3–6 months abroad often have no steady income; study routes add tuition."),
    flex: T("灵活度偏低。愿意读书、转方向、去非热门城市或短期降薪，会让可选路线多出很多。", "Low flexibility. Being open to study, a pivot, regional cities or a short step back opens many more routes."),
  };

  /* ---------- Countries ----------
   * profile: rough thresholds for matching (eng/exp/skills 0–100), pathway types, tags for priorities.
   * full: true => detailed bilingual content. */
  const L = (label, url) => ({ label, url });
  const COUNTRIES = [
    {
      id: "ca", flag: "🇨🇦", name: T("加拿大", "Canada"), full: true, lang: "en", difficulty: 3,
      pathways: ["skilled", "employer", "study"], prio: { growth: 1, balance: 2, safety: 2, climate: 0, asia: 0, cost: 1 },
      profile: { english: 60, skills: 50, experience: 35, runway: 55 },
      line: T("打分制透明，但近年收紧了留学和临时居民数量。", "Transparent points system, but study and temporary-resident numbers have tightened recently."),
      overview: T("加拿大长期以经济移民为主，Express Entry 用 CRS 打分邀请申请人。2024 年起政府收紧了留学签证配额和毕业工签规则，并降低临时居民比例。对普通职场人，英语高分 + 年轻 + 对口经验仍是最清楚的路线，但分数线随抽签类别波动，不可预测。",
        "Canada relies heavily on economic immigration; Express Entry invites candidates by CRS score. Since 2024 it has capped study permits, tightened post-graduation work rules and lowered temporary-resident targets. For ordinary professionals, high English + youth + relevant experience is still the clearest route, but cut-offs vary by draw category and aren't predictable."),
      routes: [
        { type: "skilled", name: T("Express Entry（联邦技术移民等）", "Express Entry (Federal Skilled Worker etc.)"), note: T("进入候选池按 CRS 打分，定期抽签邀请。英语和年龄占分很重。", "Enter a pool ranked by CRS; regular draws invite the top. English and age weigh heavily.") },
        { type: "skilled", name: T("省提名（PNP）", "Provincial Nominee Programs"), note: T("各省按本地需求提名，部分需要本地工作 offer。", "Provinces nominate for local needs; some need a local job offer.") },
        { type: "study", name: T("留学 → 毕业工签（PGWP）", "Study → Post-Graduation Work Permit"), note: T("毕业工签最长约 3 年；现在对专业和语言有额外要求，需提前核对。", "PGWP up to ≈3 years; now has field-of-study and language conditions — check before enrolling.") },
      ],
      req: [
        [T("英语", "English"), T("联邦技术移民最低约 CLB 7（约雅思各项 6）；有竞争力的分数通常更高", "FSW minimum ≈ CLB 7 (≈ IELTS 6 each); competitive scores usually higher")],
        [T("年龄", "Age"), T("约 20–29 岁得分最高，之后逐年减少", "Points peak around 20–29 and decline after")],
        [T("学历", "Education"), T("需做学历认证（ECA）", "Educational Credential Assessment required")],
        [T("经验", "Experience"), T("至少约 1 年连续对口技能工作", "At least ≈1 year of continuous skilled work")],
        [T("资金", "Funds"), T("无 offer 时需证明安家资金，单人约 1.4–1.5 万加元（每年更新）", "Without an offer, settlement funds ≈ CAD 14–15k for one person (updated yearly)")],
      ],
      living: T("多伦多、温哥华房租很高，一居室常见约 2,000–3,000 加元/月；中小城市便宜很多。新移民常见“加拿大经验”门槛，第一份工作可能低于国内职级。公费医疗覆盖基本医疗，但专科等待时间长。冬季漫长寒冷。", "Toronto and Vancouver rents are high — a one-bed is often ≈ CAD 2,000–3,000/month; smaller cities are far cheaper. Newcomers often hit the 'Canadian experience' barrier, so the first job may be below your current level. Public healthcare covers basics but specialist waits are long. Winters are long and cold."),
      risks: [
        T("政策变化快：2024–2025 年留学和临时居民政策多次收紧", "Policy shifts fast: study and temporary-resident rules tightened repeatedly in 2024–2025"),
        T("CRS 分数线不可预测，可能等很久收不到邀请", "CRS cut-offs are unpredictable; you may wait long without an invitation"),
        T("大城市住房成本高，刚落地容易入不敷出", "Big-city housing is expensive; early months can run at a loss"),
        T("专业资格（如护士、工程师）需要本地注册，耗时", "Regulated professions need local licensing, which takes time"),
      ],
      suits: [T("英语较好", "Good English"), T("30 岁以下", "Under 30"), T("能接受从低一级做起", "OK starting a level lower")],
      links: [L(T("IRCC · Express Entry", "IRCC · Express Entry"), "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html"), L(T("IRCC · 毕业工签", "IRCC · Post-graduation work permit"), "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation.html")],
    },
    {
      id: "au", flag: "🇦🇺", name: T("澳大利亚", "Australia"), full: true, lang: "en", difficulty: 4,
      pathways: ["skilled", "employer", "study"], prio: { growth: 1, balance: 2, safety: 2, climate: 2, asia: 2, cost: 0 },
      profile: { english: 70, skills: 60, experience: 50, runway: 60 },
      line: T("收入和生活质量高，但独立技术移民竞争激烈、分数线高。", "High pay and quality of life, but independent skilled migration is competitive with high cut-offs."),
      overview: T("澳洲以打分制技术移民和雇主担保为主。独立技术移民（189）和州担保（190/491）都要求职业在清单上、通过职业评估，并在 SkillSelect 中获邀。热门职业的实际邀请分数常远高于及格线。雇主担保在 2024 年底改为 Skills in Demand 签证。离亚洲近，时差小。",
        "Australia runs points-tested skilled migration and employer sponsorship. Independent (189) and state-nominated (190/491) visas require a listed occupation, a skills assessment and an invitation via SkillSelect. Real invitation scores for popular jobs are often well above the pass mark. Employer sponsorship moved to the Skills in Demand visa in late 2024. It's close to Asia with small time differences."),
      routes: [
        { type: "skilled", name: T("技术移民 189 / 190 / 491", "Skilled visas 189 / 190 / 491"), note: T("打分 + 职业清单 + 邀请。州担保和偏远地区路线门槛相对低。", "Points + occupation list + invitation. State and regional routes are somewhat more accessible.") },
        { type: "employer", name: T("Skills in Demand 雇主担保", "Skills in Demand (employer-sponsored)"), note: T("需要雇主愿意担保，后续可能转永居。", "Needs a willing sponsor; may lead to permanent residency.") },
        { type: "study", name: T("留学 → 毕业生签证（485）", "Study → Temporary Graduate visa (485)"), note: T("毕业后可留下工作一段时间；学费和生活费都高。", "Lets graduates stay and work for a period; tuition and living costs are high.") },
      ],
      req: [
        [T("英语", "English"), T("最低约雅思各项 6；有竞争力通常需要 7–8 加分", "Minimum ≈ IELTS 6 each; competitive profiles usually 7–8 for extra points")],
        [T("年龄", "Age"), T("技术移民一般需 45 岁以下，25–32 岁得分最高", "Skilled visas generally under 45; 25–32 scores highest")],
        [T("学历", "Education"), T("需通过对应职业评估机构的评估", "Positive skills assessment from the relevant authority")],
        [T("经验", "Experience"), T("对口经验按年加分，部分职业评估要求 1–3 年", "Relevant experience adds points; some assessments need 1–3 years")],
        [T("资金", "Funds"), T("技术移民一般无硬性资金证明，但签证和评估费用不低", "Usually no fixed funds test for skilled visas, but fees add up")],
      ],
      living: T("悉尼、墨尔本房租高且竞争激烈，看房常排队。薪资水平高，最低工资在全球前列。全民医保 Medicare 覆盖永居及公民，临时签证需买私人保险。气候整体温和、阳光足。", "Sydney and Melbourne rents are high and competitive. Wages are high, with one of the world's highest minimum wages. Medicare covers PRs and citizens; temporary visa holders need private cover. The climate is generally mild and sunny."),
      risks: [
        T("热门职业邀请分数可能远超及格线，等待时间不确定", "Popular occupations may need scores far above the pass mark; waits are uncertain"),
        T("职业清单和州担保名额每年变化", "Occupation lists and state quotas change yearly"),
        T("留学成本高，毕业后不保证找到对口工作", "Study is expensive and doesn't guarantee a relevant job"),
        T("住房紧张，大城市租房压力大", "Housing is tight; renting in big cities is stressful"),
      ],
      suits: [T("英语好", "Strong English"), T("紧缺职业", "Shortage occupation"), T("喜欢阳光和户外", "Likes sun and outdoors")],
      links: [L(T("内政部 · 189 独立技术移民", "Home Affairs · Subclass 189"), "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189"), L(T("内政部 · 485 毕业生签证", "Home Affairs · Subclass 485"), "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/temporary-graduate-485")],
    },
    {
      id: "de", flag: "🇩🇪", name: T("德国", "Germany"), full: true, lang: "local", difficulty: 3,
      pathways: ["skilled", "employer", "study"], prio: { growth: 1, balance: 2, safety: 2, climate: 0, asia: 0, cost: 2 },
      profile: { english: 50, skills: 60, experience: 30, runway: 45 },
      line: T("缺技术人才，路线多；但德语决定你能走多远。", "Short of skilled workers with many routes — but German decides how far you get."),
      overview: T("德国面临明显的技术人才短缺，近年放宽了技术移民法，推出欧盟蓝卡门槛下调和“机会卡”（Chancenkarte）找工作签证。IT 等岗位可以用英语工作，但日常生活、行政和大多数职位仍需要德语。公立大学学费低，是性价比较高的留学转工作路线。",
        "Germany has a clear skills shortage and has loosened its skilled-immigration law, lowering EU Blue Card thresholds and adding the Opportunity Card (Chancenkarte) for job seekers. Some IT roles work in English, but daily life, bureaucracy and most jobs still need German. Public universities charge little or no tuition, making study-to-work relatively affordable."),
      routes: [
        { type: "employer", name: T("欧盟蓝卡", "EU Blue Card"), note: T("需要认可学历 + 达到薪资门槛的 offer；有德语可更快拿永居。", "Recognised degree + job offer above a salary threshold; German speeds up permanent residency.") },
        { type: "skilled", name: T("机会卡（找工作签证）", "Opportunity Card (job-seeker)"), note: T("打分制，允许入境找工作约 1 年，期间可兼职。", "Points-based; about a year to look for work, with part-time work allowed.") },
        { type: "study", name: T("留学 → 毕业找工作居留", "Study → post-study job-seeking permit"), note: T("毕业后有约 18 个月找对口工作。", "About 18 months after graduation to find qualified work.") },
      ],
      req: [
        [T("语言", "Language"), T("英语岗位存在，但德语 B1 以上会大幅增加机会；机会卡对德语/英语有分数要求", "English roles exist, but German B1+ widens options greatly; the Opportunity Card scores German/English")],
        [T("年龄", "Age"), T("无硬性上限；45 岁以上首次申请蓝卡等有额外养老金/薪资要求", "No hard cap; first-time applicants 45+ face extra pension/salary conditions")],
        [T("学历", "Education"), T("学历需在德国被认可（可查 anabin）", "Degree must be recognised in Germany (check anabin)")],
        [T("经验", "Experience"), T("蓝卡主要看学历和 offer；机会卡经验可加分", "Blue Card is about degree + offer; experience adds Opportunity Card points")],
        [T("资金", "Funds"), T("机会卡和留学需证明生活费（冻结账户，约每年 1.1–1.2 万欧元，会调整）", "Opportunity Card and study require proof of funds (blocked account ≈ €11–12k/year, adjusted)")],
      ],
      living: T("生活成本在西欧中偏低，但慕尼黑、法兰克福等城市租房难。蓝卡薪资门槛约每年 4.3–4.8 万欧元（每年调整，紧缺职业更低）。税和社保扣除较高，但医保、失业保险完善。行政流程繁琐、纸质化。", "Cost of living is moderate for Western Europe, but finding housing in Munich or Frankfurt is hard. Blue Card salary thresholds are ≈ €43–48k/year (adjusted yearly, lower for shortage jobs). Tax and social contributions are high, but health and unemployment insurance are solid. Bureaucracy is slow and paper-heavy."),
      risks: [
        T("不学德语很难融入，职业天花板明显", "Without German, integration is hard and the career ceiling is real"),
        T("学历认证和行政手续耗时", "Degree recognition and paperwork take time"),
        T("大城市租房竞争激烈", "Big-city rentals are very competitive"),
        T("冬季阴冷，社交节奏慢，适应需要时间", "Grey winters and slow-building social circles take adjustment"),
      ],
      suits: [T("工程 / IT", "Engineering / IT"), T("愿意学德语", "Willing to learn German"), T("预算有限想读书", "Study on a budget")],
      links: [L(T("Make it in Germany（官方）", "Make it in Germany (official)"), "https://www.make-it-in-germany.com/en/"), L(T("欧盟蓝卡", "EU Blue Card"), "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card")],
    },
    {
      id: "nz", flag: "🇳🇿", name: T("新西兰", "New Zealand"), full: true, lang: "en", difficulty: 3,
      pathways: ["skilled", "employer", "study"], prio: { growth: 0, balance: 2, safety: 2, climate: 1, asia: 1, cost: 0 },
      profile: { english: 65, skills: 55, experience: 40, runway: 50 },
      line: T("节奏慢、安全，路线清楚，但市场小、薪资偏低。", "Calm and safe with clear routes, but a small market and lower pay."),
      overview: T("新西兰技术移民（SMC）2023 年改为 6 分制，看重职业注册、学历和本地薪资。多数人先拿“认证雇主工作签证”（AEWV），在新西兰工作一段时间后再申请居留；“绿名单”职业有更快的居留通道。就业市场小，城市选择有限。",
        "New Zealand's Skilled Migrant Category moved to a 6-point system in 2023, valuing registration, qualifications and NZ salary. Most people first get an Accredited Employer Work Visa (AEWV), work there for a while, then apply for residence; Green List occupations have faster residence paths. The job market is small and city choices are limited."),
      routes: [
        { type: "employer", name: T("认证雇主工作签证（AEWV）", "Accredited Employer Work Visa"), note: T("需认证雇主的 offer，是大多数人进入的第一步。", "Needs an offer from an accredited employer — the usual first step.") },
        { type: "skilled", name: T("技术移民（SMC）/ 绿名单", "Skilled Migrant Category / Green List"), note: T("6 分制；绿名单职业可直通或工作 2 年后居留。", "6-point system; Green List roles offer straight-to-residence or work-to-residence after 2 years.") },
        { type: "study", name: T("留学 → 毕业工签", "Study → Post-study work visa"), note: T("毕业工签期限取决于学历层级。", "Duration depends on qualification level.") },
      ],
      req: [
        [T("英语", "English"), T("技术移民约雅思总分 6.5", "SMC ≈ IELTS 6.5 overall")],
        [T("年龄", "Age"), T("技术移民需 55 岁以下", "SMC applicants must be under 55")],
        [T("学历", "Education"), T("海外学历需 NZQA 评估", "Overseas qualifications need NZQA assessment")],
        [T("经验", "Experience"), T("通常需在新西兰本地工作一段时间才够分", "Usually need some NZ work experience to reach the points")],
        [T("资金", "Funds"), T("工作签证无投资要求；留学需证明生活费", "No investment needed for work visas; students must show living funds")],
      ],
      living: T("奥克兰房价和房租高，薪资整体低于澳洲。公立医疗有等待期。安全、自然环境好、工作节奏慢。离中国约 11–12 小时航程，时差约 4–5 小时。", "Auckland housing is expensive and wages are generally lower than Australia's. Public healthcare has waiting lists. It's safe, beautiful and slower-paced. It's about 11–12 hours' flight from China with a 4–5 hour time difference."),
      risks: [
        T("市场小，专业岗位少，换工作选择有限", "Small market: fewer specialist roles and limited job mobility"),
        T("工资与房价比偏低", "Wages are low relative to housing"),
        T("AEWV 依赖雇主，工作变动会影响签证", "AEWV ties you to an employer; job changes affect the visa"),
        T("社交圈和娱乐相对单调", "Social and entertainment options can feel limited"),
      ],
      suits: [T("看重平衡与安全", "Values balance & safety"), T("护理 / 技工 / 工程", "Nursing / trades / engineering"), T("喜欢自然", "Loves nature")],
      links: [L(T("新西兰移民局 · 签证", "Immigration NZ · Visas"), "https://www.immigration.govt.nz/visas/"), L(T("技术移民居留签证", "Skilled Migrant Category Resident Visa"), "https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/")],
    },
    {
      id: "ie", flag: "🇮🇪", name: T("爱尔兰", "Ireland"), full: true, lang: "en", difficulty: 3,
      pathways: ["employer", "study"], prio: { growth: 2, balance: 1, safety: 2, climate: 0, asia: 0, cost: 0 },
      profile: { english: 62, skills: 60, experience: 35, runway: 55 },
      line: T("欧洲的英语科技中心，靠 offer 进入；住房是最大难题。", "Europe's English-speaking tech hub, entered via a job offer; housing is the big problem."),
      overview: T("爱尔兰没有打分制技术移民，主要靠雇主 offer 申请工作许可。“关键技能工作许可”（Critical Skills）适合 IT、工程、医疗等紧缺职业，工作约 2 年后可申请 Stamp 4 长期居留。本地硕士毕业后有 Stamp 1G 找工作期。大量跨国科技公司欧洲总部在都柏林。",
        "Ireland has no points-based migration; most people need an employer offer for an employment permit. The Critical Skills Employment Permit suits IT, engineering, healthcare and other shortage jobs, and after ≈2 years you can move to Stamp 4 residence. Graduates of Irish master's programmes get a Stamp 1G job-search period. Many multinational tech firms have their EU HQ in Dublin."),
      routes: [
        { type: "employer", name: T("关键技能工作许可", "Critical Skills Employment Permit"), note: T("紧缺职业 + 达到薪资门槛的 offer；约 2 年后可转长期居留。", "Shortage occupation + offer above a salary threshold; ≈2 years later, long-term residence.") },
        { type: "employer", name: T("一般工作许可", "General Employment Permit"), note: T("覆盖更多职业，但门槛和限制更多。", "Covers more occupations but has more conditions.") },
        { type: "study", name: T("读硕士 → Stamp 1G", "Master's → Stamp 1G"), note: T("毕业后有一段时间留下找工作（硕士约 2 年）。", "A period to stay and find work after graduating (≈2 years for master's).") },
      ],
      req: [
        [T("英语", "English"), T("工作许可无统一考试要求，但雇主会按英语面试；留学约雅思 6.5", "No fixed test for permits, but interviews are in English; study ≈ IELTS 6.5")],
        [T("年龄", "Age"), T("无打分，年龄不直接扣分", "No points test; age isn't scored directly")],
        [T("学历", "Education"), T("关键技能许可通常要求本科及以上", "Critical Skills usually requires a degree")],
        [T("经验", "Experience"), T("雇主看重对口经验", "Employers value relevant experience")],
        [T("资金", "Funds"), T("工作许可看薪资门槛（每年调整）；留学需证明生活费", "Permits use salary thresholds (adjusted); students must show living funds")],
      ],
      living: T("都柏林住房危机严重，房租在欧洲名列前茅，找房非常困难。科技、制药、金融岗位多，薪资较好。公立医疗等待时间长，很多人买私人保险。气候温和但多雨。", "Dublin has a severe housing crisis — rents are among Europe's highest and finding a place is very hard. Tech, pharma and finance jobs are plentiful and pay well. Public healthcare waits are long; many buy private cover. The weather is mild but rainy."),
      risks: [
        T("住房紧缺，可能找到工作却找不到房", "Housing shortage: you might land a job but not a home"),
        T("高度依赖雇主 offer，科技行业裁员会影响签证", "Heavily offer-dependent; tech layoffs affect your status"),
        T("工作许可职业清单和薪资门槛会调整", "Occupation lists and salary thresholds get revised"),
        T("天气阴雨，冬季日照短", "Rainy, with short winter days"),
      ],
      suits: [T("IT / 制药 / 金融", "IT / pharma / finance"), T("想在欧洲用英语工作", "Wants to work in English in Europe"), T("能拿到 offer", "Can land an offer")],
      links: [L(T("企业部 · 工作许可", "DETE · Employment permits"), "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/"), L(T("爱尔兰移民服务", "Irish Immigration Service"), "https://www.irishimmigration.ie/")],
    },
  ];

  /* Coming-soon countries: name, one line, rough matching profile. */
  const soon = (id, flag, zh, en, lzh, len, lang, difficulty, pathways, prio, profile) =>
    COUNTRIES.push({ id, flag, name: T(zh, en), line: T(lzh, len), lang, difficulty, pathways, prio, profile, full: false });
  const P = (g, b, s, c, a, k) => ({ growth: g, balance: b, safety: s, climate: c, asia: a, cost: k });
  const Q = (english, skills, experience, runway) => ({ english, skills, experience, runway });
  soon("uk", "🇬🇧", "英国", "United Kingdom", "技术工作签证依赖雇主担保，门槛近年提高。", "Skilled Worker visa needs a sponsor; thresholds rose recently.", "en", 4, ["employer", "study"], P(2, 1, 1, 0, 0, 0), Q(65, 60, 40, 55));
  soon("fr", "🇫🇷", "法国", "France", "人才签证路线多，但法语几乎是必需的。", "Several talent routes, but French is close to essential.", "local", 4, ["employer", "study"], P(1, 2, 1, 1, 0, 1), Q(45, 60, 40, 50));
  soon("nl", "🇳🇱", "荷兰", "Netherlands", "高技术移民用英语就能工作，但住房紧张。", "Highly skilled migrants can work in English, but housing is tight.", "en-friendly", 3, ["employer", "study"], P(2, 2, 2, 0, 0, 0), Q(60, 60, 35, 50));
  soon("sg", "🇸🇬", "新加坡", "Singapore", "离家近、用英语，但工作准证门槛高、永居难。", "Close to home and English-speaking, but work passes are demanding and PR is hard.", "en", 4, ["employer"], P(2, 0, 2, 0, 2, 0), Q(60, 65, 50, 40));
  soon("jp", "🇯🇵", "日本", "Japan", "高度人才积分制对 IT 友好，但职场以日语为主。", "Highly Skilled points system suits IT, but workplaces run in Japanese.", "local", 3, ["skilled", "employer", "study"], P(1, 0, 2, 1, 2, 1), Q(35, 55, 30, 40));
  soon("kr", "🇰🇷", "韩国", "South Korea", "积分制签证存在，但韩语和职场文化是门槛。", "Points-based visas exist, but Korean and work culture are hurdles.", "local", 4, ["employer", "study"], P(1, 0, 2, 1, 2, 1), Q(35, 55, 35, 40));
  soon("us", "🇺🇸", "美国", "United States", "机会大，但工作签证靠抽签，路径最不确定。", "Huge opportunity, but work visas rely on a lottery — the least predictable path.", "en", 5, ["employer", "study"], P(2, 0, 0, 1, 0, 0), Q(70, 70, 40, 70));
  soon("se", "🇸🇪", "瑞典", "Sweden", "工作签证靠 offer，生活平衡好，永居要求收紧。", "Offer-based work permits, great balance, tighter PR rules.", "en-friendly", 3, ["employer", "study"], P(1, 2, 2, 0, 0, 0), Q(60, 60, 35, 50));
  soon("no", "🇳🇴", "挪威", "Norway", "薪资高、技工需求大，但挪威语和高物价是现实。", "High pay and demand for trades, but Norwegian and high prices are real.", "local", 4, ["employer"], P(1, 2, 2, 0, 0, 0), Q(55, 60, 45, 55));
  soon("ch", "🇨🇭", "瑞士", "Switzerland", "薪资最高之一，但非欧盟名额极少。", "Among the highest pay, but very few non-EU permits.", "local", 5, ["employer"], P(2, 2, 2, 0, 0, 0), Q(70, 75, 60, 60));
  soon("es", "🇪🇸", "西班牙", "Spain", "生活舒适，但本地就业难、需要西语。", "Pleasant life, but a tough local job market and Spanish needed.", "local", 4, ["employer", "study"], P(0, 2, 1, 2, 0, 1), Q(45, 55, 40, 55));
  soon("pt", "🇵🇹", "葡萄牙", "Portugal", "生活成本较低，但本地薪资低、需要葡语。", "Lower costs, but low local wages and Portuguese needed.", "local", 3, ["employer", "study"], P(0, 2, 2, 2, 0, 2), Q(45, 55, 35, 55));
  soon("it", "🇮🇹", "意大利", "Italy", "工作签证有配额，意大利语和就业市场是挑战。", "Quota-based work permits; Italian and the job market are challenges.", "local", 4, ["employer", "study"], P(0, 1, 1, 2, 0, 1), Q(40, 55, 40, 55));
  soon("at", "🇦🇹", "奥地利", "Austria", "红白红卡积分制，德语加分明显。", "Points-based Red-White-Red Card; German counts a lot.", "local", 3, ["skilled", "employer", "study"], P(1, 2, 2, 0, 0, 1), Q(50, 60, 35, 50));
  soon("fi", "🇫🇮", "芬兰", "Finland", "安全、平衡，但就业市场小、芬兰语难。", "Safe and balanced, but a small job market and hard language.", "en-friendly", 3, ["employer", "study"], P(0, 2, 2, 0, 0, 1), Q(55, 55, 35, 50));
  soon("my", "🇲🇾", "马来西亚", "Malaysia", "离家近、成本低，但外籍工作机会有限、薪资一般。", "Close and affordable, but limited roles for foreigners and modest pay.", "en", 2, ["employer"], P(0, 1, 1, 1, 2, 2), Q(40, 50, 35, 30));
  soon("ae", "🇦🇪", "阿联酋", "United Arab Emirates", "免个税、英语通用，但居留和工作强绑定，难入籍。", "No income tax, English everywhere, but residency is tied to work and citizenship is rare.", "en", 2, ["employer"], P(2, 0, 2, 0, 1, 0), Q(50, 50, 40, 35));

  const PATHWAYS = { skilled: T("技能打分", "Skilled points"), employer: T("雇主担保", "Employer-sponsored"), study: T("留学转工作", "Study-to-work") };
  const LANGS = { en: T("英语国家", "English-speaking"), "en-friendly": T("英语可工作", "English-friendly"), local: T("需当地语言", "Local language needed") };

  /** Match a country to a user's axes + priorities. Returns {score, gaps[]} — gaps are axis ids where user < country need. */
  function matchCountry(c, s, a) {
    const p = c.profile, gaps = [];
    let pen = 0;
    for (const k of ["english", "skills", "experience", "runway"]) {
      // Local-language countries soften the English need, but flexibility (willing to learn) matters more.
      const need = p[k];
      if (s[k] < need) { gaps.push({ axis: k, need, have: s[k] }); pen += (need - s[k]) * (k === "english" ? 1.2 : 1); }
    }
    if (c.lang === "local" && !(a.willing || []).includes("language")) { pen += 15; gaps.push({ axis: "language", need: 0, have: 0 }); }
    const prio = (a.prio || []).reduce((t, id) => t + (c.prio[id] || 0) * 3, 0);
    const score = clamp(72 - pen * 0.9 + prio - (c.difficulty - 3) * 5);
    return { score, gaps };
  }

  return { T, AXES, STEPS, ARCHETYPES, GAP_TEXT, COUNTRIES, PATHWAYS, LANGS, scoreAxes, readiness, matchCountry,
    pickArchetype: (s, r) => ARCHETYPES.find((x) => x.test(s, r)) };
})();
