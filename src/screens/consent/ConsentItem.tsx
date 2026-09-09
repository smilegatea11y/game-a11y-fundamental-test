import { Disclosure } from '../../components/ui/Disclosure';
import type { ConsentItemSpec } from '../../data/consentItems';
import { domId } from '../../state/useConsentForm';

interface ConsentItemProps {
  item: ConsentItemSpec;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
}

/**
 * 동의 항목 한 건 = 체크박스 + 요약 + 자세히 보기.
 *
 * 구조상 주의점: <label> 안에 <details> 를 넣으면 안 된다. label 안의
 * 인터랙티브 요소는 클릭 대상이 겹쳐 동작이 깨지고, 접근성 이름에
 * 상세 본문 전체가 섞여 들어간다. 그래서 체크박스+라벨과 Disclosure 를
 * 형제로 둔다.
 */
export function ConsentItem({ item, checked, onChange, error }: ConsentItemProps) {
  const inputId = domId.checkbox(item.id);
  const summaryId = domId.checkboxSummary(item.id);
  const errorId = domId.checkboxError(item.id);
  const describedBy = [summaryId, error ? errorId : null].filter(Boolean).join(' ');

  /*
   * 접근성 이름을 <label> 자식 노드의 텍스트 이어붙이기에 맡기지 않고
   * aria-labelledby 로 명시한다.
   *
   * 라벨 안의 배지와 제목은 각각 <span> 이고 시각적 간격은 flex gap 이 만든다.
   * DOM 에는 둘 사이에 공백 문자가 없어서, 이름이 이어붙여질 때
   * "필수일반 개인정보 수집·이용 동의" 처럼 붙어 읽힌다 (실측으로 확인).
   * 공백 텍스트 노드를 넣는 방법은 flex 가 공백 전용 노드를 렌더링하지 않아
   * 브라우저별 처리가 갈린다. aria-labelledby 는 여러 참조를 공백으로 잇는 것이
   * 스펙에 명시되어 있어 결과가 확정적이다.
   *
   * htmlFor/id 연결은 그대로 두어 라벨 클릭으로 체크되는 동작을 유지한다.
   */
  const badgeId = `${inputId}-badge`;
  const titleId = `${inputId}-title`;
  const sensitiveId = `${inputId}-sensitive`;
  const labelledBy = [badgeId, titleId, item.sensitive ? sensitiveId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={`consent-item${item.sensitive ? ' consent-item--sensitive' : ''}`}>
      <div className="consent-item__control">
        <input
          type="checkbox"
          id={inputId}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          aria-required={item.required ? 'true' : undefined}
        />
        <label className="consent-item__label" htmlFor={inputId}>
          {/* 필수/선택을 색이 아니라 글자로 구분한다 (WCAG 1.4.1 색에 의존 금지) */}
          <span
            id={badgeId}
            className={`badge badge--${item.required ? 'required' : 'optional'}`}
          >
            {item.required ? '필수' : '선택'}
          </span>
          <span id={titleId} className="consent-item__title">
            {item.title}
          </span>
          {item.sensitive ? (
            <span id={sensitiveId} className="badge badge--sensitive">
              민감정보
            </span>
          ) : null}
        </label>
      </div>

      {error ? (
        <p className="field__error consent-item__error" id={errorId}>
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}

      <p className="consent-item__summary" id={summaryId}>
        {item.summary}
      </p>

      <Disclosure label={item.title}>
        <dl className="detail-list">
          {item.details.map((row) => (
            <div className="detail-list__row" key={row.term}>
              <dt>{row.term}</dt>
              <dd>{row.description}</dd>
            </div>
          ))}
        </dl>
      </Disclosure>
    </li>
  );
}
