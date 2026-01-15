# EXIF QuickView Script

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

EXIF QuickView Script is a userscript that displays EXIF metadata information below images when you hover your mouse over them. This tool is especially useful for photographers and anyone interested in viewing camera settings and other metadata embedded in images directly in their browser.

## Features

- Shows EXIF data including camera model, aperture, shutter speed, ISO, focal length, and more
- Displays GPS location data with clickable Google Maps links
- Fully customizable display options:
  - Choose which EXIF fields to display
  - Toggle between compact and normal view modes
  - Position EXIF panel at top or bottom of images
  - Set minimum image dimensions to trigger EXIF display
  - Exclude specific websites from EXIF display
- Smooth user experience with no flickering when moving between image and EXIF panel
- Works on virtually all websites (with configurable exclusions)

## Installation

1. **Install a userscript manager**:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

2. **Install EXIF QuickView**:
   - Click on the [raw userscript file](https://exifqs.pages.dev/exif-quickview-script.user.js) to automatically install it in your userscript manager
   - Or, create a new script in your userscript manager and paste the entire code from the userscript file

## Usage

1. **Basic usage**:
   - Hover your mouse over any image that is larger than the minimum configured size (default: 300x300 pixels)
   - EXIF information will appear below the image
   - Move your mouse over the EXIF panel to interact with links (e.g., GPS location links)

2. **Access settings**:
   - Right-click on your userscript manager icon in the browser toolbar
   - Select "EXIF QuickView Settings" from the menu
   - Configure your preferred options and click "Save & Close"

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| Enable EXIF QuickView | Toggle the script on/off | Enabled |
| Hide images with no EXIF data | Don't show panel for images without EXIF data | Enabled |
| Compact view | Display EXIF data in a single line | Enabled |
| Show at top of image | Display EXIF panel above images instead of below | Disabled |
| Camera Make/Model | Show camera manufacturer and model | Enabled |
| Focal Length | Show lens focal length in mm | Enabled |
| Shutter Speed | Show exposure time | Enabled |
| Aperture (F-Number) | Show f-stop value | Enabled |
| ISO | Show ISO sensitivity | Enabled |
| Date & Time | Show capture timestamp | Enabled |
| GPS Location | Show geographical location data | Enabled |
| Minimum Image Size | Only show EXIF for images larger than specified dimensions | 300x300 px |
| Excluded Sites | Websites where EXIF viewer won't appear | facebook.com, twitter.com, instagram.com |

## Known Limitations

- Requires images to be loaded from the same domain or have appropriate CORS headers to access EXIF data
- GPS location lookup requires an active internet connection
- May not work on websites with strict Content Security Policies
- Some websites that heavily manipulate images dynamically might require page refresh after script installation

## Privacy Notice

This script:
- Only processes EXIF data from images you hover over
- For GPS location lookup, sends coordinates to Google Maps API
- Stores your settings locally in your browser
- Does not collect or transmit any personal data or browsing history

## Credits

- **Original Chrome Extension (removed from Chrome Web Store on 2025-02-15)**: [EXIF QuickView](https://chromewebstore.google.com/detail/exif-quickview/kjihpkahhpobojbdnknpelpgmcihnepj) by [smartendude](mailto:smartendude@gmail.com) ([Kayasit Rugtepa](mailto:kayasit.rugtepa@gmail.com))
- **Modified and converted to Userscript** by Qwen3-Max
- **EXIF.js Library**: [exif-js](https://github.com/exif-js/exif-js) by Jacob Seidelin
- **Google Maps API**: For reverse geocoding GPS coordinates to human-readable addresses

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Support

If you encounter any issues or have feature requests:
1. Check the [Issues](https://github.com/virtuecho/EXIF_QuickView_Script/issues) page
2. Create a new issue with details about the problem
3. Include browser version, userscript manager, and steps to reproduce

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request with improvements or bug fixes.

---

**Note**: This userscript is not affiliated with, endorsed by, or connected to Google LLC or any other third-party service mentioned in this documentation. All trademarks and registered trademarks are the property of their respective owners.

---

## Original Features & Capabilities:

This will extension will run when your mouse is over the image. Small overlay information will be shown on photo that contains EXIF data. This Extension also provide options to customize how it looks.

*Please note that some website strips out EXIF data so this extension will not work in that case
**This extension might not work on some website that has special way to display image

## Original Release Notes:
2.1.1
- Remove leftover debug code

2.1.0
- Add option to display taken mode
- Make the overlay on very top of other elements

2.0.6
- Sanitize input in exclude url option

2.0.5
- Fix color of GPS link is hard to see

2.0.3
- Fix min width and height not working

2.0.2
- Make compact mode a little bit more compact

2.0.1
- Fix the icon in extension manager not show
- Add contact detail to option page

2.0
- Update map API for new version of Google Maps API
- Add "Display at top of image" option
- Remove external and CDN dependencies
- Remove jQuery and use pure javascript for better performance
- Add analytics back only for setting section only for improvement purpose

1.9
- Due to any privacy concerns, no data will be collected from this extension

1.8
- Fix overlay element overrides image functionalities

1.7
- add compact mode option
- option for no overlay when no EXIF data

1.6.1
- Fix overlay is not hidden after mouse left

1.6
- Add flash mode and exposure program data

1.5.3
- Fix bug for some site that overwrite h1 style

1.5.2
- Refine Make and Model data

1.5.1
- Track few camera information for developing purpose

1.5
- Add analytic to option page
- fix bug that the overlay element is not removed when scroll to new image

1.4
- Add option page
- Add ability to exclude site
- Change text when mouseover on extension

1.3
- Add ability to turn on/off by clicking extension in toolbar

1.1
- Change to absolute position to avoid style confilct

1.0
- Initial Release
