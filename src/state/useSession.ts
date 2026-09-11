import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearLegacyKeys,
  clearSession,
  isStorageAvailable,
  loadSession,
  startSession,
  updateSession,
} from '../lib/sessionStore';
import type { SessionDraft, SessionLogEntry, SessionStep } from '../lib/sessionStore';
import type { ConsentRecord } from '../types/consent';

/**
 * 저장 상태. 화면에 그대로 표시해서 참여자가 눈으로 확인할 수 있게 한다.
 *
 *  unavailable — 이 브라우저에서 저장이 아예 안 된다 (시크릿 모드 등)
 *  idle        — 아직 저장할 것이 없다
 *  saved       — 최근 변경이 저장됐다
 *  failed      — 저장을 시도했지만 실패했다 (용량 초과 등)
 */
export type SaveState = 'unavailable' | 'idle' | 'saved' | 'failed';

/**
 * 세션 초안을 다루는 단일 입구.
 *
 * 화면은 이 훅만 쓰고 sessionStore 를 직접 건드리지 않는다. 그래야 저장 시점과
 * 로그 기록이 한 곳에 모여, "어떤 화면은 저장을 빼먹었다"는 상황이 생기지 않는다.
 */
export function useSession() {
  const storageAvailable = useMemo(() => isStorageAvailable(), []);

  const [draft, setDraft] = useState<SessionDraft | null>(() => {
    if (!storageAvailable) return null;
    clearLegacyKeys();
    return loadSession();
  });

  const [saveState, setSaveState] = useState<SaveState>(
    storageAvailable ? 'idle' : 'unavailable',
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  /*
   * 저장이 불가능한 환경에서도 진행은 되게 한다. 다만 메모리에만 남으므로
   * 새로고침하면 사라진다 — 그 사실은 화면이 경고로 알린다.
   */
  const memoryOnly = useRef(!storageAvailable);

  const applyResult = useCallback(
    (result: { draft: SessionDraft; write: { ok: boolean; reason?: string } }) => {
      setDraft(result.draft);
      if (memoryOnly.current) {
        setSaveState('unavailable');
        return result.draft;
      }
      if (result.write.ok) {
        setSaveState('saved');
        setSaveError(null);
      } else {
        setSaveState('failed');
        setSaveError(result.write.reason ?? '저장에 실패했습니다.');
      }
      return result.draft;
    },
    [],
  );

  /** 동의 완료 시점에 세션을 열고 동의 기록과 로그를 남긴다. */
  const grantConsent = useCallback(
    (consent: ConsentRecord) => {
      const started = startSession();
      const result = updateSession(
        started.draft,
        { consent, currentStep: 'participant' },
        {
          type: 'consent-granted',
          step: 'consent',
          // 동의한 항목 id 만 남긴다. 문안 전문이나 개인정보 값은 넣지 않는다.
          detail: `${consent.consentVersion} / 동의 항목: ${Object.entries(consent.items)
            .filter(([, agreed]) => agreed)
            .map(([id]) => id)
            .join(', ')}`,
        },
      );
      return applyResult(result);
    },
    [applyResult],
  );

  /**
   * 값이 바뀔 때마다 호출한다. 화면 전환 시점까지 기다리지 않는다.
   * patch 에 다음 화면들의 필드를 넣으면 그대로 저장된다.
   */
  const save = useCallback(
    (
      patch: Parameters<typeof updateSession>[1],
      logEntry?: Omit<SessionLogEntry, 'at'>,
    ) => {
      setDraft((current) => {
        if (current === null) return current;
        const result = updateSession(current, patch, logEntry);
        // setState 안에서 부수효과를 내지 않도록, 저장 상태는 다음 틱에 반영한다.
        queueMicrotask(() => applyResult(result));
        return result.draft;
      });
    },
    [applyResult],
  );

  const enterStep = useCallback(
    (step: SessionStep) => {
      save({ currentStep: step }, { type: 'step-entered', step });
    },
    [save],
  );

  const reset = useCallback(() => {
    clearSession();
    setDraft(null);
    setSaveState(storageAvailable ? 'idle' : 'unavailable');
    setSaveError(null);
  }, [storageAvailable]);

  /*
   * 다른 탭에서 같은 세션을 지우거나 바꿨을 때 이 탭이 낡은 상태로 남지 않게 한다.
   * 참여자가 실수로 두 탭을 열어 두 갈래로 입력하는 상황을 막는다.
   */
  useEffect(() => {
    if (!storageAvailable) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== 'gaft.session') return;
      setDraft(loadSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageAvailable]);

  return {
    draft,
    consent: draft?.consent ?? null,
    log: draft?.log ?? [],
    saveState,
    saveError,
    storageAvailable,
    grantConsent,
    save,
    enterStep,
    reset,
  };
}
