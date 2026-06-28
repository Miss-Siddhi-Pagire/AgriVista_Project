// ─────────────────────────────────────────────────────────────
//  AgriVista Mobile — API Constants
//  Switch kBaseUrl depending on environment:
//
//  LOCAL TESTING:
//    • Android Emulator → 'http://10.0.2.2:7000'
//    • Physical device on same WiFi → 'http://192.168.X.X:7000'
//      (find your PC IP via: ipconfig → IPv4 Address)
//
//  PRODUCTION (deployed backend on Render):
//    → 'https://agrivista-backend.onrender.com'
// ─────────────────────────────────────────────────────────────

// ✅ CHANGE THIS LINE based on your setup:
const String kBaseUrl = 'https://agrivista-backend.onrender.com';
// const String kBaseUrl = 'http://10.0.2.2:7000';         // ← emulator
// const String kBaseUrl = 'http://192.168.1.5:7000';      // ← physical device (change IP)

// ── Auth ─────────────────────────────────────────────────────
const String kLogin   = '$kBaseUrl/login';
const String kSignup  = '$kBaseUrl/signup';

// ── ML Predictions ───────────────────────────────────────────
const String kPredictCrop       = '$kBaseUrl/api/ml/predict-crop';
const String kPredictYield      = '$kBaseUrl/api/ml/predict-yield';
const String kPredictFertilizer = '$kBaseUrl/api/ml/predict-fertilizer';
const String kPredictDisease    = '$kBaseUrl/api/ml/predict-disease';

// ── User Data / History ──────────────────────────────────────
String kGetCropHistory(String uid)      => '$kBaseUrl/get-form/$uid';
String kGetYieldHistory(String uid)     => '$kBaseUrl/api/yield/$uid';
String kGetFertilizerHistory(String uid)=> '$kBaseUrl/api/fertilizer/$uid';
String kDeleteCrop(String id)           => '$kBaseUrl/delete-form/$id';
String kDeleteYield(String id)          => '$kBaseUrl/api/yield/$id';
String kDeleteFertilizer(String id)     => '$kBaseUrl/api/fertilizer/$id';
String kSaveCrop(String uid)            => '$kBaseUrl/data';
String kSaveYield(String uid)           => '$kBaseUrl/api/yield';
String kSaveFertilizer(String uid)      => '$kBaseUrl/api/fertilizer';

// ── Forum / Community ────────────────────────────────────────
const String kPostFetch    = '$kBaseUrl/Postfetch';
const String kPostCreate   = '$kBaseUrl/Post';
const String kCommentCreate= '$kBaseUrl/Comment';
String kPostById(String id)      => '$kBaseUrl/PostId?postId=$id';
String kCommentFetch(String id)  => '$kBaseUrl/Commentfetch?postId=$id';
String kLikePost(String id)      => '$kBaseUrl/$id/likePost';
String kUserPosts(String uid)    => '$kBaseUrl/user/$uid';
String kLikedPosts(String uid)   => '$kBaseUrl/liked/$uid';
String kUserComments(String uid) => '$kBaseUrl/user/$uid';

// ── Season Planner ───────────────────────────────────────────
const String kSeasonPlan        = '$kBaseUrl/api/season-planner';
const String kSeasonCalendar    = '$kBaseUrl/api/season-planner/calendar';
const String kSeasonRotation    = '$kBaseUrl/api/season-planner/rotation';
String kSavedPlans(String uid)   => '$kBaseUrl/api/season-planner/saved/$uid';
String kPlanHistory(String uid)  => '$kBaseUrl/api/season-planner/history/$uid';

// ── Advisory (AI) ────────────────────────────────────────────
const String kAdvisory = '$kBaseUrl/api/advisory';

// ── Weather ──────────────────────────────────────────────────
String kWeather(String uid)        => '$kBaseUrl/api/weather/$uid';
const String kWeatherRegion        = '$kBaseUrl/api/weather/region';

// ── User Profile ─────────────────────────────────────────────
String kGetProfile(String uid)     => '$kBaseUrl/getFarmerDetails/$uid';
const String kUpdateProfile        = '$kBaseUrl/updateFarmerDetails';

// ── Market Prices ────────────────────────────────────────────
const String kMarketPrices         = '$kBaseUrl/api/market/prices';
