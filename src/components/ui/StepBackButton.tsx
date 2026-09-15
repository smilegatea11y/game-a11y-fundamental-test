import { STEP_LABEL } from '../../lib/sessionStore';
import type { SessionStep } from '../../lib/sessionStore';
import type { useSession } from '../../state/useSession';
import './stepBackButton.css';

interface StepBackButtonProps {
  session: ReturnType<typeof useSession>;
  /** 돌아갈 단계. */
  to: SessionStep;
}

/**
 * "이전 단계로" 버튼. 2단계부터 모든 화면 하단에 상시 노출한다.
 *
 * 왜 정식 기능인가: 이 절차는 30분 이상 걸리고, 앞 단계에 적은 답을 고칠 수
 * 없으면 그 자체로 접근성 문제다. 잘못 고른 장애 유형 하나 때문에 처음부터
 * 다시 하게 만들면, 되돌릴 방법이 세션 초기화밖에 없다.
 *
 * 화면이 아니라 이 부품이 `session.enterStep` 을 직접 호출한다. App 까지
 * onBack 을 배선하면 화면 수만큼 같은 배선이 늘어난다.
 *
 * 입력값은 값이 바뀔 때마다 저장되므로 뒤로 가도 사라지지 않는다.
 * 되돌아간 화면은 저장된 초안을 그대로 다시 읽어 들인다. 그래서 이 버튼을
 * 실수로 눌러도 잃는 것이 없다 — 다시 "다음 단계로"를 누르면 그만이다.
 */
export function StepBackButton({ session, to }: StepBackButtonProps) {
  return (
    <div className="step-back">
      {/*
        type="button" 이 반드시 필요하다. 이 버튼은 <form> 안에 있고,
        기본값(submit)이면 "다음 단계로"와 똑같이 동작해 버린다.
      */}
      <button type="button" className="btn btn--secondary" onClick={() => session.enterStep(to)}>
        {/* 목적지 이름을 넣는다. "이전 단계로"만 있으면 스크린리더로 버튼을
            훑을 때 어디로 가는 버튼인지 알 수 없다. */}
        이전 단계로: {STEP_LABEL[to]}
      </button>
      <p className="step-back__note">
        지금까지 입력하신 내용은 저장되어 있습니다. 돌아가도 사라지지 않습니다.
      </p>
    </div>
  );
}
