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
  | 'mental';

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

export interface DisabilityInfo {
  /** 1단계 — 선택한 법정 유형 (다중) */
  types: DisabilityType[];

  /** 1단계 — 유형별 장애 정도. 선택한 유형에 대해서만 값이 있다. */
  severityByType: Partial<Record<DisabilityType, DisabilitySeverity>>;

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
  types: [],
  severityByType: {},
  aspectsByGroup: {},
  aspectOtherByGroup: {},
  aspectSideByKey: {},
  narrative: '',
};

/** 좌우 방향 값의 키를 만든다. 규칙이 흩어지지 않게 한 곳에 둔다. */
export function sideKey(group: AspectGroup, aspect: string): string {
  return `${group}:${aspect}`;
}
