import { LegalDoc } from '@/components/LegalDoc';
import { TERMS_OF_SERVICE } from '@/lib/legal';

/** /terms — 스토어·카카오 검수에 제출하는 공개 주소이자 앱 안의 같은 화면 */
export default function Terms() {
  return <LegalDoc doc={TERMS_OF_SERVICE} />;
}
