import type {
  AccessibilityFeature,
  AgeBracket,
  DailyAssistiveDeviceUse,
  EnrollmentPath,
  GamePlayYears,
  GameStyle,
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
 *  선택지는 전부 라디오/체크박스다. 스펙은 게임 경력·성향·주간 플레이 시간을
 *  드롭다운으로 적었지만, 스펙 자신이 분할 ID 입력박스를 거부한 근거
 *  ("스위치·아이트래커 사용자는 칸마다 초점 이동이 늘어나 조작 비용이 커짐")가
 *  드롭다운에도 그대로 적용된다. 열기→탐색→선택 3단계가 필요하고, OS 가 그리는
 *  옵션 목록은 이 프로젝트의 24px 글자 크기를 따르지 않는다. 선택지가 5개 이하라
 *  한 화면에 모두 펼쳐 보이는 라디오가 이 사용자층에 낫다.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { FieldOption } from '../components/ui/OptionGroup';

export const GENDER_OPTIONS: readonly FieldOption<Gender>[] = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'selfDescribed', label: '직접 입력', revealsDetail: true },
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
  { value: 'other', label: '기타', revealsDetail: true },
];

/** ID 의 경로코드와 참여 경로 선택의 대응. 불일치 경고에 쓴다. */
export const PATH_CODE_BY_ENROLLMENT: Record<EnrollmentPath, 'P' | 'A' | 'O'> = {
  panel: 'P',
  ally: 'A',
  other: 'O',
};

export const GAME_PLAY_YEARS_OPTIONS: readonly FieldOption<GamePlayYears>[] = [
  { value: 'under1', label: '1년 미만' },
  { value: 'from1to3', label: '1~3년' },
  { value: 'from3to5', label: '3~5년' },
  { value: 'from5to10', label: '5~10년' },
  { value: 'over10', label: '10년 이상' },
];

/**
 * 플레이 성향.
 *
 * 괄호 설명을 라벨에 욱여넣지 않고 캡션으로 분리한다. 라벨이 길어지면
 * 스크린리더가 선택지 목록을 훑을 때 세 단어를 구분하기 어렵고,
 * "캐주얼"이 무슨 뜻인지는 고르는 순간에 보여야 한다.
 */
export const GAME_STYLE_OPTIONS: readonly FieldOption<GameStyle>[] = [
  { value: 'casual', label: '캐주얼', caption: '가끔, 가볍게 즐기는 편' },
  { value: 'core', label: '코어', caption: '정기적으로 즐기고 공략도 찾아보는 편' },
  {
    value: 'hardcore',
    label: '하드코어',
    caption: '경쟁전·랭킹·대회 등 진지하게 즐기는 편',
  },
];

export const GENRE_OPTIONS: readonly FieldOption<Genre>[] = [
  { value: 'fps', label: 'FPS' },
  { value: 'tps', label: 'TPS' },
  { value: 'rpg', label: 'RPG' },
  { value: 'sports', label: '스포츠' },
  { value: 'rhythm', label: '리듬게임' },
  { value: 'puzzle', label: '퍼즐' },
  { value: 'strategy', label: '전략/시뮬레이션' },
  { value: 'other', label: '기타', revealsDetail: true },
];

export const WEEKLY_PLAYTIME_OPTIONS: readonly FieldOption<WeeklyPlaytime>[] = [
  { value: 'under5', label: '5시간 미만' },
  { value: 'from5to10', label: '5~10시간' },
  { value: 'from10to20', label: '10~20시간' },
  { value: 'over20', label: '20시간 이상' },
];

export const DAILY_ASSISTIVE_OPTIONS: readonly FieldOption<DailyAssistiveDeviceUse>[] = [
  { value: 'yes', label: '예', revealsDetail: true },
  { value: 'no', label: '아니요' },
];

/**
 * 게임 내 접근성 기능.
 *
 * 이름이 바로 와닿지 않는 항목에는 캡션을 붙인다. "민감도"나 "카메라 고정"은
 * 그 기능을 써 본 사람에게만 통하는 말이라, 설명이 없으면 쓰고 있으면서도
 * 고르지 않는 사람이 생긴다.
 */
