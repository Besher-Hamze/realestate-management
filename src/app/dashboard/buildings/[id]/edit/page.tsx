import { use } from 'react';
import EditBuildingPageContent from '@/components/buildings/EditBuildingPageContent';

export default function EditBuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditBuildingPageContent id={id} />;
}
