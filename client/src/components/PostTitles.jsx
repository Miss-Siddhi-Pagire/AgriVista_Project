import { formatDistanceToNow } from 'date-fns';
import Cookies from 'js-cookie';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import EditDetails from '../components/EditDetails';
import { Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import url from '../url';
import { detectLanguage, translateText } from '../util/TranslatePost';
import { MoreVertical, Edit2, Trash2, Heart, MessageCircle } from 'lucide-react';

const PostTitles = ({ posts, type }) => {
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [translatedPosts, setTranslatedPosts] = useState([]);

  // Read cookies inside the component to ensure freshness
  const targetLanguage = Cookies.get("language") || "en";
  const id = Cookies.get('id');

  useEffect(() => {
    if (!posts || posts.length === 0) {
      setTranslatedPosts([]); // Clear if no posts
      return;
    }

    const formatDate = (dateString) =>
      formatDistanceToNow(new Date(dateString), { addSuffix: true }).replace('about ', '');

    // Sort and format
    let sortedPosts =
      type === "posts"
        ? posts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : type === "comment"
          ? posts.slice().sort((a, b) => new Date(b.commentSeq) - new Date(a.commentSeq))
          : posts;

    const formattedPosts = sortedPosts.map((post) => ({
      ...post,
      formattedDate: formatDate(post.createdAt),
    }));

    // ✅ If no translation needed (English, missing language, or 'deff')
    if (!targetLanguage || targetLanguage === "en" || targetLanguage === "deff") {
      setTranslatedPosts(formattedPosts);
      return;
    }

    // ✅ Skip translation for comments completely
    if (type === "comment") {
      setTranslatedPosts(formattedPosts);
      return;
    }

    // Function for translation with safe fallback
    const translatePosts = async () => {
      try {
        const translated = await Promise.all(
          formattedPosts.map(async (post) => {
            try {
              const detectedData = await detectLanguage([post.content]);
              const detectedLang = detectedData?.[0]?.language || "en";

              // Skip if same language
              if (detectedLang === targetLanguage) return post;

              const translatedContent = await translateText(
                [post.content, post.heading, post.creatorname, post.formattedDate],
                targetLanguage,
                detectedLang
              );

              return {
                ...post,
                content: translatedContent[0],
                heading: translatedContent[1],
                creatorname: translatedContent[2],
                formattedDate: translatedContent[3],
              };
            } catch (error) {
              console.warn("⚠️ Translation failed for one post, keeping original:", error.message);
              return post; // fallback if one fails
            }
          })
        );

        setTranslatedPosts(translated);
      } catch (error) {
        console.error("🚨 Translation process failed:", error.message);
        setTranslatedPosts(formattedPosts); // ✅ always show originals if error
      }
    };

    translatePosts();
  }, [posts, targetLanguage, type]);

  // 🛠 Handle edit
  const handleEdit = (post) => {
    setSelectedPost(post);
    setShowEditDetails(true);
  };

  // 🗑 Handle delete
  const handleDelete = async (postId) => {
    try {
      if (type === "comment") {
        await axios.delete(`${url}/DeleteComment?commentId=${postId}`);
      } else {
        await axios.delete(`${url}/DeletePostAndComments?postId=${postId}`);
      }

      toast.success(`${type === "comment" ? "Comment" : "Post and comments"} deleted successfully!`, {
        onClose: setTimeout(() => window.location.reload(), 1500),
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete item. Please try again.");
    }
  };

  // 🛠 Handle like
  const handleLike = async (post) => {
    if (!id) {
      toast.error("Please login to like posts");
      return;
    }
    try {
      const response = await axios.patch(`${url}/${post._id}/likePost`, { userId: id });
      // Update local state deeply
      const updatedPost = response.data;

      // Helper to update specific post in list
      const updateList = (list) => list.map((p) => p._id === updatedPost._id ? { ...p, likes: updatedPost.likes } : p);

      setTranslatedPosts(updateList(translatedPosts));

    } catch (error) {
      console.error(error);
    }
  };

  // 💬 UI Loading fallback
  if (!posts) {
    return (
      <div className="spinner-border text-info" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  const disabledStyle = {
    color: 'currentColor',
    cursor: 'not-allowed',
    pointerEvents: 'none',
    textDecoration: 'none',
  };

  // Default avatar
  const defaultAvatar = "https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg";

  // ✅ Render translatedPosts (or originals if translation failed)
  return (
    <div>

      {translatedPosts.map((post) => {
        const initials = post.creatorname?.substring(0, 2).toUpperCase() || "U";
        
        return (
          <div key={post._id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <a
              href={type === "posts" ? `/forum/${post._id}` : "#"}
              style={type === "posts" ? { textDecoration: 'none', color: 'inherit', display: 'block' } : { textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'default', pointerEvents: 'none' }}
            >
              <div 
                className="dash-card form-group" 
                style={{ margin: 0, cursor: 'pointer', transition: 'all 0.25s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateX(6px)'; e.currentTarget.style.borderColor = 'var(--leaf)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '.8rem' }}>
                  {post.profilePhoto ? (
                    <img
                      src={post.profilePhoto}
                      alt="avatar"
                      style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { e.target.src = defaultAvatar; }}
                    />
                  ) : (
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--leaf),var(--forest-mid))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-body)', fontSize: '.68rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initials}
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: 'var(--ff-head)', fontSize: '.85rem', fontWeight: 700, color: 'var(--forest)' }}>
                      {post.creatorname}
                    </div>
                    <div style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: 'var(--text-light)' }}>
                      {post.formattedDate}
                    </div>
                  </div>
                </div>

                <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: '.92rem', fontWeight: 700, color: 'var(--forest)', marginBottom: '5px' }}>
                  {post.heading}
                </h3>
                <p style={{ fontFamily: 'var(--ff-body)', fontSize: '.76rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 300, whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>

                {post.image && (
                  <div style={{ marginTop: '1rem', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                      src={`${url}${post.image}`}
                      alt="Post attachment"
                      style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Social Actions mimicking the design */}
                {type === "posts" && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '.7rem', alignItems: 'center' }}>
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        handleLike(post);
                      }}
                      style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: post.likes?.includes(id) ? 'var(--leaf)' : 'var(--text-light)', cursor: 'pointer', zIndex: 10, position: 'relative' }}
                    >
                      👍 {post.likes?.length || 0}
                    </span>
                    <span style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: 'var(--text-light)', cursor: 'pointer' }}>
                      💬 {post.commentsCount || 0} replies
                    </span>
                    <span style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: 'var(--text-light)', cursor: 'pointer' }}>
                      🔖 Save
                    </span>
                  </div>
                )}
              </div>
            </a>

            {post.creatorId === id && (
              <div
                className="dropdown"
                style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', zIndex: 10 }}
              >
                <button
                  className="dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ width: '32px', height: '32px', border: 'none', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                >
                  <MoreVertical size={16} color="var(--forest)" />
                </button>
                <ul className="dropdown-menu shadow-sm" style={{ border: '1px solid var(--card-border)', borderRadius: '8px', minWidth: '150px' }}>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => handleEdit(post)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', color: 'var(--forest)' }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => handleDelete(post._id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {/* Edit Modal */}
      <Modal show={showEditDetails} onHide={() => setShowEditDetails(false)}>
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--card-border)', backgroundColor: 'var(--mint-light)' }}>
          <Modal.Title style={{ fontFamily: 'var(--ff-head)', color: 'var(--forest)', fontWeight: 700 }}>Edit Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#fff' }}>
          <EditDetails
            post={selectedPost}
            type={type}
            onClose={() => setShowEditDetails(false)}
          />
        </Modal.Body>
      </Modal>

      <Toaster position="top-center" />
    </div>
  );
};

export default PostTitles;
