import { CONSENT_VERSION } from '../data/consentItems';
import type { BasicInfo } from '../types/basicInfo';
import type { ConsentRecord } from '../types/consent';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  세션 초안 저장소
 * ─────────────────────────────────────────────────────────────────────────────
 *  이 앱에는 서버가 없다. 참여자는 동의 → 기본정보 → 장애정보 → 기기사양 →
 *  역량 테스트를 모두 끝낸 뒤에야 CSV 파일 하나를 받는다. 그 사이에 창이
 *  닫히거나 새로고침되거나 배터리가 끊기면 지금까지 입력한 전부가 사라진다.
 *  측정까지 30분 이상 걸리는 절차에서 그건 치명적이다.
 *
 *  그래서 화면을 넘어갈 때가 아니라 **값이 바뀔 때마다** 이 저장소에 기록한다.
 *  CSV 는 마지막에 이 초안을 읽어서 만든다.
 *
 *  로그를 함께 남기는 이유:
 *   - "언제 어떤 버전의 문안에 동의했는지"는 법적으로 남아야 한다
 *   - 참여자가 어디서 중단했는지 알 수 있어야 이어서 진행시킬 수 있다
 *   - 저장이 실패한 순간을 사후에 확인할 수 있어야 한다
 *
 *  주의: localStorage 는 이 브라우저·이 기기에만 남는다. 다른 기기로 옮겨지지
 *  않고, 사이트 데이터를 지우면 사라진다. 동의 화면의 안내문이 이 사실을 고지한다.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const STORAGE_KEY = 'gaft.session';

/** 이전 구현이 쓰던 키. 남아 있으면 지운다. */
const LEGACY_KEYS = ['gaft.consent'];

/**
 * 초안 구조가 바뀌면 올린다. 올리면 저장된 초안이 무효가 되어 처음부터
 * 다시 시작한다. 다음 화면(기본정보 등)의 필드를 SessionDraft 에 추가할 때
 * 함께 올릴 것.
 */
export const SESSION_SCHEMA_VERSION = 2;

/** 로그가 무한히 커지지 않게 제한한다. 테스트 단계에서 항목이 빠르게 늘어난다. */
const MAX_LOG_ENTRIES = 400;

/**
 * 참여자가 지나는 단계. SYSTEM_SPEC 3-2~3-5 의 순서를 그대로 따른다.
 * 아직 구현되지 않은 단계는 PlaceholderScreen 이 받는다.
 */
export type SessionStep =
  | 'consent'
  | 'basicInfo'
  | 'disability'
  | 'device'
  | 'tests'
  | 'submit';

export const STEP_ORDER: readonly SessionStep[] = [
  'consent',
  'basicInfo',
  'disability',
  'device',
  'tests',
  'submit',
];

export const STEP_LABEL: Record<SessionStep, string> = {
  consent: '개인정보 수집·이용 동의',
  basicInfo: '참여자 기본정보',
  disability: '장애 정보',
  device: '기기 사양',
  tests: '역량 테스트',
  submit: '결과 제출',
};

export type SessionLogType =
  | 'session-started'
  | 'consent-granted'
  | 'step-entered'
  | 'section-saved'
  | 'session-reset'
  | 'save-failed';

export interface SessionLogEntry {
  /** ISO 8601 */
  at: string;
  type: SessionLogType;
  step?: SessionStep;
  /** 무엇이 저장됐는지 같은 짧은 메모. 개인정보 값 자체는 넣지 않는다. */
  detail?: string;
}

export interface SessionDraft {
  schemaVersion: number;
  /**
   * 이 브라우저 세션의 임의 식별자. 참여자 고유 ID(관리자 발급)와 다른 값이다.
   * 초안이 여러 번 이어서 저장될 때 같은 진행인지 구분하는 용도.
   */
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  currentStep: SessionStep;
  consent: ConsentRecord | null;
  /** 기본정보 (SYSTEM_SPEC 3-2). 입력 중에도 계속 갱신된다. */
  basicInfo: BasicInfo | null;
  log: SessionLogEntry[];
}

/* ── 저장 가능 여부 ────────────────────────────────────────────────────────── */

/**
 * localStorage 를 실제로 쓸 수 있는지 확인한다.
 *
 * 존재 여부만 보면 안 된다. 시크릿 모드나 사이트 데이터 차단 설정에서는
 * 객체는 있지만 setItem 이 예외를 던진다. 그래서 실제로 써보고 지운다.
 *
 * 이 값이 false 면 참여자에게 미리 알려야 한다. 30분 걸리는 측정을 끝냈는데
 * 아무것도 저장되지 않았다는 걸 그때 알게 되면 안 된다.
 */
