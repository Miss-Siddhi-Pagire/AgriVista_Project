import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/theme.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';

class PlannerScreen extends StatefulWidget {
  const PlannerScreen({super.key});
  @override
  State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<SeasonPlan> _saved = [], _history = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _tabs = TabController(length: 2, vsync: this); _load(); }

  Future<void> _load() async {
    final uid = context.read<AuthProvider>().userId!;
    setState(() => _loading = true);
    try {
      final results = await Future.wait([ApiService.getSavedPlans(uid), ApiService.getPlanHistory(uid)]);
      if (mounted) setState(() { _saved = results[0]; _history = results[1]; });
    } catch (_) {} finally { if (mounted) setState(() => _loading = false); }
  }

  Widget _planCard(SeasonPlan p) => Container(
    margin: const EdgeInsets.only(bottom: 16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppTheme.cardBorder),
      boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 10, offset: Offset(0, 4))],
    ),
    child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: AppTheme.mint, borderRadius: BorderRadius.circular(12)),
          child: const Text('📅', style: TextStyle(fontSize: 20))),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(p.crop.isNotEmpty ? p.crop : 'Season Plan', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.forest)),
          const SizedBox(height: 2),
          Text(p.season, style: const TextStyle(fontSize: 13, color: AppTheme.leaf, fontWeight: FontWeight.bold)),
        ])),
        if (p.saved) const Icon(Icons.bookmark, color: AppTheme.leaf, size: 28),
      ]),
      const SizedBox(height: 16),
      const Divider(height: 1),
      const SizedBox(height: 12),
      Row(children: [
        const Icon(Icons.location_on, size: 16, color: AppTheme.textMuted),
        const SizedBox(width: 6),
        Text(p.district.isNotEmpty ? p.district : 'N/A', style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
        const Spacer(),
        const Icon(Icons.calendar_today, size: 16, color: AppTheme.textMuted),
        const SizedBox(width: 6),
        Text(DateFormat('dd MMM yyyy').format(p.createdAt), style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
      ]),
    ])),
  );

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppTheme.mintFaint,
    appBar: AppBar(
      title: const Text('Season Planner'),
      bottom: TabBar(controller: _tabs, labelColor: Colors.white, unselectedLabelColor: Colors.white60,
        indicatorColor: AppTheme.leafBright,
        indicatorWeight: 3,
        tabs: const [Tab(text: 'Saved Plans'), Tab(text: 'History')]),
      actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
    ),
    body: _loading
      ? const Center(child: CircularProgressIndicator())
      : TabBarView(controller: _tabs, children: [
          _saved.isEmpty
            ? const Center(child: Padding(padding: EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text('📅', style: TextStyle(fontSize: 48)), SizedBox(height: 12),
                Text('No saved plans yet.', style: TextStyle(color: AppTheme.textMuted, fontSize: 16, fontWeight: FontWeight.w600)),
            ])))
            : RefreshIndicator(onRefresh: _load, child: ListView(padding: const EdgeInsets.all(16), children: _saved.map(_planCard).toList())),
          _history.isEmpty
            ? const Center(child: Padding(padding: EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text('📋', style: TextStyle(fontSize: 48)), SizedBox(height: 12),
                Text('No plan history.', style: TextStyle(color: AppTheme.textMuted, fontSize: 16, fontWeight: FontWeight.w600)),
            ])))
            : RefreshIndicator(onRefresh: _load, child: ListView(padding: const EdgeInsets.all(16), children: _history.map(_planCard).toList())),
        ]),
  );
}
