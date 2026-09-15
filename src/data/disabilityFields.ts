import { withSubjectParticle } from '../lib/korean';
import type { FieldOption } from '../components/ui/OptionGroup';
import type {
  AffectedArea,
  AspectGroup,
  BodySide,
  DisabilityRegistration,
  DisabilitySeverity,
  DisabilityType,
} from '../types/disability';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  장애 정보 문안 (SYSTEM_SPEC 3-3)
 * ─────────────────────────────────────────────────────────────────────────────
 *  화면 로직은 여기 값을 읽어 렌더링만 한다. 문구 수정은 이 파일만 고치면 된다.
 *
 *  세부 양상 문구는 스펙 표를 그대로 쓰지 않고 다시 썼다. 기준 두 가지:
 *
 *   1. 게임 조작에서 실제로 갈리는 것만 남긴다.
 *      "근력저하" 같은 묶음 표현은 테스트 설계에 쓸 수 없다. 버튼을 오래
 *      누르기 어려운 것과 빠르게 연타하기 어려운 것은 다른 대안이 필요하다.
 *   2. 진단명이 아니라 참여자가 겪는 일로 적는다.
 *      "안구진탕" 대신 "화면의 한 점을 계속 보기 어려움". 참여자는 의료인이
 *      아니고, 진단명을 모르는 사람이 자기 상태를 못 고르면 데이터가 비뚤어진다.
 *      의학 용어는 괄호로 덧붙여 아는 사람이 확인할 수 있게만 둔다.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ── 1단계 — 갈림길: 등록 여부 ──────────────────────────────────────────────── */

/**
 * 법정 유형을 보여주기 **전에** 묻는다.
 *
 * 미등록자에게 법정 유형 16개를 들이밀면 고를 것이 없다. 억지로 비슷한 것을
 * 하나 고르게 하면 "시각장애인 1명"으로 집계되는데 실제로는 색각이상자다 —
 * 데이터가 거짓이 된다. 정도(중증/경증)도 등록자에게만 있는 값이라
 * 갈라놓지 않으면 미등록자가 답할 수 없는 필수 질문에 막힌다.
 */
export const REGISTRATION_OPTIONS: readonly FieldOption<DisabilityRegistration>[] = [
  {
    value: 'registered',
    label: '등록 장애인입니다',
    caption: '장애인 복지카드(장애인등록증)를 발급받으셨습니다',
  },
  {
    value: 'unregistered',
    label: '해당 없음 (등록 장애인이 아닙니다)',
    caption: '등록은 하지 않으셨어도 참여하실 수 있습니다. 다음 질문에서 어떤 영역에 영향이 있는지 알려주세요',
  },
];

/**
 * 미등록자 경로의 영역 선택.
 *
 * 값이 곧 양상 그룹 id 다. 등록자 경로에서 법정 유형이 하던 일(2단계에 어떤
 * 질문을 띄울지 정하는 일)을 여기서는 참여자가 직접 고른다.
 */
export const AFFECTED_AREA_OPTIONS: readonly FieldOption<AffectedArea>[] = [
  {
    value: 'visionAspects',
    label: '보는 것 (시각)',
    caption: '예: 색을 구분하기 어려움(색약·색맹), 작은 글자가 안 보임, 빛 번짐',
  },
  {
    value: 'hearingAspects',
    label: '듣는 것 (청각)',
    caption: '예: 특정 높낮이가 안 들림, 소리 방향을 알기 어려움, 이명',
  },
  {
    value: 'motorAspects',
    label: '조작 (손·팔·다리)',
    caption: '예: 손 떨림, 연타가 어려움, 오래 조작하면 지침',
  },
  {
    value: 'cognitiveAspects',
    label: '인지·감각',
    caption: '예: 감각 과민, 오래 집중하기 어려움, 특정 장면을 견디기 어려움(공포증)',
  },
  {
    value: 'epilepsyAspects',
    label: '빛 자극·발작',
    caption: '예: 점멸하는 화면이나 특정 무늬에 민감함',
  },
  {
    value: 'internalAspects',
    label: '체력·지속 시간',
    caption: '예: 오래 플레이하면 지침, 통증, 자주 쉬어야 함',
  },
  {
    value: 'speechAspects',
    label: '말하기·음성 소통',
    caption: '예: 음성 채팅이 어려움, 음성 인식이 내 발음을 못 알아들음',
  },
  // 대조군. 다른 항목과 동시에 선택되면 모순이므로 배타 처리한다.
  {
    value: 'none',
    label: '해당 없음',
    caption: '게임 플레이에 영향을 주는 상태가 없습니다',
    exclusive: true,
  },
];

