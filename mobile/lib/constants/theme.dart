import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Updated to match the softer olive/pine green from the first mockup
  static const Color forest = Color(0xFF386641);
  static const Color forestMid = Color(0xFF4A7C50);
  static const Color forestLight = Color(0xFF5E9665);
  static const Color leaf = Color(0xFF16A34A);
  static const Color leafBright = Color(0xFF22C55E);
  static const Color leafPale = Color(0xFF4ADE80);
  static const Color mint = Color(0xFFDCFCE7);
  static const Color mintLight = Color(0xFFF0FDF4);
  static const Color mintFaint = Color(0xFFF7FEF9);
  
  static const Color textMain = Color(0xFF052E16);
  static const Color textMuted = Color(0xFF4B7C5E);
  static const Color textLight = Color(0xFF6B9E80);

  static const Color cardBorder = Color(0x384ADE80); // rgba(74,222,128,0.22)
  static const Color cardShadow = Color(0x1F22C55E); // rgba(34,197,94,0.12)

  // Web text styles
  static TextStyle get titleStyle => GoogleFonts.playfairDisplay(
    fontSize: 32, fontWeight: FontWeight.bold, color: forest, letterSpacing: -0.3,
  );
  
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: leaf,
      primary: leaf,
      secondary: forest,
      surface: mintFaint,
      background: mintLight,
    ),
    scaffoldBackgroundColor: mintLight,
    textTheme: GoogleFonts.outfitTextTheme().apply(
      bodyColor: textMain,
      displayColor: forest,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: forest,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: GoogleFonts.playfairDisplay(
        fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: forest,
        foregroundColor: leafPale,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15),
        elevation: 2,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: forest,
        side: const BorderSide(color: Color(0x804ADE80), width: 2), // rgba(74,222,128,.5)
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9),
        borderSide: const BorderSide(color: Color(0x4D4ADE80)), // rgba(74,222,128,.3)
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9),
        borderSide: const BorderSide(color: Color(0x4D4ADE80)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9),
        borderSide: const BorderSide(color: leaf, width: 2),
      ),
      labelStyle: const TextStyle(color: textMuted, fontWeight: FontWeight.w700, fontSize: 12),
    ),
    cardTheme: const CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
        side: BorderSide(color: cardBorder, width: 1),
      ),
    ),
  );
}
