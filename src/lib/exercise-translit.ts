/**
 * 영어 운동명 → 한글 음차 (번역 아님).
 * 예: "barbell bench press" → "바벨 벤치 프레스", "lateral raise" → "래터럴 레이즈"
 * 단어 사전 기반. 어색한 게 보이면 아래 PHRASES/WORDS 에 추가/수정만 하면 됨.
 * 사전에 없는 단어는 영어 그대로 둔다.
 */

// 2단어 우선 매칭 (붙여쓰는 게 자연스러운 것)
const PHRASES: Record<string, string> = {
  "bench press": "벤치 프레스",
  "leg press": "레그 프레스",
  "leg curl": "레그 컬",
  "leg extension": "레그 익스텐션",
  "leg raise": "레그 레이즈",
  "calf raise": "카프 레이즈",
  "lateral raise": "래터럴 레이즈",
  "front raise": "프론트 레이즈",
  "rear delt": "리어 델트",
  "hip thrust": "힙 쓰러스트",
  "face pull": "페이스 풀",
  "good morning": "굿모닝",
  "skull crusher": "스컬 크러셔",
  "french press": "프렌치 프레스",
  "mountain climber": "마운틴 클라이머",
  "jumping jack": "점핑 잭",
  "box jump": "박스 점프",
  "step up": "스텝업",
  "pull up": "풀업",
  "push up": "푸시업",
  "chin up": "친업",
  "sit up": "싯업",
  "pull down": "풀다운",
  "lat pulldown": "랫 풀다운",
  "knee raise": "니 레이즈",
  "bent over": "벤트오버",
  "close grip": "클로즈 그립",
  "wide grip": "와이드 그립",
  "overhead press": "오버헤드 프레스",
  "military press": "밀리터리 프레스",
  "shoulder press": "숄더 프레스",
  "chest press": "체스트 프레스",
  "upright row": "업라이트 로우",
};

