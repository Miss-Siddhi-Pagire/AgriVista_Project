import 'dart:async';
import '../models/models.dart';

// ─────────────────────────────────────────────────────────────
//  AgriVista Mock API Service
//  All methods are mocked. No backend required!
// ─────────────────────────────────────────────────────────────

class ApiService {
  // In-memory state for persistence during session
  static final List<PostModel> _mockPosts = [
    PostModel(
      id: 'post_1',
      heading: 'Best practices for Wheat Farming',
      content: 'Make sure you perform soil testing before winter...',
      creatorname: 'Ramesh Singh',
      creatorId: 'user_123',
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      likes: ['user_456'],
      commentsCount: 2,
    ),
    PostModel(
      id: 'post_2',
      heading: 'Organic Fertilizers Discussion',
      content: 'Has anyone tried neem cake for pest control?',
      creatorname: 'Suresh Patil',
      creatorId: 'user_456',
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
      likes: [],
      commentsCount: 0,
    ),
  ];

  static final List<CommentModel> _mockComments = [
    CommentModel(
      id: 'comment_1',
      content: 'Yes, it works wonderfully!',
      postId: 'post_2',
      creatorname: 'Vikas Kumar',
      creatorId: 'user_789',
      createdAt: DateTime.now().subtract(const Duration(hours: 1)),
    ),
    CommentModel(
      id: 'comment_2',
      content: 'Great tips, thanks!',
      postId: 'post_1',
      creatorname: 'Amit Sharma',
      creatorId: 'user_000',
      createdAt: DateTime.now(),
    ),
  ];

  static final Map<String, dynamic> _mockUser = {
    'id': 'user_123',
    'username': 'Agri User',
    'email': 'user@agrivista.com',
    'profilePhoto': null,
  };

  static Future<void> _delay([int ms = 500]) async {
    await Future.delayed(Duration(milliseconds: ms));
  }

  // ── AUTH ──────────────────────────────────────────────────
  static Future<Map<String, dynamic>> login(String email, String password) async {
    await _delay();
    return {
      'success': true,
      'token': 'mock_jwt_token',
      'user': _mockUser,
    };
  }

  static Future<Map<String, dynamic>> signup({
    required String name,
    required String email,
    required String password,
    String state = '',
    String farmSize = '',
  }) async {
    await _delay();
    return {
      'success': true,
      'token': 'mock_jwt_token',
      'user': {
        '_id': 'new_user_123',
        'username': name,
        'email': email,
      },
    };
  }

  // ── ML PREDICTIONS ────────────────────────────────────────
  static Future<Map<String, dynamic>> predictCrop(Map<String, dynamic> inputs) async {
    await _delay(1000);
    return {
      'success': true,
      'prediction': {'recommended_crop': 'Wheat'},
      'recordId': 'record_${DateTime.now().millisecondsSinceEpoch}',
    };
  }

  static Future<Map<String, dynamic>> predictYield(Map<String, dynamic> inputs) async {
    await _delay(1000);
    return {
      'success': true,
      'prediction': {'estimated_yield': '3.5 tons/hectare'},
      'recordId': 'record_${DateTime.now().millisecondsSinceEpoch}',
    };
  }

  static Future<Map<String, dynamic>> predictFertilizer(Map<String, dynamic> inputs) async {
    await _delay(1000);
    return {
      'success': true,
      'prediction': {'recommended_fertilizer': 'Urea'},
      'recordId': 'record_${DateTime.now().millisecondsSinceEpoch}',
    };
  }

  // ── HISTORY ───────────────────────────────────────────────
  static Future<List<Map<String, dynamic>>> getCropHistory(String uid) async {
    await _delay();
    return [
      {
        '_id': 'hist_1',
        'prediction': {'recommended_crop': 'Rice'},
        'date': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
        'inputs': {'Temperature': 28, 'Humidity': 70},
      }
    ];
  }

  static Future<List<Map<String, dynamic>>> getYieldHistory(String uid) async {
    await _delay();
    return [];
  }

  static Future<List<Map<String, dynamic>>> getFertilizerHistory(String uid) async {
    await _delay();
    return [];
  }

  static Future<void> deleteCrop(String id) async {
    await _delay();
  }

  static Future<void> deleteYield(String id) async {
    await _delay();
  }

  static Future<void> deleteFertilizer(String id) async {
    await _delay();
  }

  // ── FORUM ─────────────────────────────────────────────────
  static Future<List<PostModel>> fetchPosts() async {
    await _delay();
    return List.from(_mockPosts.reversed); 
  }

