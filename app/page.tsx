"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Send, Users, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true); // Tránh giật UI lúc mới load

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [isCommentAnon, setIsCommentAnon] = useState(false);

  useEffect(() => {
    const fetchSessionAndPosts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoadingSession(false);

      if (session) {
        fetchPosts(session.access_token);
      }
    };
    fetchSessionAndPosts();
  }, []);

  const fetchPosts = async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setPosts(await res.json());
  };

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
      fetchPosts(session.access_token);
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Lỗi khi đăng bài");
    }
  };

  const toggleComments = async (postId: string) => {
    if (activePostId === postId) {
      setActivePostId(null);
      return;
    }
    setActivePostId(postId);
    setComments([]);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments?postId=${postId}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) setComments(await res.json());
  };

  const handleCreateComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ content: commentContent, postId, isAnonymous: isCommentAnon }),
    });

    if (res.ok) {
      setCommentContent("");
      setIsCommentAnon(false);
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments?postId=${postId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (refreshRes.ok) setComments(await refreshRes.json());
    }
  };

  if (loadingSession) return <div className="min-h-[80vh] flex items-center justify-center">Đang tải...</div>;

  // GIAO DIỆN CHÀO MỪNG (Chưa đăng nhập)
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 space-y-8 py-20">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 dark:text-white tracking-tight">
            Cộng đồng <span className="text-blue-600">Học thuật</span> dành cho Sinh viên
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Hỏi đáp bài tập, review tín chỉ, chia sẻ tài liệu và kết nối với hàng ngàn sinh viên khác. Bạn có thể lựa chọn đăng bài công khai hoặc ẩn danh an toàn.
          </p>
        </div>

        <Link href="/auth" className="px-8 py-3.5 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg shadow-blue-500/30">
          Tham gia ngay
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 max-w-4xl text-left">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Shield className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">Ẩn danh an toàn</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">Thoải mái review môn học và giảng viên mà không sợ lộ danh tính thật.</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Users className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">Kết nối dễ dàng</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">Tìm kiếm đồng đội làm đồ án và học nhóm thông qua hồ sơ kỹ năng cá nhân.</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Zap className="w-10 h-10 text-yellow-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">Tốc độ & Hiện đại</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">Nền tảng được xây dựng với công nghệ mới nhất, đảm bảo trải nghiệm mượt mà.</p>
          </div>
        </div>
      </div>
    );
  }

  // GIAO DIỆN BẢNG TIN (Đã đăng nhập)
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8 font-sans pb-20">
      {/* Form Đăng bài */}
      <form onSubmit={handleCreatePost} className="space-y-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 mt-6">
        <input
          type="text"
          placeholder="Tiêu đề bài thảo luận..."
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <textarea
          placeholder="Bạn đang thắc mắc điều gì?..."
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-all"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label className="flex items-center space-x-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 accent-blue-600"
            />
            <span>Đăng bài ẩn danh</span>
          </label>
          <div className="flex items-center gap-4">
            {message && <span className="text-sm text-blue-500 font-medium">{message}</span>}
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              Đăng bài
            </button>
          </div>
        </div>
      </form>

      {/* Danh sách bài viết */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            {/* Nội dung Post */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${post.isAnonymous ? 'bg-zinc-400 dark:bg-zinc-700' : 'bg-gradient-to-tr from-blue-500 to-purple-500'}`}>
                    {post.isAnonymous ? "?" : post.author?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className={`block text-sm font-semibold ${post.isAnonymous ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-white"}`}>
                      {post.author?.username}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white leading-snug">{post.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>

            {/* Nút Toggle Comments */}
            <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center space-x-2 text-sm font-medium text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Bình luận</span>
              </button>
            </div>

            {/* Khu vực Bình luận (giữ nguyên logic cũ) */}
            {activePostId === post.id && (
              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                <div className="space-y-4 mb-6">
                  {comments.length === 0 ? (
                    <p className="text-sm text-center text-zinc-500 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1 ${comment.isAnonymous ? 'bg-zinc-400' : 'bg-gradient-to-tr from-blue-500 to-purple-500'}`}>
                          {comment.isAnonymous ? "?" : comment.author?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className={`text-sm font-semibold ${comment.isAnonymous ? "text-zinc-500" : "text-zinc-900 dark:text-zinc-100"}`}>
                              {comment.author?.username}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(comment.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={(e) => handleCreateComment(e, post.id)} className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Viết bình luận..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none text-sm focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!commentContent.trim()}
                      className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer text-xs text-zinc-500 ml-2">
                    <input
                      type="checkbox"
                      checked={isCommentAnon}
                      onChange={(e) => setIsCommentAnon(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-zinc-300 accent-blue-600"
                    />
                    <span>Bình luận ẩn danh</span>
                  </label>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}