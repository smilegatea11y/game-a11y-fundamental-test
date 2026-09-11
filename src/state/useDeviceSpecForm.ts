import { useCallback, useMemo, useState } from 'react';
import { DEVICE_SPEC_COPY as C } from '../data/deviceSpecFields';
import { newLocalId } from '../lib/localId';
import { EMPTY_DEVICE_SPEC } from '../types/deviceSpec';
import type { DeviceSpec, ExtraDevice, InputDevice } from '../types/deviceSpec';
import type { ConsentValidationError } from '../types/consent';

/** DOM id 를 한 곳에 모아둔다. 오류 요약이 이 id 로 포커스를 옮긴다. */
export const deviceSpecDomId = {
  os: 'dev-os',
  osOther: 'dev-os-other-input',
  screenSize: 'dev-screen',
  resolution: 'dev-resolution',
  resolutionOther: 'dev-resolution-other-input',
  refreshRate: 'dev-refresh',
  inputDevices: 'dev-input',
  inputDeviceOther: 'dev-input-other-input',
  viewingDistance: 'dev-distance',
  audioOutput: 'dev-audio',
  gameAssistive: 'dev-game-assistive',
  gameAssistiveNames: 'dev-game-assistive-names-input',
  extraDevice: (id: string) => `dev-extra-${id}`,
  addExtraDevice: 'dev-extra-add',
} as const;

const firstOptionId = (groupId: string, firstValue: string) => `${groupId}-${firstValue}`;

