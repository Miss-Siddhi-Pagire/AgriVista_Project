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
      <div 
        className="d-flex flex-column p-4 pb-1" 
        style={{ 
          backgroundColor: colors.creamBg, // Updated from #c9d4f8 to Cream
          minHeight: "100vh" 
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "900px", width: "100%" }}>
          
          {/* Added Header to match the new branding */}
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: colors.deepGreen, fontFamily: 'serif' }}>
              Farmer's Forum
            </h2>
            <p className="text-muted small">Share knowledge and grow together with the community.</p>
          </div>

          <div className="d-flex flex-column justify-content-between">
              <div 
                style={{ width: 'auto' }} 
                className="shadow-sm rounded-4 p-2 bg-white"
              >
                  <CreatePost onRefresh={onRefresh}/>
              </div>
              <div style={{ marginTop: 20 }}>
                {/* Visual indicator for refreshing state */}
                {refreshing && (
                  <div className="text-center mb-2">
                    <div className="spinner-border spinner-border-sm" style={{ color: colors.primaryGreen }}></div>
                  </div>
                )}
                <PostTitles type="posts" posts={posts} />
              </div>
          </div>
        </div>
      </div>
    );
  };

export default Post;