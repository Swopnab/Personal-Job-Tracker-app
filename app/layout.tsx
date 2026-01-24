import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Job Tracker - Manage Your Applications",
    description: "Track your job and internship applications with ease",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: '#1a1a1a',
                                color: '#ededed',
                                border: '1px solid #2a2a2a',
                            },
                        }}
                    />
                </Providers>
            </body>
        </html>
    );
}
