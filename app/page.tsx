"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageCircle, Send, Users, Shield, Zap,
  ThumbsUp, Lightbulb, PartyPopper, Smile, ArrowBigUp, ArrowBigDown
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postType, setPostType] = useState<'DISCUSSION' | 'QA'>('DISCUSSION'); // Loại bài viết

  const [filter, setFilter] = useState<'ALL' | 'DISCUSSION' | 'QA'>('ALL'); // Tab Filter

  const [message, setMessage] = useState("");
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [isCommentAnon, setIsCommentAnon] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
      if (session) fetchPosts(session.access_token, filter);
    });
  }, [filter]);

  const fetchPosts = async (token: string, currentFilter: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts?filter=${currentFilter}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setPosts(await res.json());
  };

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
      fetchPosts(session.access_token, filter);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Hàm xử lý Reaction (Upvote/Like...) với cơ chế Optimistic UI
  const handleReact = async (postId: string, reactionType: string) => {
    if (!session) return;
    const userId = session.user.id;

    // 1. Lưu lại bản sao của trạng thái hiện tại (để hoàn tác nếu rớt mạng)
    const previousPosts = [...posts];

    // 2. CẬP NHẬT UI NGAY LẬP TỨC (Không cần chờ API)
    setPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id !== postId) return post; // Bỏ qua các bài viết khác

        // Tìm xem user đã react bài này chưa
        const existingReactionIndex = post.reactions.findIndex((r: any) => r.userId === userId);
        let newReactions = [...post.reactions];

        if (existingReactionIndex !== -1) {
          if (newReactions[existingReactionIndex].type === reactionType) {
            // Trường hợp 1: Bấm lại đúng nút cũ -> Xoá (Unlike/Unvote)
            newReactions.splice(existingReactionIndex, 1);
          } else {
            // Trường hợp 2: Đang Like chuyển sang Thả tim -> Đổi type
            newReactions[existingReactionIndex] = {
              ...newReactions[existingReactionIndex],
              type: reactionType
            };
          }
        } else {
          // Trường hợp 3: Chưa react bao giờ -> Thêm mới
          newReactions.push({ id: 'temp-id', userId, postId, type: reactionType });
        }

        return { ...post, reactions: newReactions };
      })
    );

    // 3. GỌI API NGẦM BÊN DƯỚI
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ type: reactionType }),
      });

      if (!res.ok) throw new Error("API Error");

    } catch (error) {
      // 4. Nếu lỗi (server sập, mất mạng) -> Hoàn tác lại UI như cũ
      console.error("Lỗi kết nối, đang hoàn tác cảm xúc...");
      setPosts(previousPosts);
    }
  };

  // Helper tính toán hiển thị cho Discussion
  const countReaction = (reactions: any[], type: string) => reactions.filter(r => r.type === type).length;
  const hasReacted = (reactions: any[], type: string) => reactions.some(r => r.type === type && r.userId === session?.user.id);

  // ... (Giữ nguyên các hàm toggleComments và handleCreateComment ở code cũ)
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
  if (!session) return ( /* (Giữ nguyên Giao diện Landing Page chưa đăng nhập của bạn) */ <div className="text-center p-20">Vui lòng đăng nhập</div>);

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

      {/* DANH SÁCH BÀI VIẾT */}
      <div className="space-y-6">
        {posts.map((post) => {
          // Tính điểm Q&A
          const upvotes = countReaction(post.reactions, 'UPVOTE');
          const downvotes = countReaction(post.reactions, 'DOWNVOTE');
          const qaScore = upvotes - downvotes;

          return (
            <div key={post.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="p-6">
                {/* Header người đăng */}
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

                {/* Nội dung */}
                <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white leading-snug">{post.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
              </div>

              {/* THANH TƯƠNG TÁC (Tuỳ biến theo loại bài) */}
              <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">

                {post.type === 'QA' ? (
                  /* UI Dành riêng cho Q&A (Giống Reddit/Quora) */
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
                  /* UI Dành riêng cho Bài Viết (Giống LinkedIn) */
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

                {/* Nút Bình luận Chung */}
                <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-blue-600 transition-colors ml-auto">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Bình luận {post._count?.comments > 0 && `(${post._count.comments})`}</span>
                </button>
              </div>

              {/* Khu vực Comments (giữ nguyên logic render cũ) */}
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
        })}
      </div>
    </div>
  );
}