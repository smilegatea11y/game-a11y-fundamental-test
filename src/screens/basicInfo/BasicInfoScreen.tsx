import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ErrorSummary } from '../../components/a11y/ErrorSummary';
import { LiveRegion } from '../../components/a11y/LiveRegion';
import { SaveStatus } from '../../components/a11y/SaveStatus';
import { OptionGroup } from '../../components/ui/OptionGroup';
import { StepBackButton } from '../../components/ui/StepBackButton';
import { TextField } from '../../components/ui/TextField';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import {
  ACCESSIBILITY_FEATURE_OPTIONS,
  AGE_BRACKET_OPTIONS,
  DAILY_ASSISTIVE_OPTIONS,
  BASIC_INFO_COPY as C,
  ENROLLMENT_PATH_OPTIONS,
  GAME_PLAY_YEARS_OPTIONS,
  GAME_STYLE_OPTIONS,
  GENDER_OPTIONS,
  GENRE_OPTIONS,
  WEEKLY_PLAYTIME_OPTIONS,
} from '../../data/basicInfoFields';
import { PARTICIPANT_ID_EXAMPLE, PARTICIPANT_ID_LENGTH } from '../../lib/participantId';
import { nextStepLabel } from '../../lib/sessionStore';
import { useErrorFocus } from '../../lib/useErrorFocus';
import { useScreenSetup } from '../../lib/useScreenSetup';
import { basicInfoDomId as domId, useBasicInfoForm } from '../../state/useBasicInfoForm';
import type { useSession } from '../../state/useSession';
import '../consent/consent.css';

interface BasicInfoScreenProps {
  session: ReturnType<typeof useSession>;
  onComplete: () => void;
}

