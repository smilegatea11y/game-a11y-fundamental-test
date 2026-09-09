import { TextField } from '../../components/ui/TextField';
import { GUARDIAN_NOTICE } from '../../data/consentItems';
import { domId } from '../../state/useConsentForm';
import type { GuardianInfo } from '../../types/consent';

interface GuardianFieldsProps {
  guardian: GuardianInfo;
  onChange: (field: keyof GuardianInfo, value: string) => void;
  errorFor: (key: string) => string | null;
}

/**
 * 만 14세 미만 참여자의 법정대리인 정보.
 *
 * 이 화면 전체의 원칙은 "동의 전에는 개인정보 입력란을 노출하지 않는다" 인데,
 * 이 필드는 예외다. 법정대리인 동의는 개인정보 처리의 법적 근거 자체이므로
 * 동의 절차의 일부다.
 *
 * 다만 이 정보는 참여자 본인이 아닌 제3자(법정대리인)의 개인정보이므로,
 * 수집 목적과 파기 시점을 필드 위에 명시한다.
 */
export function GuardianFields({ guardian, onChange, errorFor }: GuardianFieldsProps) {
  return (
    <div className="guardian" role="group" aria-labelledby="guardian-heading">
      <h3 className="guardian__heading" id="guardian-heading">
        법정대리인 동의 정보
      </h3>

      <div className="guardian__notice">
        <p>{GUARDIAN_NOTICE.legalBasis}</p>
        <p>{GUARDIAN_NOTICE.purpose}</p>
        <p>{GUARDIAN_NOTICE.retention}</p>
      </div>

      <TextField
        id={domId.guardianField('name')}
        label="법정대리인 성명"
        value={guardian.name}
        onChange={(value) => onChange('name', value)}
        error={errorFor('guardian-name')}
      />

      <TextField
        id={domId.guardianField('relation')}
        label="참여자와의 관계"
        hint="예: 모, 부, 조부모, 후견인"
        value={guardian.relation}
        onChange={(value) => onChange('relation', value)}
        error={errorFor('guardian-relation')}
      />

      <TextField
        id={domId.guardianField('contact')}
        label="법정대리인 연락처"
        hint="전화번호 또는 이메일 주소를 입력해 주세요. 동의 사실 확인 목적으로만 연락드립니다."
        value={guardian.contact}
        onChange={(value) => onChange('contact', value)}
        error={errorFor('guardian-contact')}
        type="text"
        inputMode="text"
      />
    </div>
  );
}
