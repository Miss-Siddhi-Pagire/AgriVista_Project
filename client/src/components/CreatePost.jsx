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
    <div>
      <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest)', marginBottom: '1.2rem' }}>
        Create a New Post
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="heading" className="form-lbl">{t('Fheading')}</label>
          <input
            type="text"
            className="form-input"
            id="heading"
            name="heading"
            value={formData.heading}
            placeholder="Enter heading"
            onChange={handleChange}
            autoComplete="off"
            required
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content" className="form-lbl">{t('CThoughts')}</label>
          <textarea
            className="form-input"
            placeholder="Share your thoughts or questions..."
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            style={{ height: '120px', resize: 'vertical', width: '100%' }}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="image" className="form-lbl">Attach Image <span style={{ color: 'var(--text-light)', fontWeight: 400, fontSize: '0.8rem' }}>(Optional)</span></label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              className="form-input"
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              style={{ width: '100%', padding: '8px', border: '2px dashed rgba(74,222,128,0.4)', backgroundColor: 'var(--mint)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            type="submit"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status"></div>
                Posting...
              </>
            ) : (
             <>
               <span style={{ fontSize: '1.1rem' }}>✏️</span> {t('CRespond')}
             </>
            )}
          </button>
        </div>
      </form>
      <Toaster position="top-center" />
    </div>
  );
};

export default CreatePost;
