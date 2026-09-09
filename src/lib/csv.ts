/**
 * CSV 직렬화 및 다운로드 (SYSTEM_SPEC 3-5).
 *
 * 시스템 A 는 서버에 아무것도 보내지 않는다. 참여자가 CSV 파일을 자기 기기로
 * 내려받아 지정된 이메일로 직접 제출한다. 그래서 이 파일이 시스템 A 의
 * 유일한 데이터 출구다.
 *
 * 컬럼 구성(어떤 항목이 어떤 순서로 들어가는지)은 여기서 정하지 않는다.
 * 테스트가 만들어지고 실제 결과 항목이 확정된 뒤(Phase 5) 결정할 일이다.
 * 이 모듈은 "값들을 안전한 CSV 로 만들고 내려받는" 기계 부분만 담당한다.
 */

/**
 * Excel 호환을 위한 UTF-8 BOM.
 *
 * 이게 없으면 Windows 의 Excel 이 UTF-8 CSV 를 현재 시스템 인코딩으로 읽어서
 * 한글이 전부 깨진다. 관리자가 제출받은 파일을 Excel 로 열 것이므로 필수다.
 * (메모장·VS Code·pandas 는 BOM 이 있어도 정상 처리한다.)
 *
 * 이스케이프 시퀀스로 쓴다. BOM 문자를 그대로 넣으면 편집기에서 보이지 않아
 * 실수로 지워져도 알아채기 어렵다.
 */
const UTF8_BOM = '\uFEFF';

/**
 * RFC 4180 필드 이스케이프.
 *
 * 큰따옴표, 쉼표, 개행이 들어간 값은 큰따옴표로 감싸고 내부 큰따옴표는
 * 두 개로 늘린다. 장애 양상 주관식 서술(SYSTEM_SPEC 3-3 3단계)에는
 * 쉼표와 개행이 실제로 들어오므로 이 처리를 건너뛸 수 없다.
 *
 * 앞뒤 공백이 있는 값도 감싼다. 감싸지 않으면 파서가 공백을 버릴 수 있다.
 */
function escapeField(value: string): string {
  const needsQuoting = /[",\r\n]/.test(value) || value !== value.trim();
  if (!needsQuoting) return value;
  return `"${value.split('"').join('""')}"`;
}

/**
 * 문자열 행들을 CSV 본문으로 만든다.
 *
 * 줄바꿈은 CRLF 를 쓴다. RFC 4180 규정이고, LF 만 쓰면 구형 Excel 이
 * 한 줄로 붙여 읽는 경우가 있다.
 */
export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeField).join(',')).join('\r\n');
}

/** CSV 문자열을 다운로드 가능한 Blob 으로 만든다. BOM 을 앞에 붙인다. */
export function toCsvBlob(csv: string): Blob {
  return new Blob([UTF8_BOM, csv], { type: 'text/csv;charset=utf-8' });
}

/**
 * 결과 파일명 (SYSTEM_SPEC 3-5).
 * 형식: `{고유ID}_{제출일자 YYYYMMDD}_결과.csv`
 * 예:   `GA11Y-P26-014_20260909_결과.csv`
 *
 * 날짜는 참여자의 로컬 시간대 기준이다. 참여자가 "오늘 제출한 파일"로
 * 인식하는 날짜와 파일명이 어긋나지 않아야 하므로 UTC 를 쓰지 않는다.
 */
export function buildResultFilename(participantId: string, submittedAt: Date = new Date()): string {
  const year = submittedAt.getFullYear();
  const month = String(submittedAt.getMonth() + 1).padStart(2, '0');
  const day = String(submittedAt.getDate()).padStart(2, '0');
  return `${participantId}_${year}${month}${day}_결과.csv`;
}
