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
      {translatedPosts.map((post) => (
        <div className="row row-cols-1 row-cols-md-1 g-4 mb-3" key={post._id}>
          <div className="col position-relative">
            <a
              href={type === "posts" ? `/forum/${post._id}` : "#"}
              className="card text-decoration-none"
              style={type === "posts" ? { color: 'inherit' } : disabledStyle}
            >
              <div className="card-body" style={{ boxShadow: "0 0 6px rgba(0,0,0,0.2)" }}>
                <div className="d-flex align-items-center mb-3">
                  <img
                    src={post.profilePhoto || defaultAvatar}
                    className="card-img rounded-circle object-fit-cover"
                    alt="avatar"
                    style={{ width: 40, height: 40 }}
                    onError={(e) => { e.target.src = defaultAvatar; }}
                  />
                  <div className="d-flex justify-content-between">
                    <h6 className="card-title s">&nbsp; {post.creatorname} &nbsp;</h6>
                    <small className="text-muted">&bull; {post.formattedDate}</small>
                  </div>
                </div>
                <h5 className="card-title">{post.heading}</h5>
                <p className="card-text">{post.content}</p>

                {post.image && (
                  <div className="mt-3 mb-3">
                    <img
                      src={`${url}${post.image}`}
                      alt="Post attachment"
                      className="img-fluid rounded"
                      style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Social Actions */}
                <div className="d-flex gap-4 mt-3 border-top pt-3">
                  <button
                    className="btn btn-sm d-flex align-items-center gap-1 p-0 border-0"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent card click
                      handleLike(post);
                    }}
                    style={{ color: post.likes?.includes(id) ? '#e0245e' : '#657786' }}
                  >
                    <Heart size={18} fill={post.likes?.includes(id) ? "#e0245e" : "none"} />
                    <span>{post.likes?.length || 0}</span>
                  </button>

                  <button
                    className="btn btn-sm d-flex align-items-center gap-1 p-0 border-0"
                    style={{ color: '#657786' }}
                  >
                    <MessageCircle size={18} />
                    <span>{post.commentsCount || 0}</span>
                  </button>
                </div>

              </div>
            </a>

            {post.creatorId === id && (
              <div
                className="dropdown position-absolute"
                style={{ right: 20, top: 20, zIndex: 10 }}
              >
                <button
                  className="btn btn-sm btn-light rounded-circle shadow-sm dropdown-toggle d-flex align-items-center justify-content-center"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ width: '32px', height: '32px', border: 'none' }}
                >
                  <MoreVertical size={16} color="#666" />
                </button>
                <ul className="dropdown-menu shadow-sm border-0" style={{ minWidth: '150px' }}>
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2"
                      onClick={() => handleEdit(post)}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 text-danger"
                      onClick={() => handleDelete(post._id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      <Modal show={showEditDetails} onHide={() => setShowEditDetails(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <EditDetails
            post={selectedPost}
            type={type}
            onClose={() => setShowEditDetails(false)}
          />
        </Modal.Body>
      </Modal>

      <Toaster />
    </div>
  );
};

export default PostTitles;
