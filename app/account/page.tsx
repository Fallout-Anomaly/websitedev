import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountProfileClient from "./AccountProfileClient";
import { displayNameFromMetadata } from "@/src/lib/display-name";
import { avatarPresetForUser } from "@/src/lib/profile-avatar";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const fullName = displayNameFromMetadata(user.user_metadata);
  const avatarPreset = avatarPresetForUser(user);

  return (
    <AccountProfileClient
      userId={user.id}
      initialFullName={fullName}
      initialAvatarPreset={avatarPreset}
    />
  );
}
