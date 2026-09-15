import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ErrorSummary } from '../../components/a11y/ErrorSummary';
import { SaveStatus } from '../../components/a11y/SaveStatus';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import {
  CONSENT_NOTICE,
  CONSENT_VERSION,
  CONTACT_EMAIL,
  DATA_FLOW_NOTICE,
  OPTIONAL_ITEMS,
  REQUIRED_ITEMS,
} from '../../data/consentItems';
import { nextStepLabel } from '../../lib/sessionStore';
import { useScreenSetup } from '../../lib/useScreenSetup';
import { useConsentForm } from '../../state/useConsentForm';
import type { ConsentAnswers, ConsentRecord } from '../../types/consent';
import { ConsentItem } from './ConsentItem';
import './consent.css';

interface ConsentScreenProps {
  onComplete: (record: ConsentRecord) => void;
  /**
   * 이 브라우저에서 진행 상황을 저장할 수 있는지.
   * false 면 시작 전에 알려야 한다 — 측정을 다 끝낸 뒤에 유실을 알게 되면 안 된다.
   */
  storageAvailable: boolean;
  /**
   * 체크박스의 초기 상태. **개발용 뒤로 가기**(src/devFlags.ts)로 이 화면에
   * 다시 들어왔을 때만 넘어온다. 정상 진입은 undefined 라 빈 상태로 시작한다.
   */
  initialAnswers?: ConsentAnswers;
}

