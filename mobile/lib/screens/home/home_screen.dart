import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../constants/theme.dart';
import '../prediction/crop_screen.dart';
import '../prediction/yield_screen.dart';
import '../prediction/fertilizer_screen.dart';
import '../prediction/history_screen.dart';
import '../forum/forum_screen.dart';
import '../planner/planner_screen.dart';
import '../disease/disease_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    final modules = [
      _Module(Icons.eco, 'Crop Prediction', 'Recommend best crop', const CropScreen()),
      _Module(Icons.grass, 'Yield Prediction', 'Estimate harvest', const YieldScreen()),
      _Module(Icons.science, 'Fertilizer', 'Optimize nutrients', const FertilizerScreen()),
      _Module(Icons.calendar_month, 'Season Planner', 'Plan your season', const PlannerScreen()),
      _Module(Icons.coronavirus, 'Disease Detection', 'Scan leaf illness', const DiseaseScreen()),
      _Module(Icons.forum, 'Farmer Forum', 'Community chat', const ForumScreen()),
      _Module(Icons.bar_chart, 'Data Insights', 'Profile & activity', const ProfileScreen()),
      _Module(Icons.history, 'History', 'Past prediction records', const HistoryScreen()),
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Hero Card
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.forest,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.forest.withOpacity(0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        )
                      ],
                    ),
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), shape: BoxShape.circle),
                              child: const Icon(Icons.location_on, color: AppTheme.mintLight, size: 20),
                            ),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), shape: BoxShape.circle),
                              child: const Icon(Icons.notifications, color: AppTheme.mintLight, size: 20),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        const Text('Good morning 🌾', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(auth.userName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 32, color: Colors.white)),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: const [
                            Text('Today · Pimpri, MH', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                            Text('26°C ☀️', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Section Title
                  const Text('WHAT TO DO TODAY?', style: TextStyle(
                    color: AppTheme.textMuted, fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.2
                  )),

                  const SizedBox(height: 16),

                  // Dark Grid
                  GridView.builder(
                    padding: EdgeInsets.zero,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.95, // Made cards less tall
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: modules.length,
                    itemBuilder: (ctx, i) {
                      final m = modules[i];
                      return GestureDetector(
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => m.screen)),
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppTheme.forest,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(color: AppTheme.forest.withOpacity(0.15), blurRadius: 12, offset: const Offset(0, 6)),
                            ],
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Icon(m.icon, color: Colors.white, size: 32),
                              ),
                              const SizedBox(height: 12),
                              Text(m.title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Colors.white)),
                              const SizedBox(height: 4),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                child: Text(m.subtitle, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: AppTheme.mintLight, fontWeight: FontWeight.w600)),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Module {
  final IconData icon;
  final String title, subtitle;
  final Widget screen;
  const _Module(this.icon, this.title, this.subtitle, this.screen);
}

