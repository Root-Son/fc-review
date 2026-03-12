import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FC 리뷰 - FC Online 선수 리뷰 통합 플랫폼",
  description:
    "FC Online 선수 카드 리뷰를 한곳에서 확인하세요. AI 요약, 맞춤 추천, 체감 스탯 차트까지.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-950 text-white antialiased min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-black">
                FC
              </div>
              <span className="font-bold text-lg">FC 리뷰</span>
            </a>
            <nav className="flex items-center gap-4 text-sm text-slate-400">
              <a href="/" className="hover:text-white transition-colors">
                선수 검색
              </a>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800 mt-12">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-slate-600">
            FC 리뷰 — FC Online 선수 리뷰 통합 플랫폼 | 공홈 · 인벤 · 피온북
            리뷰를 AI로 분석
          </div>
        </footer>
      </body>
    </html>
  );
}
