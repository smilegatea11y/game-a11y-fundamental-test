import { STEP_BACK_NAV } from './devFlags';
import { BasicInfoScreen } from './screens/basicInfo/BasicInfoScreen';
import { ConsentScreen } from './screens/consent/ConsentScreen';
import { DeviceSpecScreen } from './screens/deviceSpec/DeviceSpecScreen';
import { DisabilityScreen } from './screens/disability/DisabilityScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
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
  const step = session.draft?.currentStep ?? 'consent';

  const renderScreen = () => {
    // 동의 기록이 없으면 어떤 단계가 저장돼 있든 동의 화면으로 되돌린다.
    if (session.consent === null) {
      return (
        <ConsentScreen
          onComplete={session.grantConsent}
          storageAvailable={session.storageAvailable}
        />
      );
    }

    // consent 와 basicInfo 두 갈래가 같은 화면을 반환하므로 한 번만 만든다.
    const basicInfoScreen = (
      <BasicInfoScreen session={session} onComplete={() => session.enterStep('disability')} />
    );

    switch (step) {
      case 'consent':
        /*
         * 개발용 뒤로 가기(src/devFlags.ts)로 동의 화면에 되돌아온 경우.
         * 저장된 동의를 그대로 유지하고 체크박스도 체크된 상태로 보여준다.
         *
         * grantConsent 를 다시 쓰면 안 된다 — 그 안의 startSession() 이 세션을
         * 새로 만들어 기본정보·장애정보·기기사양이 전부 지워진다. save() 로 패치한다.
         *
         * agreedAt 은 처음 값을 유지한다. 필수 4건을 모두 체크해야만 제출되므로
         * 항목 구성은 되돌아오기 전과 반드시 같다 — 새로 동의한 것이 아니라
         * 지나가는 것이고, 법적으로 의미 있는 시각은 최초 동의 시각이다.
         */
        if (STEP_BACK_NAV && session.consent !== null) {
          const grantedAt = session.consent.agreedAt;
          return (
            <ConsentScreen
              initialAnswers={session.consent.items}
              storageAvailable={session.storageAvailable}
              onComplete={(record) =>
                session.save(
                  { consent: { ...record, agreedAt: grantedAt }, currentStep: 'basicInfo' },
                  {
                    type: 'consent-granted',
                    step: 'consent',
                    detail: '개발용 뒤로 가기 후 재확인',
                  },
                )
              }
            />
          );
        }
        /*
         * 플래그가 꺼져 있을 때의 기존 동작: 저장된 단계가 consent 여도
         * (구버전 초안, 수동 편집 등) 자리표시 화면에 갇히지 않게 기본정보로 보낸다.
         */
        return basicInfoScreen;
      case 'basicInfo':
        return basicInfoScreen;
      case 'disability':
        return <DisabilityScreen session={session} onComplete={() => session.enterStep('device')} />;
      case 'device':
        return <DeviceSpecScreen session={session} onComplete={() => session.enterStep('tests')} />;
      // 아직 만들지 않은 단계는 공용 자리표시 화면이 받는다.
      default:
        return <PlaceholderScreen step={step} session={session} />;
    }
  };

  return (
    <>
      <a className="skip-link visually-hidden-focusable" href="#main">
        본문으로 건너뛰기
      </a>
      {renderScreen()}
    </>
  );
}
