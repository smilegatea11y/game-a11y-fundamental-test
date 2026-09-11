import type { SaveState } from '../../state/useSession';

interface SaveStatusProps {
  state: SaveState;
  error: string | null;
}

/**
 * 저장 상태 표시.
 *
 * 서버가 없으므로 참여자는 "내 입력이 남아 있는가"를 확인할 방법이 없다.
 * 30분 넘는 절차에서 그건 불안 요소이고, 실제로 저장이 깨졌을 때 알아챌
 * 수단도 없다. 그래서 상태를 눈에 보이게 + 스크린리더에 읽히게 둔다.
 *
 * 접근성 처리:
 *  - role="status" 로 상태가 바뀔 때만 읽힌다. 첫 렌더에는 읽지 않는다.
 *  - 문구에 시각(타임스탬프)을 넣지 않는다. 넣으면 저장할 때마다 텍스트가
 *    바뀌어 낭독이 계속 끼어든다. 텍스트가 같으면 DOM 이 변하지 않아
 *    조용히 넘어가고, 실패로 바뀌는 순간에만 읽힌다.
 *  - 색만으로 구분하지 않는다. 아이콘 문자와 문구를 함께 쓴다.
 */
export function SaveStatus({ state, error }: SaveStatusProps) {
  if (state === 'idle') {
    // 아직 저장할 것이 없을 때는 영역만 잡아둔다 (role="status" 는 항상 DOM 에 있어야 한다).
    return <p className="save-status" role="status" />;
  }

  if (state === 'unavailable') {
    return (
      <p className="save-status save-status--warn" role="status">
        <span aria-hidden="true">⚠ </span>
        이 브라우저에서는 진행 상황이 저장되지 않습니다. 창을 닫거나 새로고침하면 처음부터 다시
        하셔야 합니다. 시크릿 모드를 끄거나 다른 브라우저를 사용해 주세요.
      </p>
    );
  }

  if (state === 'failed') {
    return (
      <p className="save-status save-status--error" role="status">
        <span aria-hidden="true">⚠ </span>
        진행 상황을 저장하지 못했습니다. {error} 창을 닫으면 입력한 내용이 사라질 수 있습니다.
      </p>
    );
  }

  return (
    <p className="save-status save-status--saved" role="status">
      <span aria-hidden="true">✓ </span>
      입력하신 내용이 이 브라우저에 저장되었습니다.
    </p>
  );
}
