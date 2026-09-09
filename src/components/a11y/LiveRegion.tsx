interface LiveRegionProps {
  /** 읽어줄 문장. 빈 문자열이면 아무것도 읽지 않는다. */
  message: string;
  /** true 면 화면에도 표시한다. 기본값은 스크린리더 전용. */
  visible?: boolean;
}

/**
 * 화면 변화를 스크린리더에 알리는 영역.
 *
 * role="status" 는 aria-live="polite" + aria-atomic="true" 를 함축한다.
 * - polite: 사용자가 읽는 중이면 끊지 않고 기다린다
 * - atomic: 바뀐 글자만이 아니라 영역 전체를 다시 읽는다
 *
 * 중요: 이 영역은 조건부로 마운트하면 안 된다. 마운트와 동시에 내용이 채워지면
 * 스크린리더가 변경을 감지하지 못하는 경우가 있다. 항상 DOM 에 두고
 * 내용만 바꿔야 한다. (그래서 message 가 빈 문자열이어도 렌더링한다.)
 */
export function LiveRegion({ message, visible = false }: LiveRegionProps) {
  return (
    <p role="status" className={visible ? undefined : 'visually-hidden'}>
      {message}
    </p>
  );
}
