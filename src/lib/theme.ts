/**
 * 화면 밝기(테마) 설정.
 *
 * 빛 번짐(halation)에 취약한 정도는 사람마다 반대 방향이다. 어두운 배경에서
 * 밝은 글자가 번져 보이는 사람도 있고, 흰 배경 자체가 눈부신 사람도 있다.
 * 그래서 한쪽으로 고정하지 않고 참여자가 직접 뒤집을 수 있게 한다.
 *
 * 주의: 이 설정은 셸(Shell) 화면에만 적용된다. 테스트 자극(Stimulus)의 색·대비는
 * 측정 유효성 때문에 고정값이어야 하므로 이 토큰을 쓰지 않는다.
 * (SYSTEM_SPEC 2절, CLAUDE.md 참고)
 */

export type ThemePreference = 'system' | 'dark' | 'light';

/**
 * 저장 키.
 *
 * 주의: index.html 의 선반영 스크립트가 같은 문자열을 하드코딩하고 있다.
 * 그 스크립트는 React 가 마운트되기 전에 실행돼야 해서 이 모듈을 import 할 수
 * 없다. 한쪽만 바꾸면 첫 페인트에 테마가 적용되지 않고 화면이 번쩍이는데,
 * 오류가 나지 않아 알아채기 어렵다. 값을 바꿀 때는 index.html 도 함께 고칠 것.
 */
export const THEME_STORAGE_KEY = 'gaft.theme';

export const THEME_OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  description: string;
}> = [
  {
    value: 'system',
    label: '기기 설정 따르기',
    description: '운영체제의 밝기 설정을 그대로 씁니다.',
  },
  {
    value: 'dark',
    label: '어두운 화면',
    description: '검정에 가까운 배경과 밝은 글자입니다.',
  },
  {
    value: 'light',
    label: '밝은 화면',
    description: '흰 배경과 검정에 가까운 글자입니다. 밝은 글자가 번져 보일 때 선택하세요.',
  },
];

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'dark' || value === 'light';
}

/**
 * 저장된 설정을 읽는다.
 *
 * 참여자 데이터가 아니라 기기별 표시 설정이므로 세션 초안(gaft.session)과
 * 별도 키에 둔다. 세션은 문안 개정으로 무효화되지만 밝기 설정은 유지돼야 한다.
 * CSV 에도 포함하지 않는다.
 */
export function readThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* 저장할 수 없어도 현재 화면에는 적용된다. */
  }
}

/**
 * 문서 루트에 설정을 반영한다.
 *
 * 'system' 일 때는 data-theme 속성을 지워서 CSS 의 prefers-color-scheme 쿼리가
 * 판단하게 맡긴다. 여기서 matchMedia 를 읽어 dark/light 로 고정해버리면
 * 참여자가 OS 설정을 바꿨을 때 따라가지 못한다.
 */
export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', preference);
  }
}
