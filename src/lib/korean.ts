/** 한국어 문장 조립 유틸. */

/**
 * 받침 유무에 따라 목적격 조사를 고른다. ("성명을" / "관계를")
 *
 * "을(를)" 같은 병기 표기를 쓰면 스크린리더가 "을 괄호 를 괄호닫기" 로 읽어
 * 문장이 끊긴다. 오류 메시지는 스크린리더로 듣는 경우가 많으므로 조사를 정확히
 * 골라야 한다.
 *
 * 한글 음절은 0xAC00 부터 (초성 19 × 중성 21 × 종성 28) 순서로 배열되어 있어,
 * (코드 - 0xAC00) % 28 이 0 이면 종성(받침)이 없다.
 */
export function withObjectParticle(word: string): string {
  // String.prototype.at 은 ES2022 이므로, 컴파일 target(ES2020)에 맞춰 인덱스로 접근한다.
  const code = word.charCodeAt(word.length - 1);
  const isHangulSyllable = code >= 0xac00 && code <= 0xd7a3;
  if (!isHangulSyllable) return `${word}을`;
  const hasFinalConsonant = (code - 0xac00) % 28 !== 0;
  return `${word}${hasFinalConsonant ? '을' : '를'}`;
}

/**
 * 받침 유무에 따라 주격 조사를 고른다. ("손떨림이" / "터널 시야가")
 *
 * 동적으로 끼워 넣는 라벨에 조사를 손으로 붙이면, 나중에 받침 없는 항목이
 * 추가될 때 조용히 틀린다. 장애 세부 양상 라벨처럼 목록이 늘어나는 곳에 쓴다.
 */
export function withSubjectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  const isHangulSyllable = code >= 0xac00 && code <= 0xd7a3;
  if (!isHangulSyllable) return `${word}이`;
  const hasFinalConsonant = (code - 0xac00) % 28 !== 0;
  return `${word}${hasFinalConsonant ? '이' : '가'}`;
}
