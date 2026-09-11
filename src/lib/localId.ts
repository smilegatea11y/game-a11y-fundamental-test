/**
 * 브라우저 안에서만 쓰는 짧은 식별자.
 *
 * 반복 폼 항목(부가 기기 목록 등)을 구분하는 데 쓴다. 배열 인덱스를 키로 쓰면
 * 중간 항목을 삭제할 때 뒤 항목의 DOM id 가 밀려서 label 연결과 포커스 대상이
 * 엉뚱한 요소를 가리킨다. 그래서 항목마다 고정된 id 를 붙인다.
 *
 * 참여자 고유 ID 와 무관한 값이고 개인정보가 아니다.
 */
export function newLocalId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    }
  } catch {
    /* 아래 폴백으로 */
  }
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
