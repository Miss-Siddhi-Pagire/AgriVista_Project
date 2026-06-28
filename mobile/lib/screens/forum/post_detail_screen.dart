import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/theme.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';

class PostDetailScreen extends StatefulWidget {
  final String postId;
  const PostDetailScreen({super.key, required this.postId});
  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  PostModel? _post;
  List<CommentModel> _comments = [];
  bool _loading = true;
  final _commentCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.fetchPostById(widget.postId),
        ApiService.fetchComments(widget.postId),
      ]);
      setState(() {
        _post = results[0] as PostModel?;
        _comments = results[1] as List<CommentModel>;
      });
    } catch (_) {} finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _addComment() async {
    final txt = _commentCtrl.text.trim();
    if (txt.isEmpty) return;
    final auth = context.read<AuthProvider>();
    setState(() => _submitting = true);
    try {
      await ApiService.addComment(widget.postId, txt, auth.userName, auth.userId!);
      _commentCtrl.clear();
      _load();
    } catch (_) {} finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_post == null) return const Scaffold(body: Center(child: Text('Post not found')));
    return Scaffold(
      appBar: AppBar(title: Text(_post!.heading, maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: Column(children: [
        Expanded(child: ListView(padding: const EdgeInsets.all(14), children: [
          // Post header
          Row(children: [
            CircleAvatar(backgroundColor: AppTheme.mint, child: Text(_post!.creatorname[0].toUpperCase(), style: const TextStyle(color: AppTheme.forest, fontWeight: FontWeight.bold))),
            const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_post!.creatorname, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(DateFormat('dd MMM yyyy, hh:mm a').format(_post!.createdAt), style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            ]),
          ]),
          const SizedBox(height: 12),
          if (_post!.image != null && _post!.image!.isNotEmpty)
            ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.network('http://10.0.2.2:7000${_post!.image}', fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox.shrink())),
          if (_post!.image != null && _post!.image!.isNotEmpty) const SizedBox(height: 12),
          Text(_post!.heading, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: AppTheme.forest)),
          const SizedBox(height: 8),
          Text(_post!.content, style: const TextStyle(fontSize: 14, height: 1.6)),
          const Divider(height: 28),
          Row(children: [const Icon(Icons.comment, size: 18, color: AppTheme.leaf), const SizedBox(width: 6), Text('Comments (${_comments.length})', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.forest))]),
          const SizedBox(height: 8),
          ..._comments.map((c) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppTheme.mintLight, borderRadius: BorderRadius.circular(10)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.creatorname, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 4),
              Text(c.content, style: const TextStyle(fontSize: 13)),
              const SizedBox(height: 4),
              Text(DateFormat('dd MMM yyyy').format(c.createdAt), style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            ]),
          )),
        ])),
        // Comment input
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
          decoration: const BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)]),
          child: Row(children: [
            Expanded(child: TextField(
              controller: _commentCtrl,
              decoration: InputDecoration(hintText: 'Write a comment...', contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10), isDense: true),
            )),
            const SizedBox(width: 8),
            IconButton(
              onPressed: _submitting ? null : _addComment,
              icon: _submitting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.send, color: AppTheme.leaf),
            ),
          ]),
        ),
      ]),
    );
  }
}
