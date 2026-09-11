import type { FieldOption } from '../components/ui/OptionGroup';
import type {
  AudioOutput,
  GameAssistiveUse,
  InputDevice,
  OperatingSystem,
  RefreshRate,
  Resolution,
  ScreenSize,
  ViewingDistance,
} from '../types/deviceSpec';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  기기 사양 문안 (SYSTEM_SPEC 3-4)
 * ─────────────────────────────────────────────────────────────────────────────
 *  확인 방법 안내는 **항상 보이는 캡션**으로 넣는다. 호버 툴팁은 마우스가
 *  없으면 열 수 없고, 스크린리더에서 읽히는 시점이 일정하지 않다.
 *  각 그룹의 hint 로 넘겨 화면에 그대로 노출된다.
 *
 *  "모르겠음"을 넣은 이유: 해상도·주사율은 모르는 사람이 많다. 추측을 강요하면
 *  틀린 값이 들어와 측정 해석을 망친다. 모른다는 사실 자체가 유효한 데이터다.
 *  스펙의 모니터 크기 캡션도 "정확히 모르면 대략적인 크기를"이라고 열어두고 있다.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const OS_OPTIONS: readonly FieldOption<OperatingSystem>[] = [
  { value: 'win10', label: 'Windows 10' },
  { value: 'win11', label: 'Windows 11' },
  { value: 'macos', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
  { value: 'other', label: '기타', revealsDetail: true },
  { value: 'unknown', label: '모르겠음' },
];

/**
 * 노트북 내장 화면을 첫 선택지로 둔다.
 * 외장 모니터 인치 구간만 나열하면 노트북 사용자가 고를 항목이 없다.
 */
export const SCREEN_SIZE_OPTIONS: readonly FieldOption<ScreenSize>[] = [
  { value: 'laptopBuiltIn', label: '노트북 내장 화면' },
  { value: 'under21', label: '21인치 미만' },
  { value: 'from21to24', label: '21~24인치' },
  { value: 'from25to27', label: '25~27인치' },
  { value: 'from28to32', label: '28~32인치' },
  { value: 'over32', label: '32인치 초과' },
  { value: 'unknown', label: '모르겠음' },
];

export const RESOLUTION_OPTIONS: readonly FieldOption<Resolution>[] = [
  { value: 'fhd', label: '1920 × 1080 (FHD)' },
  { value: 'qhd', label: '2560 × 1440 (QHD)' },
  { value: 'uhd4k', label: '3840 × 2160 (4K)' },
  { value: 'other', label: '기타 (직접 입력)', revealsDetail: true },
  { value: 'unknown', label: '모르겠음' },
];

export const REFRESH_RATE_OPTIONS: readonly FieldOption<RefreshRate>[] = [
  { value: 'hz60', label: '60Hz' },
  { value: 'hz90', label: '90Hz' },
  { value: 'hz120', label: '120Hz' },
  { value: 'hz144', label: '144Hz' },
  { value: 'hz240', label: '240Hz' },
  { value: 'unknown', label: '모르겠음' },
];

export const INPUT_DEVICE_OPTIONS: readonly FieldOption<InputDevice>[] = [
  { value: 'mouse', label: '마우스' },
  { value: 'keyboard', label: '키보드' },
  { value: 'gamepad', label: '게임패드 (일반 컨트롤러)' },
  { value: 'adaptiveController', label: '적응형 컨트롤러' },
  { value: 'trackball', label: '트랙볼' },
  { value: 'switchInterface', label: '스위치' },
  { value: 'eyeTracker', label: '아이트래커' },
  { value: 'headMouse', label: '헤드 마우스' },
  { value: 'touch', label: '화면 터치' },
  { value: 'other', label: '기타 (직접 입력)', revealsDetail: true },
];

export const VIEWING_DISTANCE_OPTIONS: readonly FieldOption<ViewingDistance>[] = [
  { value: 'under50', label: '50cm 미만' },
  { value: 'from50to100', label: '50~100cm' },
  { value: 'over100', label: '100cm 초과' },
];

/**
 * "소리를 쓰지 않음"을 넣는다.
 * 스펙의 3택(스피커/유선/무선)만 두면 청각장애 참여자가 거짓 응답을 하게 된다.
 */
export const AUDIO_OUTPUT_OPTIONS: readonly FieldOption<AudioOutput>[] = [
  { value: 'builtInSpeaker', label: '기기 내장 스피커' },
  { value: 'externalSpeaker', label: '외부 스피커' },
  { value: 'wiredHeadset', label: '유선 이어폰·헤드셋' },
  { value: 'wirelessHeadset', label: '무선 이어폰·헤드셋' },
  { value: 'noSound', label: '소리를 쓰지 않음' },
];

/**
 * 게임용 보조기기.
 *
 * `sameAsDaily` 가 핵심이다. NVDA 처럼 일상에도 게임에도 쓰는 기기가 있는데,
 * 이 선택지가 없으면 참여자가 3-2 와 여기 중 어디에 답해야 할지 헷갈린다.
 * 3-2 에서 "평소 보조기기 없음"을 고른 경우에는 화면에서 이 선택지를 숨긴다.
 */
export const GAME_ASSISTIVE_OPTIONS: readonly FieldOption<GameAssistiveUse>[] = [
  { value: 'gameSpecific', label: '게임할 때 쓰는 보조기기가 따로 있습니다', revealsDetail: true },
  { value: 'sameAsDaily', label: '평소 쓰는 보조기기를 게임할 때도 그대로 씁니다' },
  { value: 'none', label: '게임할 때는 보조기기를 쓰지 않습니다' },
];

export const DEVICE_SPEC_COPY = {
  intro:
    '측정 결과를 해석하는 데 필요한 정보입니다. 같은 반응 시간이라도 무선 헤드셋은 지연이 있고, 같은 글자 크기라도 화면과의 거리가 다르면 다르게 읽힙니다.',

  primaryHeading: '테스트를 진행하는 기기',
  primaryIntro:
    '지금 이 화면을 보고 계신 기기의 사양을 알려주세요. 측정값 해석의 기준이 되는 기기입니다.',

  os: {
    legend: '운영체제',
    otherLabel: '운영체제 직접 입력',
    missing: '운영체제를 선택해 주세요.',
    otherMissing: '운영체제를 직접 입력해 주세요.',
  },

  screenSize: {
    legend: '화면 크기',
    // 스펙 3-4 표의 확인 방법 안내를 그대로 상시 노출한다.
    hint: '모니터 뒷면 스티커나 구매 영수증에서 확인 가능합니다. 정확히 모르면 대략적인 크기를 선택해주세요.',
    missing: '화면 크기를 선택해 주세요.',
  },

  resolution: {
    legend: '해상도',
    hint: '확인 방법: 바탕화면에서 마우스 우클릭 → 디스플레이 설정 → "디스플레이 해상도" 항목에서 확인 (예: 1920x1080). macOS 는 시스템 설정 → 디스플레이에서 확인합니다.',
    otherLabel: '해상도 직접 입력',
    otherHint: '예: 3440 x 1440',
    missing: '해상도를 선택해 주세요.',
    otherMissing: '해상도를 직접 입력해 주세요.',
  },

  refreshRate: {
    legend: '주사율',
    hint: '확인 방법: 디스플레이 설정 → 고급 디스플레이 설정 → "화면 주사율" 항목에서 확인. 단위는 Hz(헤르츠)입니다. 대부분의 일반 모니터는 60Hz 입니다.',
    missing: '주사율을 선택해 주세요.',
  },

  inputDevices: {
    legend: '주 입력장치',
    hint: '게임할 때 쓰시는 것을 모두 선택해 주세요.',
    otherLabel: '입력장치 직접 입력',
    missing: '주 입력장치를 하나 이상 선택해 주세요.',
    otherMissing: '입력장치를 직접 입력해 주세요.',
  },

  viewingDistance: {
    legend: '화면과의 평균 시청 거리',
    hint: '자로 재지 않으셔도 됩니다. 팔을 하나 뻗은 정도(약 50~70cm)를 기준으로 가늠해주세요.',
    // 시각 테스트(글자크기·대비인식)의 유효성이 이 값에 직접 걸려 있다. (스펙 3-4)
    missing: '화면과의 시청 거리를 선택해 주세요. 시각 테스트 해석에 꼭 필요한 값입니다.',
  },

  audioOutput: {
    legend: '오디오 출력 방식',
    hint: '무선 기기는 소리가 조금 늦게 나오기 때문에, 반응속도 측정값을 해석할 때 이 값을 함께 봅니다.',
    missing: '오디오 출력 방식을 선택해 주세요.',
  },

  gameAssistive: {
    heading: '게임할 때 쓰는 보조기기',
    legend: '게임용 보조기기 사용 여부',
    hint: '게임을 할 때 실제로 쓰시는 보조기기를 알려주세요. 여기서 알려주시는 기기에 맞춰 테스트 조작 방식을 정하고, 맞지 않는 테스트는 대체하거나 건너뜁니다.',
    namesLabel: '게임용 보조기기 명칭 또는 모델명',
    namesHint:
      '예: Xbox 적응형 컨트롤러, 한손 컨트롤러, 스위치 인터페이스, 아이트래커, 헤드 마우스, 발 페달, 커스텀 키패드',
    dailyCarriedLabel: '평소 쓰시는 보조기기 (기본정보에서 입력하신 내용)',
    dailyCarriedEmpty: '기본정보에 입력하신 내용이 없습니다.',
    missing: '게임용 보조기기 사용 여부를 선택해 주세요.',
    namesMissing: '게임용 보조기기의 명칭 또는 모델명을 입력해 주세요.',
  },

  extraDevices: {
    heading: '그 외 게임에 쓰는 기기',
    intro:
      '위 기기 말고도 게임에 쓰시는 기기가 있으면 모델명을 적어주세요. 없으면 비워두셔도 됩니다.',
    label: (index: number) => `부가 기기 ${index}`,
    hint: '예: PlayStation 5, Nintendo Switch OLED, iPad Air, Xbox Series X',
    addButton: '기기 추가',
    removeButton: (index: number) => `부가 기기 ${index} 삭제`,
    added: (index: number) => `부가 기기 ${index} 입력란이 추가되었습니다.`,
    removed: (index: number) => `부가 기기 ${index}을 삭제했습니다.`,
    emptyMissing: (index: number) => `부가 기기 ${index}의 모델명을 입력하거나 삭제해 주세요.`,
  },

  submitHint: {
    ready: '입력이 모두 끝났습니다. 역량 테스트로 이동합니다.',
    remaining: (n: number) => `아직 입력하지 않은 항목이 ${n}건 있습니다.`,
  },
} as const;
