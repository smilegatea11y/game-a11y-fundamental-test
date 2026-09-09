import { useCallback, useMemo, useState } from 'react';
import {
  CONSENT_ITEMS,
  CONSENT_VERSION,
  REQUIRED_COUNT,
  REQUIRED_ITEMS,
} from '../data/consentItems';
import type {
  AgeBracket,
  ConsentAnswers,
  ConsentItemId,
  ConsentRecord,
  ConsentValidationError,
  GuardianInfo,
} from '../types/consent';

/** DOM id 생성 규칙을 한 곳에 모아둔다. 오류 요약이 여기로 포커스를 옮긴다. */
export const domId = {
  checkbox: (id: ConsentItemId) => `consent-${id}`,
  checkboxError: (id: ConsentItemId) => `consent-${id}-error`,
  checkboxSummary: (id: ConsentItemId) => `consent-${id}-summary`,
  ageGroup: 'age-bracket',
  ageFirstOption: 'age-bracket-over14',
  ageError: 'age-bracket-error',
  guardianField: (field: keyof GuardianInfo) => `guardian-${field}`,
  guardianFieldError: (field: keyof GuardianInfo) => `guardian-${field}-error`,
} as const;

const EMPTY_ANSWERS: ConsentAnswers = { A: false, B: false, C: false, D: false, E: false };
const EMPTY_GUARDIAN: GuardianInfo = { name: '', relation: '', contact: '' };

const GUARDIAN_FIELD_LABELS: Record<keyof GuardianInfo, string> = {
  name: '법정대리인 성명',
  relation: '참여자와의 관계',
  contact: '법정대리인 연락처',
};

/**
 * 받침 유무에 따라 목적격 조사를 고른다. ("성명을" / "관계를")
 *
 * "을(를)" 같은 병기 표기를 쓰면 스크린리더가 "을 괄호 를 괄호닫기" 로 읽어
 * 문장이 끊긴다. 오류 메시지는 스크린리더로 듣는 경우가 많으므로 조사를 정확히
 * 골라야 한다.
 *
 * 한글 음절은 0xAC00 부터 (초성 19 × 중성 21 × 종성 28) 순서로 배열되어 있어,
 * (코드 - 0xAC00) % 28 이 0 이면 종성(받침)이 없다.
 */
function withObjectParticle(word: string): string {
  // String.prototype.at 은 ES2022 이므로, 컴파일 target(ES2020)에 맞춰 인덱스로 접근한다.
  const code = word.charCodeAt(word.length - 1);
  const isHangulSyllable = code >= 0xac00 && code <= 0xd7a3;
  if (!isHangulSyllable) return `${word}을`;
  const hasFinalConsonant = (code - 0xac00) % 28 !== 0;
  return `${word}${hasFinalConsonant ? '을' : '를'}`;
}

export function useConsentForm() {
  const [answers, setAnswers] = useState<ConsentAnswers>(EMPTY_ANSWERS);
  const [ageBracket, setAgeBracket] = useState<AgeBracket | null>(null);
  const [guardian, setGuardian] = useState<GuardianInfo>(EMPTY_GUARDIAN);

  /**
   * 제출을 시도한 적이 있는지. 오류 메시지는 제출 이후에만 보여준다.
   * 아무것도 안 한 사용자에게 빨간 오류를 미리 띄우지 않기 위한 것.
   */
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const toggleAnswer = useCallback((id: ConsentItemId, checked: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: checked }));
  }, []);

  const updateGuardian = useCallback((field: keyof GuardianInfo, value: string) => {
    setGuardian((prev) => ({ ...prev, [field]: value }));
  }, []);

  const requiredAgreedCount = useMemo(
    () => REQUIRED_ITEMS.filter((item) => answers[item.id]).length,
    [answers],
  );

  const needsGuardian = ageBracket === 'under14';

  /**
   * 검증 결과. 화면 순서(위 → 아래)와 같은 순서로 오류를 담는다.
   * 오류 요약의 링크 순서가 화면 순서와 일치해야 사용자가 헤매지 않는다.
   */
  const errors = useMemo<ConsentValidationError[]>(() => {
    const list: ConsentValidationError[] = [];

    for (const item of CONSENT_ITEMS) {
      if (item.required && !answers[item.id]) {
        list.push({
          key: `consent-${item.id}`,
          targetId: domId.checkbox(item.id),
          message: `[필수] ${item.title}에 동의해 주세요.`,
        });
      }
    }

    if (ageBracket === null) {
      list.push({
        key: 'age-bracket',
        targetId: domId.ageFirstOption,
        message: '참여자 연령을 선택해 주세요. (만 14세 이상 / 만 14세 미만)',
      });
    }

    if (needsGuardian) {
      for (const field of ['name', 'relation', 'contact'] as const) {
        if (!guardian[field].trim()) {
          list.push({
            key: `guardian-${field}`,
            targetId: domId.guardianField(field),
            message: `${withObjectParticle(GUARDIAN_FIELD_LABELS[field])} 입력해 주세요.`,
          });
        }
      }
    }

    return list;
  }, [answers, ageBracket, guardian, needsGuardian]);

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
    if (!isComplete || ageBracket === null) return null;
    return {
      consentVersion: CONSENT_VERSION,
      agreedAt: new Date().toISOString(),
      items: { ...answers },
      ageBracket,
      guardian: needsGuardian
        ? {
            name: guardian.name.trim(),
            relation: guardian.relation.trim(),
            contact: guardian.contact.trim(),
          }
        : null,
    };
  }, [isComplete, ageBracket, answers, needsGuardian, guardian]);

  return {
    answers,
    toggleAnswer,
    ageBracket,
    setAgeBracket,
    needsGuardian,
    guardian,
    updateGuardian,
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
