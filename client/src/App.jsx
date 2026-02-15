import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { Home, Login, Signup, SeasonRecommendation } from "./pages";
import Update from "./pages/Update";
import Navbar from "./components/Navbar";
import Posts from "./pages/Post";
import PostDetails from "./pages/PostDetails";
import Landing from "./pages/Landing";
import UpdateProfile from "./pages/UpdateProfile";
import ParticularUserData from "./pages/ParticularUserData";
import Footer from "./components/Footer";
import GeminiChatAssistant from "./components/GeminiChatAssistant";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import SeasonPlanner from "./pages/SeasonPlanner";

function App() {
  const location = useLocation();

  // Define which paths should NOT show the common layout elements
  const hideLayout = location.pathname === "/login" || location.pathname === "/signup";
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Only show Navbar if not on login/signup/admin */}
      {!hideLayout && !isAdminRoute && <Navbar />}

      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/Landing" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/update" element={<Update />} />
          <Route path="/season-recommendation" element={<SeasonRecommendation />} />
          <Route path="/season-planner" element={<SeasonPlanner />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/forum" element={<Posts />} />
          <Route path="/forum/:postId" element={<PostDetails />} />
          <Route path="/your-data" element={<ParticularUserData />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route path="" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>

      {/* Only show Assistant and Footer if not on login/signup/admin */}
      {!hideLayout && !isAdminRoute && <GeminiChatAssistant />}
      {!hideLayout && !isAdminRoute && <Footer />}
    </div>
  );
}

export default App;