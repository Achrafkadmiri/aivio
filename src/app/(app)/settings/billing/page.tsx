import type { Metadata } from "next";
import { BillingClient } from "@/components/settings/billing-client";

export const metadata: Metadata = { title: "Billing" };

export default function BillingSettingsPage() {
  return <BillingClient />;
}
