import { useState } from 'react';
import { DeployNotice } from './components/DeployNotice';
import { clearConsent, loadConsent, saveConsent } from './lib/storage';
import { ConsentScreen } from './screens/consent/ConsentScreen';
import { ParticipantScreen } from './screens/participant/ParticipantScreen';
import type { ConsentRecord } from './types/consent';

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
 *  서버/구글시트 전송을 붙이는 단계에서, 유효한 동의 기록이 없는 제출은
 *  서버에서도 거부해야 한다.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function App() {
  /*
   * 새로고침해도 동의 상태를 유지한다. 단, 저장된 기록이 현재 문안 버전과
   * 다르거나 형식이 깨졌으면 loadConsent 가 null 을 돌려주므로
   * 자동으로 동의 화면부터 다시 시작한다. (lib/storage.ts 참고)
   */
  const [consent, setConsent] = useState<ConsentRecord | null>(() => loadConsent());

  const handleConsentComplete = (record: ConsentRecord) => {
    saveConsent(record);
    setConsent(record);
  };

  const handleReset = () => {
    clearConsent();
    setConsent(null);
  };

  return (
    <>
      <a className="skip-link visually-hidden-focusable" href="#main">
        본문으로 건너뛰기
      </a>

      {/* 배포 빌드에서만 렌더링된다. 로컬 개발 중에는 null. */}
      <DeployNotice />

      {consent === null ? (
        <ConsentScreen onComplete={handleConsentComplete} />
      ) : (
        <ParticipantScreen consent={consent} onReset={handleReset} />
      )}
    </>
  );
}
