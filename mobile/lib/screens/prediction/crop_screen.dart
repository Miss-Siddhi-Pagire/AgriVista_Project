import 'package:flutter/material.dart';
import '../../constants/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/prediction_result_card.dart';

class CropScreen extends StatefulWidget {
  const CropScreen({super.key});
  @override
  State<CropScreen> createState() => _CropScreenState();
}

class _CropScreenState extends State<CropScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  Map<String, dynamic>? _result;
  String? _error;

  final _fields = {
    'Nitrogen': 90.0, 'Phosphorus': 42.0, 'Potassium': 43.0,
    'Temperature': 25.0, 'Humidity': 70.0, 'Rainfall': 200.0, 'pH': 6.5,
  };
  final Map<String, TextEditingController> _controllers = {};

  @override
  void initState() {
    super.initState();
    _fields.forEach((k, v) => _controllers[k] = TextEditingController(text: v.toString()));
  }

  @override
  void dispose() {
    for (final c in _controllers.values) c.dispose();
    super.dispose();
  }

  Future<void> _predict() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; _result = null; });
    try {
      final inputs = {for (final e in _controllers.entries) e.key: double.tryParse(e.value.text) ?? 0.0};
      final res = await ApiService.predictCrop(inputs);
      if (mounted) setState(() { _result = res; });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Crop Prediction')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Soil & Weather Data', style: TextStyle(
                fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.forest,
              )),
              const SizedBox(height: 8),
              const Text('Enter local environment metrics to predict the best crop.', style: TextStyle(
                color: AppTheme.textMuted, fontSize: 13,
              )),
              const SizedBox(height: 24),
              
              if (_result != null) ...[
                PredictionResultCard(
                  title: 'Recommended Crop',
                  result: _result!['prediction']?.toString() ?? 'N/A',
                  confidence: _result!['confidence']?.toString(),
                  emoji: '🌱',
                  color: AppTheme.leaf,
                ),
                const SizedBox(height: 24),
              ],
              if (_error != null) ...[
                _ErrorCard(_error!),
                const SizedBox(height: 16),
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
                  children: _controllers.entries.map((e) => _NumField(
                    label: e.key, controller: e.value,
                    unit: e.key == 'Temperature' ? '°C' : e.key == 'Humidity' || e.key == 'pH' ? '' : e.key == 'Rainfall' ? 'mm' : '',
                  )).toList(),
                ),
              ),
              const SizedBox(height: 32),
              
              ElevatedButton(
                onPressed: _loading ? null : _predict,
                child: _loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.leafPale))
                  : const Text('Predict Best Crop'),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Reusable form helpers ─────────────────────────────────
class _NumField extends StatelessWidget {
  final String label, unit;
  final TextEditingController controller;
  const _NumField({required this.label, required this.controller, this.unit = ''});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(
          fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.5,
        )),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            hintText: 'Enter value',
            suffixText: unit,
            suffixStyle: const TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.bold),
          ),
          validator: (v) => v == null || v.isEmpty ? 'Required' : null,
        ),
      ],
    ),
  );
}

class _ErrorCard extends StatelessWidget {
  final String error;
  const _ErrorCard(this.error);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
    child: Text(error, style: const TextStyle(color: Colors.red, fontSize: 13)),
  );
}
