# game-a11y-fundamental-test

장애인 게이머의 게임 플레이 기초 역량을 측정하고 개인 리포트를 제공하는 웹 앱.
전체 기획과 로드맵은 [SYSTEM_SPEC.md](SYSTEM_SPEC.md) 참고.

## 실행

```bash
npm install
npm run dev
```

타입 검사: `npm run typecheck` · 빌드: `npm run build`

## 스택

Vite + React 18 + TypeScript. 라우터·상태관리 라이브러리 없음 —
화면 전환은 `src/App.tsx`의 단계 상태로만 처리한다.

## 접근성 — 이 프로젝트의 최우선 원칙

접근성은 **두 층위**로 나뉜다. 이 구분을 혼동하면 안 된다.

### 셸(Shell) — WCAG 2.2 AA 완전 준수

동의, 폼, 안내문, 결과 화면 등 측정 대상이 아닌 모든 화면.

- 키보드만으로 전체 완주 가능. `tabindex` 양수 사용 금지
- `outline: none` **금지**. 포커스 링은 `src/styles/base.css`에서 전역 관리
- 커스텀 위젯을 만들지 말고 native 요소를 쓴다
  (checkbox / radio / `<details>` / `<fieldset>`+`<legend>`)
- `<input type="checkbox">`와 `radio`는 `appearance`를 덮어쓰지 않는다 —
  고대비 모드에서 상태 표시가 사라진다
- 색만으로 의미를 전달하지 않는다. 아이콘·텍스트·패턴을 항상 함께 쓴다
  (필수/선택은 글자 배지, 오류는 `⚠`+글자, 완료는 `✓`+글자, 민감정보는 굵은 테두리)
- SPA 화면 전환 시 `useScreenSetup()`으로 `document.title` 갱신 + `h1` 포커스 이동
- 오류는 제출 버튼 `disabled` 대신 오류 요약(`ErrorSummary`) + 포커스 이동으로 처리
- 포커스 이동을 `requestAnimationFrame`에 의존하지 않는다. 탭이 백그라운드거나
  렌더링이 스로틀되면 실행되지 않는다. `useEffect`를 쓴다 (실측으로 확인된 문제)
- 클릭·터치 타겟은 최소 44×44px (`--target-min`)
- 한국어 오류 메시지에 `을(를)` 같은 병기를 쓰지 않는다. 스크린리더가
  "을 괄호 를"로 읽는다. 받침을 보고 조사를 고른다
  (`withObjectParticle()` in `src/state/useConsentForm.ts`)

### 저시력 시인성 — 스크린리더와 동등한 우선순위

색상·크기·굵기는 취향이 아니라 기준이다. 전부 `src/styles/tokens.css`에 있다.

- **대비**: 본문 텍스트 AA(4.5:1)를 최소선, **AAA(7:1)를 지향.** 현재 모든 텍스트
  토큰이 라이트·다크 양쪽에서 7:1 이상이다. 색을 바꾸면 브라우저에서 다시 측정하고
  토큰 주석의 수치를 갱신할 것 — 손계산을 믿지 말고 실측한다
- **글자 크기**: 본문 20px(`--text-base`), 보조 텍스트 18px(`--text-sm`).
  **16px 미만 토큰은 정의하지 않는다** — "작은 글씨" 자리를 만들지 않아서
  나중에 쓰이는 것을 구조적으로 막는다. 전부 rem
- **폰트**: Pretendard를 npm으로 자체 호스팅한다. 민감정보를 다루는 사이트라
  외부 폰트 CDN을 쓰지 않는다(참여자 IP 노출, CDN 장애 시 폰트 소실).
  Regular(400)/Medium(500)/Bold(700)만 로드하므로 Light/Thin은 지정해도 적용되지
  않는다. `body`에 굵기를 명시해 서체 기본값이 Light로 떨어지지 않게 한다
- **자간·행간**: 행간 1.7, 자간 `+0.01em`. **음수 자간 금지** — 큰 제목을 좁혀
  다듬는 흔한 처리지만 자소가 붙어 보이게 만든다
- 대비가 낮은 보조 텍스트는 Medium(500)으로 굵혀 보강한다

### 테스트 자극(Stimulus) — 표준화된 통제 조건 유지

반응속도, 대비 인식, 주변시야 등 "측정 대상 그 자체"인 화면.

- 자극의 색상 대비, 글자 크기, 애니메이션 속도, 타이밍은 사용자
  브라우저/OS 접근성 설정에 의해 바뀌면 **안 된다** — 측정값이 무효가 된다
- 따라서 `tokens.css`, `prefers-color-scheme`, `prefers-reduced-motion`을
  자극 요소에 적용하지 않는다. 별도 고정값으로 관리한다
- **통제 대상은 "측정 대상 자극"뿐이고 화면 전체가 아니다.** 같은 화면에 있는
  안내 문구, 버튼, 진행 표시 등 자극이 아닌 주변 UI는 위 셸 기준(대비·글자
  크기·폰트)을 그대로 따른다. 자극 하나 때문에 화면 전체를 작고 흐리게
  만들면 안 된다
- 대신 **입력 방식**은 유연해야 한다. 온보딩에서 받은 보조기기 정보로
  수행 불가한 테스트는 대체하거나 건너뛴다
- 타이밍 측정은 `performance.now()` + `requestAnimationFrame`으로,
  React 렌더 사이클이 아니라 DOM 을 직접 제어해서 구현한다

## 코드 구조 규칙

- `src/data/` — 법적 문안, 문항 등 "텍스트 데이터". 담당자가 코드를 몰라도
  수정할 수 있게 로직과 분리한다
- `src/state/` — 검증·계산 로직. UI 를 모른다
- `src/components/ui/` — 재사용 부품. 라벨·describedby·invalid 배선을
  부품 내부에서 책임진다. 호출부에서 매번 배선하면 반드시 빠진다
- `src/components/a11y/` — 접근성 전용 부품 (라이브 리전, 오류 요약)
- `src/screens/` — 화면 단위 조립

## 개인정보 처리 규칙

- 동의 화면(`src/screens/consent/`)을 통과하기 전에는 개인정보 입력 필드를
  **DOM 에 마운트하지 않는다.** `hidden`이나 CSS 로 감추는 것으로는 부족하다
- 동의서 문안을 실질적으로 개정하면 `CONSENT_VERSION`을 올린다.
  구버전 동의 기록은 자동 무효화되어 재동의를 받는다
- `src/data/consentItems.ts`의 `⚠️ 확정 필요` 표시는 사내 개인정보 담당자
  확정을 기다리는 값이다. 배포 전에 전부 채워야 한다

## 작업 방식

1. 기능 하나 = 요청 하나
2. 코드를 짜기 전에 계획부터 설명한다
3. 기능 완성 후 접근성 관점에서 별도 점검한다 —
   [docs/accessibility-checklist.md](docs/accessibility-checklist.md)
