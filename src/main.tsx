import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/*
 * Pretendard — 한글 시인성이 검증된 서체. 자체 호스팅한다.
 * 이 사이트는 민감정보를 다루므로 외부 폰트 CDN 을 쓰지 않는다.
 * 외부 요청은 참여자의 IP 와 방문 사실을 제3자에게 노출하고,
 * CDN 장애 시 폰트가 통째로 사라진다.
 *
 * Regular(400) / Medium(500) / Bold(700) 세 가지만 불러온다.
 * SYSTEM_SPEC 이 Light/Thin 을 기본값으로 쓰지 못하게 하므로,
 * 애초에 로드하지 않아 실수로 쓰는 것을 구조적으로 막는다.
 * 각 파일은 unicode-range 로 쪼개져 있어 실제로 쓰이는 글자 구간만 내려온다.
 */
import 'pretendard/dist/web/static/Pretendard-Regular.css';
import 'pretendard/dist/web/static/Pretendard-Medium.css';
import 'pretendard/dist/web/static/Pretendard-Bold.css';

/*
 * 토큰·리셋·유틸 스타일을 App 보다 먼저 import 한다.
 *
 * ES 모듈은 import 순서대로 평가되므로, App 을 먼저 import 하면 화면들이
 * 딸려 들어오면서 consent.css 가 base.css 보다 앞에 주입된다. 그러면
 * 명시도가 같은 규칙에서 base.css 가 이겨 컴포넌트 스타일이 먹지 않는다.
 * (실제로 input[data-status] 규칙이 이 문제로 적용되지 않았다.)
 */
import './styles/tokens.css';
import './styles/base.css';
import './styles/a11y.css';

import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root 요소를 찾을 수 없습니다. index.html 을 확인하세요.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
