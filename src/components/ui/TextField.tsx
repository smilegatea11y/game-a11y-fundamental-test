/**
 * 검증 상태.
 *
 *  none    검증하지 않는 필드
 *  valid   형식이 맞음 — 초록 체크
 *  invalid 형식이 틀림 — 빨간 테두리 + 안내문구
 *  pending 아직 판단하지 않음 (입력 중이고 더 치면 맞을 수 있음)
 */
export type FieldStatus = 'none' | 'valid' | 'invalid' | 'pending';

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** 입력 예시나 보충 설명. aria-describedby 로 연결된다. */
  hint?: string;
  /** 오류 메시지. 있으면 aria-invalid 가 켜지고 describedby 에 추가된다. */
  error?: string | null;
  /** 형식 검증 상태. 'valid' 면 초록 체크를 보여준다. */
  status?: FieldStatus;
  /** status === 'valid' 일 때 보여줄 문구 */
  validMessage?: string;
  required?: boolean;
  type?: 'text' | 'tel' | 'email';
  inputMode?: 'text' | 'tel' | 'email';
  /** 입력 최대 길이. 형식이 고정된 값(고유 ID)에 쓴다. */
  maxLength?: number;
  /**
   * autocomplete 값. 기본값은 'off'.
   *
   * 이 프로젝트가 받는 자유 입력은 고유 ID, 보조기기 모델명, 장애 양상 서술처럼
   * 브라우저의 자동완성 사전(이름·주소·전화)과 성격이 다르다. 켜두면 엉뚱한
   * 값이 채워지고, 민감한 입력이 브라우저 자동완성 저장소에 남을 수도 있다.
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
 *
 * 낭독 설계 — 오류·성공 문구를 라이브 리전으로 만들지 않는다.
 * 한 글자마다 낭독이 끼어들면 타이핑 자체가 불가능해진다. 대신
 * aria-describedby 로 연결해 포커스가 올 때와 오류 상태에서 읽히게 한다.
 * "방금 유효해졌다"는 1회성 알림은 화면 쪽에서 LiveRegion 으로 따로 처리한다.
 */
export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  status = 'none',
  validMessage,
  required = false,
  type = 'text',
  inputMode,
  maxLength,
  autoComplete = 'off',
}: TextFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const validId = `${id}-valid`;

  const showValid = status === 'valid' && Boolean(validMessage);

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
    showValid ? validId : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <>
            <span className="field__required-mark" aria-hidden="true">
              {' *'}
            </span>
            <span className="visually-hidden"> (필수)</span>
          </>
        ) : null}
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

      {showValid ? (
        <p className="field__valid" id={validId}>
          <span aria-hidden="true">✓ </span>
          {validMessage}
        </p>
      ) : null}

      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        maxLength={maxLength}
        required={required || undefined}
        aria-required={required ? 'true' : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        autoComplete={autoComplete}
        /* 상태를 색만으로 알리지 않는다. 위의 ✓ / ⚠ 문구가 함께 있다. */
        data-status={status === 'none' ? undefined : status}
      />
    </div>
  );
}
