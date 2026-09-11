import { CONSENT_ITEMS, SUBMISSION_INFO } from '../../data/consentItems';
import { buildResultFilename } from '../../lib/csv';
import { useScreenSetup } from '../../lib/useScreenSetup';
import { PARTICIPANT_ID_PATTERN } from '../../types/participant';
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
          남은 단계
        </h2>
        <p className="section__lead">
          아직 구현되지 않았습니다. SYSTEM_SPEC 기준으로 다음 순서로 이어집니다.
        </p>
        <ol className="roadmap">
          <li>
            <strong>기본정보</strong> — 고유 ID(형식 {PARTICIPANT_ID_PATTERN.source}), 성별,
            연령대, 참여 경로, 게임 경력, 선호 장르, 주간 플레이 시간, 접근성 기능 사용 여부
          </li>
          <li>
            <strong>장애정보</strong> — 법정 유형 15개 중 선택(기본 7개 노출 + 그 외 접기),
            유형별 중증·경증, 게임 관련 세부 양상, 주관식 부연 설명
          </li>
          <li>
            <strong>기기 사양</strong> — OS, 모니터·해상도·주사율, 주 입력장치, 시청 거리, 오디오
            출력 방식, 보조기기 모델
          </li>
          <li>
            <strong>역량 테스트</strong> — 선택한 장애 유형에 맞는 테스트 3~4개
          </li>
          <li>
            <strong>결과 제출</strong> — CSV 다운로드 후 이메일 제출
          </li>
        </ol>
      </section>

      <section className="section" aria-labelledby="csv-heading">
        <h2 className="section__heading" id="csv-heading">
          결과 제출 방식
        </h2>
        <p className="section__lead">
          테스트를 마치면 결과가 CSV 파일로 저장되고, 참여자가 그 파일을 안내된 주소로 직접
          보냅니다. 서버로 전송되는 정보는 없습니다.
        </p>
        <dl className="detail-list">
          <div className="detail-list__row">
            <dt>파일명 형식</dt>
            <dd>
              <code>{buildResultFilename('GA11Y-P26-014', new Date(2026, 8, 9))}</code>
            </dd>
          </div>
          <div className="detail-list__row">
            <dt>제출 주소</dt>
            <dd>{SUBMISSION_INFO.email}</dd>
          </div>
        </dl>
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
