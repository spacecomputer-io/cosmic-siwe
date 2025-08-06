import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "./providers";
import Image from "next/image";

const font = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cosmic SIWE Nonce App",
  description:
    "A way to sign in with Ethereum to the app using Orbitport's cTRNG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${font.className} bg-[#0A0B1A]/20 text-white`}>
        <Web3Provider>
          <div className="flex flex-col min-h-screen">
            <header className="p-4 flex items-center justify-between gap-4 border-b border-b-white/20">
              <Image
                src={`/space-computer.svg`}
                width={30}
                height={30}
                alt="logo"
                className="w-64"
              />
              <h1 className="text-2xl font-bold">Cosmic SIWE</h1>
            </header>
            <main className="flex-grow p-4">{children}</main>
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
