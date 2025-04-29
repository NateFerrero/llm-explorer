import AFrameScriptLoader from "@/components/AFrameScriptLoader";
import "@/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import React from "react";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
export const metadata: Metadata = {
  title: {
    default: "LLM Browser",
    template: "%s | LLM Browser",
  },
  description:
    "Explore Large Language Models like never before. Visualize, extract insights, and summarize on the fly.",
  applicationName: "LLM Browser",
  keywords: [
    "LLM",
    "AI",
    "knowledge graph",
    "visualization",
    "language models",
    "OpenAI",
    "Anthropic",
    "Gemini",
  ],
  authors: [
    {
      name: "LLM Browser Team",
    },
  ],
  creator: "LLM Browser Team",
  publisher: "LLM Browser Team",
  icons: {
    icon: [
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LLM Browser",
  },
  formatDetection: {
    telephone: false,
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} dark`}
      data-unique-id="1a8379f7-3026-420c-a3ae-29879ba01ced"
      data-loc="58:9-58:66"
      data-file-name="app/layout.tsx"
    >
      <head>
        <AFrameScriptLoader />
      </head>
      <body
        className="bg-slate-900"
        data-unique-id="e8dbec53-8c7a-4308-9009-eef1a2f58954"
        data-loc="59:6-59:37"
        data-file-name="app/layout.tsx"
      >
        {children}
      </body>
    </html>
  );
}
