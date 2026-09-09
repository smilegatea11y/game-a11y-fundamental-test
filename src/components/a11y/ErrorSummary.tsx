import { forwardRef } from 'react';
import type { MouseEvent } from 'react';
import type { ConsentValidationError } from '../../types/consent';

interface ErrorSummaryProps {
  errors: readonly ConsentValidationError[];
  headingId: string;
}

/**
 * 제출 실패 시 상단에 뜨는 오류 요약.
 *
 * 설계 근거:
 *  - 제출 버튼을 disabled 로 잠그지 않고 이 요약을 쓴다. disabled 버튼은
 *    "왜 못 누르는지"를 알려주지 못하고, 포커스도 받지 못해 스크린리더
 *    사용자가 존재조차 모르게 되는 경우가 많다.
 *  - role="alert" + tabIndex={-1}: 제출할 때마다 부모가 이 요소로 포커스를
 *    옮긴다. 포커스 이동만으로도 읽히지만, role="alert" 를 함께 둬서
 *    포커스 이동이 실패하는 브라우저에서도 내용이 전달되게 한다.
 *  - 각 오류는 해당 입력으로 이동하는 링크다. 링크를 누르면 스크롤만 되는
 *    것이 아니라 포커스까지 옮긴다 (아래 handleJump).
 */
export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(
  function ErrorSummary({ errors, headingId }, ref) {
    if (errors.length === 0) return null;

    const handleJump = (event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
      event.preventDefault();
      const target = document.getElementById(targetId);
      if (!target) return;
      target.focus();
      target.scrollIntoView({ block: 'center', behavior: 'auto' });
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
          동의를 완료할 수 없습니다
        </h2>
        <p className="error-summary__intro">
          다음 {errors.length}개 항목을 확인해 주세요. 항목을 선택하면 해당 위치로 이동합니다.
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
