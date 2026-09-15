import { STEP_BACK_NAV } from '../../devFlags';
import { STEP_LABEL } from '../../lib/sessionStore';
import type { SessionStep } from '../../lib/sessionStore';
import type { useSession } from '../../state/useSession';
import './devNav.css';

interface StepBackButtonProps {
  session: ReturnType<typeof useSession>;
  /** 돌아갈 단계. */
  to: SessionStep;
}

/**
 * 개발·검증용 "이전 단계로" 버튼. `STEP_BACK_NAV` 와 함께 삭제한다.
 *
 * 화면이 아니라 이 부품이 `session.enterStep` 을 직접 호출한다. App 까지
 * onBack 을 배선하면 삭제할 때 지워야 할 곳이 화면 수만큼 늘어난다.
 *
 * 입력값은 값이 바뀔 때마다 저장되므로 뒤로 가도 사라지지 않는다.
 * 되돌아간 화면은 저장된 초안을 그대로 다시 읽어 들인다.
 */
export function StepBackButton({ session, to }: StepBackButtonProps) {
  if (!STEP_BACK_NAV) return null;

  return (
    <div className="dev-back">
      {/*
        type="button" 이 반드시 필요하다. 이 버튼은 <form> 안에 있고,
        기본값(submit)이면 "다음 단계로"와 똑같이 동작해 버린다.
      */}
      <button
        type="button"
        className="btn btn--secondary"
        onClick={() => session.enterStep(to)}
      >
        {/* 목적지 이름을 넣는다. "이전 단계로"만 있으면 스크린리더로 버튼을
            훑을 때 어디로 가는 버튼인지 알 수 없다. */}
        이전 단계로: {STEP_LABEL[to]}
      </button>
      <p className="dev-back__note">개발·검증용입니다. 배포 전 삭제합니다.</p>
    </div>
  );
}
