/* 조이의 한글 여행 — 화면과 활동 엔진 */
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
};
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickN = (a, n) => shuffle(a).slice(0, n);
const rnd = a => a[Math.floor(Math.random() * a.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const dayNo = () => Math.floor(Date.now() / 86400000);

// ── 저장 ─────────────────────────────────────────────
const KEY = 'joy-journey-v1';
const state = Object.assign({ done: {}, unlockAll: false, rate: 0.85, sfx: true, mem: {}, time: {} }, (() => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
})());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

// 간격 반복(라이트너 상자 1~5): 맞히면 한 칸 위로, 틀리면 1번 상자로
const GAP = [0, 0, 1, 2, 4, 7];
function rec(key, ok) {
  const m = state.mem[key] || (state.mem[key] = { b: 1, t: 0, ok: 0, ng: 0 });
  if (ok) { m.ok++; m.b = Math.min(5, m.b + 1); } else { m.ng++; m.b = 1; }
  m.t = dayNo(); save();
}
const due = key => { const m = state.mem[key]; if (!m) return 99; return (dayNo() - m.t) - GAP[m.b]; };

// ── 소리 ─────────────────────────────────────────────
const Speech = {
  voice: null,
  init() {
    if (!('speechSynthesis' in window)) return;
    const pick = () => {
      const vs = speechSynthesis.getVoices().filter(v => /ko/i.test(v.lang));
      this.voice = vs.find(v => /Yuna|유나/.test(v.name)) || vs.find(v => /Google/.test(v.name)) || vs[0] || null;
    };
    pick(); speechSynthesis.onvoiceschanged = pick;
  },
  say(text, rate) {
    return new Promise(res => {
      if (!('speechSynthesis' in window) || !text) return res();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; if (this.voice) u.voice = this.voice;
      u.rate = rate || state.rate;
      let fin = false; const end = () => { if (!fin) { fin = true; res(); } };
      u.onend = end; u.onerror = end;
      setTimeout(end, 1200 + text.length * 260 / u.rate);
      setTimeout(() => speechSynthesis.speak(u), 60);
    });
  },
  stop() { try { speechSynthesis.cancel(); } catch (e) {} },
};
let actx = null;
function tone(freqs, dur = .12, type = 'sine', gap = .1, vol = .18) {
  if (!state.sfx) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * gap;
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur + .15);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + .2);
    });
  } catch (e) {}
}
const sfx = {
  ok: () => tone([784, 1047], .12, 'triangle'),
  no: () => tone([330, 294], .14, 'sine', .14, .12),
  tap: () => tone([660], .05, 'triangle', 0, .1),
  clap: () => tone([180], .05, 'square', 0, .08),
  win: () => tone([523, 659, 784, 1047, 1319], .14, 'triangle', .12),
};
// 자모를 소리로 읽을 때
const sndOf = ch => JAMO[ch] ? (ch === 'ㅇ' ? '이응' : JAMO[ch].snd) : ch;
const typeOf = ch => JAMO[ch] ? JAMO[ch].type : 's';

// ── 마스코트 토리 ─────────────────────────────────────
const TORI = `<svg viewBox="0 0 120 120" class="tori" aria-hidden="true">
<ellipse cx="44" cy="30" rx="11" ry="27" fill="#fff" stroke="#F4B6C8" stroke-width="3" transform="rotate(-12 44 30)"/>
<ellipse cx="44" cy="32" rx="5" ry="18" fill="#FFC9D8" transform="rotate(-12 44 32)"/>
<ellipse cx="76" cy="30" rx="11" ry="27" fill="#fff" stroke="#F4B6C8" stroke-width="3" transform="rotate(12 76 30)"/>
<ellipse cx="76" cy="32" rx="5" ry="18" fill="#FFC9D8" transform="rotate(12 76 32)"/>
<ellipse cx="60" cy="78" rx="40" ry="35" fill="#fff" stroke="#F4B6C8" stroke-width="3"/>
<circle cx="46" cy="74" r="6" fill="#4B3F5C"/><circle cx="74" cy="74" r="6" fill="#4B3F5C"/>
<circle cx="48" cy="72" r="2" fill="#fff"/><circle cx="76" cy="72" r="2" fill="#fff"/>
<ellipse cx="36" cy="88" rx="7" ry="4" fill="#FFC9D8"/><ellipse cx="84" cy="88" rx="7" ry="4" fill="#FFC9D8"/>
<path d="M55 86 Q60 91 65 86" stroke="#4B3F5C" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="60" cy="83" r="3" fill="#FF8FAB"/>
<path d="M22 52 l6 -4 l2 7z" fill="#FFD25A"/></svg>`;
function toriAct(cls) {
  document.querySelectorAll('.screen.on .tori').forEach(t => { t.classList.remove('jump', 'tilt'); void t.offsetWidth; t.classList.add(cls); });
}
function burst(chars = ['⭐', '🌸', '💖', '✨', '🎈']) {
  const b = h('div', { class: 'burst' });
  for (let i = 0; i < 26; i++) {
    const s = h('span', {}, rnd(chars));
    s.style.left = Math.random() * 100 + 'vw'; s.style.top = '-40px'; s.style.animationDelay = Math.random() * .6 + 's';
    b.append(s);
  }
  document.body.append(b); setTimeout(() => b.remove(), 2600);
}

// ── 화면 전환 ─────────────────────────────────────────
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  Speech.stop();
}

// ── 지도 ─────────────────────────────────────────────
const doneCount = () => LESSONS.filter((_, i) => state.done[i]).length;
const totalStars = () => Object.values(state.done).reduce((a, b) => a + b, 0);
const open = i => state.unlockAll || i === 0 || !!state.done[i - 1] || !!state.done[i];
const nextLesson = () => { const i = LESSONS.findIndex((_, k) => !state.done[k]); return i < 0 ? LESSONS.length - 1 : i; };

