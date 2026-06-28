import 'package:flutter/material.dart';
import '../../constants/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/prediction_result_card.dart';

class FertilizerScreen extends StatefulWidget {
  const FertilizerScreen({super.key});
  @override
  State<FertilizerScreen> createState() => _FertilizerScreenState();
}

class _FertilizerScreenState extends State<FertilizerScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _result, _error;

  final _nCtrl = TextEditingController(text: '80');
  final _pCtrl = TextEditingController(text: '40');
  final _kCtrl = TextEditingController(text: '40');
  final _cropCtrl = TextEditingController(text: 'Rice');
  final _soilCtrl = TextEditingController(text: 'Loamy');

  @override
  void dispose() {
    _nCtrl.dispose(); _pCtrl.dispose(); _kCtrl.dispose();
    _cropCtrl.dispose(); _soilCtrl.dispose();
    super.dispose();
  }

  Future<void> _predict() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; _result = null; });
    try {
      final res = await ApiService.predictFertilizer({
        'Nitrogen': double.tryParse(_nCtrl.text) ?? 0,
        'Phosphorus': double.tryParse(_pCtrl.text) ?? 0,
        'Potassium': double.tryParse(_kCtrl.text) ?? 0,
        'soil_type': _soilCtrl.text,
        'crop_type': _cropCtrl.text,
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
    appBar: AppBar(title: const Text('Fertilizer Suggestion')),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(key: _formKey, child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Crop & Soil Information', style: TextStyle(
            fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.forest,
          )),
          const SizedBox(height: 8),
          const Text('Provide N-P-K ratios and crop details to get the right blend.', style: TextStyle(
            color: AppTheme.textMuted, fontSize: 13,
          )),
          const SizedBox(height: 24),
          
          if (_result != null) ...[
            PredictionResultCard(
              title: 'Recommended Fertilizer', 
              result: _result!, 
              emoji: '🧪', 
              color: const Color(0xFF9333EA)
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
              children: [
                _buildField('CROP NAME', _cropCtrl),
                const SizedBox(height: 16),
                _buildField('SOIL TYPE', _soilCtrl),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: _buildNumField('NITROGEN (N)', _nCtrl)),
                  const SizedBox(width: 10),
                  Expanded(child: _buildNumField('PHOS (P)', _pCtrl)),
                  const SizedBox(width: 10),
                  Expanded(child: _buildNumField('POTASH (K)', _kCtrl)),
                ]),
              ],
            )
          ),
          const SizedBox(height: 32),
          
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF9333EA), foregroundColor: Colors.white),
            onPressed: _loading ? null : _predict,
            child: _loading 
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Get Fertilizer Suggestion'),
          ),
          const SizedBox(height: 40),
        ],
      )),
    ),
  );

  Widget _buildField(String label, TextEditingController ctrl) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.5)),
      const SizedBox(height: 6),
      TextFormField(
        controller: ctrl,
        decoration: const InputDecoration(hintText: 'Enter value'),
        validator: (v) => v == null || v.isEmpty ? 'Required' : null
      ),
    ],
  );

  Widget _buildNumField(String label, TextEditingController ctrl) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.5), overflow: TextOverflow.ellipsis),
      const SizedBox(height: 6),
      TextFormField(
        controller: ctrl, keyboardType: TextInputType.number,
        decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 12)),
        validator: (v) => v == null || v.isEmpty ? '?' : null
      ),
    ],
  );
}
