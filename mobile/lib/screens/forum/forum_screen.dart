import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/theme.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import 'post_detail_screen.dart';

class ForumScreen extends StatefulWidget {
  const ForumScreen({super.key});
  @override
  State<ForumScreen> createState() => _ForumScreenState();
}

class _ForumScreenState extends State<ForumScreen> {
  List<PostModel> _posts = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _posts = await ApiService.fetchPosts();
      if (mounted) setState(() {});
    } catch (_) {} finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _like(PostModel post) async {
    final uid = context.read<AuthProvider>().userId!;
    await ApiService.likePost(post.id, uid).catchError((_) {});
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final uid = context.watch<AuthProvider>().userId ?? '';
    return Scaffold(
      backgroundColor: AppTheme.mintFaint,
      appBar: AppBar(
        title: const Text('Farmer Forum'),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _posts.isEmpty
          ? const Center(child: Text('No posts yet. Be the first!', style: TextStyle(color: AppTheme.textMuted)))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _posts.length,
                itemBuilder: (_, i) {
                  final p = _posts[i];
                  final isLiked = p.likes.contains(uid);
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.cardBorder),
                      boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 10, offset: Offset(0, 4))],
                    ),
                    child: InkWell(
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PostDetailScreen(postId: p.id))).then((_) => _load()),
                      borderRadius: BorderRadius.circular(20),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          if (p.image != null && p.image!.isNotEmpty)
                            ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.network(
                              'http://10.0.2.2:7000${p.image}', height: 160, width: double.infinity, fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                            )),
                          if (p.image != null && p.image!.isNotEmpty) const SizedBox(height: 16),
                          Row(children: [
                            CircleAvatar(radius: 20, backgroundColor: AppTheme.mint, child: Text(p.creatorname[0].toUpperCase(), style: const TextStyle(color: AppTheme.forest, fontWeight: FontWeight.w900, fontSize: 18))),
                            const SizedBox(width: 12),
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(p.creatorname, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.forest)),
                              Text(DateFormat('dd MMM yyyy').format(p.createdAt), style: const TextStyle(fontSize: 12, color: AppTheme.textLight, fontWeight: FontWeight.w600)),
                            ])),
                          ]),
                          const SizedBox(height: 16),
                          Text(p.heading, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppTheme.forest)),
                          const SizedBox(height: 8),
                          Text(p.content, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.5)),
                          const SizedBox(height: 16),
                          const Divider(height: 1),
                          const SizedBox(height: 16),
                          Row(children: [
                            GestureDetector(
                              onTap: () => _like(p),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 300),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isLiked ? Colors.red.shade50 : Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(children: [
                                  Icon(isLiked ? Icons.favorite : Icons.favorite_border, color: isLiked ? Colors.red : AppTheme.textMuted, size: 20),
                                  const SizedBox(width: 6),
                                  Text('${p.likes.length}', style: TextStyle(fontSize: 13, color: isLiked ? Colors.red : AppTheme.textMuted, fontWeight: FontWeight.bold)),
                                ]),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(20)),
                              child: Row(children: [
                                const Icon(Icons.comment_outlined, color: AppTheme.textMuted, size: 20),
                                const SizedBox(width: 6),
                                Text('${p.commentsCount}', style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                              ]),
                            ),
                            const Spacer(),
                            const Text('View Thread →', style: TextStyle(color: AppTheme.leaf, fontSize: 13, fontWeight: FontWeight.bold)),
                          ]),
                        ]),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
