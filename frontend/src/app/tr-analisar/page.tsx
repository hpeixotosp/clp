import { TRAnalisarClient } from './TRAnalisarClient';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function TRAnalisarPage() {
  return (
    <DashboardLayout>
      <TRAnalisarClient />
    </DashboardLayout>
  );
}
