import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ErrorSummary } from '../../components/a11y/ErrorSummary';
import { LiveRegion } from '../../components/a11y/LiveRegion';
import { SaveStatus } from '../../components/a11y/SaveStatus';
import { OptionGroup } from '../../components/ui/OptionGroup';
import { TextField } from '../../components/ui/TextField';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import {
  AUDIO_OUTPUT_OPTIONS,
  DEVICE_SPEC_COPY as C,
  GAME_ASSISTIVE_OPTIONS,
  INPUT_DEVICE_OPTIONS,
  OS_OPTIONS,
  REFRESH_RATE_OPTIONS,
  RESOLUTION_OPTIONS,
  SCREEN_SIZE_OPTIONS,
  VIEWING_DISTANCE_OPTIONS,
} from '../../data/deviceSpecFields';
import { useScreenSetup } from '../../lib/useScreenSetup';
import { deviceSpecDomId as domId, useDeviceSpecForm } from '../../state/useDeviceSpecForm';
import type { useSession } from '../../state/useSession';
import '../consent/consent.css';

interface DeviceSpecScreenProps {
  session: ReturnType<typeof useSession>;
  onComplete: () => void;
}

export function DeviceSpecScreen({ session, onComplete }: DeviceSpecScreenProps) {
  const headingRef = useScreenSetup('기기 사양', true);
  const form = useDeviceSpecForm(session.draft?.deviceSpec ?? null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [failedSubmitCount, setFailedSubmitCount] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  /** 추가 직후 포커스를 옮길 부가 기기 항목. */
  const pendingFocusId = useRef<string | null>(null);

  /*
   * 3-2 에서 입력한 "평소 보조기기". 게임용 보조기기 질문에서 이어받아 보여준다.
   * 평소 보조기기가 없으면 "평소 쓰는 것을 그대로 씁니다" 선택지를 숨긴다 —
   * 고를 수 없는 선택지를 비활성으로 남기면 찾기만 어려워진다.
   */
  const basicInfo = session.draft?.basicInfo ?? null;
  const usesDailyAssistive = basicInfo?.dailyAssistiveDeviceUse === 'yes';
  const dailyAssistiveNames = basicInfo?.dailyAssistiveDeviceNames.trim() ?? '';
  const gameAssistiveOptions = GAME_ASSISTIVE_OPTIONS.filter(
    (option) => option.value !== 'sameAsDaily' || usesDailyAssistive,
  );

  /*
   * 즉시 저장. 각 onToggle 안에서 "다음 값"을 손으로 계산하지 않는다.
   * 조건부 값 비우기 규칙이 훅에 있으므로 화면에서 다시 계산하면 어긋난다.
   * 로그는 제출 같은 분기점에만 남긴다.
   */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    session.save({ deviceSpec: form.value });
    // session 객체는 매 렌더 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.value]);

  /*
   * 포커스 이동을 requestAnimationFrame 에 의존하지 않는다. rAF 는 탭이
   * 백그라운드이거나 렌더링이 스로틀되면 실행되지 않는다. (실측으로 확인된 문제)
   */
  useEffect(() => {
    if (failedSubmitCount === 0) return;
    errorSummaryRef.current?.focus();
    errorSummaryRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [failedSubmitCount]);

  /*
   * 부가 기기를 추가한 직후 새 입력란으로 포커스를 옮긴다.
   *
   * 조건부 노출(성별 직접입력 등)에서는 포커스를 옮기지 않았다. 그때는
   * 라디오를 방향키로 훑는 도중이라 포커스를 빼앗으면 다른 선택지를 볼 수 없다.
   * 여기는 사용자가 "기기 추가"를 직접 눌렀으므로, 방금 만든 칸으로 가는 것이
   * 기대되는 동작이다. 가지 않으면 새 칸을 찾아 다시 Tab 을 쳐야 한다.
   */
  useEffect(() => {
    const id = pendingFocusId.current;
    if (id === null) return;
    pendingFocusId.current = null;
    document.getElementById(domId.extraDevice(id))?.focus();
  }, [form.value.extraDevices]);

  const handleAddExtraDevice = () => {
    const id = form.addExtraDevice();
    pendingFocusId.current = id;
    setAnnouncement(C.extraDevices.added(form.value.extraDevices.length + 1));
  };

  const handleRemoveExtraDevice = (id: string, index: number) => {
    form.removeExtraDevice(id);
    setAnnouncement(C.extraDevices.removed(index + 1));
    /*
     * 삭제하면 포커스가 사라진 버튼에 남아 body 로 튕긴다. 그러면 스크린리더가
     * 현재 위치를 잃는다. "기기 추가" 버튼으로 옮겨 다음 동작을 이어갈 수 있게 한다.
     */
    document.getElementById(domId.addExtraDevice)?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.setSubmitAttempted(true);
    if (!form.isComplete) {
      setFailedSubmitCount((n) => n + 1);
      return;
    }
    session.save(
      { deviceSpec: form.normalized },
      { type: 'section-saved', step: 'device', detail: '기기 사양 확정' },
    );
    onComplete();
  };

  return (
    <main className="page" id="main">
      <p className="page__step">4단계 / 기기 사양</p>

      <h1 className="page__title" ref={headingRef} tabIndex={-1}>
        기기 사양
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
          headingId="dev-error-summary-heading"
        />

        {/* ── 주 기기 ───────────────────────────────────────────────────── */}
        <section className="section" aria-labelledby="dev-primary-heading">
          <h2 className="section__heading" id="dev-primary-heading">
            {C.primaryHeading}
          </h2>
          <p className="section__lead">{C.primaryIntro}</p>

          <OptionGroup
            type="radio"
            groupId={domId.os}
            legend={C.os.legend}
            error={form.errorFor('operatingSystem')}
            options={OS_OPTIONS}
            selected={form.value.operatingSystem === null ? [] : [form.value.operatingSystem]}
            onToggle={(v, checked) => checked && form.setOperatingSystem(v)}
            renderRevealed={() => (
              <TextField
                id={domId.osOther}
                label={C.os.otherLabel}
                value={form.value.operatingSystemOther}
                onChange={(v) => form.setField('operatingSystemOther', v)}
                error={form.errorFor('operatingSystemOther')}
                required
              />
            )}
          />

          <OptionGroup
            type="radio"
            groupId={domId.screenSize}
            legend={C.screenSize.legend}
            hint={C.screenSize.hint}
            error={form.errorFor('screenSize')}
            options={SCREEN_SIZE_OPTIONS}
            selected={form.value.screenSize === null ? [] : [form.value.screenSize]}
            onToggle={(v, checked) => checked && form.setField('screenSize', v)}
          />

          <OptionGroup
            type="radio"
            groupId={domId.resolution}
            legend={C.resolution.legend}
            hint={C.resolution.hint}
            error={form.errorFor('resolution')}
            options={RESOLUTION_OPTIONS}
            selected={form.value.resolution === null ? [] : [form.value.resolution]}
            onToggle={(v, checked) => checked && form.setResolution(v)}
            renderRevealed={() => (
              <TextField
                id={domId.resolutionOther}
                label={C.resolution.otherLabel}
                hint={C.resolution.otherHint}
                value={form.value.resolutionOther}
                onChange={(v) => form.setField('resolutionOther', v)}
                error={form.errorFor('resolutionOther')}
                required
              />
            )}
          />

          <OptionGroup
            type="radio"
            groupId={domId.refreshRate}
            legend={C.refreshRate.legend}
            hint={C.refreshRate.hint}
            error={form.errorFor('refreshRate')}
            options={REFRESH_RATE_OPTIONS}
            selected={form.value.refreshRate === null ? [] : [form.value.refreshRate]}
            onToggle={(v, checked) => checked && form.setField('refreshRate', v)}
          />

          <OptionGroup
            type="checkbox"
            groupId={domId.inputDevices}
            legend={C.inputDevices.legend}
            hint={C.inputDevices.hint}
            error={form.errorFor('inputDevices') ?? form.errorFor('inputDeviceOther')}
            options={INPUT_DEVICE_OPTIONS}
            selected={form.value.inputDevices}
            onToggle={form.toggleInputDevice}
            renderRevealed={(v) =>
              v === 'other' ? (
                <TextField
                  id={domId.inputDeviceOther}
                  label={C.inputDevices.otherLabel}
                  value={form.value.inputDeviceOther}
                  onChange={(text) => form.setField('inputDeviceOther', text)}
                  error={form.errorFor('inputDeviceOther')}
                  required
                />
              ) : null
            }
          />

          <OptionGroup
            type="radio"
            groupId={domId.viewingDistance}
            legend={C.viewingDistance.legend}
            hint={C.viewingDistance.hint}
            error={form.errorFor('viewingDistance')}
            options={VIEWING_DISTANCE_OPTIONS}
            selected={form.value.viewingDistance === null ? [] : [form.value.viewingDistance]}
            onToggle={(v, checked) => checked && form.setField('viewingDistance', v)}
          />

          <OptionGroup
            type="radio"
            groupId={domId.audioOutput}
            legend={C.audioOutput.legend}
            hint={C.audioOutput.hint}
            error={form.errorFor('audioOutput')}
            options={AUDIO_OUTPUT_OPTIONS}
            selected={form.value.audioOutput === null ? [] : [form.value.audioOutput]}
            onToggle={(v, checked) => checked && form.setField('audioOutput', v)}
          />
        </section>

        {/* ── 게임용 보조기기 ───────────────────────────────────────────── */}
        <section className="section" aria-labelledby="dev-assistive-heading">
          <h2 className="section__heading" id="dev-assistive-heading">
            {C.gameAssistive.heading}
          </h2>

          <OptionGroup
            type="radio"
            groupId={domId.gameAssistive}
            legend={C.gameAssistive.legend}
            hint={C.gameAssistive.hint}
            error={form.errorFor('gameAssistiveUse')}
            options={gameAssistiveOptions}
            selected={form.value.gameAssistiveUse === null ? [] : [form.value.gameAssistiveUse]}
            onToggle={(v, checked) => checked && form.setGameAssistiveUse(v)}
            renderRevealed={(v) =>
              v === 'gameSpecific' ? (
                <TextField
                  id={domId.gameAssistiveNames}
                  label={C.gameAssistive.namesLabel}
                  hint={C.gameAssistive.namesHint}
                  value={form.value.gameAssistiveNames}
                  onChange={(text) => form.setField('gameAssistiveNames', text)}
                  error={form.errorFor('gameAssistiveNames')}
                  required
                />
              ) : null
            }
          />

          {/*
           * "평소 쓰는 것을 그대로 씁니다"를 고르면 3-2 값을 읽기 전용으로 보여준다.
           * 여기서 다시 입력받으면 같은 질문을 두 번 하는 셈이다. (스펙 3-4)
           */}
          {form.value.gameAssistiveUse === 'sameAsDaily' ? (
            <dl className="detail-list">
              <div className="detail-list__row">
                <dt>{C.gameAssistive.dailyCarriedLabel}</dt>
                <dd>{dailyAssistiveNames || C.gameAssistive.dailyCarriedEmpty}</dd>
              </div>
            </dl>
          ) : null}
        </section>

        {/* ── 부가 기기 (반복 폼) ───────────────────────────────────────── */}
        <section className="section" aria-labelledby="dev-extra-heading">
          <h2 className="section__heading" id="dev-extra-heading">
            {C.extraDevices.heading}
          </h2>
          <p className="section__lead">{C.extraDevices.intro}</p>

          {form.value.extraDevices.map((device, index) => (
            <div className="extra-device" key={device.id}>
              <TextField
                id={domId.extraDevice(device.id)}
                label={C.extraDevices.label(index + 1)}
                hint={index === 0 ? C.extraDevices.hint : undefined}
                value={device.modelName}
                onChange={(v) => form.setExtraDeviceName(device.id, v)}
                error={form.errorFor(`extraDevice-${device.id}`)}
              />
              <button
                type="button"
                className="btn btn--secondary btn--compact"
                onClick={() => handleRemoveExtraDevice(device.id, index)}
              >
                {/* 버튼 이름에 번호를 넣는다. "삭제" 버튼이 여러 개면 구분되지 않는다. */}
                {C.extraDevices.removeButton(index + 1)}
              </button>
            </div>
          ))}

          <button
            type="button"
            id={domId.addExtraDevice}
            className="btn btn--secondary"
            onClick={handleAddExtraDevice}
          >
            {C.extraDevices.addButton}
          </button>
        </section>

        <div className="actions">
          <button type="submit" className="btn btn--primary" aria-describedby="dev-submit-hint">
            저장하고 다음 단계로
          </button>
          <p className="actions__hint" id="dev-submit-hint">
            {form.isComplete ? C.submitHint.ready : C.submitHint.remaining(form.errors.length)}
          </p>
        </div>
      </form>
    </main>
  );
}