export function ConsentScreen({
  onComplete,
  storageAvailable,
  initialAnswers,
}: ConsentScreenProps) {
  /*
   * 첫 진입에는 포커스를 빼앗지 않는다(읽기부터 시작하는 화면이다).
   * 다만 뒤로 가기로 되돌아온 경우에는 눌렀던 버튼이 사라지면서 포커스가
   * body 로 튕기므로, 그때는 제목으로 옮겨 위치를 알려준다.
   */
  const headingRef = useScreenSetup('개인정보 수집·이용 동의', initialAnswers !== undefined);
  const form = useConsentForm(initialAnswers);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  /**
   * 제출 실패 횟수. 오류 요약으로 포커스를 옮기는 트리거로만 쓴다.
   *
   * requestAnimationFrame 으로 포커스를 옮기면 안 된다. rAF 는 탭이
   * 백그라운드이거나 렌더링이 스로틀된 상태에서 실행되지 않으므로,
   * 그런 상황에서 스크린리더 사용자가 제출 실패 피드백을 전혀 받지 못한다.
   * (실측으로 확인된 문제다.)
   * useEffect 는 커밋 직후 프레임 스케줄링과 무관하게 실행된다.
   *
   * 실패할 때마다 값이 올라가므로, 같은 오류로 다시 제출해도 포커스가 다시 잡힌다.
   */
  const [failedSubmitCount, setFailedSubmitCount] = useState(0);

  useEffect(() => {
    if (failedSubmitCount === 0) return;
    errorSummaryRef.current?.focus();
    errorSummaryRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [failedSubmitCount]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.setSubmitAttempted(true);

    const record = form.buildRecord();
    if (!record) {
      // 포커스 이동은 위 useEffect 가 담당한다.
      setFailedSubmitCount((count) => count + 1);
      return;
    }

    onComplete(record);
  };

  const remaining = form.requiredTotal - form.requiredAgreedCount;
  const submitHint = form.isComplete
    ? '모든 항목에 동의하셨습니다. 참여자 정보 입력 화면으로 이동합니다.'
    : `아직 동의하지 않은 항목이 ${remaining}건 있습니다.`;

  return (
    <main className="page" id="main">
      <p className="page__step">1단계 / 개인정보 수집·이용 동의</p>

      <h1 className="page__title" ref={headingRef} tabIndex={-1}>
        개인정보 수집·이용 동의
      </h1>

      {/* 읽기 시작 전에 바꿀 수 있어야 하므로 본문 맨 앞에 둔다. */}
      <ThemeToggle />

      <section className="notice" aria-labelledby="notice-heading">
        <h2 className="notice__heading" id="notice-heading">
          먼저 확인해 주세요
        </h2>
        <ul className="notice__list">
          <li>{CONSENT_NOTICE.purpose}</li>
          <li>{CONSENT_NOTICE.quit}</li>
          <li>
            <strong>{CONSENT_NOTICE.refusal}</strong>
          </li>
        </ul>
      </section>

      {/*
       * 데이터가 서버로 가지 않는다는 사실은 참여자의 판단에 직접 영향을 주므로
       * "자세히 보기" 안에 묻지 않고 항목 목록 앞에 펼쳐서 보여준다.
       */}
      <section className="notice notice--flow" aria-labelledby="flow-heading">
        <h2 className="notice__heading" id="flow-heading">
          입력한 정보의 기록과 전달
        </h2>
        <ul className="notice__list">
          {DATA_FLOW_NOTICE.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {/* 저장이 불가능한 환경이면 동의 전에 알린다. */}
      {!storageAvailable ? (
        <SaveStatus state="unavailable" error={null} />
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <ErrorSummary
          ref={errorSummaryRef}
          errors={form.submitAttempted ? form.errors : []}
          headingId="error-summary-heading"
        />

        <section className="section" aria-labelledby="required-section-heading">
          <h2 className="section__heading" id="required-section-heading">
            동의 항목
          </h2>
          <fieldset>
            <legend className="visually-hidden">
              동의 항목 {REQUIRED_ITEMS.length}건. 모두 동의해야 참여할 수 있습니다.
            </legend>
            <ul className="consent-list">
              {REQUIRED_ITEMS.map((item) => (
                <ConsentItem
                  key={item.id}
                  item={item}
                  checked={form.answers[item.id]}
                  onChange={(checked) => form.toggleAnswer(item.id, checked)}
                  error={form.errorFor(`consent-${item.id}`)}
                />
              ))}
            </ul>
          </fieldset>
        </section>

        {/*
         * 현재 선택 항목은 없다. 섹션을 지우는 대신 조건부로 두어, 나중에
         * 선택 항목이 추가되면 consentItems.ts 만 고쳐도 그대로 렌더된다.
         */}
        {OPTIONAL_ITEMS.length > 0 ? (
          <section className="section" aria-labelledby="optional-section-heading">
            <h2 className="section__heading" id="optional-section-heading">
              선택 동의 항목
            </h2>
            <p className="section__lead">
              아래 {OPTIONAL_ITEMS.length}건은 선택 항목입니다. 동의하지 않으셔도 측정 참여에
              아무런 영향이 없습니다.
            </p>
            <fieldset>
              <legend className="visually-hidden">
                선택 동의 항목 {OPTIONAL_ITEMS.length}건. 동의하지 않아도 참여할 수 있습니다.
              </legend>
              <ul className="consent-list">
                {OPTIONAL_ITEMS.map((item) => (
                  <ConsentItem
                    key={item.id}
                    item={item}
                    checked={form.answers[item.id]}
                    onChange={(checked) => form.toggleAnswer(item.id, checked)}
                  />
                ))}
              </ul>
            </fieldset>
          </section>
        ) : null}

        <div className="actions">
          {/*
           * 제출 버튼을 disabled 로 잠그지 않는다. 눌러야 무엇이 부족한지
           * 알 수 있고, disabled 버튼은 포커스를 받지 못해 스크린리더
           * 사용자가 존재를 놓치기 쉽다. 대신 aria-describedby 로 남은
           * 조건을 항상 알려준다.
           */}
          <button type="submit" className="btn btn--primary" aria-describedby="submit-hint">
            {nextStepLabel('consent')}
          </button>
          <p className="actions__hint" id="submit-hint">
            {submitHint}
          </p>
        </div>
      </form>

      <footer className="page__footer">
        <h2 className="page__footer-heading">문의 및 동의 철회</h2>
        <p className="section__lead">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p className="page__version">동의서 버전: {CONSENT_VERSION}</p>
      </footer>
    </main>
  );
}
