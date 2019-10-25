# REDCap EM Configuration Design Study

A REDCap External Module to demo a new EM config system

## How to use

Currently, this is only a static HTML page. So to see the demo, first clone this repo on your local machine.

Then, head over to the `html` folder, and open `config-dialog.html` in a browser. That's it.

## Features

- For project settings, the project id and name will be shown. For system settings, this will say '_Global System Settings_'.
- Settings can be organized in tabs.
  - The _System_ tab is always there and hosts the settings provided directly by the EM Framework.
  - If no tabs are defined in `config.json`, a tab named _Module_ will be added automatically.
- Descriptions and help texts can be defined in `config.json` and will be shown with appropriate styling or as a popup.
- The currently shown settings can be exported or imported (from JSON files).
- Repeatable settings are handled either embedded/nested, or in a edited on separate screens. The _General_ tab demonstrates the first way, the _Others_ tab the other. The latter is probably the better way, as less scrolling will be needed and no indentations will be needed. 