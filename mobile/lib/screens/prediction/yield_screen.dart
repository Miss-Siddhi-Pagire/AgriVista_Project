import 'package:flutter/material.dart';
import '../../constants/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/prediction_result_card.dart';

class YieldScreen extends StatefulWidget {
  const YieldScreen({super.key});
  @override
  State<YieldScreen> createState() => _YieldScreenState();
}

class _YieldScreenState extends State<YieldScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _result, _error;

  final Map<String, TextEditingController> _ctrl = {
    'SoilMoisture': TextEditingController(text: '45'),
    'pH': TextEditingController(text: '6.5'),
    'Temperature': TextEditingController(text: '25'),
    'Rainfall': TextEditingController(text: '200'),
    'Humidity': TextEditingController(text: '70'),
    'TotalDays': TextEditingController(text: '120'),
  };
  final Map<String, String> _units = {
    'SoilMoisture': '%', 'pH': '', 'Temperature': '°C',
    'Rainfall': 'mm', 'Humidity': '%', 'TotalDays': 'days',
  };

  @override
  void dispose() {
    for (final c in _ctrl.values) c.dispose();
    super.dispose();
  }

  Future<void> _predict() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; _result = null; });
    try {
      final res = await ApiService.predictYield({
        'soil_moisture': double.parse(_ctrl['SoilMoisture']!.text),
        'pH': double.parse(_ctrl['pH']!.text),
        'temperature': double.parse(_ctrl['Temperature']!.text),
        'rainfall': double.parse(_ctrl['Rainfall']!.text),
        'humidity': double.parse(_ctrl['Humidity']!.text),
        'total_days': double.parse(_ctrl['TotalDays']!.text),
      });
      if (mounted) setState(() => _result = res['prediction']?.toString() ?? 'N/A');
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Yield Prediction')),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Soil & Field Conditions', style: TextStyle(
              fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.forest,
            )),
            const SizedBox(height: 8),
            const Text('Provide field metrics to estimate the expected harvest yield.', style: TextStyle(
              color: AppTheme.textMuted, fontSize: 13,
            )),
            const SizedBox(height: 24),
            
            if (_result != null) ...[
              PredictionResultCard(
                title: 'Estimated Yield', 
                result: _result!, 
                emoji: '🌾', 
                color: const Color(0xFF2563EB)
              ),
              const SizedBox(height: 24),
            ],
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12), 
                decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)), 
                child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13))
              ), 
              const SizedBox(height: 16)
            ],
            
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.cardBorder),
                boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 16, offset: Offset(0, 4))],
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: _ctrl.entries.map((e) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(e.key.toUpperCase(), style: const TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.5,
                      )),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: e.value, 
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          hintText: 'Enter value', 
                          suffixText: _units[e.key] ?? '',
                          suffixStyle: const TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.bold),
                        ),
                        validator: (v) => v == null || v.isEmpty ? 'Required' : null
                      ),
                    ],
                  ),
                )).toList(),
              )
            ),
            const SizedBox(height: 32),
            
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
              onPressed: _loading ? null : _predict,
              child: _loading 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Predict Yield'),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    ),
  );
}
