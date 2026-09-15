import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ErrorSummary } from '../../components/a11y/ErrorSummary';
import { LiveRegion } from '../../components/a11y/LiveRegion';
import { SaveStatus } from '../../components/a11y/SaveStatus';
import { StepBackButton } from '../../components/dev/StepBackButton';
import { OptionGroup } from '../../components/ui/OptionGroup';
import { TextArea } from '../../components/ui/TextArea';
import { TextField } from '../../components/ui/TextField';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import {
  AFFECTED_AREA_OPTIONS,
  ASPECT_GROUP_MAP,
  DISABILITY_COPY as C,
  NARRATIVE_EXAMPLES,
  PRIMARY_TYPE_OPTIONS,
  REGISTRATION_OPTIONS,
  SECONDARY_TYPE_OPTIONS,
  SEVERITY_OPTIONS,
  SIDE_OPTIONS,
  SIDE_OPTIONS_WITH_BOTH,
} from '../../data/disabilityFields';
import { nextStepLabel } from '../../lib/sessionStore';
import { useScreenSetup } from '../../lib/useScreenSetup';
import { disabilityDomId as domId, useDisabilityForm } from '../../state/useDisabilityForm';
import type { useSession } from '../../state/useSession';
import { sideKey } from '../../types/disability';
import type { AspectGroup } from '../../types/disability';
import '../consent/consent.css';

interface DisabilityScreenProps {
  session: ReturnType<typeof useSession>;
  onComplete: () => void;
}

