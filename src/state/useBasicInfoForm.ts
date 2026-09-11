import { useCallback, useMemo, useState } from 'react';
import {
  ACCESSIBILITY_FEATURE_OPTIONS,
  BASIC_INFO_COPY,
  PATH_CODE_BY_ENROLLMENT,
} from '../data/basicInfoFields';
import {
  canStillBecomeValid,
  isValidParticipantId,
  normalizeParticipantId,
  readPathCode,
} from '../lib/participantId';
import { EMPTY_BASIC_INFO } from '../types/basicInfo';
import type { AccessibilityFeature, BasicInfo, Genre } from '../types/basicInfo';
import type { ConsentValidationError } from '../types/consent';
import type { FieldStatus } from '../components/ui/TextField';

/**
 * DOM id 를 한 곳에 모아둔다. 오류 요약이 이 id 로 포커스를 옮긴다.
 *
 * 조건부 자유 입력란은 모두 `-input` 으로 끝낸다.
 * OptionGroup 은 선택지 id 를 `그룹id-선택지값` 으로 만드는데, 자유 입력란 id 가
 * 그 형태와 겹치면 중복 id 가 된다. 실제로 `basic-path-other`(기타 선택지)와
 * 참여 경로 자유 입력란이 충돌해 htmlFor 연결과 오류 요약의 포커스 대상이
 * 엉뚱한 요소를 가리켰다. 접미사를 고정해 구조적으로 막는다.
 */
export const basicInfoDomId = {
  participantId: 'basic-participant-id',
  gender: 'basic-gender',
  genderSelfDescribed: 'basic-gender-self-input',
  ageBracket: 'basic-age',
  enrollmentPath: 'basic-path',
  enrollmentPathOther: 'basic-path-other-input',
  gameSkill: 'basic-skill',
  genres: 'basic-genres',
  genreOther: 'basic-genres-other-input',
  weeklyPlaytime: 'basic-playtime',
  assistiveDevice: 'basic-assistive',
  assistiveDeviceNames: 'basic-assistive-names-input',
  accessibilityFeatures: 'basic-a11y-features',
} as const;

/** 그룹의 첫 선택지 id — 오류 요약이 라디오/체크박스로 포커스를 옮길 때 쓴다. */
const firstOptionId = (groupId: string, firstValue: string) => `${groupId}-${firstValue}`;

const EXCLUSIVE_FEATURES = new Set<AccessibilityFeature>(
  ACCESSIBILITY_FEATURE_OPTIONS.filter((o) => o.exclusive).map((o) => o.value),
);

