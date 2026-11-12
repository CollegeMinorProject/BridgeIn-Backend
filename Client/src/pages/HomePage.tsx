
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  username: string;
  avatar: string;
}

interface Post {
  id: number;
  username: string;
  avatar: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
}

const stories: User[] = [
  { id: 1, username: "berry_b_29", avatar: "https://i.pravatar.cc/100?img=47" },
  { id: 2, username: "soumayaa_", avatar: "https://i.pravatar.cc/100?img=12" },
  { id: 3, username: "mizoislive", avatar: "https://i.pravatar.cc/100?img=44" },
  { id: 4, username: "ezsnippet", avatar: "https://i.pravatar.cc/100?img=13" },
  { id: 5, username: "sayantani.18", avatar: "https://i.pravatar.cc/100?img=49" },
  { id: 6, username: "rideyav", avatar: "https://i.pravatar.cc/100?img=11" },
];

const initialPosts: Post[] = [
  {
    id: 1,
    username: "berry_b_29",
    avatar: "https://i.pravatar.cc/100?img=47",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900",
    caption: "Beautiful memories and beautiful moments ❤️",
    likes: 124,
    comments: 12,
  },
  {
    id: 2,
    username: "mizoislive",
    avatar: "https://i.pravatar.cc/100?img=44",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900",
    caption: "Exploring the beauty of nature 🌿",
    likes: 89,
    comments: 8,
  },
  {
    id: 3,
    username: "soumayaa_",
    avatar: "https://i.pravatar.cc/100?img=12",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900",
    caption: "A little escape from everyday life ✨",
    likes: 215,
    comments: 24,
  },
];

export default function HomePage({
  isLoggedIn = false,
}: {
  isLoggedIn?: boolean;
}) {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [savedPosts, setSavedPosts] = useState<number[]>([]);

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // Redirect unauthorized users to login
  const handleProtectedAction = (action: string) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    console.log(`${action} action triggered`);
  };

  // Like functionality
  const handleLike = (postId: number) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    setLikedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  // Save functionality
  const handleSave = (postId: number) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    setSavedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  // Load more posts
  const loadMorePosts = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      // Simulating a backend API request
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setPosts((prev) => {
        const newPosts = initialPosts.map((post, index) => ({
          ...post,
          id: Date.now() + index,
        }));

        return [...prev, ...newPosts];
      });

      // In the future, replace this with API pagination.
    } catch (error) {
      console.error("Unable to load posts:", error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Infinite scroll: Load more when user reaches 70%
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const totalHeight = document.documentElement.scrollHeight;

      if (scrollPosition >= totalHeight * 0.7) {
        loadMorePosts();
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loadMorePosts]);

  return (
    <div className="min-h-screen bg-[#0c0f12] text-white">

      {/* LEFT SIDEBAR */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[75px] flex-col items-center border-r border-gray-800 bg-[#0c0f12] py-6 md:flex">

        <div className="mb-20 text-3xl font-bold">
          ◎
        </div>

        <nav className="flex flex-1 flex-col items-center gap-9">

          <button onClick={() => navigate("/")} title="Home" className="text-2xl hover:text-gray-400">
            ⌂
          </button>

          <button title="Reels" className="text-2xl hover:text-gray-400">
            ▷
          </button>

          <button onClick={() => handleProtectedAction("Messages")} title="Messages" className="text-2xl hover:text-gray-400">
            ◇
          </button>

          <button title="Search" className="text-2xl hover:text-gray-400">
            ⌕
          </button>

          <button title="Notifications" className="text-2xl hover:text-gray-400">
            ♡
          </button>

          <button onClick={() => handleProtectedAction("Create post")} title="Create post" className="text-3xl hover:text-gray-400">
            +
          </button>

          <button onClick={() => handleProtectedAction("Profile")} title="Profile">
            <img
              src="https://i.pravatar.cc/100?img=68"
              className="h-7 w-7 rounded-full object-cover"
              alt="Profile"
            />
          </button>

        </nav>

        <div className="flex flex-col gap-8 text-2xl">
          <button title="More">☰</button>
          <button title="More apps">▦</button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-800 bg-[#0c0f12] px-5 py-3 md:hidden">
        <h1 className="text-xl font-bold">BridgeIn</h1>
        <button onClick={() => handleProtectedAction("Notifications")}>
          ♡
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full max-w-[1000px] px-3 pb-10 md:pl-[75px]">

        {/* STORIES */}
        <section className="mx-auto flex max-w-[650px] gap-5 overflow-x-auto px-2 py-7 scrollbar-hide">

          {stories.map((user) => (
            <button
              key={user.id}
              onClick={() => handleProtectedAction("Story")}
              className="flex min-w-[75px] flex-col items-center gap-2"
            >
              <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-[65px] w-[65px] rounded-full border-[3px] border-[#0c0f12] object-cover"
                />
              </div>

              <span className="max-w-[75px] truncate text-xs">
                {user.username}
              </span>
            </button>
          ))}

        </section>

        {/* POSTS FEED */}
        <section className="mx-auto flex max-w-[470px] flex-col gap-10">

          {posts.map((post) => (
            <article key={post.id} className="w-full">

              {/* POST HEADER */}
              <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <img
                    src={post.avatar}
                    alt={post.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />

                  <div>
                    <p className="text-sm font-semibold">
                      {post.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      Suggested for you
                    </p>
                  </div>

                </div>

                <button className="text-xl text-gray-300">
                  ⋯
                </button>

              </div>

              {/* POST IMAGE */}
              <div className="overflow-hidden rounded-md border border-gray-800 bg-[#171a1e]">

                <img
                  src={post.image}
                  alt="Post"
                  loading="lazy"
                  className="max-h-[650px] min-h-[300px] w-full object-cover"
                />

              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between py-3">

                <div className="flex items-center gap-5">

                  <button
                    onClick={() => handleLike(post.id)}
                    className={`text-2xl transition ${
                      likedPosts.includes(post.id)
                        ? "text-red-500"
                        : "text-white hover:text-gray-400"
                    }`}
                    title="Like"
                  >
                    {likedPosts.includes(post.id) ? "♥" : "♡"}
                  </button>

                  <button
                    onClick={() => handleProtectedAction("Comment")}
                    className="text-2xl hover:text-gray-400"
                    title="Comment"
                  >
                    ◯
                  </button>

                  <button
                    onClick={() => handleProtectedAction("Share")}
                    className="text-2xl hover:text-gray-400"
                    title="Share"
                  >
                    ↗
                  </button>

                </div>

                <button
                  onClick={() => handleSave(post.id)}
                  className={`text-2xl ${
                    savedPosts.includes(post.id)
                      ? "text-blue-400"
                      : "text-white"
                  }`}
                  title="Save"
                >
                  ▱
                </button>

              </div>

              {/* POST DETAILS */}
              <div className="space-y-2 text-sm">

                <p className="font-semibold">
                  {post.likes + (likedPosts.includes(post.id) ? 1 : 0)} likes
                </p>

                <p>
                  <span className="font-semibold">{post.username}</span>{" "}
                  {post.caption}
                </p>

                <button
                  onClick={() => handleProtectedAction("Comment")}
                  className="text-gray-400"
                >
                  View all {post.comments} comments
                </button>

              </div>

            </article>
          ))}

          {/* LOADING INDICATOR */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
              <span className="ml-3 text-sm text-gray-400">
                Loading more posts...
              </span>
            </div>
          )}

        </section>

      </main>
    </div>
  );
}
