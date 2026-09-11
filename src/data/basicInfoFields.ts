import type {
  AccessibilityFeature,
  AgeBracket,
  AssistiveDeviceUse,
  EnrollmentPath,
  GameSkill,
  Gender,
  Genre,
  WeeklyPlaytime,
} from '../types/basicInfo';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  기본정보 페이지 문안 (SYSTEM_SPEC 3-2)
 * ─────────────────────────────────────────────────────────────────────────────
 *  화면 로직은 여기 값을 읽어 렌더링만 한다. 문구 수정은 이 파일만 고치면 된다.
 *
 *  선택지는 전부 라디오/체크박스다. 스펙은 게임 경력과 주간 플레이 시간을
 *  드롭다운으로 적었지만, 스펙 자신이 분할 ID 입력박스를 거부한 근거
 *  ("스위치·아이트래커 사용자는 칸마다 초점 이동이 늘어나 조작 비용이 커짐")가
 *  드롭다운에도 그대로 적용된다. 열기→탐색→선택 3단계가 필요하고, OS 가 그리는
 *  옵션 목록은 이 프로젝트의 24px 글자 크기를 따르지 않는다. 선택지가 4개뿐이라
 *  한 화면에 모두 펼쳐 보이는 라디오가 이 사용자층에 낫다.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface FieldOption<T extends string> {
  value: T;
  label: string;
  /** 선택 시 자유 입력란을 노출할지 */
  revealsInput?: boolean;
  /** 다중선택에서 다른 값과 함께 고를 수 없는 항목 */
  exclusive?: boolean;
}

export const GENDER_OPTIONS: readonly FieldOption<Gender>[] = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'selfDescribed', label: '직접 입력', revealsInput: true },
  { value: 'undisclosed', label: '밝히고 싶지 않음' },
];

export const AGE_BRACKET_OPTIONS: readonly FieldOption<AgeBracket>[] = [
  { value: 'age14to19', label: '14~19세' },
  { value: 'age20s', label: '20대' },
  { value: 'age30s', label: '30대' },
  { value: 'age40s', label: '40대' },
  { value: 'age50s', label: '50대' },
  { value: 'age60plus', label: '60대 이상' },
];

export const ENROLLMENT_PATH_OPTIONS: readonly FieldOption<EnrollmentPath>[] = [
  { value: 'panel', label: '접근성 패널 프로그램' },
  { value: 'ally', label: '스마일 플레이 앨라이 프로그램' },
  { value: 'other', label: '기타', revealsInput: true },
];

/** ID 의 경로코드와 참여 경로 선택의 대응. 불일치 경고에 쓴다. */
export const PATH_CODE_BY_ENROLLMENT: Record<EnrollmentPath, 'P' | 'A' | 'O'> = {
  panel: 'P',
  ally: 'A',
  other: 'O',
};

export const GAME_SKILL_OPTIONS: readonly FieldOption<GameSkill>[] = [
  { value: 'entry', label: '입문' },
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '상급' },
];

export const GENRE_OPTIONS: readonly FieldOption<Genre>[] = [
  { value: 'fps', label: 'FPS' },
  { value: 'tps', label: 'TPS' },
  { value: 'rpg', label: 'RPG' },
  { value: 'sports', label: '스포츠' },
  { value: 'rhythm', label: '리듬게임' },
  { value: 'puzzle', label: '퍼즐' },
  { value: 'strategy', label: '전략/시뮬레이션' },
  { value: 'other', label: '기타', revealsInput: true },
];

export const WEEKLY_PLAYTIME_OPTIONS: readonly FieldOption<WeeklyPlaytime>[] = [
  { value: 'under5', label: '5시간 미만' },
  { value: 'from5to10', label: '5~10시간' },
  { value: 'from10to20', label: '10~20시간' },
  { value: 'over20', label: '20시간 이상' },
];

