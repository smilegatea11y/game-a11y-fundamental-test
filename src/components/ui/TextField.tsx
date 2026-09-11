interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 입력 예시나 보충 설명. aria-describedby 로 연결된다. */
  hint?: string;
  /** 오류 메시지. 있으면 aria-invalid 가 켜지고 describedby 에 추가된다. */
  error?: string | null;
  type?: 'text' | 'tel' | 'email';
  inputMode?: 'text' | 'tel' | 'email';
  /**
   * autocomplete 값. 기본값은 'off'.
   *
   * 이 프로젝트가 받는 자유 입력은 고유 ID, 보조기기 모델명, 장애 양상 서술처럼
   * 브라우저의 자동완성 사전(이름·주소·전화)과 성격이 다르다. 켜두면 엉뚱한
   * 값이 채워지고, 민감한 입력이 브라우저 자동완성 저장소에 남을 수도 있다.
   * 자동완성이 실제로 도움이 되는 필드에서만 개별적으로 켤 것.
   */
  autoComplete?: string;
}

/**
 * 텍스트 입력 한 칸.
 *
 * 라벨-입력-힌트-오류의 연결(htmlFor / aria-describedby / aria-invalid)을
 * 이 컴포넌트가 책임진다. 호출부에서 매번 배선하면 반드시 어딘가 빠진다.
 *
 * placeholder 는 힌트 대용으로 쓰지 않는다. 입력을 시작하면 사라지고,
 * 대비가 낮으며, 스크린리더 지원이 일정하지 않다. 힌트는 hint 로 넘길 것.
 */
export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  type = 'text',
  inputMode,
  autoComplete = 'off',
}: TextFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        <span className="field__required-mark" aria-hidden="true">
          {' *'}
        </span>
        <span className="visually-hidden"> (필수)</span>
      </label>

      {hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className="field__error" id={errorId}>
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}

      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        aria-required="true"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        autoComplete={autoComplete}
      />
    </div>
  );
}
