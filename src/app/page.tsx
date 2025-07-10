"use client";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { endOfWeek, startOfWeek } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);

      if (!session) {
        router.push("/auth");
      } else {
        // 세션이 있으면 주간 인사이트 가져오기
        fetchWeeklyInsight();
      }
    };

    checkSession();

    // 세션 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session && event === "SIGNED_OUT") {
        router.push("/auth");
      } else if (session) {
        fetchWeeklyInsight();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchWeeklyInsight = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 이번 주의 시작과 끝 날짜 계산
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // 일요일부터 시작
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

      const { data, error } = await supabase
        .from("diaries")
        .select("*")
        .eq("user_id", user.id)
        .gte("target_date", weekStart.toISOString().split("T")[0])
        .lte("target_date", weekEnd.toISOString().split("T")[0])
        .not("ai_feedback", "is", null)
        .not("ai_feedback", "eq", "")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setWeeklyInsight(data[0].ai_feedback);
      } else {
        setWeeklyInsight(null);
      }
    } catch (error) {
      console.error("Error fetching weekly insight:", error);
      setWeeklyInsight(null);
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-rose-300 rounded-full mx-auto mb-4"></div>
          <div className="text-slate-600 font-light">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // 리다이렉트 중
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-semibold">감</span>
              </div>
              <h1 className="text-2xl font-light text-slate-800 tracking-wide">
                감정일기
              </h1>
            </div>

            <div className="flex items-center space-x-6">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-slate-500 font-light">안녕하세요</p>
                <p className="text-slate-700 font-medium">{user.email}</p>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-xl transition-all duration-200"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                설정
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        {/* 히어로 섹션 */}
        <section className="text-center mb-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl sm:text-6xl font-light text-slate-800 mb-8 tracking-tight">
              오늘의 마음을
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 font-normal">
                기록해보세요
              </span>
            </h2>
            <p className="text-xl text-slate-600 font-light leading-relaxed mb-12">
              하루의 감정을 정리하고, AI가 당신의 마음을 이해해드릴게요.
              <br className="hidden sm:block" />
              작은 기록이 큰 변화를 만들어갑니다.
            </p>
          </div>
        </section>

        {/* 액션 카드들 */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 일기 쓰기 카드 */}
            <Link
              href="/diary/new"
              className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/40"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 to-pink-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                  오늘 일기 쓰기
                </h3>
                <p className="text-slate-600 font-light leading-relaxed">
                  지금 이 순간의 마음을 기록해보세요.
                  <br />
                  당신의 감정을 AI가 따뜻하게 분석해드릴게요.
                </p>
              </div>
            </Link>

            {/* 일기 보기 카드 */}
            <Link
              href="/diary"
              className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/40"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                  이전 일기 보기
                </h3>
                <p className="text-slate-600 font-light leading-relaxed">
                  지난 기록들을 돌아보며 성장을 확인해보세요.
                  <br />
                  감정의 변화와 패턴을 발견할 수 있어요.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* 인사이트 섹션 */}
        <section>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-10 border border-white/30 shadow-lg">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                  이번 주 감정 인사이트
                </h3>
                <div className="w-20 h-1 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full mx-auto"></div>
              </div>

              {insightLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-6"></div>
                    <div className="h-4 bg-slate-200 rounded mx-auto max-w-xs mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded mx-auto max-w-sm"></div>
                  </div>
                </div>
              ) : weeklyInsight ? (
                <div className="bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-2xl p-8 border border-rose-100/50">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 font-medium mb-2">
                        💭 AI의 최근 감정 분석
                      </p>
                      <p className="text-slate-700 font-light leading-relaxed text-lg">
                        {weeklyInsight}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg text-slate-600 font-light">
                    이번 주에 작성된 일기가 없어요.
                    <br />첫 번째 일기를 작성하고 AI 분석을 받아보세요! ✨
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-white/20 mt-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex items-center justify-center">
            <button
              onClick={async () => {
                if (confirm("정말 로그아웃하시겠습니까?")) {
                  await supabase.auth.signOut();
                }
              }}
              className="text-slate-400 hover:text-slate-600 text-sm font-light transition-colors duration-200"
            >
              로그아웃
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
