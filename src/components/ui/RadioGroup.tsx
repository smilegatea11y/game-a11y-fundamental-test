export interface RadioOption<T extends string> {
  value: T;
  /** DOM id. 오류 요약이 이 id 로 포커스를 옮긴다. */
  id: string;
  label: string;
  /** 선택지에 딸린 보충 설명 */
  description?: string;
}

interface RadioGroupProps<T extends string> {
  legend: string;
  /** 그룹 전체에 대한 설명. */
  hint?: string;
  name: string;
  options: readonly RadioOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string | null;
  /** 그룹 자체의 id. 힌트·오류 메시지 id 를 여기서 파생시킨다. */
  groupId: string;
}

/**
 * 라디오 그룹. fieldset + legend 가 그룹 이름을 제공한다.
 *
 * div[role="radiogroup"] 로 흉내내지 않고 native fieldset/input 을 쓴다.
 * 화살표 키 순환, 그룹 내 단일 선택, 탭 시 그룹 전체를 한 정지점으로 취급하는
 * 동작을 전부 브라우저가 제공한다.
 *
 * 오류 메시지는 그룹(aria-describedby)과 각 라디오(aria-describedby) 양쪽에
 * 연결한다. 그룹에만 걸면 그룹 진입 시점을 놓친 스크린리더에서 읽히지 않고,
 * 라디오에만 걸면 그룹 전체의 문제라는 맥락이 사라진다.
 *
 * aria-invalid 는 fieldset(role=group)이 지원하지 않는 속성이므로 쓰지 않고,
 * 개별 라디오에 건다.
 */
export function RadioGroup<T extends string>({
  legend,
  hint,
  name,
  options,
  value,
  onChange,
  error,
  groupId,
}: RadioGroupProps<T>) {
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;
  const groupDescribedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <fieldset className="radio-group" aria-describedby={groupDescribedBy || undefined}>
      <legend className="radio-group__legend">{legend}</legend>

      {hint ? (
        <p className="radio-group__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className="field__error" id={errorId}>
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}

      <div className="radio-group__options">
        {options.map((option) => {
          const descriptionId = option.description ? `${option.id}-desc` : null;
          const optionDescribedBy = [descriptionId, error ? errorId : null]
            .filter(Boolean)
            .join(' ');

          return (
            <div className="radio-option" key={option.value}>
              <input
                type="radio"
                id={option.id}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                aria-required="true"
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={optionDescribedBy || undefined}
              />
              <label htmlFor={option.id}>{option.label}</label>
              {descriptionId ? (
                <p className="radio-option__description" id={descriptionId}>
                  {option.description}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
