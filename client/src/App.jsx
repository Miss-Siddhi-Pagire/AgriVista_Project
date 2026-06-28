import "./App.css";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Home, Login, Signup, SeasonRecommendation, CropCalendar, FinancialLedger, MarketPrices, DiseaseHeatmap } from "./pages";
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
import DiseaseDetection from "./pages/DiseaseDetection";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const location = useLocation();

  // Define which paths should NOT show the common layout elements
  const hideLayout = location.pathname === "/login" || location.pathname === "/signup";
  const isAdminRoute = location.pathname.startsWith('/admin');
  // Landing page has its own minimal navbar built-in, so hide global one there too
  const isLandingPage = location.pathname === "/" || location.pathname === "/Landing";

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Only show Navbar if not on login/signup/admin/landing */}
      {!hideLayout && !isAdminRoute && !isLandingPage && <Navbar />}

      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/Landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/update" element={<Update />} />
            <Route path="/season-recommendation" element={<SeasonRecommendation />} />
            <Route path="/season-planner" element={<SeasonPlanner />} />
            <Route path="/calendar" element={<CropCalendar />} />
            <Route path="/ledger" element={<FinancialLedger />} />
            <Route path="/market" element={<MarketPrices />} />
            <Route path="/heatmap" element={<DiseaseHeatmap />} />
            <Route path="/update-profile" element={<UpdateProfile />} />
            <Route path="/user" element={<Navigate to="/update-profile" replace />} />
            <Route path="/forum" element={<Posts />} />
            <Route path="/forum/:postId" element={<PostDetails />} />
            <Route path="/your-data" element={<ParticularUserData />} />
            <Route path="/disease-detection" element={<DiseaseDetection />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route path="" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>

      {/* Only show Assistant and Footer if not on login/signup/admin/landing */}
      {!hideLayout && !isAdminRoute && !isLandingPage && <GeminiChatAssistant />}
      {!hideLayout && !isAdminRoute && !isLandingPage && <Footer />}
    </div>
  );
}

export default App;