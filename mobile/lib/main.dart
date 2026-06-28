import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'constants/theme.dart';
import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authProvider = AuthProvider();
  await authProvider.tryAutoLogin();
  runApp(
    ChangeNotifierProvider.value(
      value: authProvider,
      child: const AgriVistaApp(),
    ),
  );
}

class AgriVistaApp extends StatelessWidget {
  const AgriVistaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgriVista',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      home: const AppRoot(),
    );
  }
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});
  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  bool _showLogin = true;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoggedIn) return const MainScreen();

    return _showLogin
      ? LoginScreen(onGoSignup: () => setState(() => _showLogin = false))
      : SignupScreen(onGoLogin: () => setState(() => _showLogin = true));
  }
}