/* ── 1단계 — 법정 유형 (등록자 경로) ────────────────────────────────────────── */

/**
 * 기본 노출 7개. (장애인복지법 시행령 별표1)
 *
 * 뇌전증장애는 법적 분류상 "신체적 장애 > 내부기관의 장애"에 속하는 독립된
 * 법정 유형이다. 점멸광 발작 위험이 게임 접근성과 직결되므로 내부기관 장애
 * 중에서는 예외적으로 기본 노출에 넣었다. (스펙 3-3)
 *
 * 지적장애와 자폐성장애는 시행령상 각각 독립된 유형이지만, 시행규칙 별표1의
 * 중분류에서는 둘 다 "정신적 장애 > 발달장애"에 묶인다. 한쪽으로 합치지
 * 않는 이유는 복지카드에 둘 중 하나로 적히기 때문이다 — 합치면 참여자가
 * 자기 카드에 적힌 이름을 화면에서 찾을 수 없다. 대신 캡션으로 관계를 알린다.
 * (2단계 질문은 어차피 같은 cognitiveAspects 그룹 하나로 합쳐진다.)
 *
 * 장애 정도는 여기서 묻지 않는다. 사람당 하나이므로 유형 위에서 따로 받는다.
 */
export const PRIMARY_TYPE_OPTIONS: readonly FieldOption<DisabilityType>[] = [
  { value: 'vision', label: '시각장애' },
  { value: 'hearing', label: '청각장애' },
  { value: 'physical', label: '지체장애' },
  { value: 'brainLesion', label: '뇌병변장애' },
  { value: 'intellectual', label: '지적장애', caption: '발달장애에 속하는 유형입니다' },
  { value: 'autism', label: '자폐성장애', caption: '발달장애에 속하는 유형입니다' },
  { value: 'epilepsy', label: '뇌전증장애' },
];

/**
 * "그 외 유형 보기"로 접어두는 9개. 삭제가 아니라 노출 우선순위 조정이다.
 * 기본 7개와 합쳐 장애인복지법 시행령 별표1의 16개 법정 유형 전부를 담는다.
 */
export const SECONDARY_TYPE_OPTIONS: readonly FieldOption<DisabilityType>[] = [
  { value: 'speech', label: '언어장애' },
  { value: 'facial', label: '안면장애' },
  { value: 'kidney', label: '신장장애' },
  { value: 'heart', label: '심장장애' },
  { value: 'liver', label: '간장애' },
  { value: 'respiratory', label: '호흡기장애' },
  { value: 'ostomy', label: '장루·요루장애' },
  // 2026-05-01 시행으로 신설된 16번째 유형.
  { value: 'pancreas', label: '췌장장애' },
  { value: 'mental', label: '정신장애' },
];

export const ALL_TYPE_OPTIONS = [...PRIMARY_TYPE_OPTIONS, ...SECONDARY_TYPE_OPTIONS];

