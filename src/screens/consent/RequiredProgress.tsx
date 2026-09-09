interface RequiredProgressProps {
  agreed: number;
  total: number;
}

/**
 * 필수 항목 동의 진행률.
 *
 * 접근성 처리:
 *  - 텍스트를 role="status" 로 감싸서, 체크할 때마다 "필수 2/3 동의"가
 *    스크린리더에 읽히게 한다. role="status" 는 마운트 시점에는 읽지 않고
 *    값이 바뀔 때만 읽으므로, 첫 진입에서 불필요한 소리가 나지 않는다.
 *  - 막대 그래픽은 aria-hidden="true". 같은 정보를 role="progressbar" 로
 *    한 번 더 노출하면 텍스트와 중복해서 두 번 읽힌다.
 *  - 숫자 대비 진행 상태를 색으로만 표시하지 않고, 완료 시 "모두 동의" 라는
 *    글자를 함께 보여준다.
 */
export function RequiredProgress({ agreed, total }: RequiredProgressProps) {
  const complete = agreed >= total;
  const percent = total === 0 ? 100 : Math.round((agreed / total) * 100);

  return (
    <div className={`progress${complete ? ' progress--complete' : ''}`}>
      <p className="progress__text" role="status">
        {complete ? (
          <>
            <span aria-hidden="true">✓ </span>
            필수 {total}건 모두 동의 — 다음 단계로 진행할 수 있습니다.
          </>
        ) : (
          <>
            필수 {agreed}/{total} 동의 — {total - agreed}건 남았습니다.
          </>
        )}
      </p>
      <div className="progress__track" aria-hidden="true">
        <div className="progress__bar" style={{ inlineSize: `${percent}%` }} />
      </div>
    </div>
  );
}
