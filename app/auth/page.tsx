"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Đang xử lý...");

    // Tự động xóa khoảng trắng thừa ở đầu/cuối
    const safeEmail = email.trim();
    const safePassword = password.trim();

    try {
      if (isLogin) {
        // ĐĂNG NHẬP
        const { data, error } = await supabase.auth.signInWithPassword({
          email: safeEmail,
          password: safePassword,
        });
        if (error) throw error;
        setMessage("Đăng nhập thành công! Đang lưu session...");
        console.log("Token:", data.session.access_token);
      } else {
        // ĐĂNG KÝ
        const { data, error } = await supabase.auth.signUp({
          email: safeEmail,
          password: safePassword,
        });
        if (error) throw error;

        if (data.session) {
          // ... code trước đó ...

          // Ưu tiên dùng biến môi trường, nếu rỗng thì ép cứng luôn vào localhost:3000
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

          const res = await fetch(`${API_URL}/auth/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({ username: username.trim(), studentId: studentId.trim() }),
          });

          // Hiển thị lỗi chi tiết từ backend nếu có
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Lỗi khi đồng bộ dữ liệu vào Database");
          }
          setMessage("Đăng ký thành công!");

          // ... code sau đó ...
        } else {
          setMessage("Vui lòng kiểm tra email để xác nhận!");
        }
      }
    } catch (error: any) {
      setMessage(error.message || "Đã có lỗi xảy ra");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-center mb-6 text-zinc-900 dark:text-zinc-50">
          {isLogin ? "Đăng Nhập" : "Đăng Ký Tài Khoản"}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4 text-black dark:text-white">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Tên hiển thị (Username)"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
              />
              <input
                type="text"
                placeholder="Mã số sinh viên (Optional)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email sinh viên"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none outline-none"
          />

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {isLogin ? "Đăng Nhập" : "Đăng Ký"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-blue-500">{message}</p>}

        <div className="mt-6 text-center text-sm text-zinc-500">
          {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 hover:underline"
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </div>
      </div>
    </div>
  );
}