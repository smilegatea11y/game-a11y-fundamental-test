/**
 * 동의 항목 식별자. data/consentItems.ts 의 항목과 1:1 대응한다.
 *
 * 'D'(영상 제공)는 v1.2.0 에서 제거됐다. 번호를 당기지 않는 이유는
 * consentItems.ts 의 주석 참고.
 */
export type ConsentItemId = 'A' | 'B' | 'C' | 'E';

export type ConsentAnswers = Record<ConsentItemId, boolean>;

/**
 * 동의 기록. "언제 / 어떤 버전의 문안에 / 무엇을 동의했는지"가 남아야 하므로
 * consentVersion 과 agreedAt 은 생략할 수 없다.
 * 문안이 개정되면 CONSENT_VERSION 을 올리고, 저장된 구버전 기록은 무효로 처리해
 * 참여자에게 다시 동의를 받는다. (lib/storage.ts 참고)
 */
export interface ConsentRecord {
  consentVersion: string;
  /** ISO 8601 */
  agreedAt: string;
  items: ConsentAnswers;
}

/** 폼 검증 오류 1건. targetId 는 포커스를 옮길 DOM 요소의 id. */
export interface ConsentValidationError {
  key: string;
  targetId: string;
  message: string;
}
