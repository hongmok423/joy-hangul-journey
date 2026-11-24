/* 조이의 한글 여행 — 데이터와 커리큘럼
   언어학(한글 제자 원리·음절 구조), 유아교육(음운 인식→해독→유창성, 간격 반복),
   디자인(색 약속·큰 터치·음성 안내) 원칙에 따라 26걸음으로 짰습니다. */

// ── 한글 조합 ─────────────────────────────────────────
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function compose(c, v, j = '') {
  const ci = CHO.indexOf(c), vi = JUNG.indexOf(v), ji = JONG.indexOf(j);
  if (ci < 0 || vi < 0 || ji < 0) return '';
  return String.fromCharCode(0xAC00 + (ci * 21 + vi) * 28 + ji);
}
function decompose(s) {
  const code = s.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  return { c: CHO[Math.floor(code / 588)], v: JUNG[Math.floor((code % 588) / 28)], j: JONG[code % 28] };
}
const VERT = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ';   // 키다리 모음: 자음은 왼쪽
const HORI = 'ㅗㅛㅜㅠㅡ';         // 납작이 모음: 자음은 위쪽
function vowelShape(v) { return VERT.includes(v) ? 'vert' : HORI.includes(v) ? 'hori' : 'mix'; }

// ── 자모 40자 ─────────────────────────────────────────
// snd: 소리값을 들려줄 때 읽는 말(자음은 '으'를 붙인 음절), word: 예시 낱말
const JAMO = {
  // 기본 모음 — 천(·)·지(ㅡ)·인(ㅣ)
  'ㅣ': { type: 'v', name: '이', snd: '이', word: '이', pic: '🦷', origin: '똑바로 서 있는 사람 모양이에요.', parts: ['사람'] },
  'ㅡ': { type: 'v', name: '으', snd: '으', word: '으르렁', pic: '🦁', origin: '평평한 땅 모양이에요.', parts: ['땅'] },
  'ㅏ': { type: 'v', name: '아', snd: '아', word: '아기', pic: '👶', origin: '사람(ㅣ) 오른쪽, 바깥에 해(·)가 떴어요. 입을 크게 벌려 "아"!', parts: ['사람', '해→'] },
  'ㅓ': { type: 'v', name: '어', snd: '어', word: '엄마', pic: '👩', origin: '사람(ㅣ) 왼쪽, 안쪽에 해(·)가 있어요. "어"!', parts: ['←해', '사람'] },
  'ㅗ': { type: 'v', name: '오', snd: '오', word: '오이', pic: '🥒', origin: '땅(ㅡ) 위에 해(·)가 떴어요. 입을 동그랗게 "오"!', parts: ['해↑', '땅'] },
  'ㅜ': { type: 'v', name: '우', snd: '우', word: '우유', pic: '🥛', origin: '땅(ㅡ) 아래로 해(·)가 졌어요. 입을 쭉 내밀어 "우"!', parts: ['땅', '해↓'] },
  'ㅑ': { type: 'v', name: '야', snd: '야', word: '야구', pic: '⚾', origin: 'ㅏ에 해가 하나 더! "이"와 "아"를 빨리 붙이면 "야".', parts: ['ㅏ', '+점'] },
  'ㅕ': { type: 'v', name: '여', snd: '여', word: '여우', pic: '🦊', origin: 'ㅓ에 해가 하나 더! "이+어"를 빨리 하면 "여".', parts: ['ㅓ', '+점'] },
  'ㅛ': { type: 'v', name: '요', snd: '요', word: '요요', pic: '🪀', origin: 'ㅗ에 해가 하나 더! "이+오"를 빨리 하면 "요".', parts: ['ㅗ', '+점'] },
  'ㅠ': { type: 'v', name: '유', snd: '유', word: '유령', pic: '👻', origin: 'ㅜ에 해가 하나 더! "이+우"를 빨리 하면 "유".', parts: ['ㅜ', '+점'] },
  'ㅐ': { type: 'v', name: '애', snd: '애', word: '애벌레', pic: '🐛', origin: 'ㅏ와 ㅣ가 손을 잡았어요. "애"', parts: ['ㅏ', '+ㅣ'] },
  'ㅔ': { type: 'v', name: '에', snd: '에', word: '에어컨', pic: '🌬️', origin: 'ㅓ와 ㅣ가 손을 잡았어요. "에" — ㅐ와 소리가 거의 같아서 낱말로 기억해요.', parts: ['ㅓ', '+ㅣ'] },
  'ㅒ': { type: 'v', name: '얘', snd: '얘', word: '얘기', pic: '💬', origin: 'ㅑ와 ㅣ가 손을 잡았어요.', parts: ['ㅑ', '+ㅣ'] },
  'ㅖ': { type: 'v', name: '예', snd: '예', word: '예수님', pic: '✝️', origin: 'ㅕ와 ㅣ가 손을 잡았어요. "예수님"의 "예"!', parts: ['ㅕ', '+ㅣ'] },
  'ㅘ': { type: 'v', name: '와', snd: '와', word: '와플', pic: '🧇', origin: 'ㅗ와 ㅏ가 손을 잡았어요. "오+아"를 빨리 하면 "와"!', parts: ['ㅗ', '+ㅏ'] },
  'ㅙ': { type: 'v', name: '왜', snd: '왜', word: '왜', pic: '❓', origin: 'ㅗ와 ㅐ가 손을 잡았어요.', parts: ['ㅗ', '+ㅐ'] },
  'ㅚ': { type: 'v', name: '외', snd: '외', word: '외계인', pic: '👽', origin: 'ㅗ와 ㅣ가 손을 잡았어요.', parts: ['ㅗ', '+ㅣ'] },
  'ㅝ': { type: 'v', name: '워', snd: '워', word: '원숭이', pic: '🐒', origin: 'ㅜ와 ㅓ가 손을 잡았어요. "우+어"를 빨리 하면 "워"!', parts: ['ㅜ', '+ㅓ'] },
  'ㅞ': { type: 'v', name: '웨', snd: '웨', word: '웨이터', pic: '🤵', origin: 'ㅜ와 ㅔ가 손을 잡았어요.', parts: ['ㅜ', '+ㅔ'] },
  'ㅟ': { type: 'v', name: '위', snd: '위', word: '위', pic: '⬆️', origin: 'ㅜ와 ㅣ가 손을 잡았어요. "위"!', parts: ['ㅜ', '+ㅣ'] },
  'ㅢ': { type: 'v', name: '의', snd: '의', word: '의자', pic: '🪑', origin: 'ㅡ와 ㅣ가 손을 잡았어요. "으+이"를 빨리 하면 "의"!', parts: ['ㅡ', '+ㅣ'] },
  // 기본 자음 — 소리 내는 곳을 본뜬 다섯 글자
  'ㄱ': { type: 'c', name: '기역', snd: '그', word: '기린', pic: '🦒', origin: '혀 뒤쪽이 목구멍을 막는 모양이에요.', organ: '👅 혀뿌리' },
  'ㄴ': { type: 'c', name: '니은', snd: '느', word: '나비', pic: '🦋', origin: '혀끝이 윗잇몸에 닿는 모양이에요.', organ: '👅 혀끝' },
  'ㅁ': { type: 'c', name: '미음', snd: '므', word: '모자', pic: '🧢', origin: '네모난 입 모양이에요. 입술을 붙였다 떼요.', organ: '👄 입술' },
  'ㅅ': { type: 'c', name: '시옷', snd: '스', word: '사자', pic: '🦁', origin: '뾰족한 이 모양이에요. 이 사이로 바람이 "스—"', organ: '🦷 이' },
  'ㅇ': { type: 'c', name: '이응', snd: '이응', word: '오리', pic: '🦆', origin: '동그란 목구멍 모양이에요. 첫소리에서는 소리가 없는 "자리 지킴이"예요.', organ: '⭕ 목구멍' },
  // 획을 더한 자음 — 더 세게
  'ㅋ': { type: 'c', name: '키읔', snd: '크', word: '코', pic: '👃', origin: 'ㄱ에 획 하나를 더했어요. 바람이 더 세게 "크"!', base: 'ㄱ' },
  'ㄷ': { type: 'c', name: '디귿', snd: '드', word: '도토리', pic: '🌰', origin: 'ㄴ에 획 하나를 더했어요. 혀끝이 딱 막아요 "드".', base: 'ㄴ' },
  'ㅌ': { type: 'c', name: '티읕', snd: '트', word: '토끼', pic: '🐰', origin: 'ㄷ에 획을 또 더했어요. 바람이 세게 "트"!', base: 'ㄷ' },
  'ㄹ': { type: 'c', name: '리을', snd: '르', word: '라디오', pic: '📻', origin: 'ㄴ의 특별한 친구예요. 혀를 또르르 굴려요 "르".', base: 'ㄴ' },
  'ㅂ': { type: 'c', name: '비읍', snd: '브', word: '바나나', pic: '🍌', origin: 'ㅁ에 획을 더했어요. 입술을 꼭 다물었다 "브".', base: 'ㅁ' },
  'ㅍ': { type: 'c', name: '피읖', snd: '프', word: '포도', pic: '🍇', origin: 'ㅂ보다 바람이 세게 나와요 "프"!', base: 'ㅂ' },
  'ㅈ': { type: 'c', name: '지읒', snd: '즈', word: '자동차', pic: '🚗', origin: 'ㅅ에 획을 더했어요 "즈".', base: 'ㅅ' },
  'ㅊ': { type: 'c', name: '치읓', snd: '츠', word: '치마', pic: '👗', origin: 'ㅈ에 획을 또 더했어요. 바람이 세게 "츠"!', base: 'ㅈ' },
  'ㅎ': { type: 'c', name: '히읗', snd: '흐', word: '하마', pic: '🦛', origin: 'ㅇ에 획을 더했어요. 목에서 바람이 "흐—"', base: 'ㅇ' },
  // 쌍자음 — 같은 글자 둘 = 힘준 소리
  'ㄲ': { type: 'c', name: '쌍기역', snd: '끄', word: '꽃', pic: '🌸', origin: 'ㄱ이 둘! 목에 힘을 꽉 주어 "끄".', base: 'ㄱ' },
  'ㄸ': { type: 'c', name: '쌍디귿', snd: '뜨', word: '딸기', pic: '🍓', origin: 'ㄷ이 둘! 힘을 꽉 "뜨".', base: 'ㄷ' },
  'ㅃ': { type: 'c', name: '쌍비읍', snd: '쁘', word: '빵', pic: '🍞', origin: 'ㅂ이 둘! 입술에 힘을 꽉 "쁘".', base: 'ㅂ' },
  'ㅆ': { type: 'c', name: '쌍시옷', snd: '쓰', word: '씨앗', pic: '🌱', origin: 'ㅅ이 둘! 힘을 주어 "쓰".', base: 'ㅅ' },
  'ㅉ': { type: 'c', name: '쌍지읒', snd: '쯔', word: '짜장면', pic: '🍜', origin: 'ㅈ이 둘! 힘을 꽉 "쯔".', base: 'ㅈ' },
};

