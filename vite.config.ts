import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  /*
   * 상대 경로로 애셋을 참조한다.
   *
   * GitHub Pages 는 사이트를 하위 경로에 올린다. GitHub Enterprise Server 에서는
   * 서브도메인 격리 설정에 따라 경로가 두 가지로 갈린다.
   *   격리 On  : https://pages.<host>/<owner>/<repo>/
   *   격리 Off : https://<host>/pages/<owner>/<repo>/
   *
   * base 를 절대 경로로 박으면 이 중 한쪽에서만 동작한다. './' 로 두면
   * 어느 경로에 올라가도 애셋이 정상 로드된다. 이 앱은 클라이언트 라우터가
   * 없고 단일 진입점이라 상대 경로로 인한 부작용이 없다.
   *
   * 나중에 라우터를 붙여 /participant 같은 하위 경로를 쓰게 되면
   * 이 설정을 절대 경로로 바꾸고 배포 URL 을 고정해야 한다.
   */
  base: './',

  server: {
    port: 5173,
    strictPort: false,
  },
});
