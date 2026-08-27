import { LegalDoc } from '@/components/LegalDoc';
import { PRIVACY_POLICY } from '@/lib/legal';

/** /privacy — 스토어·카카오 검수에 제출하는 공개 주소이자 앱 안의 같은 화면 */
export default function Privacy() {
  return <LegalDoc doc={PRIVACY_POLICY} />;
}