const WORDS: Record<string, string> = {
  // 장비
  barbell: "바벨", dumbbell: "덤벨", cable: "케이블", machine: "머신", smith: "스미스",
  kettlebell: "케틀벨", band: "밴드", weighted: "웨이티드", assisted: "어시스티드",
  lever: "레버", sled: "슬레드", rope: "로프", plate: "플레이트", ez: "이지", bar: "바",
  olympic: "올림픽", suspension: "서스펜션", roller: "롤러", ball: "볼", medicine: "메디신",
  stability: "스태빌리티", bosu: "보수", resistance: "레지스턴스", trap: "트랩",
  // 동작
  press: "프레스", row: "로우", curl: "컬", extension: "익스텐션", fly: "플라이", flye: "플라이",
  raise: "레이즈", squat: "스쿼트", deadlift: "데드리프트", lunge: "런지", lunges: "런지",
  dip: "딥", dips: "딥", crunch: "크런치", crunches: "크런치", plank: "플랭크", thrust: "쓰러스트",
  pulldown: "풀다운", pullover: "풀오버", shrug: "슈러그", shrugs: "슈러그", kickback: "킥백",
  clean: "클린", jerk: "저크", snatch: "스내치", swing: "스윙", swings: "스윙",
  pushup: "푸시업", pullup: "풀업", chinup: "친업", situp: "싯업", burpee: "버피", burpees: "버피",
  jump: "점프", twist: "트위스트", climber: "클라이머", crossover: "크로스오버", pushdown: "푸시다운",
  // 수식
  lateral: "래터럴", front: "프론트", rear: "리어", side: "사이드", seated: "시티드",
  standing: "스탠딩", lying: "라잉", incline: "인클라인", decline: "디클라인", flat: "플랫",
  reverse: "리버스", hammer: "해머", preacher: "프리처", concentration: "컨센트레이션",
  arnold: "아놀드", romanian: "루마니안", bulgarian: "불가리안", hack: "핵", single: "싱글",
  alternating: "얼터네이팅", alternate: "얼터네이트", wide: "와이드", close: "클로즈",
  narrow: "내로우", neutral: "뉴트럴", overhead: "오버헤드", military: "밀리터리", bent: "벤트",
  upright: "업라이트", prone: "프론", isometric: "아이소메트릭", partial: "파셜",
  // 부위/근육
  glute: "글루트", glutes: "글루트", hamstring: "햄스트링", quad: "쿼드", bicep: "바이셉",
  biceps: "바이셉", tricep: "트라이셉", triceps: "트라이셉", chest: "체스트", back: "백",
  shoulder: "숄더", shoulders: "숄더", oblique: "오블리크", obliques: "오블리크", forearm: "포어암",
  wrist: "리스트", neck: "넥", lat: "랫", lats: "랫", delt: "델트", calf: "카프", calves: "카프",
  core: "코어", hip: "힙", leg: "레그", legs: "레그", knee: "니", pec: "펙", deck: "덱",
  // 유산소
  cardio: "카디오", treadmill: "트레드밀", bike: "바이크", cycling: "사이클링", rowing: "로잉",
  elliptical: "일립티컬", running: "러닝", skater: "스케이터",
  // 방향
  up: "업", down: "다운", cross: "크로스", grip: "그립", stance: "스탠스",
  // 추가 보강
  variation: "배리에이션", arm: "암", arms: "암", over: "오버", twisted: "트위스티드",
  flyes: "플라이", wiper: "와이퍼", wipers: "와이퍼", horizontal: "호리존탈", vertical: "버티컬",
  revers: "리버스", goblet: "고블릿", sumo: "스모", pike: "파이크", archer: "아처",
  diamond: "다이아몬드", spider: "스파이더", zottman: "자트만", drag: "드래그", floor: "플로어",
  walking: "워킹", kneeling: "닐링", pause: "포즈", pulse: "펄스", negative: "네거티브",
  hold: "홀드", around: "어라운드", world: "월드", split: "스플릿", staggered: "스태거드",
  rotational: "로테이셔널", rotation: "로테이션", pull: "풀", push: "푸시",
  one: "원", two: "투", high: "하이", low: "로우", mid: "미드", v: "브이",
  bench: "벤치", flry: "플라이", pushdowns: "푸시다운", raises: "레이즈", presses: "프레스",
  rows: "로우", curls: "컬", extensions: "익스텐션", squats: "스쿼트", deadlifts: "데드리프트",
};

// 빼는 연결어
const DROP = new Set(["with", "the", "a", "of", "and", "for", "your", "on", "to"]);

export function translitExercise(name: string): string {
  if (!name) return name;
  const raw = name.toLowerCase().replace(/[-_/()]/g, " ").replace(/\s+/g, " ").trim();
  const tokens = raw.split(" ");
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const two = i + 1 < tokens.length ? `${tokens[i]} ${tokens[i + 1]}` : "";
    if (two && PHRASES[two]) {
      out.push(PHRASES[two]);
      i += 2;
      continue;
    }
    const t = tokens[i];
    i += 1;
    if (DROP.has(t)) continue;
    if (WORDS[t]) out.push(WORDS[t]);
    else out.push(t.charAt(0).toUpperCase() + t.slice(1)); // 미등록 → 영어 그대로
  }
  return out.join(" ");
}

// API bodyPart → 한글 라벨 (탭)
export const BODY_PARTS: { api: string; ko: string }[] = [
  { api: "chest", ko: "가슴" },
  { api: "back", ko: "등" },
  { api: "shoulders", ko: "어깨" },
  { api: "upper arms", ko: "팔(상완)" },
  { api: "lower arms", ko: "팔(전완)" },
  { api: "upper legs", ko: "하체" },
  { api: "lower legs", ko: "종아리" },
  { api: "waist", ko: "복근" },
  { api: "cardio", ko: "유산소" },
  { api: "neck", ko: "목" },
];
