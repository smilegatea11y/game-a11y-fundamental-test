/**
 * 기본정보 페이지 입력값 (SYSTEM_SPEC 3-2).
 *
 * 값은 코드(영문 키)로 저장하고 화면 라벨은 data/basicInfoFields.ts 에 둔다.
 * 라벨 문구가 바뀌어도 이미 제출된 데이터의 의미가 흔들리지 않아야 한다.
 */

export type Gender = 'male' | 'female' | 'selfDescribed' | 'undisclosed';

export type AgeBracket = 'age14to19' | 'age20s' | 'age30s' | 'age40s' | 'age50s' | 'age60plus';

/** ID 의 경로코드 P/A/O 와 대응한다. (SYSTEM_SPEC 3-1) */
export type EnrollmentPath = 'panel' | 'ally' | 'other';

/** 게임을 즐겨온 기간. 숙련도와 분리한다 — 오래 했다고 잘하는 것이 아니다. */
export type GamePlayYears = 'under1' | 'from1to3' | 'from3to5' | 'from5to10' | 'over10';

/** 플레이 성향 (자기분류). 각 선택지의 뜻은 캡션으로 항상 보여준다. */
export type GameStyle = 'casual' | 'core' | 'hardcore';

export type Genre =
  | 'fps'
  | 'tps'
  | 'rpg'
  | 'sports'
  | 'rhythm'
  | 'puzzle'
  | 'strategy'
  | 'other';

export type WeeklyPlaytime = 'under5' | 'from5to10' | 'from10to20' | 'over20';

export type DailyAssistiveDeviceUse = 'yes' | 'no';

/**
 * 'none'(사용 안 함)은 다른 값과 함께 선택될 수 없다.
 *
 * 'colorFilter' 는 예전에 'colorblind'(색맹모드)였다. 색각이상을 '색맹'으로
 * 뭉뚱그리는 것은 틀린 표현이고, 게임에서 실제로 제공하는 기능의 이름도
 * '색상 필터'다.
 */
export type AccessibilityFeature =
  | 'subtitles'
  | 'colorFilter'
  | 'highContrast'
  | 'monoAudio'
  | 'buttonRemap'
  | 'sensitivity'
  | 'cameraLock'
  | 'difficulty'
  | 'other'
  | 'none';

export interface BasicInfo {
  /** 정규화(대문자)된 값으로 저장한다. */
  participantId: string;

  gender: Gender | null;
  /** gender === 'selfDescribed' 일 때만 의미가 있다. 비워둘 수 있다. */
  genderSelfDescribed: string;

  ageBracket: AgeBracket | null;

  enrollmentPath: EnrollmentPath | null;
  /** enrollmentPath === 'other' 일 때 필수. */
  enrollmentPathOther: string;

  gamePlayYears: GamePlayYears | null;
  gameStyle: GameStyle | null;

  genres: Genre[];
  /** genres 에 'other' 가 포함될 때 필수. */
  genreOther: string;

  weeklyPlaytime: WeeklyPlaytime | null;

  dailyAssistiveDeviceUse: DailyAssistiveDeviceUse | null;
  /**
   * dailyAssistiveDeviceUse === 'yes' 일 때만 의미가 있다. 비워둘 수 있다.
   * 기기 사양 페이지(3-4)는 이 값을 이어받아 반복 질문하지 않는다.
   */
  dailyAssistiveDeviceNames: string;

  accessibilityFeatures: AccessibilityFeature[];
  /** accessibilityFeatures 에 'other' 가 포함될 때 필수. */
  accessibilityFeatureOther: string;
}

export const EMPTY_BASIC_INFO: BasicInfo = {
  participantId: '',
  gender: null,
  genderSelfDescribed: '',
  ageBracket: null,
  enrollmentPath: null,
  enrollmentPathOther: '',
  gamePlayYears: null,
  gameStyle: null,
  genres: [],
  genreOther: '',
  weeklyPlaytime: null,
  dailyAssistiveDeviceUse: null,
  dailyAssistiveDeviceNames: '',
  accessibilityFeatures: [],
  accessibilityFeatureOther: '',
};
