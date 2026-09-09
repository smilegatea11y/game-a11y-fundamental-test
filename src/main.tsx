import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

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

import './styles/tokens.css';
import './styles/base.css';
import './styles/a11y.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root 요소를 찾을 수 없습니다. index.html 을 확인하세요.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
