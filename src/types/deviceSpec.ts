/**
 * 기기 사양 (SYSTEM_SPEC 3-4).
 *
 * 값은 코드(영문 키)로 저장하고 화면 라벨은 data/deviceSpecFields.ts 에 둔다.
 */

export type OperatingSystem = 'win10' | 'win11' | 'macos' | 'linux' | 'other' | 'unknown';

export type ScreenSize =
  | 'laptopBuiltIn'
  | 'under21'
  | 'from21to24'
  | 'from25to27'
  | 'from28to32'
  | 'over32'
  | 'unknown';

export type Resolution = 'fhd' | 'qhd' | 'uhd4k' | 'other' | 'unknown';

export type RefreshRate = 'hz60' | 'hz90' | 'hz120' | 'hz144' | 'hz240' | 'unknown';

export type InputDevice =
  | 'mouse'
  | 'keyboard'
  | 'gamepad'
  | 'adaptiveController'
  | 'trackball'
  | 'switchInterface'
  | 'eyeTracker'
  | 'headMouse'
  | 'touch'
  | 'other';

export type ViewingDistance = 'under50' | 'from50to100' | 'over100';

export type AudioOutput = 'builtInSpeaker' | 'externalSpeaker' | 'wiredHeadset' | 'wirelessHeadset' | 'noSound';

/**
 * 게임할 때 쓰는 보조기기.
 *
 * 3-2 의 "평소(일상·컴퓨터) 보조기기"와 구분된다. NVDA 처럼 일상에도 게임에도
 * 쓰는 경우가 있으므로 `sameAsDaily` 를 둬서 참여자가 헷갈리지 않게 한다.
 */
export type GameAssistiveUse = 'gameSpecific' | 'sameAsDaily' | 'none';

/** 부가 기기 — 모델명만 받는다. 모델명에 기기 종류가 이미 담긴다. */
export interface ExtraDevice {
  /** 반복 폼 항목 식별자. DOM id 와 React key 에 쓴다. */
  id: string;
  modelName: string;
}

export interface DeviceSpec {
  /* ── 주 기기 (테스트를 진행하는 환경) ─────────────────────────────────── */
  operatingSystem: OperatingSystem | null;
  operatingSystemOther: string;

  screenSize: ScreenSize | null;

  resolution: Resolution | null;
  resolutionOther: string;

  refreshRate: RefreshRate | null;

  inputDevices: InputDevice[];
  inputDeviceOther: string;

  viewingDistance: ViewingDistance | null;

  audioOutput: AudioOutput | null;

  /* ── 게임용 보조기기 ──────────────────────────────────────────────────── */
  gameAssistiveUse: GameAssistiveUse | null;
  /** gameAssistiveUse === 'gameSpecific' 일 때 필수. */
  gameAssistiveNames: string;

  /* ── 부가 기기 (선택, 여러 대) ────────────────────────────────────────── */
  extraDevices: ExtraDevice[];
}

export const EMPTY_DEVICE_SPEC: DeviceSpec = {
  operatingSystem: null,
  operatingSystemOther: '',
  screenSize: null,
  resolution: null,
  resolutionOther: '',
  refreshRate: null,
  inputDevices: [],
  inputDeviceOther: '',
  viewingDistance: null,
  audioOutput: null,
  gameAssistiveUse: null,
  gameAssistiveNames: '',
  extraDevices: [],
};
