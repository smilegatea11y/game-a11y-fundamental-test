import { ConsentScreen } from './screens/consent/ConsentScreen';
import { ParticipantScreen } from './screens/participant/ParticipantScreen';
import { useSession } from './state/useSession';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  단계 게이트
 * ─────────────────────────────────────────────────────────────────────────────
 *  동의 화면을 통과하기 전에는 어떤 개인정보 입력 필드도 노출되지 않아야 한다.
 *  그래서 다음 화면을 CSS 로 감추거나 hidden 속성으로 두지 않고,
 *  아예 렌더 트리에 마운트하지 않는다. DOM 에 존재하지 않으면
 *  탭 이동, 스크린리더 탐색, 브라우저 자동완성 어디에도 걸리지 않는다.
 *
 *  주의: 이 게이트는 UX·법적 절차 보장용이고 보안 경계가 아니다.
 *  서버/외부 전송을 붙이는 단계에서, 유효한 동의 기록이 없는 제출은
 *  받는 쪽에서도 거부해야 한다.
 *
 *  진행 상황은 useSession 이 값이 바뀔 때마다 브라우저에 기록한다.
 *  CSV 는 마지막 단계에서 그 초안을 읽어 만든다. (lib/sessionStore.ts)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function App() {
  const session = useSession();

  return (
    <>
      <a className="skip-link visually-hidden-focusable" href="#main">
        본문으로 건너뛰기
      </a>

      {session.consent === null ? (
        <ConsentScreen
          onComplete={session.grantConsent}
          storageAvailable={session.storageAvailable}
        />
      ) : (
        <ParticipantScreen session={session} />
      )}
    </>
  );
}
