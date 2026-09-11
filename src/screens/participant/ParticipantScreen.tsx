import { useEffect } from 'react';
import { SaveStatus } from '../../components/a11y/SaveStatus';
import { CONSENT_ITEMS, SUBMISSION_INFO } from '../../data/consentItems';
import { buildResultFilename } from '../../lib/csv';
import { useScreenSetup } from '../../lib/useScreenSetup';
import type { useSession } from '../../state/useSession';
import { PARTICIPANT_ID_PATTERN } from '../../types/participant';
// .page / .section / .btn 등 공용 클래스가 여기 정의되어 있다.
import '../consent/consent.css';

interface ParticipantScreenProps {
  session: ReturnType<typeof useSession>;
}

const LOG_TYPE_LABEL: Record<string, string> = {
  'session-started': '세션 시작',
  'consent-granted': '동의 완료',
  'step-entered': '단계 진입',
  'section-saved': '입력 저장',
  'session-reset': '세션 초기화',
  'save-failed': '저장 실패',
};

/**
 * 2단계 자리표시 화면.
 *
 * 실제 입력 폼(SYSTEM_SPEC 3-2/3-3/3-4)은 아직 없다. 지금은
 *  (1) 동의 게이트가 동작하는지,
 *  (2) 동의 기록과 진행 로그가 화면을 넘어와도 유지되는지
 * 를 눈으로 확인하는 용도다.
 *
 * 아래 "진행 기록"은 개발·검증용 표시다. 실제 폼이 붙으면 참여자에게
 * 보여줄 필요가 없으므로 제거하거나 접어둘 것.
 */
export function ParticipantScreen({ session }: ParticipantScreenProps) {
  const headingRef = useScreenSetup('참여자 정보 입력', true);
  const { draft, consent, log, saveState, saveError, enterStep, reset } = session;

  /*
   * 이 화면에 도착했다는 사실을 로그에 남긴다. 참여자가 어디서 중단했는지
   * 알 수 있어야 이어서 진행시킬 수 있다.
   * 이미 이 단계로 기록돼 있으면(새로고침으로 재진입) 중복 기록하지 않는다.
   */
  useEffect(() => {
    if (draft !== null && draft.currentStep !== 'participant') {
      enterStep('participant');
    }
  }, [draft, enterStep]);

  if (consent === null || draft === null) return null;

  const agreedAtText = new Date(consent.agreedAt).toLocaleString('ko-KR');

  return (
    <main className="page" id="main">
      <p className="page__step">2단계 / 참여자 정보 입력</p>

      <h1 className="page__title" ref={headingRef} tabIndex={-1}>
        참여자 정보 입력
      </h1>

      <SaveStatus state={saveState} error={saveError} />

      <section className="section" aria-labelledby="record-heading">
        <h2 className="section__heading" id="record-heading">
          기록된 동의 내용
        </h2>
        <dl className="detail-list">
          <div className="detail-list__row">
            <dt>동의 일시</dt>
            <dd>{agreedAtText}</dd>
          </div>
          <div className="detail-list__row">
            <dt>동의서 버전</dt>
            <dd>{consent.consentVersion}</dd>
          </div>
          {CONSENT_ITEMS.map((item) => (
            <div className="detail-list__row" key={item.id}>
              <dt>
                [{item.required ? '필수' : '선택'}] {item.title}
              </dt>
              <dd>{consent.items[item.id] ? '동의' : '미동의'}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section" aria-labelledby="next-heading">
        <h2 className="section__heading" id="next-heading">
          남은 단계
        </h2>
        <p className="section__lead">
          아직 구현되지 않았습니다. SYSTEM_SPEC 기준으로 다음 순서로 이어집니다.
        </p>
        <ol className="roadmap">
          <li>
            <strong>기본정보</strong> — 고유 ID(형식 {PARTICIPANT_ID_PATTERN.source}), 성별,
            연령대, 참여 경로, 게임 경력, 선호 장르, 주간 플레이 시간, 접근성 기능 사용 여부
          </li>
          <li>
            <strong>장애정보</strong> — 법정 유형 15개 중 선택(기본 7개 노출 + 그 외 접기),
            유형별 중증·경증, 게임 관련 세부 양상, 주관식 부연 설명
          </li>
          <li>
            <strong>기기 사양</strong> — OS, 모니터·해상도·주사율, 주 입력장치, 시청 거리, 오디오
            출력 방식, 보조기기 모델
          </li>
          <li>
            <strong>역량 테스트</strong> — 선택한 장애 유형에 맞는 테스트 3~4개
          </li>
          <li>
            <strong>결과 제출</strong> — CSV 다운로드 후 이메일 제출
          </li>
        </ol>
      </section>

      <section className="section" aria-labelledby="csv-heading">
        <h2 className="section__heading" id="csv-heading">
          결과 제출 방식
        </h2>
        <p className="section__lead">
          위 단계를 모두 마치면 결과가 CSV 파일 하나로 저장되고, 참여자가 그 파일을 안내된
          주소로 직접 보냅니다. 서버로 전송되는 정보는 없습니다. 그래서 각 단계의 입력은
          값이 바뀔 때마다 이 브라우저에 즉시 기록됩니다.
        </p>
        <dl className="detail-list">
          <div className="detail-list__row">
            <dt>파일명 형식</dt>
            <dd>
              <code>{buildResultFilename('GA11Y-P26-014', new Date(2026, 8, 9))}</code>
            </dd>
          </div>
          <div className="detail-list__row">
            <dt>제출 주소</dt>
            <dd>{SUBMISSION_INFO.email}</dd>
          </div>
        </dl>
      </section>

      <section className="section" aria-labelledby="log-heading">
        <h2 className="section__heading" id="log-heading">
          진행 기록
        </h2>
        <p className="section__lead">
          이 브라우저에 저장된 진행 로그입니다. 개발·검증용 표시이며 실제 폼이 붙으면
          참여자 화면에서는 감춥니다. 세션 {draft.sessionId.slice(0, 8)} · 마지막 저장{' '}
          {new Date(draft.updatedAt).toLocaleString('ko-KR')}
        </p>
        <ol className="roadmap">
          {log.map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              <strong>{LOG_TYPE_LABEL[entry.type] ?? entry.type}</strong>{' '}
              {new Date(entry.at).toLocaleTimeString('ko-KR')}
              {entry.detail ? ` — ${entry.detail}` : ''}
            </li>
          ))}
        </ol>
      </section>

      <div className="actions">
        <button type="button" className="btn btn--secondary" onClick={reset}>
          진행 기록 초기화 (개발용)
        </button>
        <p className="actions__hint">
          저장된 동의와 진행 로그를 지우고 1단계 동의 화면으로 돌아갑니다. 개발·검증 중에만
          사용합니다.
        </p>
      </div>
    </main>
  );
}
