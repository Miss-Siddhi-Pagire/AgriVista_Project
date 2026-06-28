class UserModel {
  final String id;
  final String username;
  final String email;
  final String? profilePhoto;

  UserModel({required this.id, required this.username, required this.email, this.profilePhoto});

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['_id'] ?? json['id'] ?? '',
    username: json['username'] ?? '',
    email: json['email'] ?? '',
    profilePhoto: json['profilePhoto'],
  );
}

class PostModel {
  final String id;
  final String heading;
  final String content;
  final String creatorname;
  final String creatorId;
  final DateTime createdAt;
  final List<String> likes;
  final String? image;
  final int commentsCount;

  PostModel({
    required this.id, required this.heading, required this.content,
    required this.creatorname, required this.creatorId, required this.createdAt,
    required this.likes, this.image, this.commentsCount = 0,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) => PostModel(
    id: json['_id'] ?? '',
    heading: json['heading'] ?? '',
    content: json['content'] ?? '',
    creatorname: json['creatorname'] ?? '',
    creatorId: json['creatorId'] ?? '',
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    likes: List<String>.from(json['likes'] ?? []),
    image: json['image'],
    commentsCount: json['commentsCount'] ?? 0,
  );
}

class CommentModel {
  final String id;
  final String content;
  final String postId;
  final String creatorname;
  final String creatorId;
  final DateTime createdAt;

  CommentModel({
    required this.id, required this.content, required this.postId,
    required this.creatorname, required this.creatorId, required this.createdAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) => CommentModel(
    id: json['_id'] ?? '',
    content: json['content'] ?? '',
    postId: json['postId'] ?? '',
    creatorname: json['creatorname'] ?? '',
    creatorId: json['creatorId'] ?? '',
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

class PredictionRecord {
  final String id;
  final dynamic prediction;
  final DateTime date;
  final Map<String, dynamic> inputs;

  PredictionRecord({required this.id, required this.prediction, required this.date, required this.inputs});

  String get predictionLabel {
    if (prediction == null) return 'N/A';
    if (prediction is Map) {
      return prediction['recommended_crop'] ?? prediction['recommended_fertilizer'] ?? 'N/A';
    }
    return prediction.toString();
  }
}

class SeasonPlan {
  final String id;
  final String crop;
  final String season;
  final String district;
  final bool saved;
  final DateTime createdAt;

  SeasonPlan({
    required this.id, required this.crop, required this.season,
    required this.district, required this.saved, required this.createdAt,
  });

  factory SeasonPlan.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    return SeasonPlan(
      id: json['_id'] ?? '',
      crop: data['crop'] ?? json['crop'] ?? '',
      season: data['season'] ?? json['season'] ?? '',
      district: data['district'] ?? json['district'] ?? '',
      saved: json['saved'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}
