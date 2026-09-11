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

export type GameSkill = 'entry' | 'beginner' | 'intermediate' | 'advanced';

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

export type AssistiveDeviceUse = 'yes' | 'no';

/** 'none'(사용 안 함)은 다른 값과 함께 선택될 수 없다. */
export type AccessibilityFeature =
  | 'subtitles'
  | 'colorblind'
  | 'buttonRemap'
  | 'difficulty'
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

  gameSkill: GameSkill | null;

  genres: Genre[];
  /** genres 에 'other' 가 포함될 때 필수. */
  genreOther: string;

  weeklyPlaytime: WeeklyPlaytime | null;

  assistiveDeviceUse: AssistiveDeviceUse | null;
  /**
   * assistiveDeviceUse === 'yes' 일 때만 의미가 있다. 비워둘 수 있다.
   * 기기 사양 페이지(3-4)는 이 값을 이어받아 반복 질문하지 않는다.
   */
  assistiveDeviceNames: string;

  accessibilityFeatures: AccessibilityFeature[];
}

export const EMPTY_BASIC_INFO: BasicInfo = {
  participantId: '',
  gender: null,
  genderSelfDescribed: '',
  ageBracket: null,
  enrollmentPath: null,
  enrollmentPathOther: '',
  gameSkill: null,
  genres: [],
  genreOther: '',
  weeklyPlaytime: null,
  assistiveDeviceUse: null,
  assistiveDeviceNames: '',
  accessibilityFeatures: [],
};