export function BasicInfoScreen({ session, onComplete }: BasicInfoScreenProps) {
  const headingRef = useScreenSetup('참여자 기본정보', true);
  const form = useBasicInfoForm(session.draft?.basicInfo ?? null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [failedSubmitCount, setFailedSubmitCount] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [idAnnouncement, setIdAnnouncement] = useState('');

  /*
   * ── 즉시 저장 ────────────────────────────────────────────────────────────
   * 값이 바뀔 때마다 저장한다. CSV 는 맨 마지막에 한 번 만들어지므로,
   * 그전까지의 입력이 날아가면 30분 넘는 절차가 통째로 무효가 된다.
   *
   * 저장을 각 onToggle/onChange 안에서 하지 않는다. 그러면 "다음 값"을
   * 호출부에서 손으로 다시 계산해야 하고, 상태 갱신 규칙(배타 선택, 조건부
   * 값 비우기)이 훅과 화면 두 곳에 흩어져 반드시 어긋난다.
   * form.value 변화를 한 곳에서 받아 저장한다.
   *
   * 로그는 남기지 않는다. 한 글자마다 로그를 쌓으면 상한(400)이 금방 차서
   * 정작 필요한 기록("어디서 중단했는지")이 밀려난다. 로그는 제출 같은
   * 분기점에만 남긴다.
   * ─────────────────────────────────────────────────────────────────────── */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    session.save({ basicInfo: form.value });
    // session 객체는 매 렌더 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.value]);

  /*
   * 포커스 이동을 requestAnimationFrame 에 의존하지 않는다. rAF 는 탭이
   * 백그라운드이거나 렌더링이 스로틀되면 실행되지 않아, 스크린리더 사용자가
   * 제출 실패 피드백을 전혀 받지 못한다. (실측으로 확인된 문제)
   */
  // 첫 미입력 항목으로 스크롤 + 포커스. 요약은 화면에 그대로 남는다.
  useErrorFocus(failedSubmitCount, form.errors, errorSummaryRef);

  /* 조건부 입력란이 나타난 사실을 알린다. 포커스는 빼앗지 않는다. */
  const revealed = useRef({
    gender: form.value.gender === 'selfDescribed',
    path: form.value.enrollmentPath === 'other',
    genre: form.value.genres.includes('other'),
    assistive: form.value.dailyAssistiveDeviceUse === 'yes',
  });
  useEffect(() => {
    const now = {
      gender: form.value.gender === 'selfDescribed',
      path: form.value.enrollmentPath === 'other',
      genre: form.value.genres.includes('other'),
      assistive: form.value.dailyAssistiveDeviceUse === 'yes',
    };
    const labels: Record<keyof typeof now, string> = {
      gender: '성별 직접 입력란',
      path: '참여 경로 직접 입력란',
      genre: '선호 장르 직접 입력란',
      assistive: '보조기기 명칭 입력란',
    };
    const added = (Object.keys(now) as Array<keyof typeof now>).filter(
      (k) => now[k] && !revealed.current[k],
    );
    revealed.current = now;
    if (added.length > 0) {
      setAnnouncement(`${added.map((k) => labels[k]).join(', ')}이 아래에 추가되었습니다.`);
    }
  }, [form.value.gender, form.value.enrollmentPath, form.value.genres, form.value.dailyAssistiveDeviceUse]);

  /*
   * 고유 ID 가 방금 유효해진 순간만 1회 알린다.
   * 글자마다 낭독이 끼어들면 타이핑 자체가 불가능해진다.
   */
  const wasIdValid = useRef(form.idStatus === 'valid');
  useEffect(() => {
    const isValid = form.idStatus === 'valid';
    if (isValid !== wasIdValid.current) {
      setIdAnnouncement(isValid ? C.participantId.valid : '');
      wasIdValid.current = isValid;
    }
  }, [form.idStatus]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.setSubmitAttempted(true);
    if (!form.isComplete) {
      setFailedSubmitCount((n) => n + 1);
      return;
    }
    // 정규화된 값으로 확정 저장하고, 이때만 로그를 남긴다.
    session.save(
      { basicInfo: form.normalized },
      { type: 'section-saved', step: 'basicInfo', detail: '기본정보 확정' },
    );
    onComplete();
  };

  return (
    <main className="page" id="main">
      <p className="page__step">2단계 / 참여자 기본정보</p>

      <h1 className="page__title" ref={headingRef} tabIndex={-1}>
        참여자 기본정보
      </h1>

      <ThemeToggle />

      <SaveStatus state={session.saveState} error={session.saveError} />

      {/* 화면 구조 변화 안내 전용 영역. 항상 DOM 에 있어야 한다. */}
      <LiveRegion message={announcement} />
      <LiveRegion message={idAnnouncement} />

      <p className="section__lead">{C.intro}</p>

      <form onSubmit={handleSubmit} noValidate>
        <ErrorSummary
          ref={errorSummaryRef}
          errors={form.submitAttempted ? form.errors : []}
          title="기본정보 입력을 완료할 수 없습니다"
          headingId="basic-error-summary-heading"
        />

        <section className="section" aria-labelledby="basic-id-heading">
          <h2 className="section__heading" id="basic-id-heading">
            고유 ID
          </h2>
          <TextField
            id={domId.participantId}
            label={C.participantId.label}
            hint={C.participantId.hint}
            hintExtra={
              <>
                형식 예시: <code>{PARTICIPANT_ID_EXAMPLE}</code>
              </>
            }
            value={form.value.participantId}
            onChange={form.setParticipantId}
            onBlur={form.onIdBlur}
            error={form.idError}
            status={form.idStatus}
            validMessage={C.participantId.valid}
            required
            maxLength={PARTICIPANT_ID_LENGTH}
            inputMode="text"
          />
        </section>

        <section className="section" aria-labelledby="basic-profile-heading">
          <h2 className="section__heading" id="basic-profile-heading">
            참여자 정보
          </h2>

          <OptionGroup
            type="radio"
            groupId={domId.gender}
            legend={C.gender.legend}
            error={form.errorFor('gender')}
            options={GENDER_OPTIONS}
            selected={form.value.gender === null ? [] : [form.value.gender]}
            onToggle={(v, checked) => checked && form.setGender(v)}
            renderRevealed={() => (
              <TextField
                id={domId.genderSelfDescribed}
                label={C.gender.selfDescribedLabel}
                labelHidden
                value={form.value.genderSelfDescribed}
                onChange={(v) => form.setField('genderSelfDescribed', v)}
              />
            )}
          />

          <OptionGroup
            type="radio"
            groupId={domId.ageBracket}
            legend={C.ageBracket.legend}
            error={form.errorFor('ageBracket')}
            options={AGE_BRACKET_OPTIONS}
            selected={form.value.ageBracket === null ? [] : [form.value.ageBracket]}
            onToggle={(v, checked) => checked && form.setField('ageBracket', v)}
          />

          <OptionGroup
            type="radio"
            groupId={domId.enrollmentPath}
            legend={C.enrollmentPath.legend}
            error={form.errorFor('enrollmentPath')}
            warning={form.pathMismatchWarning}
            options={ENROLLMENT_PATH_OPTIONS}
            selected={form.value.enrollmentPath === null ? [] : [form.value.enrollmentPath]}
            onToggle={(v, checked) => checked && form.setEnrollmentPath(v)}
            renderRevealed={() => (
              <TextField
                id={domId.enrollmentPathOther}
                label={C.enrollmentPath.otherLabel}
                value={form.value.enrollmentPathOther}
                onChange={(v) => form.setField('enrollmentPathOther', v)}
                error={form.errorFor('enrollmentPathOther')}
                required
              />
            )}
          />

          <OptionGroup
            type="radio"
            groupId={domId.gamePlayYears}
            legend={C.gamePlayYears.legend}
            error={form.errorFor('gamePlayYears')}
            options={GAME_PLAY_YEARS_OPTIONS}
            selected={form.value.gamePlayYears === null ? [] : [form.value.gamePlayYears]}
            onToggle={(v, checked) => checked && form.setField('gamePlayYears', v)}
          />

          <OptionGroup
            type="radio"
            groupId={domId.gameStyle}
            legend={C.gameStyle.legend}
            error={form.errorFor('gameStyle')}
            options={GAME_STYLE_OPTIONS}
            selected={form.value.gameStyle === null ? [] : [form.value.gameStyle]}
            onToggle={(v, checked) => checked && form.setField('gameStyle', v)}
          />

          <OptionGroup
            type="checkbox"
            groupId={domId.genres}
            legend={C.genres.legend}
            hint={C.genres.hint}
            error={form.errorFor('genres')}
            options={GENRE_OPTIONS}
            selected={form.value.genres}
            onToggle={form.toggleGenre}
            renderRevealed={() => (
              <TextField
                id={domId.genreOther}
                label={C.genres.otherLabel}
                value={form.value.genreOther}
                onChange={(v) => form.setField('genreOther', v)}
                error={form.errorFor('genreOther')}
                required
              />
            )}
          />

          <OptionGroup
            type="radio"
            groupId={domId.weeklyPlaytime}
            legend={C.weeklyPlaytime.legend}
            error={form.errorFor('weeklyPlaytime')}
            options={WEEKLY_PLAYTIME_OPTIONS}
            selected={form.value.weeklyPlaytime === null ? [] : [form.value.weeklyPlaytime]}
            onToggle={(v, checked) => checked && form.setField('weeklyPlaytime', v)}
          />

          <OptionGroup
            type="radio"
            groupId={domId.dailyAssistiveDevice}
            legend={C.dailyAssistiveDevice.legend}
            hint={C.dailyAssistiveDevice.hint}
            error={form.errorFor('dailyAssistiveDeviceUse')}
            options={DAILY_ASSISTIVE_OPTIONS}
            selected={form.value.dailyAssistiveDeviceUse === null ? [] : [form.value.dailyAssistiveDeviceUse]}
            onToggle={(v, checked) => checked && form.setDailyAssistiveDeviceUse(v)}
            renderRevealed={() => (
              <TextField
                id={domId.dailyAssistiveDeviceNames}
                label={C.dailyAssistiveDevice.namesLabel}
                hint={C.dailyAssistiveDevice.namesHint}
                value={form.value.dailyAssistiveDeviceNames}
                onChange={(v) => form.setField('dailyAssistiveDeviceNames', v)}
              />
            )}
          />

          <OptionGroup
            type="checkbox"
            groupId={domId.accessibilityFeatures}
            legend={C.accessibilityFeatures.legend}
            hint={C.accessibilityFeatures.hint}
            error={form.errorFor('accessibilityFeatures')}
            options={ACCESSIBILITY_FEATURE_OPTIONS}
            selected={form.value.accessibilityFeatures}
            onToggle={form.toggleAccessibilityFeature}
            renderRevealed={() => (
              <TextField
                id={domId.accessibilityFeatureOther}
                label={C.accessibilityFeatures.otherLabel}
                value={form.value.accessibilityFeatureOther}
                onChange={(v) => form.setField('accessibilityFeatureOther', v)}
                error={form.errorFor('accessibilityFeatureOther')}
                required
              />
            )}
          />
        </section>

        <div className="actions">
          <button type="submit" className="btn btn--primary" aria-describedby="basic-submit-hint">
            {nextStepLabel('basicInfo')}
          </button>
          <p className="actions__hint" id="basic-submit-hint">
            {form.isComplete
              ? '입력이 모두 끝났습니다. 장애 정보 입력 화면으로 이동합니다.'
              : `아직 입력하지 않은 항목이 ${form.errors.length}건 있습니다.`}
          </p>
          <StepBackButton session={session} to="consent" />
        </div>
      </form>
    </main>
  );
}