export function isStorageAvailable(): boolean {
  try {
    const probe = '__gaft_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/* ── 내부 유틸 ─────────────────────────────────────────────────────────────── */

function nowIso(): string {
  return new Date().toISOString();
}

function newSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* 아래 폴백으로 */
  }
  // randomUUID 가 없는 환경(구형 브라우저, 비보안 컨텍스트)용 폴백.
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 로그를 상한에 맞춘다.
 *
 * 그냥 앞에서 자르면 "언제 동의했는지" 같은 지울 수 없는 기록이 먼저 사라진다.
 * 그래서 보존 대상(세션 시작, 동의, 저장 실패)은 남기고 나머지 중 오래된 것만 버린다.
 */
function capLog(log: SessionLogEntry[]): SessionLogEntry[] {
  if (log.length <= MAX_LOG_ENTRIES) return log;

  const keepAlways = new Set<SessionLogType>(['session-started', 'consent-granted', 'save-failed']);
  const pinned = log.filter((entry) => keepAlways.has(entry.type));
  const rest = log.filter((entry) => !keepAlways.has(entry.type));
  const room = Math.max(0, MAX_LOG_ENTRIES - pinned.length);

  // 보존 대상이 상한을 넘길 정도로 많으면 그중 최신만 남긴다.
  if (room === 0) return pinned.slice(-MAX_LOG_ENTRIES);

  return [...pinned, ...rest.slice(-room)].sort((a, b) => a.at.localeCompare(b.at));
}

function isValidDraft(value: unknown): value is SessionDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Partial<SessionDraft>;

  if (draft.schemaVersion !== SESSION_SCHEMA_VERSION) return false;
  if (typeof draft.sessionId !== 'string' || draft.sessionId.length === 0) return false;
  if (typeof draft.createdAt !== 'string' || typeof draft.updatedAt !== 'string') return false;
  if (!Array.isArray(draft.log)) return false;

  /*
   * 동의 기록이 있다면 현재 문안 버전과 같아야 한다.
   * 문안이 개정되면 이전 동의는 무효이므로 초안 전체를 버리고 재동의를 받는다.
   * 부분적으로 살려두면 "구버전 문안에 동의한 사람의 데이터"가 섞인다.
   */
  if (draft.consent !== null) {
    if (typeof draft.consent !== 'object' || draft.consent === null) return false;
    if (draft.consent.consentVersion !== CONSENT_VERSION) return false;
  }

  return true;
}

/** 쓰기 결과. 실패를 조용히 삼키면 참여자가 유실을 모른 채 진행한다. */
export type WriteResult = { ok: true } | { ok: false; reason: string };

function persist(draft: SessionDraft): WriteResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    return { ok: true };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'QuotaExceededError'
        ? '브라우저 저장 공간이 부족합니다.'
        : '이 브라우저에서는 진행 상황을 저장할 수 없습니다.';
    return { ok: false, reason };
  }
}

/* ── 공개 API ──────────────────────────────────────────────────────────────── */

/** 남아 있는 구버전 키를 정리한다. 앱 시작 시 한 번 호출한다. */
export function clearLegacyKeys(): void {
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* 지우지 못해도 진행에 문제 없다. */
    }
  }
}

/**
 * 저장된 초안을 읽는다.
 * 없거나, 형식이 깨졌거나, 스키마·동의서 버전이 달라졌으면 null.
 */
export function loadSession(): SessionDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 새 세션을 시작한다. 기존 초안은 버린다. */
export function startSession(): { draft: SessionDraft; write: WriteResult } {
  const at = nowIso();
  const draft: SessionDraft = {
    schemaVersion: SESSION_SCHEMA_VERSION,
    sessionId: newSessionId(),
    createdAt: at,
    updatedAt: at,
    currentStep: 'consent',
    consent: null,
    basicInfo: null,
    log: [{ at, type: 'session-started' }],
  };
  return { draft, write: persist(draft) };
}

/**
 * 초안을 부분 갱신하고 로그를 남긴다.
 *
 * 다음 화면들이 쓰는 입구다. 필드를 SessionDraft 에 추가하면 이 함수를 그대로
 * 쓸 수 있다. 값이 바뀔 때마다 호출하는 것을 전제로 한다.
 *
 * 갱신된 초안을 항상 돌려준다 — 쓰기가 실패해도 화면의 메모리 상태는 이어져야
 * 하므로, 실패는 write 로 알리고 진행을 막지는 않는다.
 */
export function updateSession(
  current: SessionDraft,
  patch: Partial<Omit<SessionDraft, 'schemaVersion' | 'sessionId' | 'createdAt' | 'log'>>,
  logEntry?: Omit<SessionLogEntry, 'at'>,
): { draft: SessionDraft; write: WriteResult } {
  const at = nowIso();
  const log = logEntry ? capLog([...current.log, { at, ...logEntry }]) : current.log;

  const draft: SessionDraft = { ...current, ...patch, updatedAt: at, log };
  const write = persist(draft);

  if (!write.ok) {
    /*
     * 실패 사실을 로그에도 남긴다. 저장 자체가 안 되는 상황이면 이 로그도
     * 디스크에 못 남지만, 메모리 상태로는 화면이 경고를 띄울 수 있다.
     */
    const failed: SessionDraft = {
      ...draft,
      log: capLog([...draft.log, { at, type: 'save-failed', detail: write.reason }]),
    };
    return { draft: failed, write };
  }

  return { draft, write };
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
