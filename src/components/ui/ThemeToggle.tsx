import { useEffect, useState } from 'react';
import {
  THEME_OPTIONS,
  applyThemePreference,
  readThemePreference,
  writeThemePreference,
} from '../../lib/theme';
import type { ThemePreference } from '../../lib/theme';

/**
 * 화면 밝기 전환.
 *
 * 빛 번짐(halation)에 취약한 방향이 사람마다 반대다. 어두운 배경 위 밝은
 * 글자가 번져 보이는 사람도 있고, 흰 배경 자체가 눈부신 사람도 있다.
 * 한쪽으로 고정하면 반드시 한쪽을 배제하게 되므로 직접 뒤집을 수 있게 한다.
 *
 * 접근성 처리:
 *  - native radio + fieldset/legend 를 쓴다. 방향키 순환, 단일 선택, 그룹
 *    이름 읽기를 브라우저가 처리한다. 버튼을 눌러 순환시키는 방식은
 *    "지금 무엇이 선택돼 있는지"가 스크린리더에 드러나지 않는다.
 *  - 선택 변경을 별도 라이브 리전으로 알리지 않는다. 라디오 자체가 선택
 *    상태를 읽어주므로 중복이고, 화면 색이 바뀐 것은 시각 정보다.
 *  - 각 선택지에 설명을 붙여 "밝은 화면"이 왜 있는지 알 수 있게 한다.
 */
export function ThemeToggle() {
  /*
   * 초기값을 localStorage 에서 읽는다. index.html 의 선반영 스크립트가 이미
   * 같은 값으로 data-theme 을 세팅해 뒀으므로 화면 깜빡임은 없다.
   */
  const [preference, setPreference] = useState<ThemePreference>(() => readThemePreference());

  useEffect(() => {
    applyThemePreference(preference);
    writeThemePreference(preference);
  }, [preference]);

  return (
    <fieldset className="theme-toggle">
      <legend className="theme-toggle__legend">화면 밝기</legend>
      <div className="theme-toggle__options">
        {THEME_OPTIONS.map((option) => {
          const id = `theme-${option.value}`;
          const descriptionId = `${id}-desc`;
          return (
            <div className="theme-toggle__option" key={option.value}>
              <input
                type="radio"
                id={id}
                name="theme"
                value={option.value}
                checked={preference === option.value}
                onChange={() => setPreference(option.value)}
                aria-describedby={descriptionId}
              />
              <label htmlFor={id}>{option.label}</label>
              {/*
               * 설명은 화면에서는 감추고 스크린리더에만 읽힌다. 선택지 3개마다
               * 긴 설명을 펼쳐두면 화면이 무거워지는데, 설명이 필요한 쪽은
               * 주로 "왜 밝은 화면이 있는지" 맥락이 안 보이는 사용자다.
               */}
              <span className="visually-hidden" id={descriptionId}>
                {option.description}
              </span>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
