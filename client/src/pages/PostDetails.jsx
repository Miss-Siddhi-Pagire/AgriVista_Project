import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import CommentBox from '../components/CommentBox'
import PostTitles from '../components/PostTitles';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import url from '../url'
import { ArrowLeft, MessageSquare } from 'lucide-react';

const PostDetails = () => {
  const { postId } = useParams();
  const [post, setPost] = useState();
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Make a POST request to fetch the post details
        const response = await axios.get(`${url}/PostId?postId=${postId}`);;
        const data = await response.data;

        // Check if the response contains post data
        if (response.status) {
          setPost(data); // Update the state with the received post data
        } else {
          console.error("Error fetching post:", data.message);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };

    fetchPost(); // Call the fetchPost function when the component mounts
  }, [postId]); // Execute the effect whenever postId changes

  useEffect(() => {
    const fetchComments = async () => {
      try {
        // Make a GET request to fetch comments based on postId
        const response = await axios.get(`${url}/Commentfetch?postId=${postId}`);
        const data = await response.data;

        if (response.status) {
          setComments(data.comments); // Update the state with the received comments data

        } else {
          console.error("Error fetching comments:", data.message);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments(); // Call the fetchComments function when the component mounts
  }, [postId]);

  const formatDate = (dateString) => {
    let distance = formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
    });
    distance = distance.replace("about ", "");
    return distance;
  };



  if (!post) {
    // Render loading indicator or return null if post data is not available yet
    return (
      <div className="dash-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 style={{ color: 'var(--forest)', fontFamily: 'var(--ff-head)' }}>Loading discussion...</h4>
        </div>
      </div>
    );
  }

  const handleCommentSubmission = async (commentData) => {
    try {
      // Make a POST request to submit the comment data
      const response = await axios.post(`${url}/Comment`, commentData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = response.data;

      // Handle the response as needed
      console.log("Comment submitted:", data);
      toast.success('Replied!', {
        position: 'top-right',
        autoClose: 1200,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        onClose: setTimeout(function () { window.location.reload(1); }, 1500)
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  return (
    <div className="dash-wrap">
      {/* DASHBOARD SIDEBAR */}
      <div className="dash-sidebar">
        <div className="dash-sidebar-title">Menu</div>
        <div className="sidebar-item active">
          <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>💬</span> Discussion
        </div>
        <a href="/forum" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="sidebar-item">
            <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>🔙</span> Back to Forum
          </div>
        </a>
      </div>

      {/* DASHBOARD MAIN */}
      <div className="dash-main">
        {/* Header / Back Button */}
        <div className="dash-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(74,222,128,0.2)', marginBottom: '2rem' }}>
          <a href="/forum" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', textDecoration: 'none' }}>
            <ArrowLeft size={18} /> Back to Forum
          </a>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Main Post Section */}
          <div style={{ marginBottom: '2rem' }}>
            <PostTitles type="post" posts={[post]} />
          </div>

          {/* Comment Section */}
          <div className="dash-card">
            <h5 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--forest)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={24} style={{ color: 'var(--leaf)' }} />
              Discussion ({comments.length})
            </h5>

            <div style={{ marginBottom: '2rem' }}>
              <CommentBox postId={postId} type="comment" onCommentSubmit={handleCommentSubmission} />
            </div>

            <div style={{ marginTop: '2rem' }}>
              {comments.length > 0 ? (
                <PostTitles type="comment" posts={comments} />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--mint-light)', borderRadius: '12px', border: '1px dashed var(--leaf)' }}>
                   <p style={{ color: 'var(--text-muted)', margin: 0 }}>No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};

export default PostDetails;
