import './DeployNotice.css';

/**
 * 테스트 배포 경고.
 *
 * 이 화면은 장애 정보(민감정보)를 입력받는 동의 폼이지만, 아직
 *  - 보유기간·처리기관·보호책임자·문의처가 확정되지 않았고 (⚠️ 확정 필요)
 *  - 데이터를 받는 백엔드가 없다 (브라우저 localStorage 에만 남는다)
 *
 * 이 상태의 화면을 실제 연구로 오인해 민감정보를 입력하는 사람이 생기면 안 되므로,
 * 배포 빌드에서는 반드시 이 경고를 띄운다.
 *
 * `import.meta.env.PROD` 로 판단하므로 `npm run dev` 에서는 보이지 않고,
 * `npm run build` 결과물(= GitHub Pages 배포본)과 `npm run preview` 에서만 보인다.
 *
 * 문안이 확정되고 실제 수집을 시작할 때 이 컴포넌트를 제거할 것.
 *
 * 접근성:
 *  - role="alert" 를 쓰지 않는다. alert 은 "지금 막 생긴 변화"를 알리는 용도이고,
 *    페이지 로드 시점부터 있는 고정 안내에는 낭독이 불안정하다.
 *  - 대신 (1) DOM 최상단에 두어 순서대로 읽는 사용자가 가장 먼저 만나게 하고,
 *    (2) 이름 있는 region 랜드마크로 만들어 랜드마크 목록에서도 찾히게 한다.
 */
export function DeployNotice() {
  if (!import.meta.env.PROD) return null;

  return (
    <div className="deploy-notice" role="region" aria-label="테스트 배포 안내">
      <p className="deploy-notice__label">
        <span aria-hidden="true">⚠ </span>
        개발 중 테스트 배포
      </p>
      <p className="deploy-notice__body">
        실제 연구 참여가 아닙니다. 이 화면은 개발 검증용이며, 입력하신 정보는 어떤 곳에도
        전송·저장되지 않습니다. 동의서 문안(보유기간, 처리기관, 문의처)도 확정 전
        상태입니다. <strong>실제 장애 정보를 입력하지 마세요.</strong>
      </p>
    </div>
  );
}
