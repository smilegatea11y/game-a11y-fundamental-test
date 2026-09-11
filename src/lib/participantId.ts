/**
 * 참여자 고유 ID 검증 (SYSTEM_SPEC 3-1, 3-2).
 *
 * 형식: `GA11Y-[경로코드][연도 2자리]-[일련번호 3자리]`
 * 예:   `GA11Y-P26-014`
 */

/** 스펙에 명시된 정규식. 이 파일의 유일한 판단 기준이다. */
export const PARTICIPANT_ID_PATTERN = /^GA11Y-[PAO]\d{2}-\d{3}$/;

export const PARTICIPANT_ID_EXAMPLE = 'GA11Y-P26-014';
export const PARTICIPANT_ID_LENGTH = PARTICIPANT_ID_EXAMPLE.length;

/**
 * 부분 입력 판정용 채움값.
 *
 * 그 자체로 유효한 ID 이고 모든 자리가 "그 위치에서 허용되는 문자"다.
 * 입력값 뒤에 이걸 이어 붙여 정규식을 돌리면, 규칙을 한 벌 더 적어두지 않고도
 * "더 입력하면 유효해질 수 있는가"를 판정할 수 있다.
 * 규칙이 두 곳에 흩어지면 반드시 어긋나므로 이 방식을 쓴다.
 */
const COMPLETION_FILLER = 'GA11Y-P00-000';

/**
 * 입력값을 저장·파일명에 쓸 정규 형태로 만든다.
 * 소문자로 입력해도 대문자로 바꾼다 (관대한 입력 처리).
 */
export function normalizeParticipantId(value: string): string {
  return value.trim().toUpperCase();
}

/** 형식이 완전히 맞는지. */
export function isValidParticipantId(value: string): boolean {
  return PARTICIPANT_ID_PATTERN.test(normalizeParticipantId(value));
}

/**
 * 지금까지 입력한 값이 "앞으로 더 입력하면 유효해질 수 있는" 상태인지.
 *
 * 이게 필요한 이유: `GA11Y-P26-014` 를 입력하는 도중 `GA11Y-P` 까지 친 시점은
 * 정규식에 맞지 않는다. 그때 빨간 테두리를 띄우면 아직 다 입력하지도 않은
 * 사람에게 틀렸다고 말하는 셈이다. 그래서 "완성될 수 없는 값"일 때만 오류로 본다.
 */
export function canStillBecomeValid(value: string): boolean {
  const normalized = normalizeParticipantId(value);
  if (normalized.length > PARTICIPANT_ID_LENGTH) return false;
  const candidate = normalized + COMPLETION_FILLER.slice(normalized.length);
  return PARTICIPANT_ID_PATTERN.test(candidate);
}

/**
 * ID 에 담긴 참여 경로 코드. 형식이 맞을 때만 값이 있다.
 * 참여 경로 선택과 어긋나는지 확인하는 데 쓴다(경고만, 진행은 막지 않는다).
 */
export function readPathCode(value: string): 'P' | 'A' | 'O' | null {
  const normalized = normalizeParticipantId(value);
  if (!PARTICIPANT_ID_PATTERN.test(normalized)) return null;
  const code = normalized[6];
  return code === 'P' || code === 'A' || code === 'O' ? code : null;
}
