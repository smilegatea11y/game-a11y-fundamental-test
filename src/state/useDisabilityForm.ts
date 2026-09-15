import { useCallback, useMemo, useState } from 'react';
import {
  ASPECT_GROUP_BY_TYPE,
  ASPECT_GROUP_MAP,
  ASPECT_GROUP_ORDER,
  DISABILITY_COPY as C,
} from '../data/disabilityFields';
import { AFFECTED_AREA_OPTIONS } from '../data/disabilityFields';
import { EMPTY_DISABILITY_INFO, sideKey } from '../types/disability';
import type {
  AffectedArea,
  AspectGroup,
  BodySide,
  DisabilityInfo,
  DisabilityRegistration,
  DisabilitySeverity,
  DisabilityType,
} from '../types/disability';
import type { ConsentValidationError } from '../types/consent';

/** DOM id 를 한 곳에 모아둔다. 오류 요약이 이 id 로 포커스를 옮긴다. */
export const disabilityDomId = {
  registration: 'dis-registration',
  affectedAreas: 'dis-areas',
  primaryTypes: 'dis-types',
  secondaryTypes: 'dis-types-more',
  severity: 'dis-severity',
  aspects: (group: AspectGroup) => `dis-aspects-${group}`,
  aspectOther: (group: AspectGroup) => `dis-aspects-${group}-other-input`,
  aspectSide: (group: AspectGroup, aspect: string) => `dis-side-${group}-${aspect}`,
  narrative: 'dis-narrative',
} as const;

const EXCLUSIVE_AREAS = new Set<AffectedArea>(
  AFFECTED_AREA_OPTIONS.filter((o) => o.exclusive).map((o) => o.value),
);

/**
 * 더 이상 묻지 않는 그룹의 2단계 값을 버린다.
 *
 * 1단계에서 무엇을 고르든(법정 유형이든 영역이든) 결국 "어떤 양상 그룹을
 * 띄울지"가 바뀌고, 그때 사라진 그룹의 값이 남아 있으면 참여자가 보지도 않은
 * 답이 CSV 에 실린다. 두 경로가 같은 정리 규칙을 써야 하므로 한 곳에 둔다.
 */
function pruneAspects(prev: DisabilityInfo, stillNeeded: Set<AspectGroup>): DisabilityInfo {
  const aspectsByGroup: DisabilityInfo['aspectsByGroup'] = {};
  const aspectOtherByGroup: DisabilityInfo['aspectOtherByGroup'] = {};
  for (const group of stillNeeded) {
    if (prev.aspectsByGroup[group] !== undefined) {
      aspectsByGroup[group] = prev.aspectsByGroup[group];
    }
    if (prev.aspectOtherByGroup[group] !== undefined) {
      aspectOtherByGroup[group] = prev.aspectOtherByGroup[group];
    }
  }

  const aspectSideByKey: Record<string, BodySide> = {};
  for (const [key, side] of Object.entries(prev.aspectSideByKey)) {
    const [group] = key.split(':');
    if (stillNeeded.has(group as AspectGroup)) aspectSideByKey[key] = side;
  }

  return { ...prev, aspectsByGroup, aspectOtherByGroup, aspectSideByKey };
}

