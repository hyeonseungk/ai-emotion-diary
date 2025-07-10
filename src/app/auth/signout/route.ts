import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, ...options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch (error) {
            // 서버 컴포넌트에서 setAll 호출 시 무시
          }
        },
      },
    }
  );

  await supabase.auth.signOut();
  redirect("/auth");
}
