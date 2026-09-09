import { CONSENT_ITEMS } from '../../data/consentItems';
import { useScreenSetup } from '../../lib/useScreenSetup';
import type { ConsentRecord } from '../../types/consent';
// .page / .section / .btn 등 공용 클래스가 여기 정의되어 있다.
// 번들러가 중복 import 를 정리하므로 화면별로 명시해도 된다.
import '../consent/consent.css';

interface ParticipantScreenProps {
  consent: ConsentRecord;
  onReset: () => void;
}

/**
 * 2단계 자리표시 화면.
 *
 * 지금은 동의 게이트가 실제로 동작하는지 확인하고, 다음 단계에서 어떤 정보를
 * 받을 수 있는지 보여주는 용도만 한다. 실제 참여자 정보 입력 폼은
 * 별도 요청으로 만든다. (SYSTEM_SPEC.md Phase 1)
 */
export function ParticipantScreen({ consent, onReset }: ParticipantScreenProps) {
  const headingRef = useScreenSetup('참여자 정보 입력', true);

  const agreedAtText = new Date(consent.agreedAt).toLocaleString('ko-KR');

  return (
    <main className="page" id="main">
      <p className="page__step">2단계 / 참여자 정보 입력</p>

      <h1 className="page__title" ref={headingRef} tabIndex={-1}>
        참여자 정보 입력
      </h1>

      <div className="progress progress--complete">
        <p className="progress__text">
          <span aria-hidden="true">✓ </span>
          개인정보 수집·이용 동의가 완료되었습니다.
        </p>
      </div>

      <section className="section" aria-labelledby="record-heading">
        <h2 className="section__heading" id="record-heading">
          기록된 동의 내용
        </h2>
        <dl className="detail-list">
          <div className="detail-list__row">
            <dt>동의 일시</dt>
            <dd>{agreedAtText}</dd>
          </div>
          <div className="detail-list__row">
            <dt>동의서 버전</dt>
            <dd>{consent.consentVersion}</dd>
          </div>
          <div className="detail-list__row">
            <dt>연령 구분</dt>
            <dd>{consent.ageBracket === 'under14' ? '만 14세 미만' : '만 14세 이상'}</dd>
          </div>
          {consent.guardian ? (
            <div className="detail-list__row">
              <dt>법정대리인</dt>
              <dd>
                {consent.guardian.name} ({consent.guardian.relation}) ·{' '}
                {consent.guardian.contact}
              </dd>
            </div>
          ) : null}
          {CONSENT_ITEMS.map((item) => (
            <div className="detail-list__row" key={item.id}>
              <dt>
                [{item.required ? '필수' : '선택'}] {item.title}
              </dt>
              <dd>{consent.items[item.id] ? '동의' : '미동의'}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section" aria-labelledby="next-heading">
        <h2 className="section__heading" id="next-heading">
          다음 단계
        </h2>
        <p className="section__lead">
          이 화면에는 고유 ID 발급, 기본정보(연령대·성별), 장애 유형·정도, 기기 및 보조기기 사양
          입력 폼이 들어갑니다. 아직 구현되지 않았습니다.
        </p>
      </section>

      <div className="actions">
        <button type="button" className="btn btn--secondary" onClick={onReset}>
          동의 기록 초기화 (개발용)
        </button>
        <p className="actions__hint">
          저장된 동의 기록을 지우고 1단계 동의 화면으로 돌아갑니다. 개발·검증 중에만 사용합니다.
        </p>
      </div>
    </main>
  );
}
