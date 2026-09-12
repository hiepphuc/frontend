"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<any>(null);

  // Kiểm tra đăng nhập và lấy danh sách bài viết
  useEffect(() => {
    const fetchSessionAndPosts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      }
    };
    fetchSessionAndPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return setMessage("Vui lòng đăng nhập để đăng bài");

    setMessage("Đang đăng bài...");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ title, content, isAnonymous }),
    });

    if (res.ok) {
      setMessage("Đăng bài thành công!");
      setTitle("");
      setContent("");
      setIsAnonymous(false);
      // Gọi lại API để load bài mới nhất
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setPosts(await refreshRes.json());
    } else {
      setMessage("Lỗi khi đăng bài");
    }
  };

  if (!session) {
    return <div className="p-8 text-center">Vui lòng đăng nhập để xem bảng tin.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 font-sans">
      <h1 className="text-3xl font-bold">Bảng tin Học thuật</h1>

      {/* Form Đăng bài */}
      <form onSubmit={handleCreatePost} className="space-y-4 bg-zinc-100 dark:bg-zinc-900 p-6 rounded-xl">
        <input
          type="text"
          placeholder="Tiêu đề bài thảo luận..."
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none"
        />
        <textarea
          placeholder="Nội dung chi tiết..."
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none h-24 resize-none"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span>Đăng bài ẩn danh</span>
          </label>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Đăng bài
          </button>
        </div>
        {message && <p className="text-sm text-blue-500">{message}</p>}
      </form>

      {/* Danh sách bài viết */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold ${post.isAnonymous ? "text-zinc-500" : "text-blue-600 dark:text-blue-400"}`}>
                {post.author?.username}
              </span>
              <span className="text-xs text-zinc-400">
                {new Date(post.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-black dark:text-white">{post.title}</h3>
            <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}