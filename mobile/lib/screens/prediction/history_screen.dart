import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});
  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Map<String, dynamic>> _crop = [], _yield = [], _fert = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  Future<void> _load() async {
    final uid = context.read<AuthProvider>().userId!;
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getCropHistory(uid),
        ApiService.getYieldHistory(uid),
        ApiService.getFertilizerHistory(uid),
      ]);
      if (mounted) setState(() { _crop = results[0]; _yield = results[1]; _fert = results[2]; });
    } catch (_) {} finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _delete(String id, String type) async {
    final ok = await showDialog<bool>(context: context,
      builder: (c) => AlertDialog(title: const Text('Delete Record'),
        content: const Text('Are you sure?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ]));
    if (ok != true) return;
    if (type == 'crop') await ApiService.deleteCrop(id);
    else if (type == 'yield') await ApiService.deleteYield(id);
    else await ApiService.deleteFertilizer(id);
    _load();
  }

  String _getPred(Map m) {
    final p = m['crop'] ?? m['yield'] ?? m['fertilizer'] ?? m['prediction'] ?? m['Prediction'];
    if (p is Map) return p['prediction'] ?? p['recommended_crop'] ?? p['recommended_fertilizer'] ?? 'N/A';
    return p?.toString() ?? 'N/A';
  }

  String _fmtDate(Map m) {
    final ts = m['date'] ?? m['createdAt'] ?? m['Timestamp'];
    if (ts == null) return 'N/A';
    return DateFormat('dd MMM yyyy').format(DateTime.tryParse(ts) ?? DateTime.now());
  }

  Widget _buildList(List<Map<String, dynamic>> data, String type, String emoji) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (data.isEmpty) return Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(emoji, style: const TextStyle(fontSize: 40)),
      const SizedBox(height: 12),
      Text('No $type records yet.', style: const TextStyle(color: AppTheme.textMuted)),
    ])));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: data.length,
      itemBuilder: (_, i) {
        final item = data[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.cardBorder),
            boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 10, offset: Offset(0, 4))],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.mint, borderRadius: BorderRadius.circular(10)
                  ),
                  child: Text(emoji, style: const TextStyle(fontSize: 18))
                ),
              ],
            ),
            title: Text(_getPred(item), style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.forest, fontSize: 16)),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(_fmtDate(item), style: const TextStyle(fontSize: 12, color: AppTheme.textLight, fontWeight: FontWeight.w600)),
            ),
            trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(item['id']?.toString() ?? item['_id']?.toString() ?? '', type)),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Prediction History'),
      bottom: TabBar(
        controller: _tabs,
        labelColor: Colors.white,
        unselectedLabelColor: Colors.white60,
        indicatorColor: AppTheme.leafBright,
        indicatorWeight: 3,
        tabs: const [Tab(text: 'Crop'), Tab(text: 'Yield'), Tab(text: 'Fertilizer')],
      ),
      actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
    ),
    body: Container(
      color: AppTheme.mintFaint,
      child: TabBarView(controller: _tabs, children: [
        _buildList(_crop, 'crop', '🌱'),
        _buildList(_yield, 'yield', '🌾'),
        _buildList(_fert, 'fertilizer', '🧪'),
      ]),
    ),
  );
}
