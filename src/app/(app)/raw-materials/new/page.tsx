import { PageHeader } from "@/components/common/page-header";
import { createRawMaterialAction } from "@/server/actions/raw-materials";
import { RawMaterialForm } from "../raw-material-form";

export default function NewRawMaterialPage() {
  return (
    <div>
      <PageHeader title="New material" backHref="/raw-materials" />
      <RawMaterialForm action={createRawMaterialAction} submitLabel="Save" allowAddAnother />
    </div>
  );
}
