interface TextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 입력 예시나 보충 설명. aria-describedby 로 연결된다. */
  hint?: string;
  /** 힌트 아래에 항상 보이는 추가 안내 (예: "비워두셔도 됩니다"). */
  note?: string;
  error?: string | null;
  rows?: number;
}

/**
 * 여러 줄 자유 입력.
 *
 * placeholder 를 쓰지 않는다. 입력을 시작하면 사라지고, 대비가 낮으며,
 * 스크린리더 지원이 일정하지 않다. 예시는 화면에 항상 보이게 둔다.
 *
 * 글자 수 카운터도 두지 않는다. 여기는 분량을 재는 칸이 아니고,
 * 카운터가 라이브 리전이 되면 한 글자마다 낭독이 끼어든다.
 */
export function TextArea({
  id,
  label,
  value,
  onChange,
  hint,
  note,
  error,
  rows = 6,
}: TextAreaProps) {
  const hintId = `${id}-hint`;
  const noteId = `${id}-note`;
  const errorId = `${id}-error`;

  const describedBy = [hint ? hintId : null, note ? noteId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>

      {hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      {note ? (
        <p className="field__hint" id={noteId}>
          {note}
        </p>
      ) : null}

      {error ? (
        <p className="field__error" id={errorId}>
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}

      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        /* 제3자 정보나 민감한 서술이 브라우저 자동완성 저장소에 남지 않게 한다. */
        autoComplete="off"
      />
    </div>
  );
}