export function useDeviceSpecForm(initial: DeviceSpec | null) {
  const [value, setValue] = useState<DeviceSpec>(initial ?? EMPTY_DEVICE_SPEC);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const setField = useCallback(<K extends keyof DeviceSpec>(key: K, next: DeviceSpec[K]) => {
    setValue((prev) => ({ ...prev, [key]: next }));
  }, []);

  /**
   * "기타"를 벗어나면 자유 입력값을 버린다.
   * 남겨두면 선택하지도 않은 값이 CSV 에 실린다.
   */
  const setOperatingSystem = useCallback((os: DeviceSpec['operatingSystem']) => {
    setValue((prev) => ({
      ...prev,
      operatingSystem: os,
      operatingSystemOther: os === 'other' ? prev.operatingSystemOther : '',
    }));
  }, []);

  const setResolution = useCallback((resolution: DeviceSpec['resolution']) => {
    setValue((prev) => ({
      ...prev,
      resolution,
      resolutionOther: resolution === 'other' ? prev.resolutionOther : '',
    }));
  }, []);

  const toggleInputDevice = useCallback((device: InputDevice, checked: boolean) => {
    setValue((prev) => ({
      ...prev,
      inputDevices: checked
        ? [...prev.inputDevices, device]
        : prev.inputDevices.filter((d) => d !== device),
      inputDeviceOther: !checked && device === 'other' ? '' : prev.inputDeviceOther,
    }));
  }, []);

  const setGameAssistiveUse = useCallback((use: DeviceSpec['gameAssistiveUse']) => {
    setValue((prev) => ({
      ...prev,
      gameAssistiveUse: use,
      gameAssistiveNames: use === 'gameSpecific' ? prev.gameAssistiveNames : '',
    }));
  }, []);

  /* ── 부가 기기 (반복 폼) ──────────────────────────────────────────────── */

  /**
   * 항목을 추가하고 새 항목의 id 를 돌려준다.
   * 화면이 그 id 로 새 입력란에 포커스를 옮긴다 — 사용자가 "추가"를 직접
   * 눌렀으므로 방금 만든 곳으로 이동하는 것이 기대되는 동작이다.
   */
  const addExtraDevice = useCallback((): string => {
    const entry: ExtraDevice = { id: newLocalId('extra'), modelName: '' };
    setValue((prev) => ({ ...prev, extraDevices: [...prev.extraDevices, entry] }));
    return entry.id;
  }, []);

  const removeExtraDevice = useCallback((id: string) => {
    setValue((prev) => ({
      ...prev,
      extraDevices: prev.extraDevices.filter((d) => d.id !== id),
    }));
  }, []);

  const setExtraDeviceName = useCallback((id: string, modelName: string) => {
    setValue((prev) => ({
      ...prev,
      extraDevices: prev.extraDevices.map((d) => (d.id === id ? { ...d, modelName } : d)),
    }));
  }, []);

  /* ── 검증 ─────────────────────────────────────────────────────────────── */

  /** 화면 순서(위 → 아래)와 같은 순서로 오류를 담는다. */
  const errors = useMemo<ConsentValidationError[]>(() => {
    const list: ConsentValidationError[] = [];

    if (value.operatingSystem === null) {
      list.push({
        key: 'operatingSystem',
        targetId: firstOptionId(deviceSpecDomId.os, 'win10'),
        message: C.os.missing,
      });
    } else if (value.operatingSystem === 'other' && value.operatingSystemOther.trim() === '') {
      list.push({
        key: 'operatingSystemOther',
        targetId: deviceSpecDomId.osOther,
        message: C.os.otherMissing,
      });
    }

    if (value.screenSize === null) {
      list.push({
        key: 'screenSize',
        targetId: firstOptionId(deviceSpecDomId.screenSize, 'laptopBuiltIn'),
        message: C.screenSize.missing,
      });
    }

    if (value.resolution === null) {
      list.push({
        key: 'resolution',
        targetId: firstOptionId(deviceSpecDomId.resolution, 'fhd'),
        message: C.resolution.missing,
      });
    } else if (value.resolution === 'other' && value.resolutionOther.trim() === '') {
      list.push({
        key: 'resolutionOther',
        targetId: deviceSpecDomId.resolutionOther,
        message: C.resolution.otherMissing,
      });
    }

    if (value.refreshRate === null) {
      list.push({
        key: 'refreshRate',
        targetId: firstOptionId(deviceSpecDomId.refreshRate, 'hz60'),
        message: C.refreshRate.missing,
      });
    }

    if (value.inputDevices.length === 0) {
      list.push({
        key: 'inputDevices',
        targetId: firstOptionId(deviceSpecDomId.inputDevices, 'mouse'),
        message: C.inputDevices.missing,
      });
    } else if (value.inputDevices.includes('other') && value.inputDeviceOther.trim() === '') {
      list.push({
        key: 'inputDeviceOther',
        targetId: deviceSpecDomId.inputDeviceOther,
        message: C.inputDevices.otherMissing,
      });
    }

    /*
     * 시청 거리는 필수다. 시각 테스트(글자크기·대비인식)의 유효성이 이 값에
     * 직접 걸려 있어, 없으면 측정값을 해석할 수 없다. (스펙 3-4)
     */
    if (value.viewingDistance === null) {
      list.push({
        key: 'viewingDistance',
        targetId: firstOptionId(deviceSpecDomId.viewingDistance, 'under50'),
        message: C.viewingDistance.missing,
      });
    }

    if (value.audioOutput === null) {
      list.push({
        key: 'audioOutput',
        targetId: firstOptionId(deviceSpecDomId.audioOutput, 'builtInSpeaker'),
        message: C.audioOutput.missing,
      });
    }

    if (value.gameAssistiveUse === null) {
      list.push({
        key: 'gameAssistiveUse',
        targetId: firstOptionId(deviceSpecDomId.gameAssistive, 'gameSpecific'),
        message: C.gameAssistive.missing,
      });
    } else if (
      value.gameAssistiveUse === 'gameSpecific' &&
      value.gameAssistiveNames.trim() === ''
    ) {
      list.push({
        key: 'gameAssistiveNames',
        targetId: deviceSpecDomId.gameAssistiveNames,
        message: C.gameAssistive.namesMissing,
      });
    }

    /*
     * 부가 기기는 선택 항목이지만, 빈 칸을 남겨두면 CSV 에 빈 행이 실린다.
     * 추가했으면 채우거나 삭제하도록 안내한다.
     */
    value.extraDevices.forEach((device, index) => {
      if (device.modelName.trim() === '') {
        list.push({
          key: `extraDevice-${device.id}`,
          targetId: deviceSpecDomId.extraDevice(device.id),
          message: C.extraDevices.emptyMissing(index + 1),
        });
      }
    });

    return list;
  }, [value]);

  const errorFor = useCallback(
    (key: string): string | null => {
      if (!submitAttempted) return null;
      return errors.find((e) => e.key === key)?.message ?? null;
    },
    [errors, submitAttempted],
  );

  /** 저장·CSV 에 쓸 정규 형태. */
  const normalized = useMemo<DeviceSpec>(
    () => ({
      ...value,
      operatingSystemOther: value.operatingSystemOther.trim(),
      resolutionOther: value.resolutionOther.trim(),
      inputDeviceOther: value.inputDeviceOther.trim(),
      gameAssistiveNames: value.gameAssistiveNames.trim(),
      extraDevices: value.extraDevices.map((d) => ({ ...d, modelName: d.modelName.trim() })),
    }),
    [value],
  );

  return {
    value,
    normalized,
    setField,
    setOperatingSystem,
    setResolution,
    toggleInputDevice,
    setGameAssistiveUse,
    addExtraDevice,
    removeExtraDevice,
    setExtraDeviceName,
    errors,
    errorFor,
    isComplete: errors.length === 0,
    submitAttempted,
    setSubmitAttempted,
  };
}
