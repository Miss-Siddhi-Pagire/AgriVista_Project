import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../constants/theme.dart';
import '../../services/api_service.dart';

class DiseaseScreen extends StatefulWidget {
  const DiseaseScreen({super.key});
  @override
  State<DiseaseScreen> createState() => _DiseaseScreenState();
}

class _DiseaseScreenState extends State<DiseaseScreen> {
  File? _image;
  bool _loading = false;
  Map<String, dynamic>? _result;
  String? _error;
  final _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(source: source, imageQuality: 85);
    if (picked == null) return;
    setState(() { _image = File(picked.path); _result = null; _error = null; });
  }

  Future<void> _detect() async {
    if (_image == null) return;
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiService.detectDisease(_image!.path);
      setState(() => _result = res);
    } catch (e) {
      setState(() => _error = 'Detection failed: ${e.toString()}');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppTheme.mintLight,
    appBar: AppBar(title: const Text('Disease Detection')),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        const Text('Upload Leaf Image', style: TextStyle(
          fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.forest,
        )),
        const SizedBox(height: 8),
        const Text('Take a clear photo of the infected leaf to diagnose the disease instantly.', style: TextStyle(
          color: AppTheme.textMuted, fontSize: 13,
        )),
        const SizedBox(height: 24),
        
        // Upload area
        GestureDetector(
          onTap: () => showModalBottomSheet(context: context, backgroundColor: Colors.white, builder: (_) => Wrap(children: [
            ListTile(leading: const Icon(Icons.camera_alt, color: AppTheme.forest), title: const Text('Take Photo', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () { Navigator.pop(context); _pickImage(ImageSource.camera); }),
            ListTile(leading: const Icon(Icons.photo_library, color: AppTheme.forest), title: const Text('From Gallery', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () { Navigator.pop(context); _pickImage(ImageSource.gallery); }),
            const SizedBox(height: 20),
          ])),
          child: Container(
            height: 240, width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white, 
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.mint, width: 2),
              boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 10, offset: Offset(0, 4))],
            ),
            child: _image != null
              ? ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.file(_image!, fit: BoxFit.cover))
              : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppTheme.mintFaint, shape: BoxShape.circle),
                    child: const Icon(Icons.add_photo_alternate, size: 40, color: AppTheme.leaf)
                  ),
                  const SizedBox(height: 16),
                  const Text('Tap to upload image', style: TextStyle(color: AppTheme.forest, fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text('Camera or Gallery', style: TextStyle(color: AppTheme.textMuted.withOpacity(0.8), fontSize: 13)),
                ]),
          ),
        ),
        const SizedBox(height: 24),

        if (_image != null) ...[
          SizedBox(width: double.infinity, child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), foregroundColor: Colors.white),
            onPressed: _loading ? null : _detect,
            child: _loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Diagnose Plant Disease'),
          )),
          const SizedBox(height: 24),
        ],

        if (_error != null) Container(padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
          child: Text(_error!, style: const TextStyle(color: Colors.red))),

        if (_result != null) ...[
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.red.withOpacity(0.3)),
              boxShadow: const [BoxShadow(color: AppTheme.cardShadow, blurRadius: 16, offset: Offset(0, 8))],
            ),
            padding: const EdgeInsets.all(20), 
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.biotech, color: Colors.red, size: 28)),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Diagnosis Result', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.textMuted, fontSize: 11, letterSpacing: 1)),
                Text(_result!['disease'] ?? _result!['prediction'] ?? 'Result received',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.red)),
              ])),
            ]),
            if (_result!['confidence'] != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(20)),
                child: Text('Confidence: ${_result!['confidence']}%', style: const TextStyle(color: AppTheme.forest, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ],
            if (_result!['recommendations'] != null || _result!['suggestion'] != null || _result!['treatment'] != null) ...[
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 16),
              const Text('Suggested Treatment', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.forest, fontSize: 14)),
              const SizedBox(height: 8),
              Text(_result!['recommendations'] ?? _result!['suggestion'] ?? _result!['treatment'] ?? '', style: const TextStyle(color: AppTheme.textMuted, height: 1.5)),
            ],
          ]))
        ],
        const SizedBox(height: 40),
      ]),
    ),
  );
}