export const ASSISTIVE_DEVICE_OPTIONS: readonly FieldOption<AssistiveDeviceUse>[] = [
  { value: 'yes', label: '예', revealsInput: true },
  { value: 'no', label: '아니요' },
];

export const ACCESSIBILITY_FEATURE_OPTIONS: readonly FieldOption<AccessibilityFeature>[] = [
  { value: 'subtitles', label: '자막' },
  { value: 'colorblind', label: '색맹모드' },
  { value: 'buttonRemap', label: '버튼 리매핑' },
  { value: 'difficulty', label: '난이도 조절' },
  // 다른 항목과 동시에 선택되면 데이터가 모순이므로 배타 처리한다.
  { value: 'none', label: '사용 안 함', exclusive: true },
];

/** 각 항목의 라벨·힌트 문안. */
export const BASIC_INFO_COPY = {
  intro:
    '측정 결과를 해석하는 데 필요한 정보입니다. 입력하신 내용은 서버로 전송되지 않고 이 브라우저에만 기록됩니다.',

  participantId: {
    label: '고유 ID',
    hint: '관리자에게 발급받은 ID를 그대로 입력해 주세요. 예: GA11Y-P26-014 (소문자로 입력해도 대문자로 바뀝니다)',
    invalid: '형식이 올바르지 않습니다. 예: GA11Y-P26-014',
    valid: '형식이 올바릅니다.',
    missing: '고유 ID를 입력해 주세요.',
  },

  gender: {
    legend: '성별',
    hint: '이분법에 포함되지 않는 정체성은 직접 입력하실 수 있습니다. 원치 않으시면 밝히지 않으셔도 됩니다.',
    selfDescribedLabel: '직접 입력 (비워두셔도 됩니다)',
    missing: '성별을 선택해 주세요.',
  },

  ageBracket: {
    legend: '연령대',
    hint: '구간으로만 받습니다. 장애 유형·기기 조합과 겹쳐 개인이 역추적되는 위험을 낮추기 위한 것입니다.',
    missing: '연령대를 선택해 주세요.',
  },

  enrollmentPath: {
    legend: '참여 경로',
    otherLabel: '참여 경로 직접 입력',
    missing: '참여 경로를 선택해 주세요.',
    otherMissing: '참여 경로를 직접 입력해 주세요.',
    mismatch:
      '고유 ID의 경로 코드와 선택한 참여 경로가 다릅니다. 발급받은 ID가 맞다면 그대로 진행하셔도 됩니다.',
  },

  gameSkill: {
    legend: '게임 경력·숙련도',
    hint: '스스로 평가하시면 됩니다. 정답이 없습니다.',
    missing: '게임 경력·숙련도를 선택해 주세요.',
  },

  genres: {
    legend: '선호 게임 장르',
    hint: '여러 개 선택하실 수 있습니다.',
    otherLabel: '선호 장르 직접 입력',
    missing: '선호 게임 장르를 하나 이상 선택해 주세요.',
    otherMissing: '선호 장르를 직접 입력해 주세요.',
  },

  weeklyPlaytime: {
    legend: '주간 평균 게임 플레이 시간',
    missing: '주간 평균 게임 플레이 시간을 선택해 주세요.',
  },

  assistiveDevice: {
    legend: '보조기기 사용 여부',
    hint: '게임을 할 때 보조기기를 쓰시는지 알려주세요.',
    namesLabel: '보조기기 명칭 또는 모델명 (모르면 비워두셔도 됩니다)',
    namesHint: '예: Xbox 적응형 컨트롤러, Tobii 아이트래커',
    missing: '보조기기 사용 여부를 선택해 주세요.',
  },

  accessibilityFeatures: {
    legend: '평소 게임 내 접근성 기능 사용 여부',
    hint: '여러 개 선택하실 수 있습니다. "사용 안 함"을 고르면 다른 항목은 해제됩니다.',
    missing: '접근성 기능 사용 여부를 선택해 주세요. 쓰지 않으시면 "사용 안 함"을 골라주세요.',
  },
} as const;
