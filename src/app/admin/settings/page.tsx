import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div>
      <h1 className="admin-section-title">Settings</h1>
      <p className="text-sm text-gray-500">Company details printed on invoices, bank details, pricing margin, delivery charges and store text.</p>
      <SettingsForm s={s} />
    </div>
  );
}
