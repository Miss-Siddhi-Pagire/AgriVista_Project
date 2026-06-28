import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/theme.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<Map<String, dynamic>> _crop = [], _yield = [], _fert = [];
  List<SeasonPlan> _savedPlans = [];
  List<PostModel> _posts = [], _liked = [];
  List<CommentModel> _comments = [];
  bool _loading = true;
  int _tab = 0;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final uid = context.read<AuthProvider>().userId!;
    setState(() => _loading = true);
    try {
      final res = await Future.wait([
        ApiService.getCropHistory(uid).catchError((_) => <Map<String, dynamic>>[]),
        ApiService.getYieldHistory(uid).catchError((_) => <Map<String, dynamic>>[]),
        ApiService.getFertilizerHistory(uid).catchError((_) => <Map<String, dynamic>>[]),
        ApiService.getSavedPlans(uid).catchError((_) => <SeasonPlan>[]),
        ApiService.getUserPosts(uid).catchError((_) => <PostModel>[]),
        ApiService.getLikedPosts(uid).catchError((_) => <PostModel>[]),
        ApiService.getUserComments(uid).catchError((_) => <CommentModel>[]),
      ]);
      if (mounted) setState(() {
        _crop = res[0] as List<Map<String, dynamic>>;
        _yield = res[1] as List<Map<String, dynamic>>;
        _fert = res[2] as List<Map<String, dynamic>>;
        _savedPlans = res[3] as List<SeasonPlan>;
        _posts = res[4] as List<PostModel>;
        _liked = res[5] as List<PostModel>;
        _comments = res[6] as List<CommentModel>;
      });
    } catch (_) {} finally { if (mounted) setState(() => _loading = false); }
  }

  String _getPred(Map m) {
    final p = m['crop'] ?? m['yield'] ?? m['fertilizer'] ?? m['prediction'] ?? m['Prediction'];
    if (p is Map) return p['prediction'] ?? p['recommended_crop'] ?? p['recommended_fertilizer'] ?? 'N/A';
    return p?.toString() ?? 'N/A';
  }

  String _fmtDate(dynamic ts) {
    if (ts == null) return 'N/A';
    return DateFormat('dd MMM yyyy').format(DateTime.tryParse(ts.toString()) ?? DateTime.now());
  }

  int get _totalPredictions => _crop.length + _yield.length + _fert.length;

  @override
  Widget build(BuildContext context) {
    final tabs = ['⚡ Predictions', '📅 Planning', '🤝 Community', '⭐ Liked'];

    return Scaffold(
      backgroundColor: AppTheme.mintFaint,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 210, pinned: true,
          backgroundColor: AppTheme.forest,
          actions: [IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: _load)],
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(gradient: LinearGradient(
                colors: [AppTheme.forest, AppTheme.forestMid], begin: Alignment.topLeft, end: Alignment.bottomRight)),
              padding: const EdgeInsets.fromLTRB(24, 64, 24, 20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
                const Text('📊', style: TextStyle(fontSize: 32)),
                const SizedBox(height: 8),
                const Text('Data Insights', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 24)),
                const Text('All your AgriVista platform activity', style: TextStyle(color: Colors.white70, fontSize: 13)),
              ]),
            ),
          ),
        ),

        SliverToBoxAdapter(child: _loading
          ? const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
          : Column(children: [
              // Stats row
              Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 8), child: Row(children: [
                _StatBadge('${_totalPredictions}', 'Predictions', '⚡'),
                const SizedBox(width: 8),
                _StatBadge('${_savedPlans.length}', 'Plans', '📅'),
                const SizedBox(width: 8),
                _StatBadge('${_posts.length}', 'Posts', '💬'),
                const SizedBox(width: 8),
                _StatBadge('${_liked.length}', 'Liked', '⭐'),
              ])),

              // Tab bar
              SingleChildScrollView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.all(16),
                child: Row(children: tabs.asMap().entries.map((e) => Padding(padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _tab = e.key),
                    child: AnimatedContainer(duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: _tab == e.key ? AppTheme.forest : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: _tab == e.key ? AppTheme.forest : AppTheme.cardBorder),
                        boxShadow: _tab == e.key ? [const BoxShadow(color: AppTheme.cardShadow, blurRadius: 8, offset: Offset(0, 4))] : [],
                      ),
                      child: Text(e.value, style: TextStyle(
                        color: _tab == e.key ? Colors.white : AppTheme.forest,
                        fontWeight: FontWeight.bold, fontSize: 14,
                      )),
                    ),
                  ))).toList()),
              ),

              // Tab content
              if (_tab == 0) _PredictionsTab(crop: _crop, yield_: _yield, fert: _fert, getPred: _getPred, fmtDate: _fmtDate),
              if (_tab == 1) _PlanningTab(savedPlans: _savedPlans),
              if (_tab == 2) _CommunityTab(posts: _posts, comments: _comments, fmtDate: _fmtDate),
              if (_tab == 3) _LikedTab(liked: _liked, fmtDate: _fmtDate),
              const SizedBox(height: 40),
            ]),
        ),
      ]),
    );
  }
}

class _StatBadge extends StatelessWidget {
  final String value, label, emoji;
  const _StatBadge(this.value, this.label, this.emoji);
  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.cardBorder),
        boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 10, offset: Offset(0, 4))],
      ),
      padding: const EdgeInsets.symmetric(vertical: 16), 
      child: Column(children: [
        Text(emoji, style: const TextStyle(fontSize: 22)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppTheme.forest)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
      ])
    )
  );
}

