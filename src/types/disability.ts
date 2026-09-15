/**
 * 장애 정보 입력 (SYSTEM_SPEC 3-3).
 *
 * 값은 코드(영문 키)로 저장하고 화면 라벨은 data/disabilityFields.ts 에 둔다.
 * 라벨 문구가 바뀌어도 이미 제출된 데이터의 의미가 흔들리지 않아야 한다.
 */

/** 장애인복지법 시행령 기준 15개 유형. */
export type DisabilityType =
  // 기본 노출 (게임 접근성과 직접 연관성이 높은 7개)
  | 'vision'
  | 'hearing'
  | 'physical'
  | 'brainLesion'
  | 'intellectual'
  | 'autism'
  | 'epilepsy'
  // "그 외 유형 보기"로 접어두는 8개
  | 'speech'
  | 'facial'
  | 'kidney'
  | 'heart'
  | 'liver'
  | 'respiratory'
  | 'ostomy'
  | 'mental'
  // 2026-05-01 시행. 23년 만에 추가된 16번째 법정 유형이다.
  | 'pancreas';

/**
 * 장애 정도.
 *
 * 2019년 장애등급제(1~6급) 폐지 이후 장애인복지법 시행규칙상 2단계로 구분되고,
 * 복지카드에도 이 명칭으로 표기된다.
 */
export type DisabilitySeverity = 'severe' | 'mild';

/**
 * 세부 양상 그룹.
 *
 * 유형별이 아니라 그룹별로 묶는다. 지체장애와 뇌병변장애는 게임 조작에서
 * 물어볼 것이 같으므로, 둘을 모두 선택한 사람에게 같은 질문을 두 번 하지 않는다.
 */
export type AspectGroup =
  | 'visionAspects'
  | 'hearingAspects'
  | 'motorAspects'
  | 'cognitiveAspects'
  | 'epilepsyAspects'
  | 'internalAspects'
  | 'speechAspects';
/** 좌우 구분이 필요한 양상에 붙는 인라인 값. */
export type BodySide = 'right' | 'left';

/**
 * 1단계 갈림길 — 법정 장애인 등록 여부.
 *
 * 등록하지 않았지만 게임 플레이에 영향을 받는 사람이 있다. 색각이상은
 * 장애인복지법상 시각장애 기준에 들지 않고, 특정 장면에 대한 공포증도
 * 법정 유형이 아니다. 그런데 게임 접근성 측면에서는 정확히 측정 대상이다.
 *
 * 등록 여부를 먼저 갈라야 하는 이유: 미등록자에게 "법정 유형 16개 중
 * 고르세요"를 보여주면 고를 것이 없고, 억지로 하나 고르면 데이터가 거짓이 된다.
 * 장애 정도(중증/경증)도 등록자에게만 있는 값이다.
 */
export type DisabilityRegistration = 'registered' | 'unregistered';

/**
 * 미등록자가 직접 고르는 "영향을 받는 영역".
 *
 * 등록자 경로에서 법정 유형이 하던 일 — 2단계에 어떤 양상 그룹을 띄울지
 * 정하는 일 — 을 미등록자 경로에서는 이 값이 대신한다. 그래서 값의 정체가
 * 양상 그룹 그 자체다. 'none' 은 "영향을 주는 상태가 없음"(대조군)이다.
 */
export type AffectedArea = AspectGroup | 'none';

export interface DisabilityInfo {
  /** 1단계 — 갈림길. 이 값에 따라 아래 두 갈래 중 하나만 채워진다. */
  registration: DisabilityRegistration | null;

  /** 1단계 (등록자) — 선택한 법정 유형 (다중) */
  types: DisabilityType[];

  /**
   * 1단계 (등록자) — 장애 정도. **사람당 하나**다.
   *
   * 2019년 장애등급제(1~6급) 폐지 이후 복지카드에는 "장애의 정도가 심한
   * 장애인 / 심하지 않은 장애인" 두 가지 중 하나만 표기된다. 중복장애도
   * 합산해 하나의 정도로 판정하므로, 유형마다 따로 묻는 것은 제도와도
   * 맞지 않고 유형을 여러 개 고른 사람에게 같은 질문을 반복시킨다.
   */
  severity: DisabilitySeverity | null;

  /** 1단계 (미등록자) — 게임 플레이에 영향을 주는 영역 (다중) */
  affectedAreas: AffectedArea[];

  /**
   * 2단계 — 양상 그룹별로 선택한 세부 양상 코드들.
   * 노출된 그룹에 대해서만 값이 있다.
   */
  aspectsByGroup: Partial<Record<AspectGroup, string[]>>;

  /**
   * 2단계 — "기타(직접입력)"를 고른 그룹의 자유 입력값.
   */
  aspectOtherByGroup: Partial<Record<AspectGroup, string>>;

  /**
   * 2단계 — 좌우 구분이 필요한 양상의 방향.
   * 키는 `${그룹}:${양상코드}` 형태다.
   */
  aspectSideByKey: Record<string, BodySide>;

  /** 3단계 — 주관식 부연 설명 (선택) */
  narrative: string;
}

export const EMPTY_DISABILITY_INFO: DisabilityInfo = {
  registration: null,
  types: [],
  severity: null,
  affectedAreas: [],
  aspectsByGroup: {},
  aspectOtherByGroup: {},
  aspectSideByKey: {},
  narrative: '',
};

/** 좌우 방향 값의 키를 만든다. 규칙이 흩어지지 않게 한 곳에 둔다. */
export function sideKey(group: AspectGroup, aspect: string): string {
  return `${group}:${aspect}`;
}
