import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import PostTitles from '../components/PostTitles';
import CreatePost from '../components/CreatePost';
import url from '../url'

const Post = () => {
    const [posts, setPosts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Agrivista Theme Palette
    const colors = {
      primaryGreen: "#6A8E23", // Olive Green
      deepGreen: "#4A6317",
      creamBg: "#F9F8F3", 
      white: "#ffffff",
      textDark: "#2C3322"
    };

    const onRefresh = useCallback(() => {
      setRefreshing(true);
      fetchData(); 
      setTimeout(() => {
        setRefreshing(false);
      }, 2000);
    }, []);

    const fetchData = async () => {
      try {
        const response = await axios.get(`${url}/Postfetch`);
        setPosts(response.data.posts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    useEffect(() => {
      fetchData();
    }, []);
  
  return (
    <>
      <div style={{ background: 'linear-gradient(135deg,var(--mint-light),var(--mint))', padding: '3rem 2.5rem', textAlign: 'center', borderBottom: '1px solid rgba(74,222,128,.15)' }}>
        <div className="hero-badge" style={{ margin: '0 auto 1rem' }}>
          <div className="badge-dot"></div>50,000+ Farmers Connected
        </div>
        <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--forest)', letterSpacing: '-.3px', margin: '0 0 .8rem' }}>
          Learn from the <span className="h1-accent">farming</span> community
        </h1>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '440px', margin: '0 auto' }}>
          <input type="text" placeholder="Search discussions, crops, tips..." className="form-input" style={{ flex: 1 }} />
          <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '.82rem' }}>Search</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 0.6fr)', gap: '1.5rem', padding: '2rem 7.5vw', background: 'var(--mint-faint)', alignItems: 'start' }}>
        
        {/* Main Feed Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow:'hidden' }}>
          
          <div className="dash-card">
            <CreatePost onRefresh={onRefresh}/>
          </div>

          {refreshing && (
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div className="spinner-border spinner-border-sm" style={{ color: 'var(--leaf)', marginRight:'8px' }}></div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Refreshing feed...</span>
            </div>
          )}
          
          <PostTitles type="posts" posts={posts} />
        </div>

        {/* Right Sidebar */}
        <div>
          <div className="dash-card" style={{ marginBottom: '1rem' }}>
            <div className="dash-card-title">Trending Topics</div>
            <div className="detail-row"><span className="detail-key">Kharif 2026 Planning</span><span style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: 'var(--text-light)' }}>1.2K posts</span></div>
            <div className="detail-row"><span className="detail-key">Drip Irrigation Tips</span><span style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: 'var(--text-light)' }}>890 posts</span></div>
            <div className="detail-row"><span className="detail-key">Organic Farming</span><span style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: 'var(--text-light)' }}>654 posts</span></div>
            <div className="detail-row"><span className="detail-key">Pest & Disease Control</span><span style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: 'var(--text-light)' }}>543 posts</span></div>
          </div>
          
          <div className="dash-card">
            <div className="dash-card-title">Top Contributors</div>
            <div className="detail-row"><span className="detail-key">Dr. V. Sharma</span><span className="pill pill-blue">Expert</span></div>
            <div className="detail-row"><span className="detail-key">Rajesh Kumar</span><span style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: 'var(--text-light)' }}>1.4K posts</span></div>
            <div className="detail-row"><span className="detail-key">Anita Patil</span><span style={{ fontFamily: 'var(--ff-body)', fontSize: '.7rem', color: 'var(--text-light)' }}>892 posts</span></div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Post;