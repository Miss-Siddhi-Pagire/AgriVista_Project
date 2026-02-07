import { useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import toast, { Toaster } from 'react-hot-toast';
import CommentBox from './CommentBox';
import url from '../url';
import { useTranslation } from 'react-i18next';

const CreatePost = () => {
  const { t } = useTranslation();

  // Read cookies inside component
  const creatorname = Cookies.get('username');
  const creatorId = Cookies.get('id');

  const [formData, setFormData] = useState({
    creatorname,
    creatorId,
    heading: '',
    content: ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleImageChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("heading", formData.heading);
    data.append("content", formData.content);
    data.append("creatorname", creatorname);
    data.append("creatorId", creatorId);
    if (image) {
      data.append("image", image);
    }

    try {
      const response = await fetch(`${url}/Post`, {
        method: 'POST',
        body: data // fetch automatically sets Content-Type to multipart/form-data
      });
      const res = await response.json();

      if (response.ok) {
        toast.success(res.message, { onClose: setTimeout(() => window.location.reload(), 1500) });
      } else {
        toast.error(res.message || 'Failed to create post');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <form onSubmit={handleSubmit}>
        <div className="form-floating mb-3">
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

        <div className="form-floating mb-3">
          <textarea
            className="form-control"
            placeholder="Leave a comment here"
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            style={{ height: '100px', boxShadow: "0 0 6px rgba(0, 0, 0, 0.2)" }}
            required
          ></textarea>
          <label htmlFor="content">{t('CThoughts')}</label>
        </div>

        <div className="mb-3 text-start">
          <label htmlFor="image" className="form-label text-muted small">Attach Image (Optional)</label>
          <input
            className="form-control form-control-sm"
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          style={{ backgroundColor: '#4A6317', borderColor: '#4A6317' }}
          disabled={loading}
        >
          {loading ? "Posting..." : t('CRespond')}
        </button>
      </form>
      <Toaster />
    </div>
  );
};

export default CreatePost;