// ── 낱말 그림 사전 ────────────────────────────────────
const PIC = {
  배: '🍐', 사과: '🍎', 나비: '🦋', 바나나: '🍌', 코: '👃', 오리: '🦆', 고구마: '🍠', 해: '☀️', 기린: '🦒', 토끼: '🐰',
  비행기: '✈️', 꽃: '🌸', 나무: '🌳', 고기: '🍖', 바다: '🌊', 사자: '🦁', 오이: '🥒', 토마토: '🍅', 기차: '🚂', 우유: '🥛',
  우산: '☂️', 아기: '👶', 아이: '🧒', 모자: '🧢', 소: '🐮', 모기: '🦟', 가수: '🎤', 이: '🦷', 거미: '🕷️', 쿠키: '🍪',
  키: '📏', 도토리: '🌰', 라디오: '📻', 다리: '🦵', 머리: '💇', 비: '🌧️', 포도: '🍇', 피아노: '🎹', 버스: '🚌', 지도: '🗺️',
  주스: '🧃', 치마: '👗', 고추: '🌶️', 하마: '🦛', 하트: '❤️', 조이: '🌟', 야구: '⚾', 여우: '🦊', 요요: '🪀', 휴지: '🧻',
  개: '🐶', 새: '🐦', 게: '🦀', 노래: '🎵', 고래: '🐳', 개미: '🐜', 로에: '👦', 공: '⚽', 곰: '🐻', 밤: '🌃',
  산: '⛰️', 눈: '⛄', 문: '🚪', 손: '✋', 엄마: '👩', 언니: '👧', 사탕: '🍬', 달: '🌙', 별: '⭐', 물: '💧',
  말: '🐴', 발: '🦶', 귤: '🍊', 조엘: '🍼', 책: '📚', 수박: '🍉', 국: '🍲', 밥: '🍚', 집: '🏠', 입: '👄',
  옷: '👕', 약: '💊', 딸기: '🍓', 아빠: '👨', 오빠: '🧑', 빵: '🍞', 코끼리: '🐘', 씨앗: '🌱', 와플: '🧇', 가위: '✂️',
  귀: '👂', 의자: '🪑', 돼지: '🐷', 시계: '⏰', 교회: '⛪', 원숭이: '🐒', 외계인: '👽', 자동차: '🚗', 차: '🚙', 소라: '🐚',
};

