import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ErrorSummary } from '../../components/a11y/ErrorSummary';
import { LiveRegion } from '../../components/a11y/LiveRegion';
import {
  CONSENT_NOTICE,
  CONSENT_VERSION,
  CONTACT_INFO,
  OPTIONAL_ITEMS,
  REQUIRED_ITEMS,
} from '../../data/consentItems';
import { useScreenSetup } from '../../lib/useScreenSetup';
import { useConsentForm } from '../../state/useConsentForm';
import type { ConsentRecord } from '../../types/consent';
import { AgeVerification } from './AgeVerification';
import { ConsentItem } from './ConsentItem';
import { RequiredProgress } from './RequiredProgress';
import './consent.css';

interface ConsentScreenProps {
  onComplete: (record: ConsentRecord) => void;
}

export function ConsentScreen({ onComplete }: ConsentScreenProps) {
  const headingRef = useScreenSetup('개인정보 수집·이용 동의', false);
  const form = useConsentForm();
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  /** 조건부 필드 등장처럼, 화면 구조가 바뀐 사실만 알리는 안내문 */
  const [announcement, setAnnouncement] = useState('');

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

  /* 법정대리인 입력란이 나타나거나 사라진 사실을 알린다. 첫 렌더는 건너뛴다. */
  const previousNeedsGuardian = useRef(form.needsGuardian);
  useEffect(() => {
    if (previousNeedsGuardian.current === form.needsGuardian) return;
    previousNeedsGuardian.current = form.needsGuardian;
    setAnnouncement(
      form.needsGuardian
        ? '법정대리인 정보 입력란 3개가 아래에 추가되었습니다.'
        : '법정대리인 정보 입력란이 제거되었습니다.',
    );
  }, [form.needsGuardian]);

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
    ? '필수 항목 동의가 완료되었습니다. 참여자 정보 입력 화면으로 이동합니다.'
    : remaining > 0
      ? `필수 항목 ${remaining}건과 연령 확인이 아직 남아 있습니다.`
      : '연령 확인이 아직 남아 있습니다.';

  return (
    <main className="page" id="main">
      <p className="page__step">1단계 / 개인정보 수집·이용 동의</p>

      <h1 className="page__title" ref={headingRef} tabIndex={-1}>
        개인정보 수집·이용 동의
      </h1>

      {/* 화면 구조 변화 안내 전용 영역. 항상 DOM 에 존재해야 한다. */}
      <LiveRegion message={announcement} />

      <section className="notice" aria-labelledby="notice-heading">
        <h2 className="notice__heading" id="notice-heading">
          먼저 확인해 주세요
        </h2>
        <ul className="notice__list">
          <li>{CONSENT_NOTICE.purpose}</li>
          <li>{CONSENT_NOTICE.duration}</li>
          <li>
            <strong>{CONSENT_NOTICE.refusal}</strong>
          </li>
          <li>
            <strong>{CONSENT_NOTICE.withdrawal}</strong>
          </li>
          <li>
            <strong>{CONSENT_NOTICE.reward}</strong>
          </li>
          <li>{CONSENT_NOTICE.optionalNotice}</li>
        </ul>
      </section>

      <RequiredProgress agreed={form.requiredAgreedCount} total={form.requiredTotal} />

      <form onSubmit={handleSubmit} noValidate>
        <ErrorSummary
          ref={errorSummaryRef}
          errors={form.submitAttempted ? form.errors : []}
          headingId="error-summary-heading"
        />

        <section className="section" aria-labelledby="required-section-heading">
          <h2 className="section__heading" id="required-section-heading">
            필수 동의 항목
          </h2>
          <fieldset>
            <legend className="visually-hidden">
              필수 동의 항목 {REQUIRED_ITEMS.length}건. 모두 동의해야 참여할 수 있습니다.
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

        <section className="section" aria-labelledby="optional-section-heading">
          <h2 className="section__heading" id="optional-section-heading">
            선택 동의 항목
          </h2>
          <p className="section__lead">
            아래 {OPTIONAL_ITEMS.length}건은 선택 항목입니다. 동의하지 않으셔도 측정 참여와 보상에
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

        <AgeVerification
          ageBracket={form.ageBracket}
          onAgeChange={form.setAgeBracket}
          guardian={form.guardian}
          onGuardianChange={form.updateGuardian}
          errorFor={form.errorFor}
        />

        <div className="actions">
          {/*
           * 제출 버튼을 disabled 로 잠그지 않는다. 눌러야 무엇이 부족한지
           * 알 수 있고, disabled 버튼은 포커스를 받지 못해 스크린리더
           * 사용자가 존재를 놓치기 쉽다. 대신 aria-describedby 로 남은
           * 조건을 항상 알려준다.
           */}
          <button type="submit" className="btn btn--primary" aria-describedby="submit-hint">
            동의하고 참여자 정보 입력으로
          </button>
          <p className="actions__hint" id="submit-hint">
            {submitHint}
          </p>
        </div>
      </form>

      <footer className="page__footer">
        <h2 className="page__footer-heading">문의 및 동의 철회</h2>
        <dl className="detail-list">
          <div className="detail-list__row">
            <dt>개인정보 처리자</dt>
            <dd>{CONTACT_INFO.controller}</dd>
          </div>
          <div className="detail-list__row">
            <dt>개인정보 보호책임자</dt>
            <dd>{CONTACT_INFO.officer}</dd>
          </div>
          <div className="detail-list__row">
            <dt>이메일</dt>
            <dd>{CONTACT_INFO.email}</dd>
          </div>
          <div className="detail-list__row">
            <dt>전화</dt>
            <dd>{CONTACT_INFO.phone}</dd>
          </div>
        </dl>
        <p className="page__version">동의서 버전: {CONSENT_VERSION}</p>
      </footer>
    </main>
  );
}
