import type { ReactNode } from 'react';
/**
 * 선택지 하나.
 *
 * basicInfo 전용이 아니라 폼 화면 전체가 쓰므로 컴포넌트와 같은 곳에 둔다.
 */
export interface FieldOption<T extends string> {
  value: T;
  label: string;
  /**
   * 선택 시 그 자리에 딸린 내용을 노출할지.
   * 자유 텍스트 입력일 수도 있고 인라인 라디오(장애 정도, 좌우 방향)일 수도 있다.
   */
  revealsDetail?: boolean;
  /** 다중선택에서 다른 값과 함께 고를 수 없는 항목 */
  exclusive?: boolean;
  /**
   * 선택지 라벨 아래에 항상 보이는 한 줄 설명.
   * 호버 툴팁을 쓰지 않는다 — 마우스가 없으면 열 수 없고 스크린리더에서
   * 읽히는 시점이 일정하지 않다. 이 캡션은 선택지의 aria-describedby 로도 연결된다.
   */
  caption?: string;
}

interface OptionGroupProps<T extends string> {
  /** 'radio' = 단일 선택, 'checkbox' = 다중 선택 */
  type: 'radio' | 'checkbox';
  /** fieldset 의 id. 힌트·오류 메시지 id 를 여기서 파생시킨다. */
  groupId: string;
  legend: string;
  hint?: string;
  error?: string | null;
  /** 오류는 아니지만 알려야 하는 내용 (예: ID 경로코드 불일치) */
  warning?: string | null;
  options: readonly FieldOption<T>[];
  /** radio 면 단일 값, checkbox 면 선택된 값들 */
  selected: readonly T[];
  onToggle: (value: T, checked: boolean) => void;
  /**
   * revealsDetail 이 붙은 선택지가 선택됐을 때 그 선택지 바로 아래에 렌더할 내용.
   * 화면이 자유 입력란을 넘겨준다.
   */
  renderRevealed?: (value: T) => ReactNode;
}

/**
 * 라디오·체크박스 그룹.
 *
 * 두 가지를 한 컴포넌트로 묶은 이유: 조건부 자유 입력란("기타", "직접 입력",
 * "예")이 기본정보 페이지에만 네 곳 있고, 라디오와 체크박스 양쪽에 걸쳐 있다.
 * 화면에서 매번 배선하면 반드시 어딘가 빠진다.
 *
 * 접근성 설계:
 *  - native input + fieldset/legend 를 쓴다. 방향키 순환(라디오), 단일/다중
 *    선택, 그룹 이름 낭독을 브라우저가 처리한다
 *  - 조건부 입력란은 **트리거 선택지 바로 다음 DOM 위치**에 렌더한다.
 *    DOM 순서 = 탭 순서이므로 다음 Tab 이 자연히 그 입력란으로 들어간다.
 *    포커스를 강제로 빼앗지 않는다 — 라디오를 방향키로 훑는 도중에
 *    포커스가 튀면 다른 선택지를 확인할 수 없다
 *  - 오류·힌트를 그룹과 각 컨트롤 양쪽의 aria-describedby 에 연결한다.
 *    그룹에만 걸면 그룹 진입 시점을 놓친 스크린리더에서 읽히지 않고,
 *    컨트롤에만 걸면 그룹 전체의 문제라는 맥락이 사라진다
 *  - aria-invalid 는 fieldset(role=group)이 지원하지 않으므로 개별 컨트롤에 건다
 */
export function OptionGroup<T extends string>({
  type,
  groupId,
  legend,
  hint,
  error,
  warning,
  options,
  selected,
  onToggle,
  renderRevealed,
}: OptionGroupProps<T>) {
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;
  const warningId = `${groupId}-warning`;

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
    warning ? warningId : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <fieldset className="radio-group" aria-describedby={describedBy || undefined}>
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

      {warning ? (
        <p className="field__warning" id={warningId}>
          <span aria-hidden="true">⚠ </span>
          {warning}
        </p>
      ) : null}

      <div className="radio-group__options">
        {options.map((option) => {
          const id = `${groupId}-${option.value}`;
          const captionId = `${id}-caption`;
          const isSelected = selected.includes(option.value);
          const showRevealed = Boolean(option.revealsDetail) && isSelected && renderRevealed;

          return (
            <div className="radio-option" key={option.value}>
              <input
                type={type}
                id={id}
                name={type === 'radio' ? groupId : `${groupId}-${option.value}`}
                value={option.value}
                checked={isSelected}
                onChange={(event) => onToggle(option.value, event.target.checked)}
                aria-describedby={
                  [option.caption ? captionId : null, describedBy || null]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                aria-invalid={error ? 'true' : undefined}
              />
              <label htmlFor={id}>{option.label}</label>

              {/* 선택지별 캡션. 라벨과 같은 열(2열)에 붙어 어느 선택지의 설명인지 드러난다. */}
              {option.caption ? (
                <p className="radio-option__description" id={captionId}>
                  {option.caption}
                </p>
              ) : null}

              {/*
               * 조건부 입력란. 트리거 바로 다음에 두어 다음 Tab 이 여기로 들어온다.
               * grid 의 2열(라벨과 같은 열)에 붙여 라디오 아이콘 아래로 들여쓴다.
               */}
              {showRevealed ? (
                <div className="radio-option__revealed">{renderRevealed(option.value)}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
