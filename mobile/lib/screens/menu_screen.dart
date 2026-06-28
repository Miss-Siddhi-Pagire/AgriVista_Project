import 'package:flutter/material.dart';
import '../../constants/theme.dart';
import 'prediction/history_screen.dart';
import 'forum/forum_screen.dart';
import 'profile/profile_screen.dart';
import '../../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.mintFaint,
      appBar: AppBar(
        title: const Text('More'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.red),
            onPressed: () async {
              final confirm = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
                title: const Text('Logout'), content: const Text('Are you sure you want to logout?'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                  TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('Logout', style: TextStyle(color: Colors.red))),
                ],
              ));
              if (confirm == true && context.mounted) context.read<AuthProvider>().logout();
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _MenuTile(
              title: 'Data Insights & Profile',
              icon: Icons.bar_chart,
              color: AppTheme.forest,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())),
            ),
            _MenuTile(
              title: 'Prediction History',
              icon: Icons.history,
              color: const Color(0xFF854D0E),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen())),
            ),
            _MenuTile(
              title: 'Farmer Forum',
              icon: Icons.forum,
              color: const Color(0xFF0891B2),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ForumScreen())),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _MenuTile({required this.title, required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.cardBorder),
        boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.forest)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.textLight),
        onTap: onTap,
      ),
    );
  }
}
