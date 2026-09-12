import React from "react";

// Định nghĩa type dựa trên Prisma Schema
interface Course {
  id: string;
  code: string;
  name: string;
  faculty: string;
}

async function getCourses(): Promise<Course[]> {
  // Fetch trực tiếp từ NestJS Backend
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export default async function Home() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 font-sans">
      <main className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mạng xã hội Học thuật
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Nơi sinh viên thảo luận, chia sẻ tài liệu và review tín chỉ.
          </p>
        </header>

        <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Danh sách Môn học
            </h2>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              Chưa có môn học nào. Hãy gọi API POST /courses để thêm dữ liệu.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                      {course.code}
                    </span>
                    <span className="text-xs text-zinc-400">{course.faculty}</span>
                  </div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mt-2">
                    {course.name}
                  </h3>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}