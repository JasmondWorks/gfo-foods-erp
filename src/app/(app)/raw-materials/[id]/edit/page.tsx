import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { updateRawMaterialAction } from "@/server/actions/raw-materials";
import { getRawMaterial } from "@/server/services/raw-materials";
import { RawMaterialForm } from "../../raw-material-form";

export default async function EditRawMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await getRawMaterial(id);
  if (!material) notFound();

  return (
    <div>
      <PageHeader title="Edit material" backHref={`/raw-materials/${id}`} />
      <RawMaterialForm
        action={updateRawMaterialAction.bind(null, id)}
        submitLabel="Save changes"
        values={{
          name: material.name,
          unit: material.unit,
          reorderThreshold: String(material.reorderThreshold),
        }}
      />
    </div>
  );
}
