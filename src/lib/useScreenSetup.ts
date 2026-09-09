import { useEffect, useRef } from 'react';

const SITE_TITLE = '게임 접근성 기초 역량 측정';

/**
 * SPA 화면 전환 시 스크린리더 사용자가 "화면이 바뀌었다"는 사실을 알 수 있게 한다.
 * 브라우저가 페이지를 다시 로드하지 않으므로, 아래 두 가지를 직접 해줘야 한다.
 *
 *  1. document.title 갱신 — 탭 제목과 창 전환 시 읽히는 이름
 *  2. 새 화면의 h1 로 포커스 이동 — 포커스가 이전 화면의 사라진 요소에 남아
 *     body 로 튕기면 스크린리더가 현재 위치를 잃는다
 *
 * @param title      화면 이름
 * @param focusHeading 첫 진입 화면은 false (브라우저가 이미 문서 처음을 읽는다),
 *                     화면 전환으로 도착한 화면은 true
 * @returns h1 에 붙일 ref. h1 에는 tabIndex={-1} 이 함께 필요하다.
 */
export function useScreenSetup(title: string, focusHeading: boolean) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${title} | ${SITE_TITLE}`;
  }, [title]);

  useEffect(() => {
    if (focusHeading) {
      headingRef.current?.focus();
    }
    // 마운트 시 한 번만 실행한다. focusHeading 이 도중에 바뀌어도 재포커스하지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return headingRef;
}
