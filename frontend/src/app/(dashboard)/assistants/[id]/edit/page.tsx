import { EditAssistantView } from "@/features/assistant/components/edit-assistant-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAssistantPage({ params }: PageProps) {
  const { id } = await params;
  return <EditAssistantView assistantId={id} />;
}
