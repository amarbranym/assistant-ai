import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

import { AccountSection } from "./account-section";

export default function SettingsPage() {
  return (
    <PlaceholderPage title="Settings" description="Account and preferences.">
      <div className="flex w-full max-w-2xl flex-col gap-6 px-0 sm:px-0">
        <AccountSection />
      </div>
    </PlaceholderPage>
  );
}
