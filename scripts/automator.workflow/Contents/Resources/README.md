# VFS Token Creation Workflow - Localization

This directory contains localization files for the VFS Token Creation Automator workflow.

## Structure

- `en.lproj/` - English translations (base language)
- `fr.lproj/` - French translations

## Files

Each language directory contains:
- `Localizable.strings` - Localized strings for the AppleScript workflow

## Supported Languages

### English (en.lproj)
- Base language with original English strings
- Serves as reference for other translations

### French (fr.lproj)
- Complete French translation of all user-facing strings
- Includes error messages and success notifications

## Adding New Languages

To add support for a new language:

1. Create a new directory: `[language_code].lproj/`
2. Copy `en.lproj/Localizable.strings` to the new directory
3. Translate all strings in the new file
4. Test the workflow with the new language

## String Format

The `.strings` files use the standard macOS localization format:
```
"Original String" = "Translated String";
```

## Usage

The workflow automatically detects the system language and uses the appropriate translation file. If no translation is available for the current language, it falls back to English.
