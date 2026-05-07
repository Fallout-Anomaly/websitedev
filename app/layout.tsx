import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Header from "@/src/components/Header";
import { createClient } from "@/lib/supabase/server";
import { isStaffAccount } from "@/src/lib/staff-access";
import { displayNameForUser } from "@/src/lib/display-name";
import { avatarPresetForUser } from "@/src/lib/profile-avatar";
import WidgetBotCrate from "@/src/components/WidgetBotCrate";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isStaff = user ? await isStaffAccount(supabase, user) : false;
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
          <WidgetBotCrate />
        </Providers>
      </body>
    </html>
  );
}
