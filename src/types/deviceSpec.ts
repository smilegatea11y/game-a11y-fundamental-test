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

/**
 * 화면과의 거리.
 *
 * 구간을 "팔 하나 뻗은 거리(약 50~70cm)"에 맞춰 끊는다. 자로 재라고 할 것이
 * 아니라면 기준점이 구간 한가운데를 가로지르면 안 된다 — 같은 자세로 앉은
 * 두 사람이 서로 다른 칸을 고르게 된다.
 */
export type ViewingDistance = 'under50' | 'from50to70' | 'over70';

export type AudioOutput = 'builtInSpeaker' | 'externalSpeaker' | 'wiredHeadset' | 'wirelessHeadset' | 'noSound';

/**
 * 그 외 기기·보조기기 — 모델명만 받는다. 모델명에 기기 종류가 이미 담긴다.
 *
 * 게임용 보조기기를 따로 묻던 질문을 여기로 합쳤다. 조작에 쓰는 보조기기는
 * 대부분 입력장치 목록(적응형 컨트롤러·스위치·아이트래커·헤드 마우스)에
 * 이미 있어서, 같은 기기를 두 곳에 적게 만드는 질문이었다.
 */
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
  /** 모니터·노트북 모델명 (선택). 인치를 모를 때 이것으로 확인할 수 있다. */
  screenModelName: string;

  resolution: Resolution | null;
  resolutionOther: string;

  refreshRate: RefreshRate | null;

  inputDevices: InputDevice[];
  inputDeviceOther: string;

  viewingDistance: ViewingDistance | null;

  audioOutput: AudioOutput | null;

  /* ── 그 외 기기·보조기기 (선택, 여러 대) ──────────────────────────────── */
  extraDevices: ExtraDevice[];
}

export const EMPTY_DEVICE_SPEC: DeviceSpec = {
  operatingSystem: null,
  operatingSystemOther: '',
  screenSize: null,
  screenModelName: '',
  resolution: null,
  resolutionOther: '',
  refreshRate: null,
  inputDevices: [],
  inputDeviceOther: '',
  viewingDistance: null,
  audioOutput: null,
  extraDevices: [],
};
