# Enhanced External Module Configuration

A REDcap External Module providing an enhanced user interface for module settings.

## Installation

Install as an External Module:

1. Clone this repo into your `modules` folder.
1. Add a version to the folder's name, so it reads, e.g., `redcap_em_config_study_v0.0.1`.
1. Enable the EM in _Command Center &gt; External Modules_.

## Effect

This module will add two links to the 'Control Center &gt; External Modules' section:

1. _Configuration Design Study:_ This will open a static HTML page with the original design study.
1. _Enhanced Module Config:_ The `config.json` of this module will be displayed in the **Enhanced Configuration Dialog**. This can be set to show automatically in the module settings.

Furthermore, in Projects that have this module enabled, the _Enhanced Module Config_ link will be shown in the "External Modules" section of the main menu when on the "External Modules - Project Module Manager" page.

## Features

Some are already implemented, some are not.

- Settings can be organized in tabs.
  - The _System_ tab is always there and hosts the settings provided directly by the EM Framework.
  - If no tabs are defined in `config.json`, a tab named _Module_ will be added automatically.
- Descriptions and help texts can be defined in `config.json` and will be shown with appropriate styling or as a modals in case of help.
- The currently shown settings can be exported or imported (from JSON files).
- A settings history is provides (needs a new table in the backend). Accessible via the _System_ tab. Old settings can be restored (i.e. copied to the dialog, still need to be saved to apply) or exported. List is retrieved from server on demand, incompatible settings due to version differences will be noted via warnings (best effort restore). This can be determined via a diff of current settings keys and levels with those in the stored settings. The history table stores JSON as would be exported.
- Checkboxes are shown as toggles (switches).
- Repeatable settings are handled either embedded/nested, or in a edited on separate screens.

## Issues

Please post ideas / issues on GitHub: [https://github.com/grezniczek/redcap_em_config_study](https://github.com/grezniczek/redcap_em_config_study)

## Changelog

Version | Description
------- | ---------------------
v0.0.1  | Development state - not really release-ready.
