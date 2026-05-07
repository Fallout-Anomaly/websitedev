import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Header from "@/src/components/Header";
import { createClient } from "@/lib/supabase/server";
import { isStaffAccount } from "@/src/lib/staff-access";
import { displayNameForUser } from "@/src/lib/display-name";
import { avatarPresetForUser } from "@/src/lib/profile-avatar";
import Providers from "@/app/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fallen World",
  description: "The ultimate hardcore survival modlist for Fallout 4",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const widgetbotServer = process.env.NEXT_PUBLIC_WIDGETBOT_SERVER_ID;
  const widgetbotChannel = process.env.NEXT_PUBLIC_WIDGETBOT_CHANNEL_ID;

  let user: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>>["data"]["user"] =
    null;
  let isStaff = false;

  try {
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
    isStaff = user ? await isStaffAccount(supabase, user) : false;
  } catch {
    // If Supabase env vars are missing/misconfigured in production, don't crash the entire app shell.
    user = null;
    isStaff = false;
  }

  const displayName = displayNameForUser(user);
  const avatarPreset = avatarPresetForUser(user);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a]">
        <Providers>
          <Header
            user={user}
            isStaff={isStaff}
            displayName={displayName}
            avatarPreset={avatarPreset}
          />
          {children}
        </Providers>

        {/* WidgetBot Crate embed (per docs): bottom of body */}
        {widgetbotServer && widgetbotChannel ? (
          <script
            src="https://cdn.jsdelivr.net/npm/@widgetbot/crate@3"
            async
            defer
          >{`
new Crate({
  server: ${JSON.stringify(widgetbotServer)},
  channel: ${JSON.stringify(widgetbotChannel)}
})
`}</script>
        ) : null}
      </body>
    </html>
  );
}