function renderMap() {
  $('#starCount').textContent = totalStars();
  const nx = nextLesson(), L = LESSONS[nx];
  $('#todayName').textContent = `${nx + 1}걸음 · ${L.title}`;
  $('#todayGoal').textContent = L.goal;
  const learned = learnedSet(LESSONS.length, true);
  $('#revBtn').disabled = learned.letters.length + learned.words.length < 3;
  const wrap = $('#stages'); wrap.innerHTML = '';
  for (const st of STAGES) {
    const box = h('section', { class: 'stage' }); box.style.background = st.color;
    box.append(h('h3', {}, `${st.icon} ${st.name}`), h('p', { class: 'note' }, st.note));
    const nodes = h('div', { class: 'nodes' });
    LESSONS.forEach((l, i) => {
      if (l.stage !== st.id) return;
      const ok = open(i), d = state.done[i];
      const n = h('button', { class: 'node' + (ok ? '' : ' lock') + (i === nx ? ' cur' : ''), 'aria-label': `${i + 1}걸음 ${l.title}` },
        h('span', { class: 'no' }, `${i + 1}걸음`),
        h('span', { class: 'em' }, d ? l.sticker : ok ? '🐾' : '🔒'),
        h('span', { class: 'nt' }, l.title),
        h('span', { class: 'st' }, d ? '⭐'.repeat(d) + '☆'.repeat(3 - d) : ''));
      n.onclick = () => { if (ok) startLesson(i); else { sfx.no(); Speech.say('앞의 걸음을 먼저 해요!'); } };
      nodes.append(n);
    });
    box.append(nodes); wrap.append(box);
  }
  show('map');
  requestAnimationFrame(() => { const c = $('.node.cur'); if (c) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
}

// 배운 글자·낱말 모음
function learnedSet(upto, onlyDone) {
  const letters = new Set(), words = new Set();
  LESSONS.slice(0, upto).forEach((l, i) => {
    if (onlyDone && !state.done[i]) return;
    l.steps.forEach(s => {
      if (s.t === 'intro') letters.add(s.ch);
      if (s.t === 'family') letters.add(s.from);
      if (['read', 'listen', 'spell', 'bat'].includes(s.t)) s.words.forEach(w => PIC[w] && words.add(w));
    });
  });
  return { letters: [...letters], words: [...words] };
}

// ── 활동 카드 만들기 ──────────────────────────────────
function makeOpts(target, pool, k = 3, key = x => x) {
  const others = shuffle(pool.filter(x => key(x) !== key(target)));
  const uniq = []; const seen = new Set([key(target)]);
  for (const o of others) { if (!seen.has(key(o))) { seen.add(key(o)); uniq.push(o); } if (uniq.length >= k - 1) break; }
  return shuffle([target, ...uniq]);
}
function expand(step, li) {
  const out = [];
  switch (step.t) {
    case 'rule': out.push({ t: 'rule', ...RULES[step.key] }); break;
    case 'intro': case 'trace': case 'name': out.push({ ...step }); break;
    case 'family': out.push({ ...step }); break;
    case 'pick': {
      if (step.triad) {
        const groups = []; for (let i = 0; i < step.pool.length; i += 3) groups.push(step.pool.slice(i, i + 3));
        for (let i = 0; i < step.n; i++) { const g = groups[i % groups.length]; out.push({ t: 'pick', target: rnd(g), opts: shuffle(g), syl: true }); }
        break;
      }
      const all = [...step.pool, ...(step.extra || [])];
      let order = []; while (order.length < step.n) order.push(...shuffle(step.pool));
      order.slice(0, step.n).forEach(tg => out.push({ t: 'pick', target: tg, opts: makeOpts(tg, all, Math.min(3, all.length)), syl: !!step.syl }));
      break;
    }
    case 'build': step.items.forEach(s => out.push({ t: 'build', target: s, cons: step.cons, vows: step.vows })); break;
    case 'read': case 'listen':
      pickN(step.words, step.n).forEach(w => out.push({ t: step.t, word: w, opts: makeOpts(w, step.words, 3, x => step.t === 'read' ? PIC[x] : x) }));
      break;
    case 'spell': pickN(step.words, step.n).forEach(w => {
      const extra = shuffle(step.words.filter(x => x !== w).join('').split('').filter(c => !w.includes(c))).slice(0, 2);
      out.push({ t: 'spell', word: w, tiles: shuffle([...w.split(''), ...extra]) });
    }); break;
    case 'bat': pickN(step.words, step.n).forEach(w => {
      const d = decompose(w); out.push({ t: 'bat', word: w, base: compose(d.c, d.v), j: d.j, opts: shuffle(step.opts.includes(d.j) ? step.opts : [d.j, ...step.opts.slice(0, 2)]) });
    }); break;
    case 'clap': pickN(step.words, step.n).forEach(w => out.push({ t: 'clap', word: w })); break;
    case 'same': pickN(SAME_PAIRS, step.n).forEach(pair => {
      const [a, b] = shuffle(pair);
      const others = shuffle(SAME_PAIRS.filter(p => p !== pair).flat().filter(x => x[0] !== a[0])).slice(0, 2);
      out.push({ t: 'same', word: a, ans: b, opts: shuffle([b, ...others]) });
    }); break;
    case 'link': pickN(step.items, step.n).forEach(it => out.push({ t: 'link', a: it[0], b: it[1] })); break;
    case 'sent': pickN(step.items, step.n).forEach(it => out.push({ t: 'sent', s: it.s, p: it.p, opts: makeOpts(it.p, step.items.map(x => x.p)) })); break;
    case 'story': out.push({ ...step }); break;
    case 'review': out.push(...reviewCards(step.n, li)); break;
  }
  return out;
}
function reviewCards(n, upto) {
  const { letters, words } = learnedSet(upto, false);
  const items = [...letters.map(x => ['L', x]), ...words.map(x => ['W', x])];
  if (!items.length) return [];
  // 복습할 때가 된 것 → 자주 틀린 것 → 무작위
  items.sort((a, b) => (due(b[1]) - due(a[1])) || ((state.mem[b[1]]?.ng || 0) - (state.mem[a[1]]?.ng || 0)) || Math.random() - .5);
  const chosen = shuffle(items.slice(0, Math.max(n * 2, n)).slice(0, n));
  return chosen.map(([k, x]) => {
    if (k === 'L') {
      const same = letters.filter(y => typeOf(y) === typeOf(x));
      return { t: 'pick', target: x, opts: makeOpts(x, same.length >= 3 ? same : letters), review: true };
    }
    return { t: 'read', word: x, opts: makeOpts(x, words, 3, y => PIC[y]), review: true };
  });
}

// ── 공부 진행 ─────────────────────────────────────────
let run = null; // {li, cards, idx, graded, first, token}
function startLesson(li) {
  const cards = LESSONS[li].steps.flatMap(s => expand(s, li));
  run = { li, cards, idx: 0, graded: 0, first: 0, token: 0 };
  show('lesson'); nextCard(true);
}
function startReview() {
  const cards = reviewCards(8, LESSONS.length);
  run = { li: -1, cards, idx: 0, graded: 0, first: 0, token: 0 };
  show('lesson'); nextCard(true);
}
function nextCard(firstOne) {
  if (!firstOne) run.idx++;
  $('#prog i').style.width = (run.idx / run.cards.length * 100) + '%';
  if (run.idx >= run.cards.length) return finish();
  run.token++;
  const c = run.cards[run.idx], st = $('#stage');
  st.innerHTML = ''; st.scrollTop = 0;
  (R[c.t] || R.rule)(c, st, run.token);
}
const alive = tk => run && run.token === tk;
function grade(keys, firstTry) {
  run.graded++; if (firstTry) run.first++;
  [].concat(keys).forEach(k => k && rec(k, firstTry));
}
async function success(tk, speakText, delay = 900) {
  sfx.ok(); toriAct('jump');
  await Speech.say(rnd(PRAISE) + (speakText ? ' ' + speakText : ''));
  if (!alive(tk)) return;
  await sleep(delay * .3); if (alive(tk)) nextCard();
}
function oops(tk, el) {
  sfx.no(); toriAct('tilt');
  if (el) { el.classList.remove('no'); void el.offsetWidth; el.classList.add('no'); }
  return Speech.say(rnd(RETRY));
}
function finish() {
  const pct = run.graded ? run.first / run.graded : 1;
  const stars = pct >= .9 ? 3 : pct >= .7 ? 2 : 1;
  const L = run.li >= 0 ? LESSONS[run.li] : null;
  if (L) { state.done[run.li] = Math.max(state.done[run.li] || 0, stars); save(); }
  const d = $('#done'); d.innerHTML = '';
  d.append(h('div', { html: TORI }),
    h('h2', {}, L ? `${run.li + 1}걸음 완성!` : '복습 놀이 끝!'),
    h('div', { class: 'stars' }, ...[0, 1, 2].map(i => { const s = h('span', {}, i < stars ? '⭐' : '☆'); s.style.animationDelay = (i * .25) + 's'; return s; })),
    L ? h('div', { class: 'sticker' }, L.sticker) : null,
    h('p', { class: 'origin' }, L ? '새 스티커를 받았어요!' : '잘 기억하고 있어요!'));
  const row = h('div', { class: 'row' }, h('button', { class: 'ghost', onclick: renderMap }, '🗺️ 지도로'));
  if (L && run.li + 1 < LESSONS.length) row.append(h('button', { class: 'next', onclick: () => startLesson(run.li + 1) }, '다음 걸음 ▶'));
  d.append(row);
  show('done'); sfx.win(); burst(); toriAct('jump');
  Speech.say(L ? `${L.title}, 완성! 별 ${stars}개! 정말 잘했어요!` : '복습 놀이 끝! 정말 잘 기억했어요!');
}

// ── 활동 화면들 ───────────────────────────────────────
const spkBtn = (fn, sm) => h('button', { class: 'spk' + (sm ? ' sm' : ''), 'aria-label': '다시 듣기', onclick: () => { sfx.tap(); fn(); } }, '🔊');
const nextBtn = (label = '다음 ▶') => h('button', { class: 'next', onclick: () => { sfx.tap(); nextCard(); } }, label);
const letterCls = ch => typeOf(ch) === 'c' ? 'c' : typeOf(ch) === 'v' ? 'v' : '';

const R = {
  rule(c, st) {
    const say = () => Speech.say(c.say);
    st.append(h('div', { class: 'card' }, h('p', { class: 'rtitle' }, c.title), h('div', { class: 'rule-show' }, c.show), h('p', { class: 'origin' }, c.say)),
      h('div', { class: 'row' }, spkBtn(say, true), nextBtn('알았어요 ▶')));
    say();
  },

  intro(c, st) {
    const J = JAMO[c.ch], first = J.word[0];
    const text = J.type === 'c'
      ? `${J.name}. ${c.ch === 'ㅇ' ? '' : `${J.snd}, ${J.snd}. `}${J.origin} ${J.word}의 ${first}!`
      : `${J.name}. ${J.origin} ${J.word}의 ${first}!`;
    const say = () => Speech.say(text);
    const card = h('div', { class: 'card' },
      h('div', { class: 'biglet ' + J.type }, c.ch),
      h('div', { class: 'lname' }, J.type === 'c' ? `${J.name} · 소리 "${c.ch === 'ㅇ' ? '첫소리 없음' : J.snd}"` : `"${J.name}"`),
      J.organ ? h('span', { class: 'organ' }, J.organ) : null,
      J.parts && J.parts.length > 1 ? h('div', { class: 'parts' }, ...J.parts.map(p => h('span', {}, p))) : null,
      h('p', { class: 'origin' }, J.origin),
      h('div', { class: 'ex' }, h('span', { class: 'e' }, J.pic), h('span', {}, h('b', {}, first), J.word.slice(1))));
    st.append(card, h('div', { class: 'row' }, spkBtn(say, true), nextBtn()));
    say();
  },

  async family(c, st, tk) {
    const chain = [c.from, ...c.to];
    const fam = h('div', { class: 'fam' });
    const els = [];
    chain.forEach((ch, i) => {
      if (i) { const a = h('div', { class: 'ar' }, '획 하나 더', h('br'), '➜'); fam.append(a); els.push(a); }
      const f = h('div', { class: 'f' }, ch); fam.append(f); els.push(f);
    });
    const text = `${JAMO[c.from].name} 가족이에요. ` + c.to.map((t, i) => `${JAMO[chain[i]].name}에 획을 더하면 ${JAMO[t].name}`).join('. ') + '. 획이 늘면 소리가 더 세져요! ' + chain.map(sndOf).join(', ');
    const nb = nextBtn(); nb.classList.add('hidden');
    st.append(h('p', { class: 'rtitle' }, `${c.from} 가족`), h('div', { class: 'card' }, fam, h('p', { class: 'origin' }, '획을 하나 더 그으면 바람이 세게 나오는 소리가 돼요.')),
      h('div', { class: 'row' }, spkBtn(() => Speech.say(text), true), nb));
    for (const e of els) { await sleep(450); if (!alive(tk)) return; e.classList.add('in'); }
    nb.classList.remove('hidden');
    Speech.say(text);
  },

  pick(c, st, tk) {
    const say = () => Speech.say(c.syl ? c.target : `${sndOf(c.target)}${typeOf(c.target) === 'c' && c.target !== 'ㅇ' ? ', ' + sndOf(c.target) : ''}`);
    let tries = 0;
    const opts = h('div', { class: 'opts' });
    c.opts.forEach(o => {
      const b = h('button', { class: 'tile ' + letterCls(o), 'aria-label': o }, o);
      b.onclick = async () => {
        if (o === c.target) {
          b.classList.add('ok'); grade(c.target, tries === 0); opts.style.pointerEvents = 'none';
          success(tk, c.syl ? c.target : (JAMO[o] ? JAMO[o].name : o));
        } else {
          tries++; await oops(tk, b); if (!alive(tk)) return;
          if (tries >= 2) [...opts.children].find(x => x.textContent === c.target).classList.add('hint');
          say();
        }
      };
      opts.append(b);
    });
    st.append(h('p', { class: 'ask' }, spkBtn(say), c.review ? '복습! 들리는 글자는?' : '소리를 듣고 글자를 찾아요'), opts);
    say();
  },

  build(c, st, tk) {
    const t = decompose(c.target), shape = vowelShape(t.v);
    const sel = { c: null, v: null }; let tries = 0, busy = false;
    const sc = h('div', { class: 'slot c' }), sv = h('div', { class: 'slot v' });
    const block = h('div', { class: 'block ' + (shape === 'hori' ? 'hori' : 'vert') }, sc, sv);
    const res = h('div', { class: 'target' }, `"${c.target}" 만들기`);
    const say = () => Speech.say(`${c.target}! 만들어 볼까요?`);
    const rowC = h('div', { class: 'opts' }), rowV = h('div', { class: 'opts' });
    const check = async () => {
      if (!sel.c || !sel.v) return;
      busy = true;
      const syl = compose(sel.c, sel.v);
      block.replaceWith(h('div', { class: 'result' }, syl)); const r = st.querySelector('.result');
      await Speech.say(`${sel.c === 'ㅇ' ? '' : sndOf(sel.c) + ', '}${sel.v}, ${syl}!`); if (!alive(tk)) return;
      if (syl === c.target) { grade([t.c, t.v], tries === 0); success(tk, ''); }
      else {
        tries++; await oops(tk); if (!alive(tk)) return;
        await Speech.say(`이건 ${syl}. ${c.target}를 만들어 봐요.`); if (!alive(tk)) return;
        r.replaceWith(block); sel.c = sel.v = null; sc.textContent = sv.textContent = ''; busy = false;
        if (tries >= 2) { [...rowC.children, ...rowV.children].forEach(b => b.classList.toggle('hint', b.textContent === t.c || b.textContent === t.v)); }
      }
    };
    c.cons.forEach(x => rowC.append(h('button', { class: 'tile sm c', onclick: () => { if (busy) return; sfx.tap(); sel.c = x; sc.textContent = x; Speech.say(sndOf(x)); check(); } }, x)));
    c.vows.forEach(x => rowV.append(h('button', { class: 'tile sm v', onclick: () => { if (busy) return; sfx.tap(); sel.v = x; sv.textContent = x; Speech.say(x); check(); } }, x)));
    st.append(h('p', { class: 'ask' }, spkBtn(say, true), res), block, rowC, rowV);
    say();
  },

  async trace(c, st, tk) {
    const size = Math.min(Math.floor(window.innerHeight * .52), Math.floor(window.innerWidth * .82), 460);
    const dpr = window.devicePixelRatio || 1;
    const cv = h('canvas'); cv.width = size * dpr; cv.height = size * dpr; cv.style.width = cv.style.height = size + 'px';
    const wrap = h('div', { class: 'trace-wrap' }, cv);
    const meter = h('div', { class: 'meter' }, h('i'));
    const sayTxt = JAMO[c.ch] ? `${JAMO[c.ch].name}를 따라 써 봐요.` : `${c.ch}를 따라 써 봐요.`;
    const doneBtn = h('button', { class: 'next' }, '다 썼어요 ✔');
    const clr = h('button', { class: 'ghost' }, '↺ 지우기');
    st.append(h('p', { class: 'ask' }, spkBtn(() => Speech.say(sayTxt), true), '손가락으로 따라 써요'), wrap, meter, h('div', { class: 'row' }, clr, doneBtn));
    Speech.say(sayTxt);
    try { await document.fonts.load(`800 100px "Nanum Gothic"`, c.ch); } catch (e) {}
    if (!alive(tk)) return;
    const N = 160, fs = N * .78, font = `800 ${fs}px "Nanum Gothic", "Apple SD Gothic Neo", sans-serif`;
    const mk = () => { const k = document.createElement('canvas'); k.width = k.height = N; return k.getContext('2d', { willReadFrequently: true }); };
    const gl = mk(); gl.font = font; gl.textAlign = 'center'; gl.textBaseline = 'middle'; gl.fillText(c.ch, N / 2, N / 2 + fs * .04);
    const gd = mk(); gd.font = font; gd.textAlign = 'center'; gd.textBaseline = 'middle'; gd.lineWidth = N * .14; gd.lineJoin = 'round';
    gd.strokeText(c.ch, N / 2, N / 2 + fs * .04); gd.fillText(c.ch, N / 2, N / 2 + fs * .04);
    const G = gl.getImageData(0, 0, N, N).data, GD = gd.getImageData(0, 0, N, N).data;
    let gCount = 0; for (let i = 3; i < G.length; i += 4) if (G[i] > 128) gCount++;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const strokes = []; let cur = null, tries = 0, passed = false;
    const colors = ['#FF7FA3', '#45A9F0', '#3CC583', '#F2A23A', '#A37BEA'];
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = '#EFE6F6'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(size / 2, 10); ctx.lineTo(size / 2, size - 10); ctx.moveTo(10, size / 2); ctx.lineTo(size - 10, size / 2); ctx.stroke(); ctx.setLineDash([]);
      const f2 = size * .78; ctx.font = `800 ${f2}px "Nanum Gothic", "Apple SD Gothic Neo", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = passed ? '#BFEBD3' : '#F4E3EC'; ctx.fillText(c.ch, size / 2, size / 2 + f2 * .04);
      ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = size * .075;
      strokes.forEach((s, i) => { ctx.strokeStyle = colors[i % colors.length]; ctx.beginPath(); s.forEach((p, k) => k ? ctx.lineTo(p[0] * size, p[1] * size) : ctx.moveTo(p[0] * size, p[1] * size)); if (s.length === 1) ctx.lineTo(s[0][0] * size + .1, s[0][1] * size); ctx.stroke(); });
    };
    const score = () => {
      const u = mk(), u2 = mk();
      [[u, N * .075], [u2, N * .17]].forEach(([k, w]) => { k.lineCap = k.lineJoin = 'round'; k.lineWidth = w; k.strokeStyle = '#000';
        strokes.forEach(s => { k.beginPath(); s.forEach((p, i) => i ? k.lineTo(p[0] * N, p[1] * N) : k.moveTo(p[0] * N, p[1] * N)); if (s.length === 1) k.lineTo(s[0][0] * N + .1, s[0][1] * N); k.stroke(); }); });
      const U = u.getImageData(0, 0, N, N).data, U2 = u2.getImageData(0, 0, N, N).data;
      let cov = 0, ink = 0, out = 0;
      for (let i = 3; i < G.length; i += 4) { if (G[i] > 128 && U2[i] > 128) cov++; if (U[i] > 128) { ink++; if (GD[i] < 128) out++; } }
      return { cov: gCount ? cov / gCount : 0, out: ink ? out / ink : 0 };
    };
    const evaluate = (manual) => {
      if (passed) return;
      const s = score(); meter.firstChild.style.width = Math.min(100, s.cov / .75 * 100) + '%';
      if (s.cov >= .75 && s.out <= .4) {
        passed = true; draw(); grade(JAMO[c.ch] ? c.ch : null, tries === 0); success(tk, `${JAMO[c.ch] ? JAMO[c.ch].name : c.ch}!`);
      } else if (manual) {
        tries++;
        if (tries >= 3 && s.cov > .4) { passed = true; draw(); grade(JAMO[c.ch] ? c.ch : null, false); success(tk, '잘 썼어요!'); return; }
        sfx.no(); toriAct('tilt');
        Speech.say(s.out > .4 ? '연한 글씨 위를 따라 써 볼까?' : '조금 더 채워 볼까?');
      }
    };
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    cv.addEventListener('pointerdown', e => { if (passed) return; e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [pos(e)]; strokes.push(cur); draw(); });
    cv.addEventListener('pointermove', e => { if (!cur) return; e.preventDefault(); cur.push(pos(e)); draw(); });
    const up = () => { if (!cur) return; cur = null; evaluate(false); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    clr.onclick = () => { sfx.tap(); strokes.length = 0; meter.firstChild.style.width = '0'; draw(); };
    doneBtn.onclick = () => { sfx.tap(); evaluate(true); };
    draw();
  },

  read(c, st, tk) {
    let tries = 0, helped = false;
    const word = h('div', { class: 'word' }, ...c.word.split('').map(s => h('button', { class: 'syl', onclick: () => { sfx.tap(); Speech.say(s); } }, s)));
    const opts = h('div', { class: 'opts' });
    c.opts.forEach(o => {
      const b = h('button', { class: 'tile pic', 'aria-label': o }, PIC[o]);
      b.onclick = async () => {
        if (o === c.word) { b.classList.add('ok'); grade(c.word, tries === 0 && !helped); opts.style.pointerEvents = 'none'; success(tk, c.word); }
        else { tries++; await oops(tk, b); if (tries >= 2 && alive(tk)) { [...opts.children].find(x => x.textContent === PIC[c.word]).classList.add('hint'); } }
      };
      opts.append(b);
    });
    const hint = h('button', { class: 'ghost', onclick: () => { helped = true; sfx.tap(); Speech.say(c.word); } }, '💡 도움');
    st.append(h('p', { class: 'ask' }, c.review ? '복습! 읽고 그림을 찾아요' : '글자를 읽고 그림을 찾아요'), word, opts, hint);
    Speech.say('읽어 볼까요?');
  },

  listen(c, st, tk) {
    let tries = 0;
    const say = () => Speech.say(c.word);
    const opts = h('div', { class: 'opts' });
    c.opts.forEach(o => {
      const b = h('button', { class: 'tile word' }, o);
      b.onclick = async () => {
        if (o === c.word) { b.classList.add('ok'); grade(c.word, tries === 0); opts.style.pointerEvents = 'none'; success(tk, c.word); }
        else { tries++; await oops(tk, b); if (!alive(tk)) return; if (tries >= 2) [...opts.children].find(x => x.textContent === c.word).classList.add('hint'); say(); }
      };
      opts.append(b);
    });
    st.append(h('p', { class: 'ask' }, spkBtn(say), '듣고 낱말을 찾아요'), h('div', { class: 'pic-big' }, PIC[c.word]), opts);
    say();
  },

  spell(c, st, tk) {
    const say = () => Speech.say(c.word);
    let k = 0, miss = 0;
    const slots = c.word.split('').map(() => h('div', { class: 'slot' }));
    const tiles = h('div', { class: 'opts' });
    c.tiles.forEach(s => {
      const b = h('button', { class: 'tile sm' }, s);
      b.onclick = async () => {
        if (b.classList.contains('dim')) return;
        if (s === c.word[k]) {
          sfx.tap(); slots[k].textContent = s; slots[k].classList.add('v'); b.classList.add('dim'); k++; Speech.say(s);
          if (k === c.word.length) { grade(c.word, miss === 0); tiles.style.pointerEvents = 'none'; await sleep(500); if (alive(tk)) success(tk, c.word); }
        } else { miss++; await oops(tk, b); b.classList.remove('no'); if (alive(tk)) Speech.say(`${c.word[k]}를 찾아요`); }
      };
      tiles.append(b);
    });
    st.append(h('p', { class: 'ask' }, spkBtn(say, true), '듣고 낱말을 만들어요'), h('div', { class: 'pic-big' }, PIC[c.word]), h('div', { class: 'row' }, ...slots), tiles);
    say();
  },

  bat(c, st, tk) {
    let tries = 0;
    const say = () => Speech.say(c.word);
    const top = h('div', { class: 'slot' }, c.base); top.style.border = '0';
    const bot = h('div', { class: 'slot b' }, '?');
    const block = h('div', { class: 'block hori' }, top, bot);
    const opts = h('div', { class: 'opts' });
    c.opts.forEach(o => {
      const b = h('button', { class: 'tile b' }, o);
      b.onclick = async () => {
        if (o === c.j) {
          b.classList.add('ok'); grade(c.word, tries === 0); opts.style.pointerEvents = 'none';
          bot.textContent = o; await sleep(500); if (!alive(tk)) return;
          block.replaceWith(h('div', { class: 'result' }, c.word));
          success(tk, `${c.base}, ${c.word}!`);
        } else {
          tries++; bot.textContent = o; const wrong = compose(decompose(c.base).c, decompose(c.base).v, o);
          await Speech.say(wrong); if (!alive(tk)) return;
          bot.textContent = '?'; await oops(tk, b); if (!alive(tk)) return;
          if (tries >= 2) [...opts.children].find(x => x.textContent === c.j).classList.add('hint');
          say();
        }
      };
      opts.append(b);
    });
    st.append(h('p', { class: 'ask' }, spkBtn(say, true), '어떤 받침을 붙일까요?'), h('div', { class: 'pic-big' }, PIC[c.word]), block, opts);
    say();
  },

  clap(c, st, tk) {
    const say = () => Speech.say(c.word, state.rate * .85);
    const n = c.word.length; let tries = 0;
    const claps = h('div', { class: 'claps' });
    const opts = h('div', { class: 'opts' });
    [1, 2, 3].forEach(k => {
      const b = h('button', { class: 'tile', 'aria-label': `${k}번` }, '👏'.repeat(k)); b.style.fontSize = '40px'; b.style.fontFamily = 'var(--ui)';
      b.onclick = async () => {
        if (k === n) {
          b.classList.add('ok'); grade(null, tries === 0); opts.style.pointerEvents = 'none';
          for (const s of c.word) { if (!alive(tk)) return; sfx.clap(); claps.append(h('span', {}, s)); Speech.say(s, .7); await sleep(650); }
          if (alive(tk)) success(tk, `${c.word}, ${n}번!`);
        } else { tries++; await oops(tk, b); if (!alive(tk)) return; if (tries >= 2) opts.children[n - 1].classList.add('hint'); say(); }
      };
      opts.append(b);
    });
    st.append(h('p', { class: 'ask' }, spkBtn(say, true), '손뼉을 몇 번 칠까요?'), h('div', { class: 'pic-big' }, PIC[c.word]), claps, opts);
    say();
  },

  async same(c, st, tk) {
    let tries = 0;
    const opts = h('div', { class: 'opts' });
    const btns = c.opts.map(o => {
      const b = h('button', { class: 'tile pic', 'aria-label': o }, PIC[o]);
      b.onclick = async () => {
        if (o === c.ans) { b.classList.add('ok'); grade(null, tries === 0); opts.style.pointerEvents = 'none'; success(tk, `${c.word}, ${c.ans}! 둘 다 ${c.word[0]}!`); }
        else { tries++; await oops(tk, b); if (!alive(tk)) return; await Speech.say(o); if (tries >= 2 && alive(tk)) btns[c.opts.indexOf(c.ans)].classList.add('hint'); }
      };
      opts.append(b); return b;
    });
    const intro = async () => {
      opts.style.pointerEvents = 'none';
      await Speech.say(`${c.word}! ${c.word[0]}로 시작하는 친구는?`);
      for (let i = 0; i < c.opts.length; i++) { if (!alive(tk)) return; btns[i].classList.add('lit'); await Speech.say(c.opts[i]); btns[i].classList.remove('lit'); }
      opts.style.pointerEvents = '';
    };
    st.append(h('p', { class: 'ask' }, spkBtn(intro, true), '첫소리가 같은 친구는?'), h('div', { class: 'pic-big' }, PIC[c.word]), h('div', { class: 'target' }, c.word), opts);
    intro();
  },

  link(c, st, tk) {
    const d1 = decompose(c.a), d2 = decompose(c.b);
    const base = compose(d1.c, d1.v), moved = compose(d1.j, d2.v, d2.j);
    const jb = h('span', { class: 'jb' }, d1.j);
    const stack = h('span', { class: 'stack' }, h('span', {}, base), jb);
    const row = h('div', { class: 'link-row' }, stack, h('span', { class: 'plus' }, '+'), h('span', {}, c.b));
    const tip = h('p', { class: 'ask' }, `노란 받침 ${d1.j}을 눌러 미끄럼틀 태워 줘요!`);
    const nb = nextBtn(); nb.classList.add('hidden');
    jb.onclick = async () => {
      sfx.tap(); jb.style.animation = 'none';
      row.replaceWith(h('div', { class: 'link-row' }, h('span', {}, c.a + c.b), h('span', { class: 'plus' }, '→'), h('span', { class: 'sound-of' }, `[${base}${moved}]`)));
      tip.textContent = `받침이 옆 칸으로 쏙! "${c.a + c.b}"는 [${base}${moved}]로 읽어요.`;
      grade(null, true); sfx.ok(); toriAct('jump');
      await Speech.say(`${c.a + c.b}. ${base}${moved}!`);
      if (alive(tk)) nb.classList.remove('hidden');
    };
    st.append(h('div', { class: 'pic-big' }, PIC[c.a] || '🛝'), row, tip, h('div', { class: 'row' }, nb));
    Speech.say(`${c.a}, ${c.b}. 받침을 눌러 봐요!`);
  },

  sent(c, st, tk) {
    let tries = 0, helped = false;
    const words = c.s.split(' ');
    const line = h('div', { class: 'sent' }, ...words.map(w => h('button', { onclick: () => { sfx.tap(); Speech.say(w.replace(/[.!?,]/g, '')); } }, w)));
    const readAll = async () => { helped = true; for (const b of line.children) { if (!alive(tk)) return; b.classList.add('lit'); await Speech.say(b.textContent.replace(/[.!?,]/g, ''), state.rate * .9); b.classList.remove('lit'); } };
    const opts = h('div', { class: 'opts' });
    c.opts.forEach(o => {
      const b = h('button', { class: 'tile pic' }, o); b.style.fontSize = '58px';
      b.onclick = async () => {
        if (o === c.p) { b.classList.add('ok'); grade(null, tries === 0 && !helped); opts.style.pointerEvents = 'none'; success(tk, c.s); }
        else { tries++; await oops(tk, b); if (tries >= 2 && alive(tk)) [...opts.children].find(x => x.textContent === c.p).classList.add('hint'); }
      };
      opts.append(b);
    });
    st.append(h('p', { class: 'ask' }, '문장을 읽고 그림을 찾아요'), line, opts, h('button', { class: 'ghost', onclick: readAll }, '💡 같이 읽기'));
    Speech.say('문장을 읽어 볼까요? 모르는 낱말은 눌러 봐요.');
  },

  story(c, st, tk) {
    let p = 0;
    const page = () => {
      st.innerHTML = '';
      if (p >= c.pages.length) return quiz();
      const pg = c.pages[p];
      const line = h('div', { class: 'sent' }, ...pg.s.split(' ').map(w => h('button', { onclick: () => { sfx.tap(); Speech.say(w.replace(/[.!?,]/g, '')); } }, w)));
      const readAll = async () => { for (const b of line.children) { if (!alive(tk)) return; b.classList.add('lit'); await Speech.say(b.textContent.replace(/[.!?,]/g, ''), state.rate * .9); b.classList.remove('lit'); } };
      st.append(h('p', { class: 'rtitle' }, `📖 ${c.title} (${p + 1}/${c.pages.length})`), h('div', { class: 'scene' }, pg.p), line,
        h('div', { class: 'row' },
          p ? h('button', { class: 'ghost', onclick: () => { p--; page(); } }, '◀') : null,
          spkBtn(readAll, true),
          h('button', { class: 'next', onclick: () => { sfx.tap(); p++; page(); } }, '넘기기 ▶')));
      if (p === 0) Speech.say(`${c.title}. 한 쪽씩 읽어 봐요.`);
    };
    const quiz = () => {
      let tries = 0;
      const q = c.q, opts = h('div', { class: 'opts' });
      q.opts.forEach(([w, e], i) => {
        const b = h('button', { class: 'tile pic' }, e);
        b.onclick = async () => {
          if (i === q.a) { b.classList.add('ok'); grade(null, tries === 0); opts.style.pointerEvents = 'none'; burst(['🌈', '🕊️', '⭐']); success(tk, `${w}!`); }
          else { tries++; await oops(tk, b); }
        };
        opts.append(b);
      });
      st.append(h('p', { class: 'rtitle' }, '❓ 생각해 봐요'), h('div', { class: 'sent' }, ...q.s.split(' ').map(w => h('button', { onclick: () => Speech.say(w.replace(/[.!?,]/g, '')) }, w))), opts);
      Speech.say(q.s);
    };
    page();
  },

  name(c, st, tk) {
    burst(['🌟', '💖', '🎀', '✨']); sfx.win();
    st.append(h('p', { class: 'rtitle' }, '내 이름이에요!'), h('div', { class: 'card' }, h('div', { class: 'biglet' }, c.word), h('div', { class: 'ex' }, h('span', { class: 'e' }, PIC[c.word] || '🌟'), '조이야, 사랑해!')),
      h('div', { class: 'row' }, spkBtn(() => Speech.say(`${c.word.split('').join(', ')}. ${c.word}!`), true), nextBtn('야호 ▶')));
    Speech.say(`${c.word.split('').join(', ')}. ${c.word}! 조이 이름을 읽었어요! 정말 멋져요!`);
  },
};

// ── 스티커 책 ─────────────────────────────────────────
function stickerBook() {
  const m = h('div', { class: 'modal', onclick: e => { if (e.target === m) m.remove(); } });
  m.append(h('div', { class: 'sheet' }, h('h2', {}, `🎒 스티커 책 (${doneCount()}/${LESSONS.length})`),
    h('div', { class: 'book' }, ...LESSONS.map((l, i) => state.done[i] ? h('div', {}, l.sticker) : h('div', { class: 'empty' }, i + 1))),
    h('div', { class: 'row' }, h('button', { class: 'next', style: 'margin-top:16px', onclick: () => m.remove() }, '닫기'))));
  document.body.append(m);
}

// ── 부모님 화면 ───────────────────────────────────────
function parentLock() {
  const a = 11 + Math.floor(Math.random() * 30), b = 11 + Math.floor(Math.random() * 30); let v = '';
  const disp = h('div', { class: 'lockq' }, `${a} + ${b} = ?`);
  const m = h('div', { class: 'modal' });
  const pad = h('div', { class: 'numpad' });
  [1, 2, 3, 4, 5, 6, 7, 8, 9, '←', 0, '확인'].forEach(k => pad.append(h('button', { onclick: () => {
    if (k === '←') v = v.slice(0, -1); else if (k === '확인') { if (+v === a + b) { m.remove(); renderParent('prog'); } else { v = ''; sfx.no(); } } else if (v.length < 3) v += k;
    disp.textContent = `${a} + ${b} = ${v || '?'}`;
  } }, k)));
  m.append(h('div', { class: 'sheet', style: 'max-width:420px' }, h('h2', {}, '부모님 확인'), disp, pad,
    h('div', { class: 'row' }, h('button', { class: 'ghost', style: 'margin-top:14px', onclick: () => m.remove() }, '닫기'))));
  document.body.append(m);
}
function renderParent(tab) {
  show('parent');
  const tabs = $('#ptabs'); tabs.innerHTML = '';
  [['prog', '📈 진도'], ['map', '🔤 글자 지도'], ['why', '🧭 설계 원리'], ['set', '⚙️ 설정']].forEach(([k, n]) =>
    tabs.append(h('button', { class: tab === k ? 'on' : '', onclick: () => renderParent(k) }, n)));
  const body = $('#pbody'); body.innerHTML = '';
  if (tab === 'prog') {
    const days = [...Array(7)].map((_, i) => { const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10); return [d.slice(5), Math.round((state.time[d] || 0) / 60)]; });
    const max = Math.max(5, ...days.map(d => d[1]));
    body.append(h('div', { class: 'pbox' }, h('h3', {}, '한눈에 보기'),
      h('p', {}, `완료 ${doneCount()} / ${LESSONS.length}걸음 · 별 ${totalStars()}개 · 다음: ${nextLesson() + 1}걸음 「${LESSONS[nextLesson()].title}」`),
      h('h3', {}, '최근 7일 공부 시간(분)'),
      h('div', { class: 'bars' }, ...days.map(([d, m]) => h('div', {}, h('span', {}, m), (() => { const i = h('i'); i.style.height = (m / max * 90) + 'px'; return i; })(), h('span', {}, d))))));
    const tb = h('table', {}, h('tr', {}, h('th', {}, '걸음'), h('th', {}, '마을'), h('th', {}, '목표'), h('th', {}, '별')));
    LESSONS.forEach((l, i) => tb.append(h('tr', {}, h('td', {}, `${i + 1}. ${l.title}`), h('td', {}, STAGES.find(s => s.id === l.stage).name), h('td', {}, l.goal), h('td', {}, state.done[i] ? '⭐'.repeat(state.done[i]) : '-'))));
    body.append(h('div', { class: 'pbox' }, h('h3', {}, '26걸음 진도표'), tb));
  }
  if (tab === 'map') {
    const grid = h('div', { class: 'jgrid' });
    Object.keys(JAMO).forEach(ch => {
      const m = state.mem[ch]; const lvl = !m ? '' : m.b >= 4 ? 'm3' : m.b >= 2 ? 'm2' : 'm1';
      grid.append(h('div', { class: lvl }, ch, h('small', {}, m ? `${m.ok}/${m.ok + m.ng}` : '')));
    });
    const weak = Object.entries(state.mem).filter(([, m]) => m.ng > 0).sort((a, b) => b[1].ng / (b[1].ok + b[1].ng) - a[1].ng / (a[1].ok + a[1].ng)).slice(0, 12);
    body.append(h('div', { class: 'pbox' }, h('h3', {}, '자모 40자 익힘 정도'), h('p', {}, '회색 = 아직 · 노랑 = 배우는 중 · 파랑 = 익숙해짐 · 초록 = 확실히 앎 (숫자: 첫 시도에 맞힌 수/전체)'), grid),
      h('div', { class: 'pbox' }, h('h3', {}, '헷갈려하는 것'), h('p', {}, weak.length ? weak.map(([k, m]) => `${k}(${m.ng}번 틀림)`).join(' · ') : '아직 없어요. 복습 놀이가 자동으로 이것들을 먼저 내요.')));
  }
  if (tab === 'why') body.append(...WHY.map(([t, html]) => h('div', { class: 'pbox' }, h('h3', {}, t), h('div', { html }))));
  if (tab === 'set') {
    const seg = (opts, cur, fn) => h('div', { class: 'seg' }, ...opts.map(([v, n]) => h('button', { class: cur === v ? 'on' : '', onclick: () => { fn(v); save(); renderParent('set'); } }, n)));
    body.append(h('div', { class: 'pbox' }, h('h3', {}, '설정'),
      h('div', { class: 'set-row' }, h('span', {}, '말 빠르기'), seg([[0.7, '천천히'], [0.85, '보통'], [1, '빠르게']], state.rate, v => state.rate = v)),
      h('div', { class: 'set-row' }, h('span', {}, '효과음'), seg([[true, '켜기'], [false, '끄기']], state.sfx, v => state.sfx = v)),
      h('div', { class: 'set-row' }, h('span', {}, '모든 걸음 열기 (순서 상관없이 고르기)'), seg([[true, '열기'], [false, '차례대로']], state.unlockAll, v => state.unlockAll = v)),
      h('div', { class: 'set-row' }, h('span', {}, '목소리 시험'), h('button', { class: 'ghost', onclick: () => Speech.say('조이야, 안녕! 나는 토리야.') }, '🔊 들어 보기')),
      h('div', { class: 'set-row' }, h('span', {}, '기록 모두 지우기'), h('button', { class: 'ghost', onclick: () => { if (confirm('조이의 기록을 모두 지울까요?')) { localStorage.removeItem(KEY); location.reload(); } } }, '🗑️ 초기화'))),
      h('div', { class: 'pbox' }, h('h3', {}, '아이패드 앱처럼 쓰기'), h('p', {}, 'Safari에서 이 페이지를 열고 공유 버튼 → "홈 화면에 추가". 한 번 열어 두면 인터넷 없이도 실행돼요. 기록은 이 기기에만 저장되고 어디로도 보내지 않아요.')));
  }
}

const WHY = [
  ['한 줄 요약', `<p>“<b>소리 → 원리 → 조립 → 읽기 → 이야기</b>” 순서로, 하루 한 걸음(5~8분)씩 26걸음을 걷습니다. 매 걸음마다 지난 글자를 다시 꺼내 보는 <b>복습</b>이 자동으로 섞입니다.</p>`],
  ['🗣️ 언어학자의 설계', `<ul>
<li><b>한글은 소리의 모양을 그린 글자(자질 문자)</b>입니다. 그래서 외우기보다 <b>원리</b>로 가르칩니다. 자음은 발음 기관 모양(ㄱ 혀뿌리, ㄴ 혀끝, ㅁ 입, ㅅ 이, ㅇ 목구멍), 모음은 하늘(·)·땅(ㅡ)·사람(ㅣ)의 조합입니다.</li>
<li><b>가획 가족</b>으로 묶어 가르칩니다: ㄱ→ㅋ, ㄴ→ㄷ→ㅌ(+ㄹ), ㅁ→ㅂ→ㅍ, ㅅ→ㅈ→ㅊ, ㅇ→ㅎ. 획이 늘면 소리가 세진다는 규칙 하나로 9글자가 따라옵니다.</li>
<li>자음은 <b>이름(기역)보다 소리값(그)</b>을 먼저 들려줍니다. 글자를 합칠 때(그+아=가) 필요한 것은 소리이기 때문입니다.</li>
<li>한국 아이에게 가장 먼저 잡히는 말소리 단위는 <b>음절</b>입니다. 그래서 손뼉 세기·첫음절 찾기로 시작하고, 글자 블록(모아쓰기)을 직접 조립하게 합니다. 키다리 모음(ㅏㅓㅣ)은 오른쪽, 납작이 모음(ㅗㅜㅡ)은 아래라는 <b>자리 규칙</b>을 따로 가르칩니다.</li>
<li><b>ㅇ의 두 얼굴</b>: 첫소리에서는 소리 없는 자리 지킴이, 받침에서는 [ㅇ] 소리.</li>
<li><b>ㅐ/ㅔ</b>는 현대 서울말에서 소리가 거의 같아 소리로 구별시키지 않고 낱말(개 🐶/게 🦀)로 기억하게 했습니다.</li>
<li>받침은 <b>잘 들리는 콧소리(ㅇㄴㅁ) → 흐르는 ㄹ → 멈추는 소리(ㄱㅂ, ㅅ=ㄷ소리)</b> 순서입니다. 마지막엔 <b>연음(곰이→[고미])</b>을 ‘받침 미끄럼틀’로 보여 줍니다.</li>
<li>쌍자음은 한국어 고유의 <b>삼중 대립(가·카·까)</b>을 묶어서 들려줍니다.</li></ul>`],
  ['🧸 유아교육학 교수의 설계', `<ul>
<li><b>발달 순서</b>: 음운 인식(소리 숲) → 자모 지식 → 해독(조립·낱말) → 유창성(문장·이야기). 만 6세 한글 지도의 일반적 흐름입니다.</li>
<li><b>짧게, 자주</b>: 한 걸음은 5~8분, 하루 목표는 한 걸음. 주의 집중 시간에 맞추었습니다.</li>
<li><b>보여 주고 → 함께 하고 → 혼자 하기</b>: 소개 카드(시범) → 고르기(재인) → 조립·쓰기(산출) 순서.</li>
<li><b>틀려도 혼나지 않는 설계</b>: 감점·시간제한 없음. 두 번 틀리면 정답이 반짝여 성공으로 끝나게 합니다(무오류 학습).</li>
<li><b>간격 반복</b>: 글자마다 1~5번 상자가 있어 맞히면 다음 상자(복습 간격 1·2·4·7일), 틀리면 1번 상자로. ‘복습 놀이’와 각 걸음 끝의 복습이 때가 된 것과 자주 틀린 것을 먼저 냅니다.</li>
<li><b>의미 있는 낱말</b>: 아이 자신의 이름(조이)과 가족(엄마·언니·오빠·로에·조엘), 좋아할 만한 사물로 첫 낱말을 고릅니다. 자기 이름 읽기는 아이에게 가장 강한 동기입니다.</li>
<li><b>다감각</b>: 듣기(음성) · 보기(색·그림) · 손(조립·쓰기) · 몸(손뼉).</li></ul>`],
  ['🎨 디자이너의 설계', `<ul>
<li><b>색 약속을 끝까지 지킵니다</b>: 자음 = 분홍, 모음 = 하늘, 받침 = 노랑. 글자의 ‘역할’이 색으로 보입니다.</li>
<li>읽지 못해도 혼자 쓸 수 있게 <b>모든 안내는 음성</b>, 버튼은 64px 이상, 한 화면에 한 과제.</li>
<li>학습용 글자는 획이 반듯한 <b>나눔고딕 굵은 체</b>(교과서 글자꼴에 가까움), 화면 글씨는 둥근 주아체.</li>
<li><b>여행 지도</b>로 진도를 보여 줘 ‘다음엔 어디?’라는 기대를 만들고, 걸음마다 스티커를 모읍니다. 마스코트 토리가 맞으면 뛰고 틀리면 갸웃합니다.</li></ul>`],
  ['👨‍👩‍👧 부모님이 함께하면 좋은 것', `<ul>
<li>소개 카드에서 <b>거울 앞에서 같이 소리 내기</b>(혀·입 모양 확인).</li>
<li>하루 한 걸음 + 복습 놀이 한 판이면 충분합니다. 별이 1개여도 다음 걸음으로 가도 됩니다(복습이 따라옵니다).</li>
<li>‘글자 지도’에서 노란 글자를 생활 속 간판·과자 봉지에서 함께 찾아보세요.</li>
<li>이전에 만든 <b>듣고 따라쓰기</b>(획순) · <b>자음·모음 놀이터</b>(게임)와 함께 쓰면 좋습니다.</li></ul>`],
];

// ── 시작 ─────────────────────────────────────────────
function boot() {
  Speech.init();
  $('#splashTori').innerHTML = TORI; $('#mapTori').innerHTML = TORI; $('#lessonTori').innerHTML = TORI;
  $('#startBtn').onclick = () => {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (e) {}
    Speech.say('조이야, 안녕! 오늘도 한글 여행을 떠나 볼까?'); renderMap();
  };
  $('#goBtn').onclick = () => startLesson(nextLesson());
  $('#revBtn').onclick = startReview;
  $('#bookBtn').onclick = stickerBook;
  $('#parentBtn').onclick = parentLock;
  $('#quitBtn').onclick = () => { run = null; renderMap(); };
  $('#pclose').onclick = renderMap;
  setInterval(() => { if ($('#lesson').classList.contains('on') && !document.hidden) { const d = today(); state.time[d] = (state.time[d] || 0) + 5; save(); } }, 5000);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
