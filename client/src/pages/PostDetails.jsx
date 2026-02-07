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
    return <div>Loading...</div>;
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

  // Agrivista Theme Palette
  const colors = {
    primaryGreen: "#6A8E23", // Olive Green
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    white: "#ffffff",
    textDark: "#2C3322"
  };

  return (
    <div
      className="d-flex flex-column p-4 pb-1"
      style={{
        backgroundColor: colors.creamBg,
        minHeight: "100vh"
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "900px", width: "100%" }}>

        {/* Header / Back Button */}
        <div className="mb-4">
          <a href="/forum" className="text-decoration-none d-flex align-items-center gap-2" style={{ color: colors.deepGreen, fontWeight: '600' }}>
            <i className="fas fa-arrow-left"></i> Back to Forum
          </a>
        </div>

        {/* Main Post Section */}
        <div className="mb-4">
          <PostTitles type="post" posts={[post]} />
        </div>

        {/* Comment Section */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
          <h5 className="mb-4 fw-bold" style={{ color: colors.deepGreen }}>
            <i className="far fa-comments me-2"></i>
            Discussion ({comments.length})
          </h5>

          <CommentBox postId={postId} type="comment" onCommentSubmit={handleCommentSubmission} />

          <div className="mt-4">
            <PostTitles type="comment" posts={comments} />
          </div>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};

export default PostDetails;
