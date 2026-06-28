import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../constants/theme.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onGoSignup;
  const LoginScreen({super.key, required this.onGoSignup});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  String? _error;

  Future<void> _login() async {
    setState(() => _error = null);
    final auth = context.read<AuthProvider>();
    final err = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
    if (err != null && mounted) setState(() => _error = err);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.forest, Color(0xFF0F4D27)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            color: AppTheme.leaf,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.eco, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Text('AgriVista', style: GoogleFonts.playfairDisplay(
                          fontSize: 28, fontWeight: FontWeight.w900,
                          color: Colors.white, fontStyle: FontStyle.italic,
                        )),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Text('Welcome\nBack', style: GoogleFonts.playfairDisplay(
                      fontSize: 42, fontWeight: FontWeight.bold, color: Colors.white, height: 1.1,
                    )),
                    const SizedBox(height: 12),
                    Text('Login to access your smart farming dashboard and predictive models.', style: TextStyle(
                      color: Colors.white.withOpacity(0.6), fontSize: 15, fontWeight: FontWeight.w300,
                    )),
                  ],
                ),
              ),
            ),
          ),
          SliverFillRemaining(
            hasScrollBody: false,
            child: Container(
              color: AppTheme.mintFaint,
              padding: const EdgeInsets.all(32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Login to your account', style: GoogleFonts.playfairDisplay(
                    fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.forest,
                  )),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Text("Don't have an account? ", style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                      GestureDetector(
                        onTap: widget.onGoSignup,
                        child: const Text('Sign Up', style: TextStyle(color: AppTheme.leaf, fontWeight: FontWeight.w700, fontSize: 13)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                    ),
                    const SizedBox(height: 16),
                  ],

                  const Text('EMAIL ADDRESS', style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.5,
                  )),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(hintText: 'john@example.com'),
                  ),
                  const SizedBox(height: 20),
                  
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('PASSWORD', style: TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.5,
                      )),
                      GestureDetector(
                        onTap: () {},
                        child: const Text('Forgot Password?', style: TextStyle(color: AppTheme.leaf, fontWeight: FontWeight.w600, fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _passCtrl,
                    obscureText: _obscure,
                    decoration: InputDecoration(
                      hintText: '••••••••',
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => _obscure = !_obscure),
                        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: AppTheme.textLight),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  ElevatedButton(
                    onPressed: auth.isLoading ? null : _login,
                    child: auth.isLoading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.leafPale))
                        : const Text('Login to Dashboard'),
                  ),
                  const SizedBox(height: 24),
                  
                  Row(
                    children: [
                      Expanded(child: Container(height: 1, color: AppTheme.cardBorder)),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Text('OR CONTINUE WITH', style: TextStyle(fontSize: 11, color: AppTheme.textLight)),
                      ),
                      Expanded(child: Container(height: 1, color: AppTheme.cardBorder)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.g_mobiledata, size: 24),
                          label: const Text('Google'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
