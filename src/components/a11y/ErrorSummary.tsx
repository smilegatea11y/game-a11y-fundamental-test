import { forwardRef } from 'react';
import type { MouseEvent } from 'react';
import { focusErrorTarget } from '../../lib/useErrorFocus';
import type { ConsentValidationError } from '../../types/consent';

interface ErrorSummaryProps {
  errors: readonly ConsentValidationError[];
  headingId: string;
  /** 요약 제목. 화면마다 다르다 — 동의 화면이 아닌 곳에서 "동의를 완료할 수 없습니다"가 뜨면 안 된다. */
  title?: string;
}

/**
 * 제출 실패 시 상단에 뜨는 오류 요약.
 *
 * 설계 근거:
 *  - 제출 버튼을 disabled 로 잠그지 않고 이 요약을 쓴다. disabled 버튼은
 *    "왜 못 누르는지"를 알려주지 못하고, 포커스도 받지 못해 스크린리더
 *    사용자가 존재조차 모르게 되는 경우가 많다.
 *  - role="alert": 제출 실패 시 포커스는 **첫 오류 항목**으로 가므로
 *    (useErrorFocus) 이 요약 자체는 포커스를 받지 않는 것이 보통이다.
 *    role="alert" 가 있어야 그 상황에서도 "몇 건이 남았는지"가 전달된다.
 *    tabIndex={-1} 은 오류 항목을 DOM 에서 찾지 못했을 때의 안전망으로 남긴다.
 *  - 각 오류는 해당 입력으로 이동하는 링크다. 링크를 누르면 스크롤만 되는
 *    것이 아니라 포커스까지 옮긴다 (아래 handleJump).
 */
export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(
  function ErrorSummary({ errors, headingId, title = '입력을 완료할 수 없습니다' }, ref) {
    if (errors.length === 0) return null;

    const handleJump = (event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
      event.preventDefault();
      // 제출 실패 시의 자동 이동과 같은 동작을 쓴다. 접힌 영역도 함께 펼친다.
      focusErrorTarget(targetId);
    };

    return (
      <div
        ref={ref}
        role="alert"
        tabIndex={-1}
        className="error-summary"
        aria-labelledby={headingId}
      >
        <h2 id={headingId} className="error-summary__heading">
          {title}
        </h2>
        <p className="error-summary__intro">
          다음 {errors.length}개 항목을 확인해 주세요. 첫 항목으로 이동해 두었습니다. 목록에서 항목을
          선택하면 그 위치로 바로 이동합니다.
        </p>
        <ul className="error-summary__list">
          {errors.map((error) => (
            <li key={error.key}>
              <a href={`#${error.targetId}`} onClick={(event) => handleJump(event, error.targetId)}>
                {error.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  },
);
