"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateSettingsAction } from "@/server/actions/settings";

interface SettingsFormProps {
  initialSettings: {
    businessName: string;
    currency: string;
    reminderOn: boolean;
    reminderHour: number;
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [reminderOn, setReminderOn] = useState(initialSettings.reminderOn);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateSettingsAction(formData);
      toast.success("Settings updated successfully");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          name="businessName"
          defaultValue={initialSettings.businessName}
          required
          className="max-w-md text-base"
        />
        <p className="text-xs text-muted-foreground">
          Displayed across the header, invoices, and reports.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency Code</Label>
        <Input
          id="currency"
          name="currency"
          value={initialSettings.currency}
          disabled
          className="max-w-md bg-muted/50 cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Nigerian Naira (₦ / NGN) is locked as primary reporting currency.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 max-w-md p-4 rounded-xl border border-border/80">
        <div>
          <Label htmlFor="reminderOn" className="font-medium cursor-pointer">
            Daily Entry Reminder
          </Label>
          <p className="text-xs text-muted-foreground">
            Flag idle periods if no data has been entered in 3+ days
          </p>
        </div>
        <Switch
          id="reminderOn"
          name="reminderOn"
          checked={reminderOn}
          onCheckedChange={setReminderOn}
        />
      </div>

      {reminderOn && (
        <div className="space-y-2 max-w-md">
          <Label htmlFor="reminderHour">Reminder Time (Hour of Day 0-23)</Label>
          <Input
            id="reminderHour"
            name="reminderHour"
            type="number"
            min={0}
            max={23}
            defaultValue={initialSettings.reminderHour}
            className="w-32"
          />
        </div>
      )}

      <div className="pt-2">
        <Button type="submit" disabled={loading} className="font-semibold shadow-xs">
          {loading ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
