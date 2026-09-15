import { useCallback, useMemo, useState } from 'react';
import { CONSENT_ITEMS, CONSENT_VERSION, REQUIRED_COUNT, REQUIRED_ITEMS } from '../data/consentItems';
import type {
  ConsentAnswers,
  ConsentItemId,
  ConsentRecord,
  ConsentValidationError,
} from '../types/consent';

/** DOM id 생성 규칙을 한 곳에 모아둔다. 오류 요약이 여기로 포커스를 옮긴다. */
export const domId = {
  checkbox: (id: ConsentItemId) => `consent-${id}`,
  checkboxError: (id: ConsentItemId) => `consent-${id}-error`,
  checkboxSummary: (id: ConsentItemId) => `consent-${id}-summary`,
} as const;

const EMPTY_ANSWERS: ConsentAnswers = { A: false, B: false, C: false, E: false };

/**
 * initialAnswers 는 **뒤로 가기로 이 화면에 되돌아온 경우에만** 넘어온다.
 * 처음 진입은 인자가 없어 빈 상태로 시작한다 — 동의를 처음 받는 자리에서
 * 체크박스가 미리 체크된 채로 나타나면 안 되기 때문이다.
 */
export function useConsentForm(initialAnswers?: ConsentAnswers) {
  const [answers, setAnswers] = useState<ConsentAnswers>(initialAnswers ?? EMPTY_ANSWERS);

  /**
   * 제출을 시도한 적이 있는지. 오류 메시지는 제출 이후에만 보여준다.
   * 아무것도 안 한 사용자에게 빨간 오류를 미리 띄우지 않기 위한 것.
   */
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const toggleAnswer = useCallback((id: ConsentItemId, checked: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: checked }));
  }, []);

  const requiredAgreedCount = useMemo(
    () => REQUIRED_ITEMS.filter((item) => answers[item.id]).length,
    [answers],
  );

  /**
   * 검증 결과. 화면 순서(위 → 아래)와 같은 순서로 오류를 담는다.
   * 오류 요약의 링크 순서가 화면 순서와 일치해야 사용자가 헤매지 않는다.
   */
  const errors = useMemo<ConsentValidationError[]>(
    () =>
      CONSENT_ITEMS.filter((item) => item.required && !answers[item.id]).map((item) => ({
        key: `consent-${item.id}`,
        targetId: domId.checkbox(item.id),
        message: `[필수] ${item.title}에 동의해 주세요.`,
      })),
    [answers],
  );

  const isComplete = errors.length === 0;

  /** 특정 필드에 오류가 있는지 (제출 시도 전에는 항상 false) */
  const errorFor = useCallback(
    (key: string): string | null => {
      if (!submitAttempted) return null;
      return errors.find((error) => error.key === key)?.message ?? null;
    },
    [errors, submitAttempted],
  );

  const buildRecord = useCallback((): ConsentRecord | null => {
    if (!isComplete) return null;
    return {
      consentVersion: CONSENT_VERSION,
      agreedAt: new Date().toISOString(),
      items: { ...answers },
    };
  }, [isComplete, answers]);

  return {
    answers,
    toggleAnswer,
    requiredAgreedCount,
    requiredTotal: REQUIRED_COUNT,
    errors,
    errorFor,
    isComplete,
    submitAttempted,
    setSubmitAttempted,
    buildRecord,
  };
}
