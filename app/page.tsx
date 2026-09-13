"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageCircle, Send, Users, Shield, Zap,
  ThumbsUp, Lightbulb, PartyPopper, Smile, ArrowBigUp, ArrowBigDown
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  // 1. Thay posts thành allPosts (Kho chứa toàn bộ bài viết)
  const [allPosts, setAllPosts] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postType, setPostType] = useState<'DISCUSSION' | 'QA'>('DISCUSSION');
  const [filter, setFilter] = useState<'ALL' | 'DISCUSSION' | 'QA'>('ALL');

  const [message, setMessage] = useState("");
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [isCommentAnon, setIsCommentAnon] = useState(false);

  // 2. Chỉ gọi API ĐÚNG 1 LẦN khi vào trang (Xóa filter khỏi dependency)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
      if (session) fetchPosts(session.access_token);
    });
  }, []);

  // 3. Luôn fetch TẤT CẢ bài viết từ backend để lưu vào kho
  const fetchPosts = async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts?filter=ALL`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setAllPosts(await res.json());
    }
  };

  // 4. BỘ LỌC TỐC ĐỘ CAO (Client-side): Tự động tính toán lại mỗi khi đổi Tab filter
  const displayedPosts = filter === 'ALL'
    ? allPosts
    : allPosts.filter(post => post.type === filter);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setMessage("Đang đăng bài...");

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ title, content, isAnonymous, type: postType }),
    });

    if (res.ok) {
      setMessage("Đăng bài thành công!");
      setTitle(""); setContent(""); setIsAnonymous(false); setPostType('DISCUSSION');
      // Lấy lại danh sách mới sau khi đăng
      fetchPosts(session.access_token);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleReact = async (postId: string, reactionType: string) => {
    if (!session) return;
    const userId = session.user.id;
    const previousPosts = [...allPosts];

    // Cập nhật Optimistic UI vào kho allPosts
    setAllPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id !== postId) return post;
        const existingReactionIndex = post.reactions.findIndex((r: any) => r.userId === userId);
        let newReactions = [...post.reactions];

        if (existingReactionIndex !== -1) {
          if (newReactions[existingReactionIndex].type === reactionType) {
            newReactions.splice(existingReactionIndex, 1);
          } else {
            newReactions[existingReactionIndex] = { ...newReactions[existingReactionIndex], type: reactionType };
          }
        } else {
          newReactions.push({ id: 'temp-id', userId, postId, type: reactionType });
        }
        return { ...post, reactions: newReactions };
      })
    );

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ type: reactionType }),
      });
      if (!res.ok) throw new Error("API Error");
    } catch (error) {
      console.error("Lỗi kết nối, đang hoàn tác cảm xúc...");
      setAllPosts(previousPosts);
    }
  };

  const countReaction = (reactions: any[], type: string) => reactions.filter(r => r.type === type).length;
  const hasReacted = (reactions: any[], type: string) => reactions.some(r => r.type === type && r.userId === session?.user.id);

  const toggleComments = async (postId: string) => {
    if (activePostId === postId) { setActivePostId(null); return; }
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ content: commentContent, postId, isAnonymous: isCommentAnon }),
    });
    if (res.ok) {
      setCommentContent(""); setIsCommentAnon(false);
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments?postId=${postId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (refreshRes.ok) setComments(await refreshRes.json());
    }
  };

  if (loadingSession) return <div className="min-h-[80vh] flex items-center justify-center">Đang tải...</div>;
  if (!session) return (
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

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 font-sans pb-20">

      {/* KHU VỰC ĐĂNG BÀI */}
      <form onSubmit={handleCreatePost} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-4 mb-4">
          <button type="button" onClick={() => setPostType('DISCUSSION')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${postType === 'DISCUSSION' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
            ✏️ Bài viết
          </button>
          <button type="button" onClick={() => setPostType('QA')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${postType === 'QA' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
            ❓ Hỏi đáp
          </button>
        </div>

        <div className="space-y-4">
          <input type="text" placeholder={postType === 'QA' ? "Câu hỏi của bạn là gì?" : "Tiêu đề bài viết..."} required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none" />
          <textarea placeholder="Nội dung chi tiết..." required value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="flex items-center space-x-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 rounded" />
              <span>Đăng ẩn danh</span>
            </label>
            <div className="flex items-center gap-4">
              {message && <span className="text-sm text-blue-500 font-medium">{message}</span>}
              <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl">Đăng bài</button>
            </div>
          </div>
        </div>
      </form>

      {/* THANH TABS LỌC BẢNG TIN */}
      <div className="flex space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        {['ALL', 'DISCUSSION', 'QA'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
            className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${filter === tab ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
          >
            {tab === 'ALL' ? 'Tất cả Bảng tin' : tab === 'DISCUSSION' ? 'Bài viết' : 'Hỏi & Đáp'}
          </button>
        ))}
      </div>

      {/* 5. Render bằng danh sách đã được lọc: displayedPosts */}
      <div className="space-y-6">
        {displayedPosts.length === 0 ? (
          <div className="text-center py-10 text-zinc-500">Chưa có bài viết nào trong mục này.</div>
        ) : (
          displayedPosts.map((post) => {
            const upvotes = countReaction(post.reactions, 'UPVOTE');
            const downvotes = countReaction(post.reactions, 'DOWNVOTE');
            const qaScore = upvotes - downvotes;

            return (
              <div key={post.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${post.isAnonymous ? 'bg-zinc-400 dark:bg-zinc-700' : 'bg-linear-to-tr from-blue-500 to-purple-500'}`}>
                      {post.isAnonymous ? "?" : post.author?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-zinc-900 dark:text-white">
                        {post.author?.username}
                        {post.type === 'QA' && <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs rounded-full">Q&A</span>}
                      </span>
                      <span className="block text-xs text-zinc-500">{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white leading-snug">{post.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>

                <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                  {post.type === 'QA' ? (
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full">
                      <button onClick={() => handleReact(post.id, 'UPVOTE')} className={`p-2 rounded-l-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${hasReacted(post.reactions, 'UPVOTE') ? 'text-orange-500' : 'text-zinc-500'}`}>
                        <ArrowBigUp className="w-5 h-5" fill={hasReacted(post.reactions, 'UPVOTE') ? 'currentColor' : 'none'} />
                      </button>
                      <span className={`px-2 font-bold text-sm ${qaScore > 0 ? 'text-orange-500' : qaScore < 0 ? 'text-blue-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {qaScore}
                      </span>
                      <button onClick={() => handleReact(post.id, 'DOWNVOTE')} className={`p-2 rounded-r-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${hasReacted(post.reactions, 'DOWNVOTE') ? 'text-blue-500' : 'text-zinc-500'}`}>
                        <ArrowBigDown className="w-5 h-5" fill={hasReacted(post.reactions, 'DOWNVOTE') ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button onClick={() => handleReact(post.id, 'LIKE')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hasReacted(post.reactions, 'LIKE') ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                        <ThumbsUp className="w-4 h-4" /> <span className="hidden sm:inline">Thích</span> {countReaction(post.reactions, 'LIKE') > 0 && <span className="ml-1 opacity-70">({countReaction(post.reactions, 'LIKE')})</span>}
                      </button>
                      <button onClick={() => handleReact(post.id, 'INSIGHTFUL')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hasReacted(post.reactions, 'INSIGHTFUL') ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                        <Lightbulb className="w-4 h-4" /> <span className="hidden sm:inline">Sáng giá</span> {countReaction(post.reactions, 'INSIGHTFUL') > 0 && <span className="ml-1 opacity-70">({countReaction(post.reactions, 'INSIGHTFUL')})</span>}
                      </button>
                      <button onClick={() => handleReact(post.id, 'CELEBRATE')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hasReacted(post.reactions, 'CELEBRATE') ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                        <PartyPopper className="w-4 h-4" /> <span className="hidden sm:inline">Chúc mừng</span> {countReaction(post.reactions, 'CELEBRATE') > 0 && <span className="ml-1 opacity-70">({countReaction(post.reactions, 'CELEBRATE')})</span>}
                      </button>
                      <button onClick={() => handleReact(post.id, 'FUNNY')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hasReacted(post.reactions, 'FUNNY') ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                        <Smile className="w-4 h-4" /> <span className="hidden sm:inline">Hài hước</span> {countReaction(post.reactions, 'FUNNY') > 0 && <span className="ml-1 opacity-70">({countReaction(post.reactions, 'FUNNY')})</span>}
                      </button>
                    </div>
                  )}

                  <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-blue-600 transition-colors ml-auto">
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Bình luận {post._count?.comments > 0 && `(${post._count.comments})`}</span>
                  </button>
                </div>

                {activePostId === post.id && (
                  <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="space-y-4 mb-6">
                      {comments.length === 0 ? (
                        <p className="text-sm text-center text-zinc-500 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1 ${comment.isAnonymous ? 'bg-zinc-400' : 'bg-linear-to-tr from-blue-500 to-purple-500'}`}>
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
                        <input type="text" placeholder="Viết bình luận..." value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="flex-1 px-4 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none text-sm focus:border-blue-500" />
                        <button type="submit" disabled={!commentContent.trim()} className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer text-xs text-zinc-500 ml-2">
                        <input type="checkbox" checked={isCommentAnon} onChange={(e) => setIsCommentAnon(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-300 accent-blue-600" />
                        <span>Bình luận ẩn danh</span>
                      </label>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}