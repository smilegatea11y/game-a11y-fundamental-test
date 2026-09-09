import { RadioGroup } from '../../components/ui/RadioGroup';
import type { RadioOption } from '../../components/ui/RadioGroup';
import { domId } from '../../state/useConsentForm';
import type { AgeBracket, GuardianInfo } from '../../types/consent';
import { GuardianFields } from './GuardianFields';

interface AgeVerificationProps {
  ageBracket: AgeBracket | null;
  onAgeChange: (value: AgeBracket) => void;
  guardian: GuardianInfo;
  onGuardianChange: (field: keyof GuardianInfo, value: string) => void;
  errorFor: (key: string) => string | null;
}

/*
 * 체크박스 토글 대신 라디오 2개를 쓴다.
 *
 * 토글이면 "체크하지 않은 상태"가 [만 14세 이상]인지 [아직 답하지 않음]인지
 * 구분되지 않는다. 법정대리인 동의 누락은 법적 문제로 이어지므로 기본값에
 * 기댈 수 없고, 스크린리더 사용자에게도 미응답 상태가 전달되지 않는다.
 * 라디오는 둘 다 비선택인 상태가 명시적인 "미응답"이라 검증할 수 있다.
 */
const AGE_OPTIONS: readonly RadioOption<AgeBracket>[] = [
  {
    value: 'over14',
    id: domId.ageFirstOption,
    label: '만 14세 이상입니다',
  },
  {
    value: 'under14',
    id: 'age-bracket-under14',
    label: '만 14세 미만입니다',
    description: '선택하시면 법정대리인 정보 입력란이 아래에 나타납니다.',
  },
];

export function AgeVerification({
  ageBracket,
  onAgeChange,
  guardian,
  onGuardianChange,
  errorFor,
}: AgeVerificationProps) {
  return (
    <section className="section" aria-labelledby="age-section-heading">
      <h2 className="section__heading" id="age-section-heading">
        참여자 연령 확인
      </h2>

      <RadioGroup
        groupId={domId.ageGroup}
        legend="참여자는 만 14세 이상입니까?"
        hint="만 14세 미만 참여자는 법정대리인의 동의가 필요합니다."
        name="age-bracket"
        options={AGE_OPTIONS}
        value={ageBracket}
        onChange={onAgeChange}
        error={errorFor('age-bracket')}
      />

      {/*
       * 조건부 필드는 이 위치(라디오 바로 다음)에 삽입한다.
       * DOM 순서 = 탭 순서이므로, 라디오에서 Tab 을 누르면 자연히 새 필드로
       * 들어간다. 포커스를 강제로 옮기지 않는다 — 라디오를 화살표로 훑는
       * 도중에 포커스를 빼앗으면 다른 선택지를 확인할 수 없게 된다.
       * 대신 ConsentScreen 의 LiveRegion 이 "입력란이 추가되었습니다"를 알린다.
       */}
      {ageBracket === 'under14' ? (
        <GuardianFields guardian={guardian} onChange={onGuardianChange} errorFor={errorFor} />
      ) : null}
    </section>
  );
}