class _PredictionsTab extends StatelessWidget {
  final List<Map<String, dynamic>> crop, yield_, fert;
  final String Function(Map) getPred;
  final String Function(dynamic) fmtDate;
  const _PredictionsTab({required this.crop, required this.yield_, required this.fert, required this.getPred, required this.fmtDate});

  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _sectionTitle('🌱 Crop Predictions (${crop.length})'),
    ...crop.map((r) => _RecordTile(emoji: '🌱', label: getPred(r), sub: fmtDate(r['date'] ?? r['createdAt'] ?? r['Timestamp']), color: AppTheme.leaf)),
    _sectionTitle('🌾 Yield Predictions (${yield_.length})'),
    ...yield_.map((r) => _RecordTile(emoji: '🌾', label: '${getPred(r)} t/ha', sub: fmtDate(r['date'] ?? r['createdAt'] ?? r['Timestamp']), color: const Color(0xFF2563EB))),
    _sectionTitle('🧪 Fertilizer Suggestions (${fert.length})'),
    ...fert.map((r) => _RecordTile(emoji: '🧪', label: getPred(r), sub: fmtDate(r['date'] ?? r['createdAt'] ?? r['Timestamp']), color: const Color(0xFF9333EA))),
  ]));
}

Widget _sectionTitle(String title) => Padding(padding: const EdgeInsets.only(top: 16, bottom: 12),
  child: Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.forest)));

class _RecordTile extends StatelessWidget {
  final String emoji, label, sub;
  final Color color;
  const _RecordTile({required this.emoji, required this.label, required this.sub, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 12),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppTheme.cardBorder),
      boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 6, offset: Offset(0, 2))],
    ),
    child: ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
        child: Text(emoji, style: const TextStyle(fontSize: 16))
      ),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppTheme.forest)),
      subtitle: Text(sub, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
    )
  );
}

class _PlanningTab extends StatelessWidget {
  final List<SeasonPlan> savedPlans;
  const _PlanningTab({required this.savedPlans});
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _sectionTitle('📅 Saved Plans (${savedPlans.length})'),
    ...savedPlans.map((p) => Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.cardBorder),
        boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 6, offset: Offset(0, 2))],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppTheme.mint, borderRadius: BorderRadius.circular(10)), child: const Text('📅')),
        title: Text(p.crop.isNotEmpty ? p.crop : 'Plan', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.forest)),
        subtitle: Text('${p.season} · ${p.district}', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.bookmark, color: AppTheme.leaf, size: 24),
      )
    )),
    if (savedPlans.isEmpty) const _Empty('📅', 'No saved plans yet.'),
  ]));
}

class _CommunityTab extends StatelessWidget {
  final List<PostModel> posts;
  final List<CommentModel> comments;
  final String Function(dynamic) fmtDate;
  const _CommunityTab({required this.posts, required this.comments, required this.fmtDate});
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _sectionTitle('📝 Your Posts (${posts.length})'),
    ...posts.map((p) => Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.cardBorder)),
      child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(p.heading, style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.forest, fontSize: 16)),
        const SizedBox(height: 6),
        Text(p.content, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, height: 1.5)),
        const SizedBox(height: 12),
        const Divider(height: 1),
        const SizedBox(height: 12),
        Row(children: [
          const Icon(Icons.favorite, color: Colors.red, size: 16), const SizedBox(width: 4),
          Text('${p.likes.length}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
          const Spacer(),
          Text(fmtDate(p.createdAt), style: const TextStyle(fontSize: 12, color: AppTheme.textLight, fontWeight: FontWeight.w600)),
        ]),
      ]))
    )),
    if (posts.isEmpty) const _Empty('📝', 'No posts yet.'),
    _sectionTitle('💬 Your Comments (${comments.length})'),
    ...comments.map((c) => Container(
      margin: const EdgeInsets.only(bottom: 12), 
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.cardBorder)),
      child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('"${c.content}"', style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 14, color: AppTheme.forest)),
        const SizedBox(height: 12),
        Text(fmtDate(c.createdAt), style: const TextStyle(fontSize: 12, color: AppTheme.textLight, fontWeight: FontWeight.w600)),
      ]))
    )),
    if (comments.isEmpty) const _Empty('💬', 'No comments yet.'),
  ]));
}

class _LikedTab extends StatelessWidget {
  final List<PostModel> liked;
  final String Function(dynamic) fmtDate;
  const _LikedTab({required this.liked, required this.fmtDate});
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _sectionTitle('⭐ Liked Posts (${liked.length})'),
    ...liked.map((p) => Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.cardBorder)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(40)), child: const Icon(Icons.favorite, color: Colors.red)),
        title: Text(p.heading, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppTheme.forest)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text('by ${p.creatorname} · ${fmtDate(p.createdAt)}', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
        ),
      )
    )),
    if (liked.isEmpty) const _Empty('⭐', 'No liked posts yet.'),
  ]));
}

class _Empty extends StatelessWidget {
  final String emoji, text;
  const _Empty(this.emoji, this.text);
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.symmetric(vertical: 32),
    child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(emoji, style: const TextStyle(fontSize: 48)),
      const SizedBox(height: 12),
      Text(text, style: const TextStyle(color: AppTheme.textMuted, fontStyle: FontStyle.italic, fontSize: 15)),
    ])));
}