export function useDisabilityForm(initial: DisabilityInfo | null) {
  const [value, setValue] = useState<DisabilityInfo>(initial ?? EMPTY_DISABILITY_INFO);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  /**
   * 2단계에 띄울 양상 그룹.
   *
   * 등록자는 고른 법정 유형에서, 미등록자는 직접 고른 영역에서 나온다.
   * 지체장애와 뇌병변장애는 같은 그룹을 가리키므로 둘을 모두 선택해도
   * 질문은 한 번만 나온다. 순서는 ASPECT_GROUP_ORDER 를 따라
   * 화면 배치가 선택 순서에 따라 흔들리지 않게 한다.
   */
  const activeGroups = useMemo<AspectGroup[]>(() => {
    const needed =
      value.registration === 'unregistered'
        ? new Set(value.affectedAreas.filter((a): a is AspectGroup => a !== 'none'))
        : new Set(value.types.map((t) => ASPECT_GROUP_BY_TYPE[t]));
    return ASPECT_GROUP_ORDER.filter((g) => needed.has(g));
  }, [value.registration, value.types, value.affectedAreas]);

  /**
   * 등록 여부를 바꾼다. 반대편 경로의 값을 버리는 것이 핵심이다.
   *
   * 등록자로 답하다가 미등록으로 바꾸면 정도·법정 유형이 남아 있으면 안 되고,
   * 그 반대도 마찬가지다. 남겨두면 화면에 보이지 않는 값이 CSV 로 나간다.
   */
  const setRegistration = useCallback((registration: DisabilityRegistration) => {
    setValue((prev) => {
      if (prev.registration === registration) return prev;
      const cleared: DisabilityInfo = {
        ...prev,
        registration,
        severity: registration === 'registered' ? prev.severity : null,
        types: registration === 'registered' ? prev.types : [],
        affectedAreas: registration === 'unregistered' ? prev.affectedAreas : [],
      };
      const stillNeeded =
        registration === 'unregistered'
          ? new Set(cleared.affectedAreas.filter((a): a is AspectGroup => a !== 'none'))
          : new Set(cleared.types.map((t) => ASPECT_GROUP_BY_TYPE[t]));
      return pruneAspects(cleared, stillNeeded);
    });
  }, []);

  /** 미등록자 경로 — 영역을 켜고 끈다. "해당 없음"은 배타 선택. */
  const toggleAffectedArea = useCallback((area: AffectedArea, checked: boolean) => {
    setValue((prev) => {
      let affectedAreas: AffectedArea[];
      if (!checked) {
        affectedAreas = prev.affectedAreas.filter((a) => a !== area);
      } else if (EXCLUSIVE_AREAS.has(area)) {
        affectedAreas = [area];
      } else {
        affectedAreas = [
          ...prev.affectedAreas.filter((a) => !EXCLUSIVE_AREAS.has(a)),
          area,
        ];
      }
      const stillNeeded = new Set(
        affectedAreas.filter((a): a is AspectGroup => a !== 'none'),
      );
      return pruneAspects({ ...prev, affectedAreas }, stillNeeded);
    });
  }, []);

  /**
   * 등록자 경로 — 법정 유형을 켜거나 끈다.
   *
   * 끌 때 딸린 값을 함께 버린다. 남겨두면 더 이상 묻지 않는 그룹의 양상이
   * CSV 에 실린다. 버릴 범위 판단이 화면과 훅 두 곳에 흩어지면 어긋나므로
   * pruneAspects 한 곳에서만 한다.
   */
  const toggleType = useCallback((type: DisabilityType, checked: boolean) => {
    setValue((prev) => {
      const types = checked ? [...prev.types, type] : prev.types.filter((t) => t !== type);
      const stillNeeded = new Set(types.map((t) => ASPECT_GROUP_BY_TYPE[t]));
      return pruneAspects({ ...prev, types }, stillNeeded);
    });
  }, []);

  const setSeverity = useCallback((severity: DisabilitySeverity) => {
    setValue((prev) => ({ ...prev, severity }));
  }, []);

  /** 세부 양상을 켜거나 끈다. 끄면 딸린 자유 입력·좌우 값도 버린다. */
  const toggleAspect = useCallback((group: AspectGroup, aspect: string, checked: boolean) => {
    setValue((prev) => {
      const current = prev.aspectsByGroup[group] ?? [];
      const next = checked ? [...current, aspect] : current.filter((a) => a !== aspect);

      const aspectOtherByGroup = { ...prev.aspectOtherByGroup };
      if (!checked && aspect === 'other') delete aspectOtherByGroup[group];

      const aspectSideByKey = { ...prev.aspectSideByKey };
      if (!checked) delete aspectSideByKey[sideKey(group, aspect)];

      return {
        ...prev,
        aspectsByGroup: { ...prev.aspectsByGroup, [group]: next },
        aspectOtherByGroup,
        aspectSideByKey,
      };
    });
  }, []);

  const setAspectOther = useCallback((group: AspectGroup, text: string) => {
    setValue((prev) => ({
      ...prev,
      aspectOtherByGroup: { ...prev.aspectOtherByGroup, [group]: text },
    }));
  }, []);

  const setAspectSide = useCallback((group: AspectGroup, aspect: string, side: BodySide) => {
    setValue((prev) => ({
      ...prev,
      aspectSideByKey: { ...prev.aspectSideByKey, [sideKey(group, aspect)]: side },
    }));
  }, []);

  const setNarrative = useCallback((text: string) => {
    setValue((prev) => ({ ...prev, narrative: text }));
  }, []);

  /* ── 검증 ─────────────────────────────────────────────────────────────── */

  /** 화면 순서(위 → 아래)와 같은 순서로 오류를 담는다. */
  const errors = useMemo<ConsentValidationError[]>(() => {
    const list: ConsentValidationError[] = [];

    /*
     * 1단계. 오류 순서는 화면 순서와 같아야 하므로 갈림길 → 갈래별 질문 순으로 담는다.
     * 갈림길에 답하기 전에는 아래 질문이 화면에 없으므로 검증하지 않는다 —
     * 보이지도 않는 항목을 오류 요약에 올리면 눌러도 갈 곳이 없다.
     */
    if (value.registration === null) {
      list.push({
        key: 'registration',
        targetId: `${disabilityDomId.registration}-registered`,
        message: C.step1.registrationMissing,
      });
    } else if (value.registration === 'registered') {
      if (value.severity === null) {
        list.push({
          key: 'severity',
          targetId: `${disabilityDomId.severity}-severe`,
          message: C.step1.severityMissing,
        });
      }
      if (value.types.length === 0) {
        list.push({
          key: 'types',
          targetId: `${disabilityDomId.primaryTypes}-vision`,
          message: C.step1.typeMissing,
        });
      }
    } else if (value.affectedAreas.length === 0) {
      list.push({
        key: 'affectedAreas',
        targetId: `${disabilityDomId.affectedAreas}-visionAspects`,
        message: C.step1.areasMissing,
      });
    }

    // 2단계 — 노출된 그룹마다
    for (const group of activeGroups) {
      const spec = ASPECT_GROUP_MAP[group];
      const selected = value.aspectsByGroup[group] ?? [];

      if (selected.length === 0) {
        list.push({
          key: `aspects-${group}`,
          targetId: `${disabilityDomId.aspects(group)}-${spec.options[0].value}`,
          message: C.step2.aspectMissing(spec.title),
        });
        continue;
      }

      if (selected.includes('other') && (value.aspectOtherByGroup[group] ?? '').trim() === '') {
        list.push({
          key: `aspect-other-${group}`,
          targetId: disabilityDomId.aspectOther(group),
          message: C.step2.otherMissing(spec.title),
        });
      }

      // 좌우 구분이 필요한 양상을 골랐으면 방향도 받아야 한다.
      for (const option of spec.options) {
        if (!option.needsSide || !selected.includes(option.value)) continue;
        if (value.aspectSideByKey[sideKey(group, option.value)] === undefined) {
          list.push({
            key: `aspect-side-${group}-${option.value}`,
            targetId: `${disabilityDomId.aspectSide(group, option.value)}-right`,
            message: C.step2.sideMissing(option.label),
          });
        }
      }
    }

    // 3단계는 선택이므로 검증하지 않는다. (스펙 3-3: "선택, 권장")
    return list;
  }, [value, activeGroups]);

  const errorFor = useCallback(
    (key: string): string | null => {
      if (!submitAttempted) return null;
      return errors.find((e) => e.key === key)?.message ?? null;
    },
    [errors, submitAttempted],
  );

  /** 저장·CSV 에 쓸 정규 형태. */
  const normalized = useMemo<DisabilityInfo>(() => {
    const aspectOtherByGroup: DisabilityInfo['aspectOtherByGroup'] = {};
    for (const [group, text] of Object.entries(value.aspectOtherByGroup)) {
      if (text !== undefined) aspectOtherByGroup[group as AspectGroup] = text.trim();
    }
    return { ...value, aspectOtherByGroup, narrative: value.narrative.trim() };
  }, [value]);

  return {
    value,
    normalized,
    activeGroups,
    setRegistration,
    toggleAffectedArea,
    toggleType,
    setSeverity,
    toggleAspect,
    setAspectOther,
    setAspectSide,
    setNarrative,
    errors,
    errorFor,
    isComplete: errors.length === 0,
    submitAttempted,
    setSubmitAttempted,
  };
}
