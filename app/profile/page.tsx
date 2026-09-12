"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, GraduationCap, Medal, BookOpen, Award, Globe, Link } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          setProfile(await res.json());
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="text-center p-10">Đang tải hồ sơ...</div>;
  if (!profile) return <div className="text-center p-10">Vui lòng đăng nhập để xem hồ sơ.</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN & KỸ NĂNG */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            {/* Avatar Placeholder */}
            <div className="w-32 h-32 mx-auto bg-linear-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{profile.username}</h1>
            <p className="text-blue-600 dark:text-blue-400 font-medium mb-4">{profile.major || "Chưa cập nhật chuyên ngành"}</p>

            <p className="text-zinc-600 dark:text-zinc-400 text-sm italic mb-6">
              {profile.bio || "Sinh viên IT năng động, đang tìm kiếm cơ hội tham gia các dự án mã nguồn mở."}
            </p>

            {/* Social Links */}
            <div className="space-y-3 text-sm text-left px-2">
              <div className="flex items-center text-zinc-700 dark:text-zinc-300">
                <Mail className="w-5 h-5 mr-3 text-zinc-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center text-zinc-700 dark:text-zinc-300">
                <GraduationCap className="w-5 h-5 mr-3 text-zinc-400" />
                <span>MSSV: {profile.studentId || "Trống"}</span>
              </div>
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" className="flex items-center text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white transition-colors">
                  <Globe className="w-5 h-5 mr-3" /> GitHub
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                  <Link className="w-5 h-5 mr-3" /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Kỹ năng */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-500" /> Kỹ năng nổi bật
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-700">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Chưa thêm kỹ năng nào.</p>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT HỌC THUẬT */}
        <div className="md:col-span-2 space-y-6">

          {/* Môn học & Điểm số */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-blue-500" /> Lịch sử Môn học
            </h2>
            {profile.enrollments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Mã Môn</th>
                      <th className="px-4 py-3">Tên Môn Học</th>
                      <th className="px-4 py-3">Học Kỳ</th>
                      <th className="px-4 py-3 rounded-tr-lg text-center">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.enrollments.map((en: any) => (
                      <tr key={en.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                        <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{en.course.code}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{en.course.name}</td>
                        <td className="px-4 py-3">{en.semester}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md font-bold">
                            {en.grade || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Chưa có dữ liệu môn học.</p>
            )}
          </div>

          {/* Thành tích */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center">
              <Medal className="w-6 h-6 mr-2 text-purple-500" /> Thành tựu & Giải thưởng
            </h2>
            {profile.achievements?.length > 0 ? (
              <div className="space-y-4">
                {profile.achievements.map((ach: any) => (
                  <div key={ach.id} className="flex gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <Medal className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{ach.title}</h3>
                      {ach.date && <p className="text-xs text-zinc-500 mb-1">{new Date(ach.date).toLocaleDateString("vi-VN")}</p>}
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Chưa có thành tích nào được ghi nhận.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}