// 첫소리(첫 음절) 친구 짝 — 음운 인식
const SAME_PAIRS = [
  ['나비', '나무'], ['바나나', '바다'], ['사과', '사자'], ['오리', '오이'],
  ['토끼', '토마토'], ['기린', '기차'], ['우유', '우산'], ['고구마', '고기'],
];

// ── 지도: 10개 마을 ───────────────────────────────────
const STAGES = [
  { id: 'A', name: '소리 숲', icon: '🌲', color: '#C9F0D6', note: '글자 전에 소리부터: 말소리를 박자(음절)로 쪼개고 첫소리를 알아차려요.' },
  { id: 'B', name: '모음 하늘', icon: '☁️', color: '#CFE8FF', note: '하늘(·)·땅(ㅡ)·사람(ㅣ) 세 가지로 모든 모음이 만들어져요.' },
  { id: 'C', name: '자음 마을', icon: '🏡', color: '#FFD9E2', note: '혀·입술·이·목구멍 모양을 본뜬 기본 자음 다섯.' },
  { id: 'D', name: '글자 블록 공방', icon: '🧱', color: '#FFE9B8', note: '자음+모음이 한 칸에 모여요. 키다리 모음은 오른쪽, 납작이 모음은 아래.' },
  { id: 'E', name: '자음 가족 숲', icon: '🌳', color: '#D7F5C9', note: '획을 더하면 더 센 소리: ㄱ→ㅋ, ㄴ→ㄷ→ㅌ, ㅁ→ㅂ→ㅍ, ㅅ→ㅈ→ㅊ, ㅇ→ㅎ.' },
  { id: 'F', name: '점 하나 더 언덕', icon: '⛰️', color: '#E6DBFF', note: '해(점)가 하나 더 붙으면 "이" 소리가 앞에 붙어요.' },
  { id: 'G', name: '낱말 놀이터', icon: '🎠', color: '#FFDCC7', note: '배운 글자로 진짜 낱말을 읽어요.' },
  { id: 'H', name: '받침 마을', icon: '🏘️', color: '#FFF3A8', note: '글자 아래를 받쳐 주는 자음 — 잘 들리는 것(ㅇㄴㅁㄹ)부터.' },
  { id: 'I', name: '쌍둥이 다리', icon: '🌉', color: '#C7F0F0', note: '쌍자음(힘준 소리)과 손잡은 모음.' },
  { id: 'J', name: '이야기 섬', icon: '🏝️', color: '#FFD3EC', note: '문장과 이야기를 읽어요.' },
];

