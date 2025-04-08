import EditBuildingPageContent from '@/components/buildings/EditBuildingPageContent';

export default function EditBuildingPage({ params }: { params: { id: string } }) {
  return <EditBuildingPageContent id={params.id} />;
}