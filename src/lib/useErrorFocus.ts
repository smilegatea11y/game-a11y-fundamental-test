import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { ConsentValidationError } from '../types/consent';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  제출 실패 시 첫 미입력 항목으로 이동
 * ─────────────────────────────────────────────────────────────────────────────
 *  오류 요약만 띄우면 "무엇이 비었는지"는 알려주지만 "어디로 가야 하는지"는
 *  사용자가 직접 찾아야 한다. 글자가 24px 이고 화면이 길어서, 화면 아래쪽
 *  제출 버튼을 누른 사람에게는 비어 있는 항목이 스크롤 밖에 있다.
 *  그래서 **첫 오류 항목으로 스크롤 + 포커스**를 옮긴다.
 *
 *  오류 요약은 그대로 화면에 남는다. 전체 몇 건인지와 나머지 항목 목록이
 *  필요하고, 요약의 링크로 각 항목에 바로 갈 수 있어야 한다.
 *  포커스가 항목에 내려앉으면 그 항목의 오류 문구가 aria-describedby 로
 *  함께 읽히므로, 스크린리더 사용자도 무엇이 문제인지 그 자리에서 듣는다.
 *
 *  requestAnimationFrame 을 쓰지 않는다. 탭이 백그라운드거나 렌더링이
 *  스로틀되면 실행되지 않아 포커스가 아예 움직이지 않는다 (실측으로 확인된 문제).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * 접힌 `<details>` 안에 있는 항목은 펼쳐야 보인다.
 * 펼치지 않으면 포커스는 들어가지만 화면에는 아무 변화가 없어,
 * 사용자는 "아무 일도 일어나지 않았다"고 느낀다.
 */
function revealAncestors(target: HTMLElement): void {
  let node: HTMLElement | null = target;
  while (node !== null) {
    const details: HTMLDetailsElement | null = node.closest('details');
    if (details === null) return;
    if (!details.open) details.open = true;
    node = details.parentElement;
  }
}

/** 오류 항목 하나로 스크롤하고 포커스를 옮긴다. 요약의 링크도 이걸 쓴다. */
export function focusErrorTarget(targetId: string): boolean {
  const target = document.getElementById(targetId);
  if (target === null) return false;
  revealAncestors(target);
  /*
   * 스크롤을 먼저, 포커스를 나중에 한다. focus() 가 스스로 스크롤하면
   * 항목이 화면 맨 위나 맨 아래에 붙어 앞뒤 맥락이 보이지 않으므로
   * preventScroll 로 막고 block:'center' 로 가운데에 놓는다.
   */
  target.scrollIntoView({ block: 'center', behavior: 'auto' });
  target.focus({ preventScroll: true });
  return true;
}

/**
 * 제출 실패 횟수가 올라갈 때마다 첫 오류 항목으로 이동한다.
 *
 * @param failedSubmitCount 실패할 때마다 증가하는 값. 같은 오류로 다시
 *   제출해도 값이 바뀌므로 포커스가 다시 잡힌다.
 * @param errors 화면 순서(위 → 아래)로 정렬된 오류 목록.
 * @param fallbackRef 오류 항목을 DOM 에서 찾지 못했을 때 포커스를 줄 곳
 *   (오류 요약). 조건부로 사라진 항목을 가리키는 경우의 안전망이다.
 */
export function useErrorFocus(
  failedSubmitCount: number,
  errors: readonly ConsentValidationError[],
  fallbackRef: RefObject<HTMLElement | null>,
): void {
  /*
   * errors 를 의존성에 넣지 않는다. 한 글자마다 새 배열이 만들어져
   * 입력 중에도 포커스가 튀게 된다. 최신 값은 ref 로 읽는다.
   */
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  useEffect(() => {
    if (failedSubmitCount === 0) return;

    const first = errorsRef.current[0];
    if (first !== undefined && focusErrorTarget(first.targetId)) return;

    fallbackRef.current?.focus();
    fallbackRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [failedSubmitCount, fallbackRef]);
}