// ── 26걸음 커리큘럼 ──────────────────────────────────
// 활동 종류
//  clap 손뼉 세기 · same 첫소리 친구 · intro 글자 소개 · family 가족 소개 · rule 원리 카드
//  pick 듣고 고르기 · build 글자 조립 · trace 손가락 쓰기 · read 낱말 읽기(그림 고르기)
//  listen 듣고 낱말 찾기 · spell 낱말 만들기 · bat 받침 붙이기 · link 받침 미끄럼틀(연음)
//  sent 문장 읽기 · story 이야기 · name 이름 축하 · review 복습(간격 반복)
const LESSONS = [
  // A 소리 숲
  { stage: 'A', title: '손뼉 짝짝', goal: '낱말을 박자로 쪼개요', sticker: '🐣', steps: [
    { t: 'rule', key: 'clap' },
    { t: 'clap', words: ['배', '사과', '바나나', '코', '오리', '고구마', '해', '나비', '토끼', '비행기'], n: 6 },
  ]},
  { stage: 'A', title: '첫소리 친구', goal: '같은 소리로 시작하는 낱말 찾기', sticker: '🌈', steps: [
    { t: 'rule', key: 'same' },
    { t: 'same', n: 6 },
    { t: 'clap', words: ['기린', '우산', '토마토', '꽃', '바다', '고기'], n: 3 },
  ]},
  // B 모음 하늘
  { stage: 'B', title: '하늘·땅·사람', goal: 'ㅣ와 ㅡ', sticker: '🍓', steps: [
    { t: 'rule', key: 'cheonjiin' },
    { t: 'intro', ch: 'ㅣ' }, { t: 'intro', ch: 'ㅡ' },
    { t: 'pick', pool: ['ㅣ', 'ㅡ'], n: 4 },
    { t: 'trace', ch: 'ㅣ' }, { t: 'trace', ch: 'ㅡ' },
  ]},
  { stage: 'B', title: '해가 옆에 떴어요', goal: 'ㅏ와 ㅓ', sticker: '🦄', steps: [
    { t: 'intro', ch: 'ㅏ' }, { t: 'intro', ch: 'ㅓ' },
    { t: 'pick', pool: ['ㅏ', 'ㅓ'], extra: ['ㅣ', 'ㅡ'], n: 5 },
    { t: 'trace', ch: 'ㅏ' }, { t: 'trace', ch: 'ㅓ' },
    { t: 'review', n: 2 },
  ]},
  { stage: 'B', title: '해가 위아래에', goal: 'ㅗ와 ㅜ', sticker: '🎈', steps: [
    { t: 'intro', ch: 'ㅗ' }, { t: 'intro', ch: 'ㅜ' },
    { t: 'pick', pool: ['ㅗ', 'ㅜ'], extra: ['ㅏ', 'ㅓ'], n: 5 },
    { t: 'trace', ch: 'ㅗ' }, { t: 'trace', ch: 'ㅜ' },
    { t: 'review', n: 3 },
  ]},
  // C 자음 마을
  { stage: 'C', title: '혀 모양 글자', goal: 'ㄱ과 ㄴ, 첫 글자 만들기', sticker: '🌻', steps: [
    { t: 'rule', key: 'consonant' },
    { t: 'intro', ch: 'ㄱ' }, { t: 'intro', ch: 'ㄴ' },
    { t: 'pick', pool: ['ㄱ', 'ㄴ'], extra: ['ㅏ', 'ㅗ'], n: 4 },
    { t: 'build', items: ['가', '나', '고', '누'], cons: ['ㄱ', 'ㄴ'], vows: ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ'] },
    { t: 'trace', ch: 'ㄱ' }, { t: 'trace', ch: 'ㄴ' },
    { t: 'review', n: 2 },
  ]},
  { stage: 'C', title: '입과 이 모양 글자', goal: 'ㅁ과 ㅅ', sticker: '🐳', steps: [
    { t: 'intro', ch: 'ㅁ' }, { t: 'intro', ch: 'ㅅ' },
    { t: 'pick', pool: ['ㅁ', 'ㅅ'], extra: ['ㄱ', 'ㄴ'], n: 5 },
    { t: 'build', items: ['마', '소', '무', '서', '미'], cons: ['ㄱ', 'ㄴ', 'ㅁ', 'ㅅ'], vows: ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅣ'] },
    { t: 'trace', ch: 'ㅁ' }, { t: 'trace', ch: 'ㅅ' },
    { t: 'review', n: 3 },
  ]},
  { stage: 'C', title: '자리 지킴이 ㅇ', goal: 'ㅇ과 첫 낱말', sticker: '🍩', steps: [
    { t: 'intro', ch: 'ㅇ' },
    { t: 'rule', key: 'ieung' },
    { t: 'build', items: ['아', '오', '우', '이', '어'], cons: ['ㅇ', 'ㄱ', 'ㅅ'], vows: ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅣ'] },
    { t: 'read', words: ['아이', '오이', '아기'], n: 3 },
    { t: 'trace', ch: 'ㅇ' },
    { t: 'review', n: 3 },
  ]},
  // D 글자 블록 공방
  { stage: 'D', title: '키다리 모음 자리', goal: 'ㅏㅓㅣ는 오른쪽에', sticker: '🚀', steps: [
    { t: 'rule', key: 'vert' },
    { t: 'build', items: ['기', '너', '마', '시', '거', '니'], cons: ['ㄱ', 'ㄴ', 'ㅁ', 'ㅅ'], vows: ['ㅏ', 'ㅓ', 'ㅣ'] },
    { t: 'pick', pool: ['가', '거', '기', '나', '너', '니'], syl: true, n: 5 },
    { t: 'trace', ch: '가' }, { t: 'trace', ch: '나' },
    { t: 'review', n: 3 },
  ]},
  { stage: 'D', title: '납작이 모음 자리', goal: 'ㅗㅜㅡ는 아래에, 첫 낱말 읽기', sticker: '🧸', steps: [
    { t: 'rule', key: 'hori' },
    { t: 'build', items: ['고', '누', '모', '수', '그'], cons: ['ㄱ', 'ㄴ', 'ㅁ', 'ㅅ'], vows: ['ㅗ', 'ㅜ', 'ㅡ'] },
    { t: 'read', words: ['나무', '오이', '모기', '고기', '거미', '아기', '가수', '소'], n: 5 },
    { t: 'listen', words: ['나무', '모기', '고기', '거미', '가수', '아이'], n: 3 },
    { t: 'trace', ch: '고' },
    { t: 'review', n: 3 },
  ]},
  // E 자음 가족 숲
  { stage: 'E', title: 'ㄱ 가족', goal: 'ㄱ에 획을 더하면 ㅋ', sticker: '🎀', steps: [
    { t: 'family', from: 'ㄱ', to: ['ㅋ'] },
    { t: 'intro', ch: 'ㅋ' },
    { t: 'pick', pool: ['기', '키', '고', '코'], syl: true, n: 4 },
    { t: 'build', items: ['코', '키', '쿠'], cons: ['ㄱ', 'ㅋ'], vows: ['ㅗ', 'ㅜ', 'ㅣ'] },
    { t: 'read', words: ['코', '쿠키', '키', '고기'], n: 3 },
    { t: 'trace', ch: 'ㅋ' },
    { t: 'review', n: 3 },
  ]},
  { stage: 'E', title: 'ㄴ 가족', goal: 'ㄴ→ㄷ→ㅌ, 그리고 ㄹ', sticker: '🐞', steps: [
    { t: 'family', from: 'ㄴ', to: ['ㄷ', 'ㅌ'] },
    { t: 'intro', ch: 'ㄷ' }, { t: 'intro', ch: 'ㅌ' }, { t: 'intro', ch: 'ㄹ' },
    { t: 'pick', pool: ['ㄷ', 'ㅌ', 'ㄹ'], extra: ['ㄴ'], n: 5 },
    { t: 'build', items: ['다', '토', '리', '두'], cons: ['ㄴ', 'ㄷ', 'ㅌ', 'ㄹ'], vows: ['ㅏ', 'ㅗ', 'ㅜ', 'ㅣ'] },
    { t: 'read', words: ['도토리', '라디오', '다리', '오리', '머리', '토마토'], n: 4 },
    { t: 'trace', ch: 'ㄷ' }, { t: 'trace', ch: 'ㄹ' },
    { t: 'review', n: 3 },
  ]},
  { stage: 'E', title: 'ㅁ 가족', goal: 'ㅁ→ㅂ→ㅍ', sticker: '🌟', steps: [
    { t: 'family', from: 'ㅁ', to: ['ㅂ', 'ㅍ'] },
    { t: 'intro', ch: 'ㅂ' }, { t: 'intro', ch: 'ㅍ' },
    { t: 'pick', pool: ['ㅂ', 'ㅍ'], extra: ['ㅁ', 'ㄷ'], n: 4 },
    { t: 'build', items: ['바', '포', '비', '피'], cons: ['ㅁ', 'ㅂ', 'ㅍ'], vows: ['ㅏ', 'ㅗ', 'ㅣ'] },
    { t: 'read', words: ['바다', '비', '바나나', '포도', '피아노', '버스', '나비'], n: 4 },
    { t: 'listen', words: ['바다', '포도', '피아노', '버스', '나비'], n: 3 },
    { t: 'trace', ch: 'ㅂ' },
    { t: 'review', n: 3 },
  ]},
  { stage: 'E', title: 'ㅅ·ㅇ 가족', goal: 'ㅅ→ㅈ→ㅊ, ㅇ→ㅎ, 그리고 내 이름!', sticker: '🍉', steps: [
    { t: 'family', from: 'ㅅ', to: ['ㅈ', 'ㅊ'] },
    { t: 'family', from: 'ㅇ', to: ['ㅎ'] },
    { t: 'intro', ch: 'ㅈ' }, { t: 'intro', ch: 'ㅊ' }, { t: 'intro', ch: 'ㅎ' },
    { t: 'pick', pool: ['ㅈ', 'ㅊ', 'ㅎ'], extra: ['ㅅ', 'ㅇ'], n: 5 },
    { t: 'build', items: ['조', '이'], cons: ['ㅅ', 'ㅈ', 'ㅇ'], vows: ['ㅗ', 'ㅏ', 'ㅣ'] },
    { t: 'name', word: '조이' },
    { t: 'read', words: ['지도', '주스', '기차', '치마', '고추', '하마', '하트', '사자'], n: 4 },
    { t: 'trace', ch: 'ㅈ' }, { t: 'trace', ch: '조' }, { t: 'trace', ch: '이' },
    { t: 'review', n: 3 },
  ]},
  // F 점 하나 더 언덕
  { stage: 'F', title: '점 하나 더', goal: 'ㅑ ㅕ ㅛ ㅠ', sticker: '🦋', steps: [
    { t: 'rule', key: 'yvowel' },
    { t: 'intro', ch: 'ㅑ' }, { t: 'intro', ch: 'ㅕ' }, { t: 'intro', ch: 'ㅛ' }, { t: 'intro', ch: 'ㅠ' },
    { t: 'pick', pool: ['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ'], extra: ['ㅏ', 'ㅗ'], n: 5 },
    { t: 'build', items: ['야', '여', '요', '유', '휴'], cons: ['ㅇ', 'ㅎ'], vows: ['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ'] },
    { t: 'read', words: ['야구', '여우', '요요', '우유', '휴지'], n: 4 },
    { t: 'trace', ch: 'ㅑ' }, { t: 'trace', ch: 'ㅠ' },
    { t: 'review', n: 3 },
  ]},
  { stage: 'F', title: '손잡은 ㅐ와 ㅔ', goal: 'ㅐ ㅔ — 소리는 같고 낱말로 기억', sticker: '🐧', steps: [
    { t: 'intro', ch: 'ㅐ' }, { t: 'intro', ch: 'ㅔ' },
    { t: 'rule', key: 'aee' },
    { t: 'read', words: ['개', '새', '게', '배', '해', '노래', '고래', '개미'], n: 5 },
    { t: 'listen', words: ['개', '게', '새', '노래', '고래', '개미'], n: 3 },
    { t: 'trace', ch: 'ㅐ' }, { t: 'trace', ch: 'ㅔ' },
    { t: 'review', n: 3 },
  ]},
  // G 낱말 놀이터
  { stage: 'G', title: '낱말 읽기 ①', goal: '두 글자 낱말 술술', sticker: '🎂', steps: [
    { t: 'read', words: ['나비', '오리', '사자', '모자', '기차', '포도', '하마', '여우', '바다', '다리', '로에', '조이'], n: 6 },
    { t: 'spell', words: ['나비', '모자', '하마', '포도', '로에'], n: 3 },
    { t: 'listen', words: ['사자', '모자', '기차', '치마', '하마', '바다'], n: 3 },
    { t: 'review', n: 3 },
  ]},
  { stage: 'G', title: '낱말 읽기 ②', goal: '세 글자 낱말', sticker: '🌷', steps: [
    { t: 'read', words: ['바나나', '도토리', '토마토', '라디오', '피아노', '고구마'], n: 5 },
    { t: 'spell', words: ['바나나', '토마토', '고구마', '도토리'], n: 3 },
    { t: 'clap', words: ['바나나', '개', '피아노', '고래', '코', '도토리'], n: 3 },
    { t: 'review', n: 4 },
  ]},
  // H 받침 마을
  { stage: 'H', title: '콧소리 받침', goal: 'ㅇ ㄴ ㅁ 받침', sticker: '🐬', steps: [
    { t: 'rule', key: 'batchim' },
    { t: 'bat', words: ['공', '곰', '산', '손', '문', '눈', '밤'], opts: ['ㅇ', 'ㄴ', 'ㅁ'], n: 5 },
    { t: 'read', words: ['공', '곰', '산', '손', '문', '엄마', '언니', '사탕'], n: 5 },
    { t: 'trace', ch: '공' },
    { t: 'review', n: 3 },
  ]},
  { stage: 'H', title: '굴러가는 받침 ㄹ', goal: 'ㄹ 받침', sticker: '🍭', steps: [
    { t: 'bat', words: ['달', '물', '말', '발', '별'], opts: ['ㄹ', 'ㄴ', 'ㅇ'], n: 4 },
    { t: 'read', words: ['달', '별', '물', '말', '발', '귤', '조엘'], n: 5 },
    { t: 'spell', words: ['조엘', '언니', '엄마'], n: 2 },
    { t: 'trace', ch: '달' },
    { t: 'review', n: 3 },
  ]},
  { stage: 'H', title: '멈추는 받침', goal: 'ㄱ ㅂ ㄷ 소리 받침', sticker: '🦔', steps: [
    { t: 'rule', key: 'stop' },
    { t: 'bat', words: ['국', '밥', '집', '입', '책', '옷'], opts: ['ㄱ', 'ㅂ', 'ㅅ'], n: 5 },
    { t: 'read', words: ['책', '수박', '국', '밥', '집', '입', '옷', '약'], n: 5 },
    { t: 'listen', words: ['밥', '집', '입', '책', '국'], n: 3 },
    { t: 'review', n: 4 },
  ]},
  // I 쌍둥이 다리
  { stage: 'I', title: '쌍둥이 자음', goal: 'ㄲ ㄸ ㅃ ㅆ ㅉ — 가·카·까', sticker: '🎠', steps: [
    { t: 'rule', key: 'tense' },
    { t: 'intro', ch: 'ㄲ' }, { t: 'intro', ch: 'ㄸ' }, { t: 'intro', ch: 'ㅃ' },
    { t: 'pick', pool: ['가', '카', '까', '다', '타', '따', '바', '파', '빠'], syl: true, n: 6, triad: true },
    { t: 'read', words: ['토끼', '딸기', '아빠', '오빠', '빵', '코끼리', '씨앗', '꽃'], n: 5 },
    { t: 'trace', ch: 'ㄲ' },
    { t: 'review', n: 3 },
  ]},
  { stage: 'I', title: '손잡은 모음', goal: 'ㅘ ㅝ ㅚ ㅟ ㅢ', sticker: '🍀', steps: [
    { t: 'rule', key: 'diph' },
    { t: 'intro', ch: 'ㅘ' }, { t: 'intro', ch: 'ㅝ' }, { t: 'intro', ch: 'ㅚ' }, { t: 'intro', ch: 'ㅟ' }, { t: 'intro', ch: 'ㅢ' },
    { t: 'read', words: ['사과', '와플', '가위', '귀', '의자', '돼지', '시계', '교회', '원숭이', '외계인'], n: 6 },
    { t: 'spell', words: ['사과', '교회', '가위', '의자'], n: 2 },
    { t: 'review', n: 3 },
  ]},
  // J 이야기 섬
  { stage: 'J', title: '문장 읽기', goal: '짧은 문장 읽고 그림 찾기', sticker: '🐼', steps: [
    { t: 'sent', items: [
      { s: '아기가 자요.', p: '👶💤' }, { s: '고래가 커요.', p: '🐳' }, { s: '새가 노래해요.', p: '🐦🎵' },
      { s: '토끼가 뛰어요.', p: '🐰💨' }, { s: '아빠가 빵을 사요.', p: '👨🍞' }, { s: '비가 와요.', p: '🌧️' },
    ], n: 4 },
    { t: 'review', n: 4 },
  ]},
  { stage: 'J', title: '받침 미끄럼틀', goal: '받침이 다음 칸으로 미끄러져요 (곰이→[고미])', sticker: '👑', steps: [
    { t: 'rule', key: 'linking' },
    { t: 'link', items: [['곰', '이'], ['눈', '이'], ['손', '을'], ['옷', '이'], ['책', '을']], n: 4 },
    { t: 'sent', items: [
      { s: '곰이 자요.', p: '🐻💤' }, { s: '눈이 와요.', p: '🌨️⛄' }, { s: '조이가 웃어요.', p: '😊' }, { s: '책을 읽어요.', p: '📖' },
    ], n: 3 },
    { t: 'review', n: 3 },
  ]},
  { stage: 'J', title: '노아의 배', goal: '이야기 한 권 읽기', sticker: '🕊️', steps: [
    { t: 'story', title: '노아의 배', pages: [
      { s: '비가 와요.', p: '🌧️🌧️🌧️' },
      { s: '노아가 큰 배를 만들어요.', p: '🧔🔨🚢' },
      { s: '동물들이 배에 타요.', p: '🦁🐘🦒🐰' },
      { s: '비가 그쳤어요.', p: '🌤️🕊️' },
      { s: '하늘에 무지개가 떠요.', p: '🌈' },
      { s: '하나님, 고마워요!', p: '🙏💛' },
    ], q: { s: '노아가 무엇을 만들었나요?', opts: [['배', '🚢'], ['집', '🏠'], ['차', '🚙']], a: 0 } },
    { t: 'review', n: 4 },
  ]},
];

// 원리 카드 (rule)
const RULES = {
  clap: { title: '손뼉 짝짝!', show: '🍌 바·나·나 👏👏👏', say: '바나나는 손뼉을 몇 번 칠까요? 바, 나, 나. 세 번! 낱말을 들으면 박자대로 손뼉을 쳐 봐요.' },
  same: { title: '첫소리 친구', show: '🦆 오리 · 🥒 오이', say: '오리, 오이. 둘 다 오로 시작해요! 첫소리가 같은 친구를 찾아봐요.' },
  cheonjiin: { title: '하늘 · 땅 · 사람', show: '☀️ · (하늘)   🟫 ㅡ (땅)   🧍 ㅣ (사람)', say: '한글 모음은 세 가지로 만들어요. 동그란 해는 하늘, 평평한 ㅡ는 땅, 서 있는 ㅣ는 사람이에요.' },
  consonant: { title: '자음은 입 모양 그림', show: '👅 ㄱ ㄴ · 👄 ㅁ · 🦷 ㅅ · ⭕ ㅇ', say: '자음은 소리 낼 때 혀와 입술, 이와 목구멍 모양을 그대로 그린 글자예요. 거울을 보며 같이 소리 내 봐요.' },
  ieung: { title: 'ㅇ은 자리 지킴이', show: 'ㅇ + ㅏ = 아', say: '모음만 쓸 때는 앞자리를 비워 두지 않아요. 소리 없는 ㅇ이 자리를 지켜 줘요. 이응, 아는 그냥 아!' },
  vert: { title: '키다리 모음은 오른쪽', show: 'ㄱ ▸ ㅏ = 가', say: 'ㅏ, ㅓ, ㅣ 처럼 키가 큰 모음은 자음의 오른쪽에 서요. 그, 아, 가!' },
  hori: { title: '납작이 모음은 아래', show: 'ㄱ\n▾\nㅗ = 고', say: 'ㅗ, ㅜ, ㅡ 처럼 납작한 모음은 자음 아래에 누워요. 그, 오, 고!' },
  yvowel: { title: '점 하나 더!', show: 'ㅏ → ㅑ   ㅗ → ㅛ', say: '해가 하나 더 뜨면 앞에 이 소리가 붙어요. 이, 아, 야! 이, 오, 요!' },
  aee: { title: 'ㅐ와 ㅔ는 쌍둥이 소리', show: '🐶 개 · 🦀 게', say: '애와 에는 요즘 소리가 거의 똑같아요. 그래서 개는 강아지, 게는 꽃게처럼 낱말 모양으로 기억해요.' },
  batchim: { title: '받침은 받쳐 주는 자음', show: '고 + ㅇ = 공 ⚽', say: '글자 아래에 자음이 하나 더 앉으면 받침이에요. 고에 이응을 받치면, 공!' },
  stop: { title: '멈추는 받침', show: '구 + ㄱ = 국 🍲   바 + ㅂ = 밥 🍚', say: '기역, 비읍 받침은 소리를 딱 멈춰요. 국, 밥! 옷의 시옷 받침은 디귿처럼 소리 나요.' },
  tense: { title: '삼총사 소리: 가 · 카 · 까', show: 'ㄱ 가 · ㅋ 카 · ㄲ 까', say: '가는 부드럽게, 카는 바람을 세게, 까는 힘을 꽉! 같은 글자가 둘이면 힘준 소리예요.' },
  diph: { title: '모음이 손을 잡아요', show: 'ㅗ + ㅏ = ㅘ   ㅜ + ㅓ = ㅝ', say: '오와 아를 빨리 붙이면 와! 우와 어를 빨리 붙이면 워! 두 모음이 손을 잡았어요.' },
  linking: { title: '받침 미끄럼틀', show: '곰 + 이 → [고미]', say: '받침 뒤에 이응으로 시작하는 글자가 오면, 받침이 미끄럼틀을 타고 옆 칸으로 넘어가요. 곰이는 고미라고 읽어요!' },
};

const PRAISE = ['잘했어요!', '멋져요!', '딩동댕!', '최고예요!', '와, 대단해요!', '정답!'];
const RETRY = ['다시 해볼까?', '한 번 더 들어 볼까?', '괜찮아, 다시!'];
