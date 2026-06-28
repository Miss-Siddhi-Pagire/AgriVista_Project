import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import '../services/api_service.dart';

// ─────────────────────────────────────────────────────────────
//  AuthProvider — Real backend authentication
//  Uses AgriVista Node.js /login and /signup endpoints.
// ─────────────────────────────────────────────────────────────

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _token;

  UserModel? get user       => _user;
  bool get isLoading        => _isLoading;
  bool get isLoggedIn       => _user != null;
  String? get userId        => _user?.id;
  String? get token         => _token;
  String get userName       => _user?.username ?? 'Farmer';

  // ── Auto login from saved session ─────────────────────────
  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final id       = prefs.getString('userId');
    final username = prefs.getString('username') ?? '';
    final email    = prefs.getString('email') ?? '';
    final token    = prefs.getString('token');

    if (id != null && id.isNotEmpty) {
      _user  = UserModel(id: id, username: username, email: email);
      _token = token;
      notifyListeners();
    }
  }

  // ── Login ──────────────────────────────────────────────────
  /// Returns null on success, error message string on failure.
  Future<String?> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await ApiService.login(email, password);

      if (data['success'] == true) {
        final user = data['user'];
        _user = UserModel(
          id: user['_id'] ?? user['id'] ?? '',
          username: user['name'] ?? user['username'] ?? 'Farmer',
          email: user['email'] ?? email,
          profilePhoto: user['profilePhoto'],
        );
        _token = data['token'];

        // Persist session
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('userId',   _user!.id);
        await prefs.setString('username', _user!.username);
        await prefs.setString('email',    _user!.email);
        if (_token != null) await prefs.setString('token', _token!);

        _isLoading = false;
        notifyListeners();
        return null; // ← success
      } else {
        _isLoading = false;
        notifyListeners();
        return data['message'] ?? 'Login failed';
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  // ── Signup ────────────────────────────────────────────────
  /// Returns null on success, error message string on failure.
  Future<String?> signup(String username, String email, String password,
      {String state = '', String farmSize = ''}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await ApiService.signup(
        name: username,
        email: email,
        password: password,
        state: state,
        farmSize: farmSize,
      );

      _isLoading = false;
      notifyListeners();

      if (data['success'] == true) {
        return null; // ← success
      }
      return data['message'] ?? 'Signup failed';
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.toString().replaceFirst('Exception: ', '');
    }
  }

  // ── Logout ────────────────────────────────────────────────
  Future<void> logout() async {
    _user  = null;
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }
}