export function DisabilityScreen({ session, onComplete }: DisabilityScreenProps) {
  const headingRef = useScreenSetup('장애 정보', true);
  const form = useDisabilityForm(session.draft?.disability ?? null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [failedSubmitCount, setFailedSubmitCount] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  /*
   * 즉시 저장. 각 onToggle 안에서 "다음 값"을 손으로 계산하지 않는다.
   * 유형 해제 시 딸린 값을 버리는 규칙이 훅에 있으므로, 화면에서 다시
   * 계산하면 두 곳이 어긋난다. 폼 값 변화를 한 곳에서 받아 저장한다.
   *
   * 로그는 남기지 않는다 — 한 글자마다 쌓으면 상한(400)이 금방 차서
   * "어디서 중단했는지"가 밀려난다. 제출 같은 분기점에만 남긴다.
   */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    session.save({ disability: form.value });
    // session 객체는 매 렌더 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.value]);

  /*
   * 포커스 이동을 requestAnimationFrame 에 의존하지 않는다. rAF 는 탭이
   * 백그라운드이거나 렌더링이 스로틀되면 실행되지 않아, 스크린리더 사용자가
   * 제출 실패 피드백을 전혀 받지 못한다. (실측으로 확인된 문제)
   */
  useEffect(() => {
    if (failedSubmitCount === 0) return;
    errorSummaryRef.current?.focus();
    errorSummaryRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [failedSubmitCount]);

  /*
   * 갈림길에 답하면 1단계 아래에 질문 묶음이 통째로 바뀐다. 라디오를 고른
   * 직후라 포커스는 갈림길에 있고, 바뀐 곳은 그 아래라 눈으로도 화면리더로도
   * 놓치기 쉽다. 포커스는 빼앗지 않고 등장 사실만 알린다.
   */
  const previousRegistration = useRef(form.value.registration);
  useEffect(() => {
    const now = form.value.registration;
    if (now === previousRegistration.current) return;
    previousRegistration.current = now;
    if (now === 'registered') {
      setAnnouncement(`${C.step1.severityLegend}와 ${C.step1.legend} 질문이 나타났습니다.`);
    } else if (now === 'unregistered') {
      setAnnouncement(`${C.step1.areasLegend} 질문이 나타났습니다.`);
    }
  }, [form.value.registration]);
  /*
   * 2단계에 새 질문 묶음이 나타난 사실을 알린다.
   * 1단계에서 유형을 고르면 화면 아래쪽 구조가 바뀌는데, 스크롤 밖이라
   * 시각적으로 알아채기 어렵다. 포커스는 빼앗지 않는다.
   */
  const previousGroups = useRef<AspectGroup[]>(form.activeGroups);
  useEffect(() => {
    const added = form.activeGroups.filter((g) => !previousGroups.current.includes(g));
    previousGroups.current = form.activeGroups;
    if (added.length > 0) {
      setAnnouncement(
        `2단계에 ${added.map((g) => ASPECT_GROUP_MAP[g].title).join(', ')} 질문이 추가되었습니다.`,
      );
    }
  }, [form.activeGroups]);

  /**
   * 접힌 "그 외 유형"에 선택된 항목이 있으면 펼친 상태로 시작한다.
   * 접힌 채로 두면 참여자가 자기가 고른 항목을 볼 수 없다.
   */
  const hasSecondarySelection = SECONDARY_TYPE_OPTIONS.some((o) =>
    form.value.types.includes(o.value),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.setSubmitAttempted(true);
    if (!form.isComplete) {
      setFailedSubmitCount((n) => n + 1);
      return;
    }
    session.save(
      { disability: form.normalized },
      { type: 'section-saved', step: 'disability', detail: '장애 정보 확정' },
    );
    onComplete();
  };

  return (
    <main className="page" id="main">
      <p className="page__step">3단계 / 장애 정보</p>

      <h1 className="page__title" ref={headingRef} tabIndex={-1}>
        장애 정보
      </h1>

      <ThemeToggle />

      <SaveStatus state={session.saveState} error={session.saveError} />

      {/* 화면 구조 변화 안내 전용 영역. 항상 DOM 에 있어야 한다. */}
      <LiveRegion message={announcement} />

      <p className="section__lead">{C.intro}</p>

      <form onSubmit={handleSubmit} noValidate>
        <ErrorSummary
          ref={errorSummaryRef}
          errors={form.submitAttempted ? form.errors : []}
          headingId="dis-error-summary-heading"
        />

        {/* ── 1단계 ─────────────────────────────────────────────────────── */}
        <section className="section" aria-labelledby="dis-step1-heading">
          <h2 className="section__heading" id="dis-step1-heading">
            {C.step1.heading}
          </h2>

          {/*
            갈림길. 법정 유형을 보여주기 전에 등록 여부부터 묻는다.
            미등록자에게 법정 유형 16개를 보여주면 고를 것이 없고, 억지로
            비슷한 것을 고르게 하면 데이터가 거짓이 된다.
          */}
          <OptionGroup
            type="radio"
            groupId={domId.registration}
            legend={C.step1.registrationLegend}
            hint={C.step1.registrationHint}
            error={form.errorFor('registration')}
            options={REGISTRATION_OPTIONS}
            selected={form.value.registration === null ? [] : [form.value.registration]}
            onToggle={(v, checked) => checked && form.setRegistration(v)}
          />

          {/*
            갈림길에 답하기 전에는 어느 쪽 질문도 띄우지 않는다.
            둘 다 보여주면 참여자가 무엇을 채워야 하는지 알 수 없다.
          */}
          {form.value.registration === 'registered' ? (
            <>
              {/*
                장애 정도를 유형보다 먼저, 한 번만 묻는다.
                복지카드에 정도가 하나만 적히므로 유형마다 반복해 물을 것이 아니다.
              */}
              <OptionGroup
                type="radio"
                groupId={domId.severity}
                legend={C.step1.severityLegend}
                hint={C.step1.severityHint}
                error={form.errorFor('severity')}
                options={SEVERITY_OPTIONS}
                selected={form.value.severity === null ? [] : [form.value.severity]}
                onToggle={(v, checked) => checked && form.setSeverity(v)}
              />

              <OptionGroup
                type="checkbox"
                groupId={domId.primaryTypes}
                legend={C.step1.legend}
                hint={C.step1.hint}
                error={form.errorFor('types')}
                options={PRIMARY_TYPE_OPTIONS}
                selected={form.value.types}
                onToggle={form.toggleType}
              />

              {/*
               * 그 외 9개 유형. 삭제가 아니라 노출 우선순위 조정이다.
               * 선택된 항목이 있으면 펼친 상태로 시작한다.
               */}
              <details className="disclosure" open={hasSecondarySelection}>
                <summary className="disclosure__summary">
                  <span className="disclosure__chevron" aria-hidden="true" />
                  <span>{C.step1.secondarySummary}</span>
                </summary>
                <div className="disclosure__panel">
                  <OptionGroup
                    type="checkbox"
                    groupId={domId.secondaryTypes}
                    legend={C.step1.secondaryLegend}
                    options={SECONDARY_TYPE_OPTIONS}
                    selected={form.value.types}
                    onToggle={form.toggleType}
                  />
                </div>
              </details>
            </>
          ) : null}

          {/*
            미등록자 경로. 법정 유형이 하던 일(2단계에 어떤 질문을 띄울지
            정하는 일)을 참여자가 영역으로 직접 고른다.
          */}
          {form.value.registration === 'unregistered' ? (
            <OptionGroup
              type="checkbox"
              groupId={domId.affectedAreas}
              legend={C.step1.areasLegend}
              hint={C.step1.areasHint}
              error={form.errorFor('affectedAreas')}
              options={AFFECTED_AREA_OPTIONS}
              selected={form.value.affectedAreas}
              onToggle={form.toggleAffectedArea}
            />
          ) : null}
        </section>


        {/* ── 2단계 ─────────────────────────────────────────────────────── */}
        {form.activeGroups.length > 0 ? (
          <section className="section" aria-labelledby="dis-step2-heading">
            <h2 className="section__heading" id="dis-step2-heading">
              {C.step2.heading}
            </h2>
            <p className="section__lead">{C.step2.intro}</p>

            {form.activeGroups.map((group) => {
              const spec = ASPECT_GROUP_MAP[group];
              const selected = form.value.aspectsByGroup[group] ?? [];
              return (
                <OptionGroup
                  key={group}
                  type="checkbox"
                  groupId={domId.aspects(group)}
                  legend={spec.title}
                  hint={spec.hint}
                  error={
                    form.errorFor(`aspects-${group}`) ?? form.errorFor(`aspect-other-${group}`)
                  }
                  options={spec.options}
                  selected={selected}
                  onToggle={(aspect, checked) => form.toggleAspect(group, aspect, checked)}
                  renderRevealed={(aspect) => {
                    const option = spec.options.find((o) => o.value === aspect);
                    if (option?.needsSide) {
                      return (
                        <OptionGroup
                          type="radio"
                          groupId={domId.aspectSide(group, aspect)}
                          legend={`${option.label} — ${option.sideLegend ?? C.step2.sideLegend}`}
                          error={form.errorFor(`aspect-side-${group}-${aspect}`)}
                          options={
                            option.allowBothSides ? SIDE_OPTIONS_WITH_BOTH : SIDE_OPTIONS
                          }
                          selected={
                            form.value.aspectSideByKey[sideKey(group, aspect)] === undefined
                              ? []
                              : [form.value.aspectSideByKey[sideKey(group, aspect)]]
                          }
                          onToggle={(side, checked) =>
                            checked && form.setAspectSide(group, aspect, side)
                          }
                        />
                      );
                    }
                    if (aspect === 'other') {
                      return (
                        <TextField
                          id={domId.aspectOther(group)}
                          label={`${spec.title} — ${C.step2.otherLabel}`}
                          value={form.value.aspectOtherByGroup[group] ?? ''}
                          onChange={(text) => form.setAspectOther(group, text)}
                          error={form.errorFor(`aspect-other-${group}`)}
                          required
                        />
                      );
                    }
                    return null;
                  }}
                />
              );
            })}
          </section>
        ) : null}

        {/* ── 3단계 ─────────────────────────────────────────────────────── */}
        <section className="section" aria-labelledby="dis-step3-heading">
          <h2 className="section__heading" id="dis-step3-heading">
            {C.step3.heading}
          </h2>

          {/*
           * 예시 문장은 항상 보이게 둔다 (스펙 3-3).
           * placeholder 나 접기/펼치기에 넣으면 정작 필요한 사람이 못 본다.
           */}
          <div className="notice notice--examples" aria-labelledby="dis-examples-heading">
            <h3 className="notice__heading" id="dis-examples-heading">
              {C.step3.examplesHeading}
            </h3>
            <ul className="notice__list">
              {NARRATIVE_EXAMPLES.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </div>

          <TextArea
            id={domId.narrative}
            label={C.step3.label}
            hint={C.step3.hint}
            note={C.step3.optional}
            value={form.value.narrative}
            onChange={form.setNarrative}
            rows={7}
          />
        </section>

        <div className="actions">
          <button type="submit" className="btn btn--primary" aria-describedby="dis-submit-hint">
            {nextStepLabel('disability')}
          </button>
          <p className="actions__hint" id="dis-submit-hint">
            {form.isComplete
              ? C.submitHint.ready
              : C.submitHint.remaining(form.errors.length)}
          </p>
          {/* 개발용 — src/devFlags.ts 와 함께 삭제한다. */}
          <StepBackButton session={session} to="basicInfo" />
        </div>
      </form>
    </main>
  );
}