  static Future<PostModel?> fetchPostById(String id) async {
    await _delay();
    try {
      return _mockPosts.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  static Future<List<CommentModel>> fetchComments(String postId) async {
    await _delay();
    return _mockComments.where((c) => c.postId == postId).toList();
  }

  static Future<void> createPost({
    required String heading,
    required String content,
    required String creatorId,
    required String creatorname,
  }) async {
    await _delay();
    final newPost = PostModel(
      id: 'post_${DateTime.now().millisecondsSinceEpoch}',
      heading: heading,
      content: content,
      creatorId: creatorId,
      creatorname: creatorname,
      createdAt: DateTime.now(),
      likes: [],
      commentsCount: 0,
    );
    _mockPosts.add(newPost);
  }

  static Future<void> addComment(
      String postId, String content, String creatorname, String creatorId) async {
    await _delay();
    final newComment = CommentModel(
      id: 'comment_${DateTime.now().millisecondsSinceEpoch}',
      content: content,
      postId: postId,
      creatorname: creatorname,
      creatorId: creatorId,
      createdAt: DateTime.now(),
    );
    _mockComments.add(newComment);
    
    // Update comment count
    final index = _mockPosts.indexWhere((p) => p.id == postId);
    if (index != -1) {
      final oldPost = _mockPosts[index];
      _mockPosts[index] = PostModel(
        id: oldPost.id,
        heading: oldPost.heading,
        content: oldPost.content,
        creatorname: oldPost.creatorname,
        creatorId: oldPost.creatorId,
        createdAt: oldPost.createdAt,
        likes: oldPost.likes,
        image: oldPost.image,
        commentsCount: oldPost.commentsCount + 1,
      );
    }
  }

  static Future<void> likePost(String postId, String userId) async {
    await _delay();
    final index = _mockPosts.indexWhere((p) => p.id == postId);
    if (index != -1) {
      final oldPost = _mockPosts[index];
      final newLikes = List<String>.from(oldPost.likes);
      if (newLikes.contains(userId)) {
        newLikes.remove(userId);
      } else {
        newLikes.add(userId);
      }
      _mockPosts[index] = PostModel(
        id: oldPost.id,
        heading: oldPost.heading,
        content: oldPost.content,
        creatorname: oldPost.creatorname,
        creatorId: oldPost.creatorId,
        createdAt: oldPost.createdAt,
        likes: newLikes,
        image: oldPost.image,
        commentsCount: oldPost.commentsCount,
      );
    }
  }

  static Future<List<PostModel>> getUserPosts(String uid) async {
    await _delay();
    return _mockPosts.where((p) => p.creatorId == uid).toList();
  }

  static Future<List<PostModel>> getLikedPosts(String uid) async {
    await _delay();
    return _mockPosts.where((p) => p.likes.contains(uid)).toList();
  }

  static Future<List<CommentModel>> getUserComments(String uid) async {
    await _delay();
    return _mockComments.where((c) => c.creatorId == uid).toList();
  }

  // ── SEASON PLANNER ────────────────────────────────────────
  static Future<Map<String, dynamic>> generateSeasonPlan({
    required String crop,
    required String season,
    required String state,
    required String district,
    String city = '',
  }) async {
    await _delay(1500);
    return {
      'success': true,
      'plan': {
        '_id': 'plan_${DateTime.now().millisecondsSinceEpoch}',
        'crop': crop,
        'season': season,
        'district': district,
        'saved': false,
        'createdAt': DateTime.now().toIso8601String(),
        'steps': [
          {'title': 'Preparation', 'desc': 'Plough the field well.'},
          {'title': 'Sowing', 'desc': 'Sow seeds 5cm deep.'},
        ],
      }
    };
  }

  static Future<List<SeasonPlan>> getSavedPlans(String uid) async {
    await _delay();
    return [];
  }

  static Future<List<SeasonPlan>> getPlanHistory(String uid) async {
    await _delay();
    return [];
  }

  // ── ADVISORY (AI) ─────────────────────────────────────────
  static Future<Map<String, dynamic>?> getAdvisory(
      Map<String, dynamic> inputs, dynamic prediction, String targetCrop) async {
    await _delay(1500);
    return {
      'message': 'Maintain soil moisture. The current pH level is optimal for $targetCrop.',
      'action_items': ['Water lightly evening', 'Check for pests'],
    };
  }

  // ── WEATHER ───────────────────────────────────────────────
  static Future<Map<String, dynamic>?> getWeather(String uid) async {
    await _delay();
    return {
      'temperature': 25.5,
      'condition': 'Sunny',
      'humidity': 60,
      'location': 'Sample District',
    };
  }

  // ── DISEASE DETECTION ─────────────────────────────────────
  static Future<Map<String, dynamic>> detectDisease(String filePath) async {
    await _delay(2000);
    return {
      'success': true,
      'disease': 'Early Blight',
      'confidence': 95.5,
      'recommendation': 'Apply fungicide containing chlorothalonil.',
    };
  }

  // ── USER PROFILE ──────────────────────────────────────────
  static Future<Map<String, dynamic>> getProfile(String uid) async {
    await _delay();
    return {'success': true, 'user': _mockUser};
  }

  // ── MARKET PRICES ─────────────────────────────────────────
  static Future<List<Map<String, dynamic>>> getMarketPrices() async {
    await _delay();
    return [
      {'commodity': 'Wheat', 'price': 2500, 'market': 'Mandi A'},
      {'commodity': 'Rice', 'price': 3200, 'market': 'Mandi B'},
      {'commodity': 'Soybean', 'price': 4500, 'market': 'Mandi C'},
    ];
  }
}
