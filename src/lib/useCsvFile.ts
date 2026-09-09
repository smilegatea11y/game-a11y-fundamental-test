import { useEffect, useMemo, useState } from 'react';
import { toCsvBlob } from './csv';

/**
 * CSV 내용을 `<a download>` 로 내려받을 수 있는 URL 로 만든다.
 *
 * 왜 버튼 + 프로그램적 클릭이 아니라 진짜 링크인가:
 *  - 스크린리더가 "링크"로 안내하므로 무엇이 일어날지 예측할 수 있다.
 *    버튼을 눌러 파일이 내려오면 아무 안내 없이 상태만 바뀐다.
 *  - 키보드·보조기기에서 링크 활성화는 가장 널리 검증된 동작이다.
 *  - 브라우저의 다운로드 UI 가 자연스럽게 개입한다. 합성 클릭은
 *    팝업 차단이나 사용자 제스처 요건에 걸릴 수 있다.
 *  - 우클릭 "다른 이름으로 저장", 새 탭에서 열기 같은 기본 기능이 그대로 살아난다.
 *
 * 반환된 href 는 컴포넌트가 사라지거나 내용이 바뀔 때 자동으로 해제된다.
 * 해제하지 않으면 blob 이 탭이 닫힐 때까지 메모리에 남는다.
 */
export function useCsvFile(csv: string | null): string | null {
  const blob = useMemo(() => (csv === null ? null : toCsvBlob(csv)), [csv]);
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (blob === null) {
      setHref(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setHref(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  return href;
}
