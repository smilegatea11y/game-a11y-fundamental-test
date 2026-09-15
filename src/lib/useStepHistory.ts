import { useEffect, useRef } from 'react';
import { STEP_ORDER } from './sessionStore';
import type { SessionStep } from './sessionStore';

/** history.state 에 넣는 키. 다른 곳에서 쓴 state 와 섞이지 않게 한다. */
const STATE_KEY = 'gaftStep';

function isSessionStep(value: unknown): value is SessionStep {
  return typeof value === 'string' && (STEP_ORDER as readonly string[]).includes(value);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  브라우저 뒤로 가기를 단계 뒤로 가기로 연결한다
 * ─────────────────────────────────────────────────────────────────────────────
 *  이 앱은 라우터가 없어서 주소가 한 번도 바뀌지 않는다. 그 상태로 브라우저
 *  뒤로 가기를 누르면 **앱을 벗어나 이전 사이트로 나가 버린다.** 30분 넘게
 *  입력한 사람이 화면을 잃는 셈이다. (입력값 자체는 브라우저에 저장되어 있어
 *  다시 들어오면 이어서 되지만, 그 사실을 알 수 없으니 잃었다고 느낀다.)
 *
 *  그래서 단계가 바뀔 때마다 history 항목을 하나 쌓고, 뒤로 가기가 눌리면
 *  그 항목이 가리키는 단계로 되돌린다. 주소는 그대로 두고 state 만 쓴다 —
 *  GitHub Pages 는 서버 라우팅이 없어서 주소를 바꾸면 새로고침 시 404 가 난다.
 *
 *  한계: 새로고침하면 history 가 초기화되어 쌓아둔 항목이 사라진다. 그때
 *  뒤로 가기는 다시 사이트를 벗어난다. 화면 안의 "이전 단계로" 버튼이
 *  항상 동작하는 경로이므로, 그쪽을 주 수단으로 둔다.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function useStepHistory(step: SessionStep, onPopBack: (step: SessionStep) => void): void {
  /** 마지막으로 history 에 반영한 단계. 같은 단계를 두 번 쌓지 않기 위한 것. */
  const synced = useRef<SessionStep | null>(null);

  /** 최신 콜백을 읽는다. 의존성에 넣으면 리스너가 매 렌더 재등록된다. */
  const onPopBackRef = useRef(onPopBack);
  onPopBackRef.current = onPopBack;

  useEffect(() => {
    if (synced.current === step) return;

    if (synced.current === null) {
      /*
       * 첫 진입(또는 새로고침 후 복원)은 push 하지 않는다. push 하면
       * 뒤로 가기를 한 번 눌러야 "나가기"가 되는 항목이 생겨, 사용자가
       * 아무 변화 없는 뒤로 가기를 한 번 겪는다.
       */
      window.history.replaceState({ [STATE_KEY]: step }, '');
    } else {
      window.history.pushState({ [STATE_KEY]: step }, '');
    }
    synced.current = step;
  }, [step]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const popped = (event.state as Record<string, unknown> | null)?.[STATE_KEY];
      if (!isSessionStep(popped)) return;
      /*
       * 브라우저가 이미 history 위치를 옮겼으므로 여기서 push 하면 안 된다.
       * synced 를 먼저 맞춰 두면 위 effect 가 이 변화를 "이미 반영됨"으로 본다.
       */
      synced.current = popped;
      onPopBackRef.current(popped);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}