export const TYPE_LABEL: Record<DisabilityType, string> = Object.fromEntries(
  ALL_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<DisabilityType, string>;

export const SEVERITY_OPTIONS: readonly FieldOption<DisabilitySeverity>[] = [
  { value: 'severe', label: '중증 (장애의 정도가 심한 장애인)' },
  { value: 'mild', label: '경증 (심하지 않은 장애인)' },
];

export const SIDE_OPTIONS: readonly FieldOption<BodySide>[] = [
  { value: 'right', label: '오른쪽' },
  { value: 'left', label: '왼쪽' },
];

/* ── 2단계 — 양상 그룹 ─────────────────────────────────────────────────────── */

export interface AspectOption extends FieldOption<string> {
  /** true 면 선택 시 오른쪽/왼쪽 라디오가 인라인으로 나타난다. */
  needsSide?: boolean;
}

export interface AspectGroupSpec {
  id: AspectGroup;
  title: string;
  hint: string;
  options: readonly AspectOption[];
}

/**
 * 유형 → 양상 그룹 매핑.
 * 여러 유형이 같은 그룹을 가리키면 그 그룹은 한 번만 노출된다.
 */
export const ASPECT_GROUP_BY_TYPE: Record<DisabilityType, AspectGroup> = {
  vision: 'visionAspects',
  hearing: 'hearingAspects',
  physical: 'motorAspects',
  brainLesion: 'motorAspects',
  intellectual: 'cognitiveAspects',
  autism: 'cognitiveAspects',
  mental: 'cognitiveAspects',
  epilepsy: 'epilepsyAspects',
  kidney: 'internalAspects',
  heart: 'internalAspects',
  liver: 'internalAspects',
  respiratory: 'internalAspects',
  ostomy: 'internalAspects',
  pancreas: 'internalAspects',
  speech: 'speechAspects',
  facial: 'speechAspects',
};

const OTHER_OPTION: AspectOption = { value: 'other', label: '기타 (직접 입력)', revealsDetail: true };

const ASPECT_GROUPS: readonly AspectGroupSpec[] = [
  {
    id: 'visionAspects',
    title: '시각 — 게임 화면에서 겪는 어려움',
    hint: '해당되는 것을 모두 선택해 주세요.',
    options: [
      { value: 'blind', label: '화면이 전혀 보이지 않음 (전맹)' },
      { value: 'lowVision', label: '안경·렌즈로 교정해도 흐리게 보임 (저시력)' },
      { value: 'smallText', label: '작은 글자를 읽기 어려움' },
      { value: 'colorVision', label: '색을 구분하기 어려움 (색약·색맹)' },
      { value: 'lowContrast', label: '배경과 사물의 밝기 차이가 작으면 구분하기 어려움' },
      { value: 'glare', label: '밝은 화면이나 흰 배경이 번져 보임 (빛 번짐)' },
      {
        value: 'hemifieldLoss',
        label: '화면 한쪽이 보이지 않음 (한쪽 시야 결손)',
        needsSide: true,
      },
      { value: 'peripheralLoss', label: '화면 가장자리가 보이지 않음 (양쪽 주변 시야 결손)' },
      { value: 'centralLoss', label: '화면 가운데가 보이지 않음 (중심 시야 결손)' },
      { value: 'nystagmus', label: '화면의 한 점을 계속 보기 어려움 (시야 흔들림)' },
      OTHER_OPTION,
    ],
  },
  {
    id: 'hearingAspects',
    title: '청각 — 게임 소리에서 겪는 어려움',
    hint: '해당되는 것을 모두 선택해 주세요.',
    options: [
      { value: 'deaf', label: '소리가 전혀 들리지 않음 (전농)' },
      { value: 'hardOfHearing', label: '작은 소리나 특정 높낮이를 듣기 어려움 (난청)' },
      { value: 'oneSided', label: '한쪽 귀만 들림', needsSide: true },
      { value: 'direction', label: '소리가 나는 방향을 알기 어려움' },
      { value: 'noiseMix', label: '여러 소리가 섞이면 필요한 소리를 골라 듣기 어려움' },
      { value: 'device', label: '보청기·인공와우를 사용함' },
      { value: 'tinnitus', label: '이명이 있어 소리 신호를 구분하기 어려움' },
      OTHER_OPTION,
    ],
  },
  {
    id: 'motorAspects',
    title: '조작 — 컨트롤러·키보드 조작에서 겪는 어려움',
    hint: '해당되는 것을 모두 선택해 주세요.',
    options: [
      { value: 'oneHandUnusable', label: '한쪽 손·팔을 쓰기 어려움', needsSide: true },
      { value: 'bothHandsUnusable', label: '양쪽 손·팔을 모두 쓰기 어려움' },
      { value: 'tremor', label: '손이 떨려서 원하는 곳을 정확히 누르기 어려움' },
      { value: 'fingerStrength', label: '손가락에 힘이 없어 버튼을 오래 누르기 어려움' },
      { value: 'armStrength', label: '팔에 힘이 없어 오래 조작하기 어려움' },
      { value: 'rapidPress', label: '같은 버튼을 빠르게 여러 번 누르기 어려움 (연타)' },
      { value: 'simultaneous', label: '여러 버튼을 동시에 누르기 어려움' },
      { value: 'preciseAim', label: '스틱·마우스로 정밀하게 조준하기 어려움' },
      { value: 'involuntary', label: '의도하지 않은 움직임이 나와 조작이 어긋남 (경직·불수의 운동)' },
      { value: 'legs', label: '다리·발을 쓰기 어려움 (페달·발 컨트롤러)' },
      { value: 'fatigue', label: '조작을 오래 이어가면 손·팔이 빨리 지침' },
      OTHER_OPTION,
    ],
  },
  {
    id: 'cognitiveAspects',
    title: '인지·감각 — 정보 처리에서 겪는 어려움',
    hint: '해당되는 것을 모두 선택해 주세요.',
    options: [
      { value: 'reactionSpeed', label: '화면 변화에 빠르게 반응하기 어려움' },
      { value: 'suddenPrompt', label: '갑자기 나타나는 화면 신호를 놓치기 쉬움' },
      { value: 'timeLimit', label: '제한 시간이 있으면 압박을 크게 느낌' },
      { value: 'complexInstruction', label: '여러 단계로 된 지시를 이해하기 어려움' },
      { value: 'manyElements', label: '화면에 정보가 많으면 무엇을 봐야 할지 찾기 어려움' },
      { value: 'sustainedFocus', label: '오래 집중하기 어려움' },
      { value: 'memory', label: '조작 방법이나 진행 상황을 기억하기 어려움' },
      { value: 'sensoryOverload', label: '소리·빛 자극이 강하면 힘들어짐 (감각 과민)' },
      { value: 'phobia', label: '특정 장면이나 소재가 나오면 견디기 어려움 (공포증)' },
      OTHER_OPTION,
    ],
  },
  {
    id: 'epilepsyAspects',
    title: '뇌전증 — 화면 자극에 대한 반응',
    hint: '해당되는 것을 모두 선택해 주세요. 테스트에서 위험한 자극을 빼는 데 씁니다.',
    options: [
      { value: 'flashing', label: '점멸하거나 빠르게 번쩍이는 화면에 민감함' },
      { value: 'pattern', label: '특정 색이나 무늬 패턴에 민감함' },
      { value: 'longPlay', label: '오래 플레이하면 발작 위험이 있음' },
      { value: 'unknownTrigger', label: '무엇이 유발 요인인지 아직 모름' },
      OTHER_OPTION,
    ],
  },
  {
    id: 'internalAspects',
    title: '체력·지속 시간 — 플레이를 이어가는 데 겪는 어려움',
    hint: '해당되는 것을 모두 선택해 주세요.',
    options: [
      { value: 'shortSession', label: '오래 플레이하기 어려움 (쉽게 지침)' },
      { value: 'needBreaks', label: '중간에 자주 쉬어야 함' },
      { value: 'pain', label: '통증이 있어 오래 조작하기 어려움' },
      { value: 'medication', label: '복용하는 약 때문에 집중이 떨어짐' },
      { value: 'posture', label: '한 자세를 오래 유지하기 어려움' },
      OTHER_OPTION,
    ],
  },
  {
    id: 'speechAspects',
    title: '말하기 — 음성 소통에서 겪는 어려움',
    hint: '해당되는 것을 모두 선택해 주세요.',
    options: [
      { value: 'voiceChat', label: '음성 채팅으로 말하기 어려움' },
      { value: 'speechRecognition', label: '음성 인식이 내 발음을 잘 알아듣지 못함' },
      { value: 'longSpeech', label: '길게 말하면 힘들어짐' },
      OTHER_OPTION,
    ],
  },
];

/**
 * needsSide 는 revealsDetail 을 함의한다.
 *
 * 좌우를 물어야 하는 항목은 선택 시 그 자리에 라디오를 띄워야 하므로
 * OptionGroup 의 노출 조건(revealsDetail)도 켜져 있어야 한다. 두 플래그를
 * 손으로 같이 적으면 새 항목을 추가할 때 반드시 하나를 빼먹는다.
 * (실제로 빼먹어서 좌우 라디오가 나타나지 않았다.)
 */
function withDerivedFlags(group: AspectGroupSpec): AspectGroupSpec {
  return {
    ...group,
    options: group.options.map((option) =>
      option.needsSide && !option.revealsDetail ? { ...option, revealsDetail: true } : option,
    ),
  };
}

const NORMALIZED_ASPECT_GROUPS = ASPECT_GROUPS.map(withDerivedFlags);

export const ASPECT_GROUP_MAP: Record<AspectGroup, AspectGroupSpec> = Object.fromEntries(
  NORMALIZED_ASPECT_GROUPS.map((g) => [g.id, g]),
) as Record<AspectGroup, AspectGroupSpec>;

/** 화면 배치 순서. 선택 순서에 따라 흔들리지 않게 고정된 순서를 쓴다. */
export const ASPECT_GROUP_ORDER: readonly AspectGroup[] = NORMALIZED_ASPECT_GROUPS.map(
  (g) => g.id,
);

/* ── 문안 ──────────────────────────────────────────────────────────────────── */

export const DISABILITY_COPY = {
  intro:
    '이 정보는 맞는 테스트를 배정하고, 조작이 맞지 않는 테스트를 대체하거나 건너뛰는 데 씁니다. 장애인 등록을 하지 않으셨더라도 색각이상이나 공포증처럼 게임 플레이에 영향을 주는 상태가 있으면 그대로 참여하실 수 있습니다. 입력하신 내용은 서버로 전송되지 않고 이 브라우저에만 기록됩니다.',

  step1: {
    heading: '1단계 · 장애 등록 여부와 유형',
    registrationLegend: '장애인 등록 여부',
    registrationHint:
      '어느 쪽을 고르시느냐에 따라 다음 질문이 달라집니다. 등록 장애인이 아니어도 참여 대상입니다.',
    registrationMissing: '장애인 등록 여부를 선택해 주세요.',
    areasLegend: '게임 플레이에 영향을 주는 영역',
    areasHint:
      '해당되는 영역을 모두 선택해 주세요. 선택하신 영역에 대해서만 2단계에서 자세히 여쭤봅니다. 진단을 받지 않으셨어도, 실제로 겪는 어려움을 기준으로 고르시면 됩니다.',
    areasMissing:
      '영향을 주는 영역을 하나 이상 선택해 주세요. 해당되는 것이 없으면 "해당 없음"을 골라주세요.',
    legend: '게임 플레이에 영향이 있다고 생각되는 장애 유형',
    hint: '해당되는 것을 모두 선택해 주세요. 여러 개 선택하실 수 있습니다.',
    secondaryLegend: '그 외 장애 유형',
    secondarySummary: '그 외 유형 보기',
    severityLegend: '장애 정도',
    severityHint:
      '복지카드에 적힌 그대로 골라주세요. 2019년 장애등급제(1~6급) 폐지 이후로는 두 가지 중 하나로만 표기됩니다. 유형을 여러 개 고르셔도 정도는 한 번만 입력하시면 됩니다.',
    typeMissing: '장애 유형을 하나 이상 선택해 주세요.',
    severityMissing: '장애 정도를 선택해 주세요.',
  },

  step2: {
    heading: '2단계 · 게임 플레이 관련 세부 양상',
    intro:
      '1단계에서 선택하신 유형에 대해서만 나타납니다. 진단명을 모르셔도 됩니다 — 실제로 겪는 어려움을 골라주세요.',
    sideLegend: '어느 쪽인가요?',
    otherLabel: '직접 입력',
    aspectMissing: (groupTitle: string) =>
      `${groupTitle}에서 해당되는 항목을 하나 이상 선택해 주세요. 맞는 것이 없으면 "기타 (직접 입력)"을 골라주세요.`,
    otherMissing: (groupTitle: string) => `${groupTitle}의 "기타" 내용을 입력해 주세요.`,
    // 조사를 손으로 붙이지 않는다. 받침 없는 라벨이 추가되면 조용히 틀린다.
    sideMissing: (aspectLabel: string) =>
      `"${aspectLabel}"${withSubjectParticle(aspectLabel).slice(aspectLabel.length)} 어느 쪽인지 선택해 주세요.`,
  },

  step3: {
    heading: '3단계 · 주관식 부연 설명',
    label: '게임 플레이에 어떤 영향이 있는지 자유롭게 적어주세요 (선택)',
    hint: '본인의 장애 양상이 게임 플레이에 전반적으로 어떤 영향을 미치는지 설명해주세요. 특정 상황을 서술하기보다는, 평소 어떤 어려움이 있는지 위주로 적어주시면 좋습니다.',
    optional: '비워두셔도 진행하실 수 있습니다. 적어주시면 수치만으로는 알 수 없는 맥락을 파악하는 데 큰 도움이 됩니다.',
    examplesHeading: '이렇게 적어주시면 좋습니다',
  },

  submitHint: {
    ready: '입력이 모두 끝났습니다. 기기 사양 입력 화면으로 이동합니다.',
    remaining: (n: number) => `아직 입력하지 않은 항목이 ${n}건 있습니다.`,
  },
} as const;

/** 3단계 안내문 아래에 항상 노출되는 예시 문장. (스펙 3-3) */
export const NARRATIVE_EXAMPLES: readonly string[] = [
  '저시력이라 화면 가장자리에 있는 사물은 잘 인지하지 못하는 편입니다.',
  '손 떨림이 있어서 정밀한 조준이 필요한 상황에서 반응이 늦어지는 경우가 많습니다.',
  '소리로 오는 신호(발소리, 경고음)를 알아차리기 어려워서 시각적 신호에 더 의존합니다.',
];
