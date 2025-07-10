import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-rose-600 mb-4">감정일기</h1>
          <p className="text-lg text-gray-600">
            {user.email}님, 오늘도 따뜻한 하루 되세요 🌸
          </p>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="max-w-2xl mx-auto">
          {/* 환영 메시지 */}
          <div className="bg-white/80 rounded-xl shadow-lg p-8 mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              오늘의 감정을 기록해보세요
            </h2>
            <p className="text-gray-600 mb-6">
              하루의 마음을 정리하고, AI가 당신의 감정을 이해해드릴게요.
              <br />
              작은 기록이 큰 변화를 만들어갑니다.
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link
              href="/diary/new"
              className="bg-rose-400 hover:bg-rose-500 text-white font-semibold rounded-xl p-6 text-center transition-colors shadow-lg hover:shadow-xl"
            >
              <div className="text-2xl mb-2">✍️</div>
              <h3 className="text-xl font-semibold mb-2">오늘 일기 쓰기</h3>
              <p className="text-rose-100 text-sm">
                지금 이 순간의 마음을 기록해보세요
              </p>
            </Link>

            <Link
              href="/diary"
              className="bg-teal-400 hover:bg-teal-500 text-white font-semibold rounded-xl p-6 text-center transition-colors shadow-lg hover:shadow-xl"
            >
              <div className="text-2xl mb-2">📖</div>
              <h3 className="text-xl font-semibold mb-2">이전 일기 보기</h3>
              <p className="text-teal-100 text-sm">
                지난 기록들을 돌아보며 성장을 확인해보세요
              </p>
            </Link>
          </div>

          {/* 최근 감정 요약 */}
          <div className="bg-white/80 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              이번 주 감정 요약
            </h3>
            <p className="text-gray-600">
              아직 기록된 일기가 없어요. 첫 번째 일기를 작성해보세요! ✨
            </p>
          </div>
        </main>

        {/* 로그아웃 버튼 */}
        <div className="text-center mt-8">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
