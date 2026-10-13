import { getStoreInfo } from '@/lib/api';
import { ContactView } from './contact-view';

export const metadata = { title: 'Liên hệ' };

export default async function ContactPage() {
  return <ContactView store={await getStoreInfo()} />;
}
