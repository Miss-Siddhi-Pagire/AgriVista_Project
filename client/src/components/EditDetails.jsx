import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import url from '../url';
import '../assets/Button.css';

const EditDetails = ({ type, post, onClose }) => {
  const [heading, setHeading] = useState(post?.heading || "");
  const [comment, setComment] = useState(post?.content || "");
  const [image, setImage] = useState(null);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === "post" || type === "posts") {
        const formData = new FormData();
        formData.append("postId", post._id);
        formData.append("heading", heading);
        formData.append("content", comment);
        if (image) {
          formData.append("image", image);
        }

        const response = await axios.put(`${url}/UpdatePost`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success(response.data.message, { onClose: setTimeout(() => window.location.reload(), 1500) });
      } else if (type === "comment") {
        const response = await axios.put(`${url}/UpdateComment`, { postId: post._id, content: comment });
        toast.success("Comment updated!", { onClose: setTimeout(() => window.location.reload(), 1500) });
      }
    } catch (error) {
      console.error(error);
      toast.error("Update failed. Try again.");
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [comment]);

  return (
    <form className="form-floating" onSubmit={handleSubmit}>
      {(type === "post" || type === "posts") && (
        <>
          <div className="form-floating">
            <input type="text" className="form-control" id="heading" placeholder="Enter heading" value={heading} onChange={e => setHeading(e.target.value)} />
            <label htmlFor="heading">Heading</label>
          </div>

          <div className="mt-3">
            <label className="form-label small text-muted">Update Image (Optional)</label>
            <input type="file" className="form-control form-control-sm" onChange={(e) => setImage(e.target.files[0])} accept="image/*" />
          </div>
        </>
      )}
      <div className="form-floating mt-3">
        <textarea ref={textareaRef} className="form-control" id="comment" placeholder="Enter comment" value={comment} onChange={e => setComment(e.target.value)} style={{ overflow: 'hidden' }} />
        <label htmlFor="comment">Comment</label>
      </div>
      <div className="d-flex justify-content-end">
        <button type="submit" className="btn-hover color-1 mt-3 w-25">Update</button>
      </div>
      <Toaster />
    </form>
  );
};

export default EditDetails;
