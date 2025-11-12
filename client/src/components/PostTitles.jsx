import { formatDistanceToNow } from 'date-fns';
import Cookies from 'js-cookie';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import EditDetails from '../components/EditDetails';
import { Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import url from '../url';
import { detectLanguage, translateText } from '../util/TranslatePost';

const targetLanguage = Cookies.get("language");
const id = Cookies.get('id');

const PostTitles = ({ posts, type }) => {
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [translatedPosts, setTranslatedPosts] = useState([]);

  useEffect(() => {
    if (!posts || posts.length === 0) return;

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

    // ✅ If no translation needed (English or missing language)
    if (!targetLanguage || targetLanguage === "en") {
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

  // ✅ Render translatedPosts (or originals if translation failed)
  return (
    <div>
      {translatedPosts.map((post) => (
        <div className="row row-cols-1 row-cols-md-1 g-4 mb-3" key={post._id}>
          <div className="col position-relative">
            <a
              href={`/forum/${post._id}`}
              className="card text-decoration-none"
              style={type === "posts" ? { color: 'inherit' } : disabledStyle}
            >
              <div className="card-body" style={{ boxShadow: "0 0 6px rgba(0,0,0,0.2)" }}>
                <div className="d-flex align-items-center mb-3">
                  <img
                    src="https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg"
                    className="card-img rounded-circle"
                    alt="avatar"
                    style={{ width: 40, height: 40 }}
                  />
                  <div className="d-flex justify-content-between">
                    <h6 className="card-title s">&nbsp; {post.creatorname} &nbsp;</h6>
                    <small className="text-muted">&bull; {post.formattedDate}</small>
                  </div>
                </div>
                <h5 className="card-title">{post.heading}</h5>
                <p className="card-text">{post.content}</p>
              </div>
            </a>

            {post.creatorId === id && (
              <div
                className="dropdown position-absolute mt-4"
                style={{ right: 20, top: -15, zIndex: 1 }}
              >
                <button
                  className="btn btn-transparent dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fas fa-ellipsis-vertical"></i>
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => handleEdit(post)}
                    >
                      <i className="fas fa-pen mx-2"></i> Edit
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => handleDelete(post._id)}
                    >
                      <i className="fas fa-trash mx-2"></i> Delete
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
