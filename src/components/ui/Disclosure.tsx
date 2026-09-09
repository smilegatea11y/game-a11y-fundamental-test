import type { ReactNode } from 'react';

interface DisclosureProps {
  /**
   * 무엇에 대한 상세인지. "자세히 보기" 라는 이름만으로는 화면에 5개가 있을 때
   * 스크린리더 사용자가 구분할 수 없으므로, 접근성 이름에 이 값을 덧붙인다.
   */
  label: string;
  children: ReactNode;
}

/**
 * 접기/펼치기. native <details>/<summary> 를 쓴다.
 *
 * button + aria-expanded 로 직접 만들 수도 있지만, native 를 쓰면
 * 키보드 조작(Enter/Space), 펼침 상태 안내, 접힌 내용의 접근성 트리 제외를
 * 브라우저가 처리해준다. 직접 만들면 이 세 가지를 모두 우리가 맞춰야 한다.
 *
 * 스크린리더 실측(NVDA/JAWS/VoiceOver)에서 문제가 나오면 이 컴포넌트 내부만
 * button + aria-expanded + aria-controls 로 교체하면 된다. 호출부는 그대로다.
 */
export function Disclosure({ label, children }: DisclosureProps) {
  return (
    <details className="disclosure">
      <summary className="disclosure__summary">
        <span className="disclosure__chevron" aria-hidden="true" />
        <span>
          자세히 보기
          <span className="visually-hidden">: {label}</span>
        </span>
      </summary>
      <div className="disclosure__panel">{children}</div>
    </details>
  );
}
