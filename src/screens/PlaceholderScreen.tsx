import { SaveStatus } from '../components/a11y/SaveStatus';
import { StepBackButton } from '../components/dev/StepBackButton';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { SUBMISSION_INFO } from '../data/consentItems';
import { TYPE_LABEL } from '../data/disabilityFields';
import { buildResultFilename } from '../lib/csv';
import { STEP_LABEL, STEP_ORDER } from '../lib/sessionStore';
import type { SessionStep } from '../lib/sessionStore';
import { useScreenSetup } from '../lib/useScreenSetup';
import type { useSession } from '../state/useSession';
import './consent/consent.css';

interface PlaceholderScreenProps {
  step: SessionStep;
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
 * 아직 만들지 않은 단계를 받는 공용 화면.
 *
 * 단계별로 빈 화면을 따로 만들면 나중에 실제 화면으로 바꿀 때마다 지워야 할
 * 파일이 늘어난다. 하나로 받고, 해당 단계가 구현되면 App 의 분기에서 빼면 된다.
 *
 * 아래 "진행 기록"은 개발·검증용 표시다. 실제 화면이 모두 붙으면 제거한다.
 */
export function PlaceholderScreen({ step, session }: PlaceholderScreenProps) {
  const label = STEP_LABEL[step];
  const headingRef = useScreenSetup(label, true);
  const { draft, log, saveState, saveError, reset } = session;

  const stepNumber = STEP_ORDER.indexOf(step) + 1;
  // 개발용 뒤로 가기 목적지. src/devFlags.ts 와 함께 삭제한다.
  const previousStep = STEP_ORDER[STEP_ORDER.indexOf(step) - 1] ?? null;
  const basicInfo = draft?.basicInfo ?? null;
  const disability = draft?.disability ?? null;
  const deviceSpec = draft?.deviceSpec ?? null;

  return (
    <main className="page" id="main">
      <p className="page__step">
        {stepNumber}단계 / {label}
      </p>

      <h1 className="page__title" ref={headingRef} tabIndex={-1}>
        {label}
      </h1>

      <ThemeToggle />

      <SaveStatus state={saveState} error={saveError} />

      <section className="notice" aria-labelledby="pending-heading">
        <h2 className="notice__heading" id="pending-heading">
          이 단계는 아직 준비 중입니다
        </h2>
        <ul className="notice__list">
          <li>
            <strong>지금까지 입력하신 내용은 저장되어 있습니다.</strong> 창을 닫아도 이 브라우저에서
            이어서 하실 수 있습니다.
          </li>
          <li>남은 단계가 완성되면 이어서 진행하시게 됩니다.</li>
        </ul>
      </section>

      {/*
        * 지금까지 저장된 내용 요약. 개발·검증용 표시이며 실제 화면이 모두
        * 붙으면 제거한다. 값 자체보다 "어디까지 저장됐는지"를 보기 위한 것이라
        * 민감한 자유 서술(장애 주관식)은 길이만 표시하고 내용은 싣지 않는다.
        */}
      {(basicInfo !== null || disability !== null || deviceSpec !== null) ? (
        <section className="section" aria-labelledby="saved-heading">
          <h2 className="section__heading" id="saved-heading">
            저장된 입력 내용
          </h2>
          <dl className="detail-list">
            {basicInfo !== null ? (
              <>
                <div className="detail-list__row">
                  <dt>고유 ID</dt>
                  <dd>
                    <code>{basicInfo.participantId || '(미입력)'}</code>
                  </dd>
                </div>
                <div className="detail-list__row">
                  <dt>선호 장르</dt>
                  <dd>{basicInfo.genres.length > 0 ? basicInfo.genres.join(', ') : '(미입력)'}</dd>
                </div>
                <div className="detail-list__row">
                  <dt>평소 보조기기</dt>
                  <dd>
                    {basicInfo.dailyAssistiveDeviceUse === 'yes'
                      ? `사용 — ${basicInfo.dailyAssistiveDeviceNames || '명칭 미입력'}`
                      : basicInfo.dailyAssistiveDeviceUse === 'no'
                        ? '사용하지 않음'
                        : '(미입력)'}
                  </dd>
                </div>
              </>
            ) : null}

            {disability !== null ? (
              <>
                <div className="detail-list__row">
                  <dt>장애 유형</dt>
                  <dd>
                    {disability.types.length > 0
                      ? disability.types.map((t) => TYPE_LABEL[t]).join(', ')
                      : '(미입력)'}
                  </dd>
                </div>
                <div className="detail-list__row">
                  <dt>세부 양상</dt>
                  <dd>
                    {Object.values(disability.aspectsByGroup).flat().length > 0
                      ? `${Object.values(disability.aspectsByGroup).flat().length}건 선택`
                      : '(미입력)'}
                  </dd>
                </div>
                <div className="detail-list__row">
                  <dt>주관식 설명</dt>
                  <dd>
                    {disability.narrative.length > 0
                      ? `${disability.narrative.length}자 입력됨`
                      : '(비워둠 — 선택 항목)'}
                  </dd>
                </div>
              </>
            ) : null}

            {deviceSpec !== null ? (
              <>
                <div className="detail-list__row">
                  <dt>주 입력장치</dt>
                  <dd>
                    {deviceSpec.inputDevices.length > 0
                      ? deviceSpec.inputDevices.join(', ')
                      : '(미입력)'}
                  </dd>
                </div>
                <div className="detail-list__row">
                  <dt>게임용 보조기기</dt>
                  <dd>
                    {deviceSpec.gameAssistiveUse === 'gameSpecific'
                      ? `게임 전용 — ${deviceSpec.gameAssistiveNames || '명칭 미입력'}`
                      : deviceSpec.gameAssistiveUse === 'sameAsDaily'
                        ? '평소 쓰는 것과 동일'
                        : deviceSpec.gameAssistiveUse === 'none'
                          ? '사용하지 않음'
                          : '(미입력)'}
                  </dd>
                </div>
                <div className="detail-list__row">
                  <dt>그 외 게임 기기</dt>
                  <dd>
                    {deviceSpec.extraDevices.length > 0
                      ? deviceSpec.extraDevices.map((d) => d.modelName).join(', ')
                      : '(없음)'}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}

      <section className="section" aria-labelledby="remaining-heading">
        <h2 className="section__heading" id="remaining-heading">
          전체 단계
        </h2>
        <ol className="roadmap">
          {STEP_ORDER.map((s, index) => (
            <li key={s}>
              <strong>
                {index + 1}. {STEP_LABEL[s]}
              </strong>
              {s === step ? ' — 준비 중' : index < stepNumber - 1 ? ' — 완료' : ''}
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="csv-heading">
        <h2 className="section__heading" id="csv-heading">
          결과 제출 방식
        </h2>
        <p className="section__lead">
          모든 단계를 마치면 결과가 CSV 파일 하나로 저장되고, 참여자가 그 파일을 안내된 주소로
          직접 보냅니다. 서버로 전송되는 정보는 없습니다.
        </p>
        <dl className="detail-list">
          <div className="detail-list__row">
            <dt>파일명 형식</dt>
            <dd>
              <code>
                {buildResultFilename(
                  basicInfo?.participantId || 'GA11Y-P26-014',
                  new Date(2026, 8, 9),
                )}
              </code>
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
          이 브라우저에 저장된 진행 로그입니다. 개발·검증용 표시이며 실제 화면이 모두 붙으면
          제거합니다.
          {draft !== null
            ? ` 세션 ${draft.sessionId.slice(0, 8)} · 마지막 저장 ${new Date(
                draft.updatedAt,
              ).toLocaleString('ko-KR')}`
            : ''}
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
          저장된 동의와 입력, 진행 로그를 지우고 1단계 동의 화면으로 돌아갑니다. 개발·검증 중에만
          사용합니다.
        </p>
        {previousStep !== null ? <StepBackButton session={session} to={previousStep} /> : null}
      </div>
    </main>
  );
}
