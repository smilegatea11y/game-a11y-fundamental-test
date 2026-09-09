/**
 * 참여자 고유 ID (SYSTEM_SPEC 3-1).
 *
 * 형식: `GA11Y-[경로코드][연도 2자리]-[일련번호 3자리]`
 * 예:   `GA11Y-P26-014`
 *
 * ID 에 담을 정보의 범위는 의도적으로 제한되어 있다. 경로·시기·순번 같은
 * 비민감 관리정보만 담고, 나이·성별·장애유형은 절대 넣지 않는다.
 * 이 ID 는 CSV 파일명, 이메일 제목, 관리자 화면 등 여러 곳에 노출되므로
 * 민감정보를 담으면 그 자체가 새로운 노출 경로가 된다.
 */

/** 참여 경로 코드 */
export const ENROLLMENT_PATHS = {
  P: '접근성 패널 프로그램',
  A: '스마일 플레이 앨라이 프로그램',
  O: '기타',
} as const;

export type EnrollmentPathCode = keyof typeof ENROLLMENT_PATHS;

export const PARTICIPANT_ID_PATTERN = /^GA11Y-[PAO]\d{2}-\d{3}$/;

/** 화면에 보여줄 형식 안내 */
export const PARTICIPANT_ID_HINT = '예: GA11Y-P26-014 (관리자에게 발급받은 ID를 그대로 입력해 주세요)';

/**
 * 형식 검증.
 *
 * 한계: 형식만 본다. 그 ID 가 실제로 관리자가 발급한 것인지는 확인하지 않는다.
 * 발급 목록과 대조하는 검증은 시스템 B(관리자 도구)의 과제다.
 * 시스템 A 는 발급 목록을 갖고 있지 않으며, 가져서도 안 된다 —
 * 공개 배포되는 정적 페이지에 참여자 명부를 두는 셈이 되기 때문이다.
 */
export function isValidParticipantId(value: string): boolean {
  return PARTICIPANT_ID_PATTERN.test(value.trim().toUpperCase());
}

/** 입력값을 저장·파일명에 쓸 정규 형태로 만든다. */
export function normalizeParticipantId(value: string): string {
  return value.trim().toUpperCase();
}
