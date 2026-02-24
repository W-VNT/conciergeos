"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateEmailDigest } from "@/lib/actions/profile-settings";
import { EMAIL_DIGEST_LABELS, type EmailDigest } from "@/types/database";
import { Mail } from "lucide-react";

interface EmailDigestSettingProps {
  initialValue: EmailDigest;
}

export function EmailDigestSetting({ initialValue }: EmailDigestSettingProps) {
  const [value, setValue] = useState<EmailDigest>(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleChange(newValue: string) {
    const frequency = newValue as EmailDigest;
    const previousValue = value;
    setValue(frequency);
    setSaving(true);

    try {
      const result = await updateEmailDigest(frequency);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || "Erreur lors de la mise a jour");
        setValue(previousValue); // Revert on error
      }
    } catch {
      toast.error("Erreur lors de la mise a jour");
      setValue(previousValue);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-start gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
        <Mail className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-1">
        <Label htmlFor="email-digest" className="text-sm font-medium">
          Resume par email
        </Label>
        <p className="text-sm text-muted-foreground">
          Recevez un resume de vos notifications non lues par email.
        </p>
      </div>
      <Select value={value} onValueChange={handleChange} disabled={saving}>
        <SelectTrigger id="email-digest" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(EMAIL_DIGEST_LABELS) as [EmailDigest, string][]).map(
            ([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
