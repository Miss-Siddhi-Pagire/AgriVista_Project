import { useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import toast, { Toaster } from 'react-hot-toast';
import CommentBox from './CommentBox';
import url from '../url';
import { useTranslation } from 'react-i18next';

const creatorname = Cookies.get('username');
const creatorId = Cookies.get('id');

const CreatePost = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    creatorname,
    creatorId,
    heading: '',
    content: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (postData) => {
    try {
      const response = await fetch(`${url}/Post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      const data = await response.json();
      toast.success(data.message, { onClose: setTimeout(() => window.location.reload(), 1500) });
    } catch (error) {
      console.error(error);
      toast.error('Failed to create post. Please try again later.');
    }
  };

  return (
    <div className="text-center">
      <div className="form-floating">
        <input
          type="text"
          className="form-control"
          id="heading"
          name="heading"
          value={formData.heading}
          placeholder="Enter heading"
          onChange={handleChange}
          autoComplete="off"
          required
          style={{ boxShadow: "0 0 6px rgba(0, 0, 0, 0.2)" }}
        />
        <label htmlFor="heading">{t('Fheading')}</label>
      </div>
      <CommentBox postId="postId" heading={formData.heading} type="post" onCommentSubmit={handleSubmit} />
      <Toaster />
    </div>
  );
};

export default CreatePost;
