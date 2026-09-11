import { CONSENT_VERSION, REQUIRED_ITEM_IDS } from '../data/consentItems';
import type { ConsentRecord } from '../types/consent';

const STORAGE_KEY = 'gaft.consent';

/**
 * 저장된 값이 실제로 ConsentRecord 인지, 그리고 아직 유효한지 확인한다.
 *
 * 유효 조건:
 *  - 저장된 동의서 버전이 현재 문안 버전과 같아야 한다.
 *    (문안이 개정되면 구버전 동의는 무효 → 참여자에게 다시 동의를 받는다)
 *  - 필수 항목이 모두 true 여야 한다.
 */
function isValidRecord(value: unknown): value is ConsentRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<ConsentRecord>;

  if (record.consentVersion !== CONSENT_VERSION) return false;
  if (typeof record.agreedAt !== 'string') return false;

  const items = record.items;
  if (typeof items !== 'object' || items === null) return false;
  if (!REQUIRED_ITEM_IDS.every((id) => items[id] === true)) return false;

  return true;
}

/**
 * 동의 기록을 읽는다. 없거나, 형식이 깨졌거나, 문안 버전이 달라졌으면 null.
 * localStorage 접근 자체가 실패할 수 있으므로(시크릿 모드, 사이트 데이터 차단)
 * 반드시 try/catch 로 감싼다.
 */
export function loadConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 저장 실패는 치명적이지 않다. 앱 상태에는 이미 반영돼 있으므로 조용히 넘어간다. */
export function saveConsent(record: ConsentRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* 저장 불가 환경 — 세션 내에서는 앱 상태로 계속 진행한다. */
  }
}

export function clearConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