export const ACCESSIBILITY_FEATURE_OPTIONS: readonly FieldOption<AccessibilityFeature>[] = [
  { value: 'subtitles', label: '자막' },
  { value: 'colorFilter', label: '색상 필터', caption: '색각이상용 색상 보정' },
  { value: 'highContrast', label: '고대비 모드', caption: '화면 요소의 명암 차이를 키움' },
  { value: 'monoAudio', label: '모노 오디오', caption: '좌우 소리를 하나로 합쳐 양쪽에 같이 출력' },
  { value: 'buttonRemap', label: '버튼 리매핑', caption: '조작 키·버튼 배치를 바꿈' },
  { value: 'sensitivity', label: '민감도 조절', caption: '조준·시점 이동 속도 조절' },
  { value: 'cameraLock', label: '카메라 고정', caption: '화면 흔들림·자동 시점 이동 줄이기' },
  { value: 'difficulty', label: '난이도 조절' },
  { value: 'other', label: '기타', revealsDetail: true },
  // 다른 항목과 동시에 선택되면 데이터가 모순이므로 배타 처리한다.
  { value: 'none', label: '사용 안 함', exclusive: true },
];

/** 각 항목의 라벨·힌트 문안. */
export const BASIC_INFO_COPY = {
  intro:
    '측정 결과를 해석하는 데 필요한 정보입니다. 입력하신 내용은 서버로 전송되지 않고 이 브라우저에만 기록됩니다.',

  participantId: {
    label: '고유 ID',
    hint: '관리자에게 발급받은 ID를 그대로 입력해 주세요.',
    invalid: '형식이 올바르지 않습니다. 예: GA11Y-P26-014',
    valid: '형식이 올바릅니다.',
    missing: '고유 ID를 입력해 주세요.',
  },

  gender: {
    legend: '성별',
    /*
     * 자유 입력란의 라벨은 화면에서 감추고 스크린리더에만 남긴다.
     * 바로 위 선택지가 이미 "직접 입력"이라 눈으로는 중복이지만,
     * 라벨을 아예 없애면 입력란에 접근성 이름이 사라진다.
     */
    selfDescribedLabel: '성별 직접 입력',
    missing: '성별을 선택해 주세요.',
  },

  ageBracket: {
    legend: '연령대',
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

  gamePlayYears: {
    legend: '게임을 즐겨온 기간',
    missing: '게임을 즐겨온 기간을 선택해 주세요.',
  },

  gameStyle: {
    legend: '게임 플레이 성향',
    missing: '게임 플레이 성향을 선택해 주세요.',
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

  /*
   * 여기는 "평소(일상·컴퓨터) 보조기기"다. 게임 조작에 쓰는 보조기기는
   * 3-4 기기 사양의 "입력장치"와 "그 외 기기"에서 받는다. 두 질문을 구분하지
   * 않으면, NVDA 처럼 일상에도 게임에도 쓰는 기기를 어디에 답해야 할지
   * 참여자가 알 수 없다.
   */
  dailyAssistiveDevice: {
    legend: '평소 쓰는 보조기기',
    hint: '게임이 아니라 일상생활이나 컴퓨터를 쓸 때 늘 사용하시는 보조기기가 있는지 알려주세요. 게임할 때 쓰는 기기는 다음 단계(기기 사양)에서 따로 물어봅니다.',
    namesLabel: '평소 쓰는 보조기기 명칭 또는 모델명',
    namesHint:
      '예: 스크린리더(NVDA·센스리더), 화면 확대 프로그램, 보청기·인공와우, 휠체어, 의사소통 보조기기',
    missing: '평소 보조기기 사용 여부를 선택해 주세요.',
  },

  accessibilityFeatures: {
    legend: '평소 게임 내 접근성 기능 사용 여부',
    hint: '여러 개 선택하실 수 있습니다. "사용 안 함"을 고르면 다른 항목은 해제됩니다.',
    otherLabel: '그 외 사용하시는 접근성 기능',
    missing: '접근성 기능 사용 여부를 선택해 주세요. 쓰지 않으시면 "사용 안 함"을 골라주세요.',
    otherMissing: '그 외 사용하시는 접근성 기능을 입력해 주세요.',
  },
} as const;
