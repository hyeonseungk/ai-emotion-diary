"use client";
import { supabase } from "@/lib/supabaseClient";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Diary {
  id: string;
  content: string;
  ai_feedback: string;
  created_at: string;
  updated_at: string;
  target_date: string;
}

export default function DiaryListPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    fetchDiaries();
  }, []);

  const fetchDiaries = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("diaries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDiaries(data || []);
    } catch (error) {
      console.error("Error fetching diaries:", error);
    } finally {
      setLoading(false);
    }
  };

  // 달력 관련 함수들
  const getDiariesForDate = (date: Date) => {
    return diaries.filter((diary) => {
      // target_date가 있으면 target_date 사용, 없으면 created_at 사용 (하위 호환성)
      const diaryDate = diary.target_date
        ? new Date(diary.target_date)
        : new Date(diary.created_at);
      return isSameDay(diaryDate, date);
    });
  };

  const getCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // 월의 시작 요일만큼 앞에 빈 칸 추가
    const startDayOfWeek = getDay(start);
    const emptyDays = Array.from({ length: startDayOfWeek }, () => null);

    return [...emptyDays, ...days];
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-semibold">감</span>
              </div>
              <h1 className="text-2xl font-light text-slate-800 tracking-wide">
                감정일기
              </h1>
            </Link>

            <div className="flex items-center space-x-6">
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
        {/* 헤더 섹션 */}
        <section className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-light text-slate-800 mb-6 tracking-tight">
            나의
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 font-normal">
              감정일기
            </span>
          </h2>
          <p className="text-xl text-slate-600 font-light leading-relaxed mb-12">
            달력에서 일기를 확인하고 새로운 기록을 남겨보세요
          </p>

          {/* 새 일기 작성 버튼 */}
          <div className="flex justify-center">
            <Link
              href="/diary/new"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <svg
                className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200"
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
              새 일기 쓰기
            </Link>
          </div>
        </section>

        {/* 달력 콘텐츠 */}
        <section>
          {diaries.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/30 shadow-lg">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <svg
                    className="w-12 h-12 text-slate-400"
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
                  아직 기록된 일기가 없어요
                </h3>
                <p className="text-lg text-slate-600 font-light mb-8">
                  첫 번째 일기를 작성하고 AI 분석을 받아보세요!
                </p>
                <Link
                  href="/diary/new"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                  첫 일기 작성하기
                </Link>
              </div>
            </div>
          ) : (
            // 달력 뷰
            <div className="max-w-5xl mx-auto">
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 overflow-hidden">
                {/* 달력 헤더 */}
                <div className="bg-gradient-to-r from-rose-400 to-pink-500 p-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors duration-200"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <h3 className="text-2xl font-semibold text-white">
                      {format(currentMonth, "yyyy년 M월", { locale: ko })}
                    </h3>

                    <button
                      onClick={goToNextMonth}
                      className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors duration-200"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 bg-slate-50/50">
                  {["일", "월", "화", "수", "목", "금", "토"].map(
                    (day, index) => (
                      <div
                        key={day}
                        className={`p-4 text-center font-medium ${
                          index === 0
                            ? "text-red-500"
                            : index === 6
                            ? "text-blue-500"
                            : "text-slate-600"
                        }`}
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* 달력 날짜 */}
                <div className="grid grid-cols-7">
                  {getCalendarDays().map((day, index) => {
                    if (!day) {
                      return (
                        <div key={index} className="aspect-square p-2"></div>
                      );
                    }

                    const dayDiaries = getDiariesForDate(day);
                    const isCurrentToday = isToday(day);

                    return (
                      <div
                        key={day.toString()}
                        className={`aspect-square p-2 border-r border-b border-white/20 relative group cursor-pointer hover:bg-rose-50/50 transition-colors duration-200 ${
                          isCurrentToday ? "bg-rose-100/50" : ""
                        }`}
                        onClick={() => {
                          // 선택한 날짜를 URL 파라미터로 전달하여 날짜별 리스트뷰로 이동
                          const dateParam = format(day, "yyyy-MM-dd");
                          router.push(`/diary/date/${dateParam}`);
                        }}
                      >
                        <div className="h-full flex flex-col">
                          <div
                            className={`text-sm font-medium mb-1 ${
                              isCurrentToday
                                ? "text-rose-600 font-bold"
                                : "text-slate-600"
                            }`}
                          >
                            {format(day, "d")}
                          </div>

                          {dayDiaries.length > 0 && (
                            <div className="flex-1 min-h-0">
                              {/* 일기 개수 표시 */}
                              <div className="flex items-center mb-1">
                                <div className="w-full h-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"></div>
                                {dayDiaries.length > 1 && (
                                  <span className="ml-1 text-xs bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {dayDiaries.length}
                                  </span>
                                )}
                              </div>

                              {/* 첫 번째 일기 내용 미리보기 */}
                              <p className="text-xs text-slate-600 line-clamp-2 leading-tight">
                                {dayDiaries[0].content}
                              </p>

                              {/* 여러 일기가 있는 경우 추가 표시 */}
                              {dayDiaries.length > 1 && (
                                <p className="text-xs text-slate-500 mt-1">
                                  +{dayDiaries.length - 1}개 더
                                </p>
                              )}

                              {/* AI 분석 완료 표시 */}
                              {dayDiaries.some(
                                (diary) => diary.ai_feedback
                              ) && (
                                <div className="mt-1">
                                  <div className="w-4 h-4 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-2 h-2 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {dayDiaries.length === 0 && (
                            <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 달력 하단 설명 */}
                <div className="p-6 bg-slate-50/30">
                  <div className="flex items-center justify-center space-x-8 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"></div>
                      <span>일기 작성됨</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-2 h-2 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <span>AI 분석 완료</span>
                    </div>
                    <div className="text-slate-500">
                      날짜를 클릭하여 일기를 보거나 작성하세요
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