export function useBasicInfoForm(initial: BasicInfo | null) {
  const [value, setValue] = useState<BasicInfo>(initial ?? EMPTY_BASIC_INFO);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  /**
   * 고유 ID 입력란을 한 번이라도 떠났는지.
   *
   * 타이핑 중인 미완성 값을 "틀렸다"고 하지 않기 위해 필요하다.
   * 떠난 뒤에는 미완성도 오류로 본다.
   */
  const [idBlurred, setIdBlurred] = useState(false);

  /** 필드 하나를 바꾼다. onChange 가 호출될 때마다 화면이 즉시 저장한다. */
  const setField = useCallback(<K extends keyof BasicInfo>(key: K, next: BasicInfo[K]) => {
    setValue((prev) => ({ ...prev, [key]: next }));
  }, []);

  /** 고유 ID — 소문자로 입력해도 대문자로 바꿔 저장한다. */
  const setParticipantId = useCallback((raw: string) => {
    // 값 전체를 대문자화하므로 길이가 바뀌지 않아 캐럿 위치가 튀지 않는다.
    setValue((prev) => ({ ...prev, participantId: raw.toUpperCase() }));
  }, []);

  const toggleGenre = useCallback((genre: Genre, checked: boolean) => {
    setValue((prev) => ({
      ...prev,
      genres: checked ? [...prev.genres, genre] : prev.genres.filter((g) => g !== genre),
      // 기타를 해제하면 자유 입력값도 버린다. 남겨두면 CSV 에 유령 값이 실린다.
      genreOther: !checked && genre === 'other' ? '' : prev.genreOther,
    }));
  }, []);

  /**
   * 접근성 기능 — "사용 안 함"은 배타 선택.
   * 자막과 "사용 안 함"이 동시에 체크되면 데이터가 모순이다.
   */
  const toggleAccessibilityFeature = useCallback(
    (feature: AccessibilityFeature, checked: boolean) => {
      setValue((prev) => {
        if (!checked) {
          return {
            ...prev,
            accessibilityFeatures: prev.accessibilityFeatures.filter((f) => f !== feature),
          };
        }
        if (EXCLUSIVE_FEATURES.has(feature)) {
          return { ...prev, accessibilityFeatures: [feature] };
        }
        return {
          ...prev,
          accessibilityFeatures: [
            ...prev.accessibilityFeatures.filter((f) => !EXCLUSIVE_FEATURES.has(f)),
            feature,
          ],
        };
      });
    },
    [],
  );

  /** 성별 — 직접 입력을 벗어나면 자유 입력값을 버린다. */
  const setGender = useCallback((gender: BasicInfo['gender']) => {
    setValue((prev) => ({
      ...prev,
      gender,
      genderSelfDescribed: gender === 'selfDescribed' ? prev.genderSelfDescribed : '',
    }));
  }, []);

  const setEnrollmentPath = useCallback((path: BasicInfo['enrollmentPath']) => {
    setValue((prev) => ({
      ...prev,
      enrollmentPath: path,
      enrollmentPathOther: path === 'other' ? prev.enrollmentPathOther : '',
    }));
  }, []);

  const setAssistiveDeviceUse = useCallback((use: BasicInfo['assistiveDeviceUse']) => {
    setValue((prev) => ({
      ...prev,
      assistiveDeviceUse: use,
      assistiveDeviceNames: use === 'yes' ? prev.assistiveDeviceNames : '',
    }));
  }, []);

  /* ── 고유 ID 실시간 상태 ──────────────────────────────────────────────── */

  const idStatus = useMemo<FieldStatus>(() => {
    const raw = value.participantId;
    if (raw.length === 0) return submitAttempted || idBlurred ? 'invalid' : 'none';
    if (isValidParticipantId(raw)) return 'valid';
    /*
     * 더 입력하면 유효해질 수 있는 값이면 아직 오류로 보지 않는다.
     * 포커스를 떠났거나 제출을 시도한 뒤에는 미완성도 오류다.
     */
    if (canStillBecomeValid(raw)) return submitAttempted || idBlurred ? 'invalid' : 'pending';
    return 'invalid';
  }, [value.participantId, submitAttempted, idBlurred]);

  const idError = useMemo<string | null>(() => {
    if (idStatus !== 'invalid') return null;
    return value.participantId.length === 0
      ? BASIC_INFO_COPY.participantId.missing
      : BASIC_INFO_COPY.participantId.invalid;
  }, [idStatus, value.participantId]);

  /**
   * ID 의 경로코드와 참여 경로 선택이 어긋나는지.
   * 관리자가 다른 경로 코드로 발급했을 수 있으므로 경고만 하고 진행은 막지 않는다.
   */
  const pathMismatchWarning = useMemo<string | null>(() => {
    const code = readPathCode(value.participantId);
    if (code === null || value.enrollmentPath === null) return null;
    return PATH_CODE_BY_ENROLLMENT[value.enrollmentPath] === code
      ? null
      : BASIC_INFO_COPY.enrollmentPath.mismatch;
  }, [value.participantId, value.enrollmentPath]);

  /* ── 검증 ─────────────────────────────────────────────────────────────── */

  /** 화면 순서(위 → 아래)와 같은 순서로 오류를 담는다. */
  const errors = useMemo<ConsentValidationError[]>(() => {
    const list: ConsentValidationError[] = [];
    const C = BASIC_INFO_COPY;

    if (!isValidParticipantId(value.participantId)) {
      list.push({
        key: 'participantId',
        targetId: basicInfoDomId.participantId,
        message:
          value.participantId.length === 0 ? C.participantId.missing : C.participantId.invalid,
      });
    }

    if (value.gender === null) {
      list.push({
        key: 'gender',
        targetId: firstOptionId(basicInfoDomId.gender, 'male'),
        message: C.gender.missing,
      });
    }

    if (value.ageBracket === null) {
      list.push({
        key: 'ageBracket',
        targetId: firstOptionId(basicInfoDomId.ageBracket, 'age14to19'),
        message: C.ageBracket.missing,
      });
    }

    if (value.enrollmentPath === null) {
      list.push({
        key: 'enrollmentPath',
        targetId: firstOptionId(basicInfoDomId.enrollmentPath, 'panel'),
        message: C.enrollmentPath.missing,
      });
    } else if (value.enrollmentPath === 'other' && value.enrollmentPathOther.trim() === '') {
      list.push({
        key: 'enrollmentPathOther',
        targetId: basicInfoDomId.enrollmentPathOther,
        message: C.enrollmentPath.otherMissing,
      });
    }

    if (value.gameSkill === null) {
      list.push({
        key: 'gameSkill',
        targetId: firstOptionId(basicInfoDomId.gameSkill, 'entry'),
        message: C.gameSkill.missing,
      });
    }

    if (value.genres.length === 0) {
      list.push({
        key: 'genres',
        targetId: firstOptionId(basicInfoDomId.genres, 'fps'),
        message: C.genres.missing,
      });
    } else if (value.genres.includes('other') && value.genreOther.trim() === '') {
      list.push({
        key: 'genreOther',
        targetId: basicInfoDomId.genreOther,
        message: C.genres.otherMissing,
      });
    }

    if (value.weeklyPlaytime === null) {
      list.push({
        key: 'weeklyPlaytime',
        targetId: firstOptionId(basicInfoDomId.weeklyPlaytime, 'under5'),
        message: C.weeklyPlaytime.missing,
      });
    }

    if (value.assistiveDeviceUse === null) {
      list.push({
        key: 'assistiveDeviceUse',
        targetId: firstOptionId(basicInfoDomId.assistiveDevice, 'yes'),
        message: C.assistiveDevice.missing,
      });
    }

    if (value.accessibilityFeatures.length === 0) {
      list.push({
        key: 'accessibilityFeatures',
        targetId: firstOptionId(basicInfoDomId.accessibilityFeatures, 'subtitles'),
        message: C.accessibilityFeatures.missing,
      });
    }

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
  const normalized = useMemo<BasicInfo>(
    () => ({
      ...value,
      participantId: normalizeParticipantId(value.participantId),
      genderSelfDescribed: value.genderSelfDescribed.trim(),
      enrollmentPathOther: value.enrollmentPathOther.trim(),
      genreOther: value.genreOther.trim(),
      assistiveDeviceNames: value.assistiveDeviceNames.trim(),
    }),
    [value],
  );

  return {
    value,
    normalized,
    setField,
    setParticipantId,
    setGender,
    setEnrollmentPath,
    setAssistiveDeviceUse,
    toggleGenre,
    toggleAccessibilityFeature,
    idStatus,
    idError,
    onIdBlur: () => setIdBlurred(true),
    pathMismatchWarning,
    errors,
    errorFor,
    isComplete: errors.length === 0,
    submitAttempted,
    setSubmitAttempted,
  };
}
