"use client";

import { useMe } from "@/hooks/use-me";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ProfileForm } from "@/components/settings/profile-form";

export function ProfileSettingsClient() {
  const { data: user, isLoading } = useMe();

  return (
    <Card variant="standard" className="max-w-lg">
      <h2 className="text-subheading font-semibold text-ink">Profile</h2>
      <p className="mt-1 text-body-sm text-muted">Update your name and avatar.</p>
      <div className="mt-6">
        {isLoading || !user ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <ProfileForm initialName={user.name} initialAvatarUrl={user.avatarUrl} email={user.email} />
        )}
      </div>
    </Card>
  );
}
