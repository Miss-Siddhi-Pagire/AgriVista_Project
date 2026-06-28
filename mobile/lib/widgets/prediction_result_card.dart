import 'package:flutter/material.dart';
import '../../constants/theme.dart';

class PredictionResultCard extends StatelessWidget {
  final String title, result, emoji;
  final String? confidence;
  final Color color;

  const PredictionResultCard({
    super.key,
    required this.title, required this.result, required this.emoji, required this.color,
    this.confidence,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: LinearGradient(colors: [color.withOpacity(0.12), color.withOpacity(0.04)], begin: Alignment.topLeft, end: Alignment.bottomRight),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: color.withOpacity(0.3)),
    ),
    child: Row(
      children: [
        Container(
          width: 60, height: 60,
          decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
          child: Center(child: Text(emoji, style: const TextStyle(fontSize: 28))),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600, letterSpacing: 1)),
              const SizedBox(height: 4),
              Text(result, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.forest)),
              if (confidence != null)
                Text('Confidence: $confidence%', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            ],
          ),
        ),
        Icon(Icons.check_circle, color: color, size: 28),
      ],
    ),
  );
}
