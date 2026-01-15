// ==UserScript==
// @name         EXIF QuickView Script
// @namespace    https://github.com/virtuecho
// @version      3.0
// @description  Shows EXIF information on the image when the mouse is over!
// @author       smartendude and virtuecho
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      maps.googleapis.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.min.js
// @icon         https://lh3.googleusercontent.com/-IbI5E_VpknhituEzp5fQbbPIMJktoqDQndR-Kt1jAK4yboTLLB9X22s6s0EquviFR9BXdxNvZbe7_D49ZG8F39Yfg
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Default configuration options
    const defaultOptions = {
        enabled: true,
        hideNoExif: true,
        compact: true,
        top: false, // Default to show at bottom of image
        make: true,
        model: true,
        focalLength: true,
        shutterSpeed: true,
        aperture: true,
        iso: true,
        datetime: true,
        gps: true,
        minWidth: 300,
        minHeight: 300,
        excludeSites: ['facebook.com', 'twitter.com', 'instagram.com']
    };

    // Load user configuration
    let options = loadOptions();
    let activeOverlay = null;
    let activeImage = null;
    let hideTimeout = null;
    
    // Initialize only if enabled and not on excluded sites
    if (options.enabled && !isExcludedSite()) {
        initStyles();
        initExifViewer();
    }
    
    // Register settings menu command
    GM_registerMenuCommand("EXIF QuickView Settings", openSettings);

    // ================ Core functionality implementation ================

    function loadOptions() {
        const saved = GM_getValue('exifOptions');
        return saved ? JSON.parse(saved) : defaultOptions;
    }

    function saveOptions(opts) {
        GM_setValue('exifOptions', JSON.stringify(opts));
    }

    function isExcludedSite() {
        const url = window.location.href;
        return options.excludeSites.some(site => url.includes(site));
    }

    function initStyles() {
        GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600&display=swap');
        
        .exif-overlay-wrapper {
            position: absolute;
            z-index: 2147483647;
            color: white;
            pointer-events: auto; /* Key change: allow interaction with overlay */
        }
        
        /* Hide default cursor change on hover */
        .exif-overlay-wrapper:hover {
            cursor: default;
        }
        
        .exif-overlay-container {
            position: relative;
            display: inline-block;
        }
        
        .exif-overlay-wrapper .exif-content-container {
            pointer-events: auto;
            font-family: "Open Sans", sans-serif;
            flex-wrap: wrap;
            position: absolute;
            width: 100%;
            padding: 0.3rem 0.5rem;
            display: flex;
            box-sizing: border-box;
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 4px;
            transition: opacity 0.3s ease;
            max-width: 90vw;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-top {
            top: 0;
            border-radius: 0 0 4px 4px;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-bottom {
            bottom: 0;
            border-radius: 4px 4px 0 0;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-no-info {
            max-width: 100%;
            width: auto;
        }
        
        .exif-overlay-wrapper .exif-content-container a {
            color: #ffeb3b;
            text-decoration: none;
        }
        
        .exif-overlay-wrapper .exif-content-container a:hover {
            text-decoration: underline;
        }
        
        .exif-overlay-wrapper .exif-content-container .exif-mode-text {
            padding: 0 6px;
            color: #ffffff;
            font-weight: 800;
            border-radius: 3px;
            font-size: 10px;
            box-shadow: inset 0px 0px 0px 1.75px #fff;
            margin: 0 0.1rem;
            display: flex;
            height: 100%;
            align-items: center;
        }
        
        .exif-overlay-wrapper .exif-content-container .exif-mode-text .exif-icon {
            width: 12px;
            height: 12px;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-normal-view {
            flex-direction: column;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-normal-view .exif-title {
            font-size: 1.5rem;
            font-weight: 600;
            line-height: 2rem;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-normal-view .exif-body {
            display: flex;
            font-size: 0.75rem;
            flex-wrap: wrap;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-normal-view .exif-body .exif-item {
            margin-right: 0.25rem;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-compact-view {
            flex-direction: row;
            align-items: center;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-compact-view .exif-title {
            font-size: 0.75rem;
            font-weight: 600;
            border-right: 1px solid white;
            margin-right: 0.25rem;
            padding-right: 0.25rem;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-compact-view .exif-body {
            display: flex;
            font-size: 0.75rem;
            flex-wrap: wrap;
        }
        
        .exif-overlay-wrapper .exif-content-container.exif-compact-view .exif-body .exif-item {
            margin-right: 0.25rem;
        }
        
        .exif-disabled-warning {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 2147483646;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-family: "Open Sans", sans-serif;
            font-size: 14px;
            display: none;
        }
        `);
        
        // Add disable warning
        let warning = document.getElementById('exif-disabled-warning');
        if (!warning) {
            warning = document.createElement('div');
            warning.id = 'exif-disabled-warning';
            warning.className = 'exif-disabled-warning';
            warning.innerHTML = 'EXIF QuickView is disabled. Right-click the Tampermonkey icon to enable it.';
            document.body.appendChild(warning);
        }
        
        if (!options.enabled) {
            warning.style.display = 'block';
            setTimeout(() => {
                warning.style.opacity = '0.7';
            }, 3000);
        }
    }

    function initExifViewer() {
        // Add event listeners for image hover
        document.body.addEventListener("mouseover", handleImageMouseOver, false);
        document.body.addEventListener("mouseout", handleImageMouseOut, false);
        
        // Add event listeners for overlay interaction
        document.body.addEventListener("mouseover", function(evt) {
            if (evt.target.closest('.exif-overlay-wrapper')) {
                clearTimeout(hideTimeout);
            }
        }, false);
        
        document.body.addEventListener("mouseout", function(evt) {
            if (evt.target.closest('.exif-overlay-wrapper') && 
                !evt.relatedTarget?.closest('.exif-overlay-wrapper') && 
                !evt.relatedTarget?.closest('img')) {
                scheduleHideOverlay();
            }
        }, false);
    }
    
    function handleImageMouseOver(evt) {
        if (evt.target.tagName === 'IMG') {
            const image = evt.target;
            
            // Check if image is larger than minimum size
            if (image.naturalWidth < options.minWidth || image.naturalHeight < options.minHeight) {
                return;
            }
            
            // Clear any scheduled hiding
            clearTimeout(hideTimeout);
            
            // If there's an active overlay for a different image, remove it first
            if (activeOverlay && activeImage !== image) {
                removeActiveOverlay();
            }
            
            // If overlay already exists for this image, don't create a new one
            if (activeOverlay && activeImage === image) {
                return;
            }
            
            activeImage = image;
            
            // Create new overlay
            EXIF.getData(image, function() {
                const meta = EXIF.getAllTags(this);
                const hasExifData = Object.keys(meta).some(key => 
                    ['Make', 'Model', 'FocalLength', 'ExposureTime', 'FNumber', 'ISOSpeedRatings', 'GPSLatitude'].includes(key)
                );
                
                if (hasExifData || !options.hideNoExif) {
                    createAndShowExifOverlay(image, meta);
                }
            });
        }
    }
    
    function handleImageMouseOut(evt) {
        if (evt.target.tagName === 'IMG') {
            // Check if mouse moved to overlay or is still in the image/overlay area
            if (!evt.relatedTarget?.closest('img') && !evt.relatedTarget?.closest('.exif-overlay-wrapper')) {
                scheduleHideOverlay();
            }
        }
    }
    
    function scheduleHideOverlay() {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(removeActiveOverlay, 300); // 300ms delay gives user time to move cursor
    }
    
    function removeActiveOverlay() {
        if (activeOverlay && document.body.contains(activeOverlay)) {
            document.body.removeChild(activeOverlay);
            activeOverlay = null;
            activeImage = null;
        }
    }
    
    function createAndShowExifOverlay(image, meta) {
        const rect = image.getBoundingClientRect();
        
        // Ensure EXIF is displayed below the image
        const viewPosition = options.top ? 'top' : 'bottom';
        const viewSize = options.compact ? 'compact-view' : 'normal-view';
        
        activeOverlay = document.createElement("div");
        activeOverlay.className = "exif-overlay-wrapper";
        activeOverlay.style.left = (rect.left + window.scrollX) + 'px';
        activeOverlay.style.width = (rect.right - rect.left) + 'px';
        
        // Calculate vertical position - display below image
        if (viewPosition === 'top') {
            activeOverlay.style.top = (rect.top + window.scrollY) + 'px';
        } else {
            // Display below the image
            activeOverlay.style.top = (rect.bottom + window.scrollY - 1) + 'px';
        }
        
        // Generate content
        let content = generateExifContent(meta, viewSize, viewPosition);
        if (!content) {
            activeOverlay = null;
            activeImage = null;
            return;
        }
        
        activeOverlay.innerHTML = content;
        
        // Ensure overlay doesn't trigger image mouseout events
        activeOverlay.addEventListener('mouseover', function(e) {
            e.stopPropagation();
        });
        
        document.body.appendChild(activeOverlay);
        
        // If location data is needed, update asynchronously
        if (meta.GPSLatitude && meta.GPSLongitude && options.gps) {
            getPlaceFromGeo(meta).then(location => {
                if (location && activeOverlay && document.body.contains(activeOverlay)) {
                    const locationEl = activeOverlay.querySelector('#exif-location');
                    if (locationEl) {
                        if (location.address) {
                            locationEl.innerHTML = `<a href="https://www.google.com/maps/place/${location.lat},${location.lng}" target="_blank">📍 ${location.address}</a>`;
                        } else {
                            locationEl.innerHTML = `<a href="https://www.google.com/maps/place/${location.lat},${location.lng}" target="_blank">📍 Location</a>`;
                        }
                    }
                }
            });
        }
        
        return activeOverlay;
    }

    function generateExifContent(meta, viewSize, viewPosition) {
        const hasData = meta.Make || meta.Model || meta.FocalLength || meta.ExposureTime || 
                        meta.FNumber || meta.ISOSpeedRatings || meta.DateTimeOriginal;
        
        if (!hasData && options.hideNoExif) {
            return '';
        }
        
        const noInfoClass = !hasData ? ' exif-no-info' : '';
        return `
        <div class="exif-content-container exif-${viewSize} exif-${viewPosition}${noInfoClass}">
            ${hasData ? generateExifDataContent(meta) : generateNoDataContent()}
        </div>`;
    }

    function generateExifDataContent(meta) {
        return `
        <div class="exif-title"> 
            ${options.make && meta.Make ? `<span class="exif-item">${meta.Make}</span>` : ''}
            ${options.model && meta.Model ? `<span class="exif-item">${fixModelValue(meta.Model)}</span>` : ''}
        </div>
        <div class="exif-body">
            📷
            ${options.focalLength && meta.FocalLength ? `<span class="exif-item">${convertNumberToFraction(meta.FocalLength)}mm</span>` : ''}
            ${options.shutterSpeed && meta.ExposureTime ? `<span class="exif-item">${convertNumberToFraction(meta.ExposureTime)}s</span>` : ''}
            ${options.aperture && meta.FNumber ? `<span class="exif-item">f/${convertNumberToDecimal(meta.FNumber)}</span>` : ''}
            ${options.iso && meta.ISOSpeedRatings ? `<span class="exif-item">ISO${meta.ISOSpeedRatings}</span>` : ''}
            ${options.datetime && (meta.DateTimeOriginal || meta.DateTime) ? 
                `<span class="exif-item">🕓 ${meta.DateTimeOriginal || meta.DateTime}</span>` : ''}
            ${options.gps && meta.GPSLatitude ? `<span class="exif-item" id="exif-location">📍 Loading...</span>` : ''}
        </div>`;
    }

    function generateNoDataContent() {
        return `
        <div class="exif-body">
            <span class="exif-item">No EXIF data</span>
        </div>`;
    }

    function reduce(numerator, denominator) {
        const gcd = function gcd(a, b) {
            return b ? gcd(b, a % b) : a;
        };
        const divisor = gcd(numerator, denominator);
        return [numerator / divisor, denominator / divisor];
    }

    function convertNumberToFraction(number) {
        if (!number || !number.numerator || !number.denominator) return '';
        if (number.denominator === 1) return number.numerator;
        const reduced = reduce(number.numerator, number.denominator);
        if (reduced[0] > 1) {
            return reduced[0] / reduced[1];
        }
        return `${reduced[0]}/${reduced[1]}`;
    }

    function convertNumberToDecimal(number) {
        if (!number || !number.numerator || !number.denominator) return '';
        return number.numerator / number.denominator;
    }

    function fixModelValue(value) {
        if (!value) return '';
        return value.replace(/canon/gi, '').replace(/nikon/gi, '');
    }

    async function getPlaceFromGeo(meta) {
        if (!options.gps || !meta.GPSLatitude || !meta.GPSLongitude) return null;
        
        try {
            const decimalLat = meta.GPSLatitude[0] + (meta.GPSLatitude[1] / 60) + (meta.GPSLatitude[2] / (60 * 60));
            const decimalLng = meta.GPSLongitude[0] + (meta.GPSLongitude[1] / 60) + (meta.GPSLongitude[2] / (60 * 60));
            const lat = (meta.GPSLatitudeRef === 'S') ? -parseFloat(decimalLat) : parseFloat(decimalLat);
            const lng = (meta.GPSLongitudeRef === 'W') ? -parseFloat(decimalLng) : parseFloat(decimalLng);
            
            // Use GM_xmlhttpRequest for cross-domain requests
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBkuDd0C_cCuO0rxquNvsQarUavIqnw31w`,
                    onload: function(response) {
                        try {
                            const jsonResponse = JSON.parse(response.responseText);
                            let addressComponent = [];
                            jsonResponse.results.forEach(address => {
                                const political = address.address_components.filter(c => 
                                    c.types.includes("political")
                                ).map(c => c.long_name);
                                if (political.length > addressComponent.length) {
                                    addressComponent = political;
                                }
                            });
                            if (addressComponent.length > 0) {
                                resolve({
                                    lat, lng,
                                    address: addressComponent.join(', ')
                                });
                            } else {
                                resolve({ lat, lng });
                            }
                        } catch (e) {
                            resolve({ lat, lng });
                        }
                    },
                    onerror: function() {
                        resolve({ lat, lng });
                    }
                });
            });
        } catch (e) {
            return null;
        }
    }

    // ================ Settings functionality ================

    function openSettings() {
        // Create settings page element
        const settingsPage = document.createElement('div');
        settingsPage.id = 'exif-settings-page';
        settingsPage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: "Open Sans", sans-serif;
        `;
        
        settingsPage.innerHTML = `
        <div style="background: white; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 20px; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <h2 style="margin: 0; color: #333;">EXIF QuickView Settings</h2>
                <button id="close-settings" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #777;">&times;</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="enabled" ${options.enabled ? 'checked' : ''} style="margin-right: 8px;">
                    <span>Enable EXIF QuickView</span>
                </label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="hide-no-exif" ${options.hideNoExif ? 'checked' : ''} style="margin-right: 8px;">
                    <span>Hide images with no EXIF data</span>
                </label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h3 style="margin: 10px 0; color: #555;">Display Options</h3>
                <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                    <input type="checkbox" id="compact" ${options.compact ? 'checked' : ''} style="margin-right: 8px;">
                    <span>Compact view</span>
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="top" ${options.top ? 'checked' : ''} style="margin-right: 8px;">
                    <span>Show at top of image</span>
                    <span style="color: #777; margin-left: 8px;">(Default is bottom)</span>
                </label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h3 style="margin: 10px 0; color: #555;">EXIF Fields to Display</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="make" ${options.make ? 'checked' : ''} style="margin-right: 8px;">
                        <span>Camera Make</span>
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="model" ${options.model ? 'checked' : ''} style="margin-right: 8px;">
                        <span>Camera Model</span>
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="focal-length" ${options.focalLength ? 'checked' : ''} style="margin-right: 8px;">
                        <span>Focal Length</span>
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="aperture" ${options.aperture ? 'checked' : ''} style="margin-right: 8px;">
                        <span>Aperture (F-Number)</span>
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="shutter-speed" ${options.shutterSpeed ? 'checked' : ''} style="margin-right: 8px;">
                        <span>Shutter Speed</span>
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="iso" ${options.iso ? 'checked' : ''} style="margin-right: 8px;">
                        <span>ISO</span>
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="datetime" ${options.datetime ? 'checked' : ''} style="margin-right: 8px;">
                        <span>Date & Time</span>
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="gps" ${options.gps ? 'checked' : ''} style="margin-right: 8px;">
                        <span>GPS Location</span>
                    </label>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h3 style="margin: 10px 0; color: #555;">Minimum Image Size (px)</h3>
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px;">Width:</label>
                        <input type="number" id="min-width" value="${options.minWidth}" min="100" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px;">Height:</label>
                        <input type="number" id="min-height" value="${options.minHeight}" min="100" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 10px 0; color: #555;">Excluded Sites</h3>
                <p style="color: #777; margin-bottom: 10px;">EXIF viewer will not appear on these sites</p>
                <div id="exclude-sites-container" style="margin-bottom: 10px; min-height: 50px; border: 1px solid #eee; border-radius: 4px; padding: 10px;">
                    ${options.excludeSites.map(site => 
                        `<div class="exclude-site-item" style="display: inline-block; background: #f0f0f0; padding: 3px 8px; border-radius: 12px; margin: 3px; position: relative;">
                            ${site} 
                            <span class="remove-site" data-site="${site}" style="cursor: pointer; color: #e74c3c; margin-left: 5px;">&times;</span>
                         </div>`).join('')
                    }
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="new-exclude-site" placeholder="Add site (e.g. example.com)" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <button id="add-exclude-site" style="padding: 8px 15px; background: #3aa757; color: white; border: none; border-radius: 4px; cursor: pointer;">Add</button>
                </div>
            </div>
            
            <div style="margin-top: 10px; padding-top: 15px; border-top: 1px solid #eee; font-size: 0.9em; color: #777;">
                <p>EXIF QuickView - Version 2.2</p>
                <p>Hover over any image to see EXIF details below it. The information panel will stay visible while your cursor is over the image or the EXIF panel.</p>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button id="reset-settings" style="padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset</button>
                <button id="save-settings" style="padding: 8px 15px; background: #3aa757; color: white; border: none; border-radius: 4px; cursor: pointer;">Save & Close</button>
            </div>
        </div>
        `;
        
        document.body.appendChild(settingsPage);
        
        // Bind events
        document.getElementById('close-settings').addEventListener('click', closeSettings);
        document.getElementById('save-settings').addEventListener('click', saveSettings);
        document.getElementById('reset-settings').addEventListener('click', resetSettings);
        document.getElementById('add-exclude-site').addEventListener('click', addExcludeSite);
        
        // Bind remove site events
        document.querySelectorAll('.remove-site').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const site = this.getAttribute('data-site');
                options.excludeSites = options.excludeSites.filter(s => s !== site);
                this.parentElement.remove();
            });
        });
        
        // Close on mask click
        settingsPage.addEventListener('click', function(e) {
            if (e.target === settingsPage) {
                closeSettings();
            }
        });
    }

    function closeSettings() {
        const settingsPage = document.getElementById('exif-settings-page');
        if (settingsPage && document.body.contains(settingsPage)) {
            document.body.removeChild(settingsPage);
        }
    }

    function saveSettings() {
        options.enabled = document.getElementById('enabled').checked;
        options.hideNoExif = document.getElementById('hide-no-exif').checked;
        options.compact = document.getElementById('compact').checked;
        options.top = document.getElementById('top').checked;
        options.make = document.getElementById('make').checked;
        options.model = document.getElementById('model').checked;
        options.focalLength = document.getElementById('focal-length').checked;
        options.shutterSpeed = document.getElementById('shutter-speed').checked;
        options.aperture = document.getElementById('aperture').checked;
        options.iso = document.getElementById('iso').checked;
        options.datetime = document.getElementById('datetime').checked;
        options.gps = document.getElementById('gps').checked;
        options.minWidth = parseInt(document.getElementById('min-width').value) || 300;
        options.minHeight = parseInt(document.getElementById('min-height').value) || 300;
        
        saveOptions(options);
        
        // Reinitialize
        if (options.enabled && !isExcludedSite()) {
            // Remove existing overlay
            if (activeOverlay && document.body.contains(activeOverlay)) {
                document.body.removeChild(activeOverlay);
                activeOverlay = null;
                activeImage = null;
            }
            initExifViewer();
        }
        
        closeSettings();
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 2147483646;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-family: "Open Sans", sans-serif;
            animation: fadeOut 3s forwards;
        `;
        successMsg.innerHTML = 'Settings saved successfully!';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            if (document.body.contains(successMsg)) {
                document.body.removeChild(successMsg);
            }
        }, 3000);
    }

    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            options = {...defaultOptions};
            saveOptions(options);
            
            // Reload settings page
            const settingsPage = document.getElementById('exif-settings-page');
            if (settingsPage) {
                document.body.removeChild(settingsPage);
                openSettings();
            }
        }
    }

    function addExcludeSite() {
        const input = document.getElementById('new-exclude-site');
        const site = input.value.trim();
        
        if (!site) return;
        
        // Basic validation
        const cleanSite = site.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        
        if (cleanSite && !options.excludeSites.includes(cleanSite)) {
            options.excludeSites.push(cleanSite);
            
            const container = document.getElementById('exclude-sites-container');
            const item = document.createElement('div');
            item.className = 'exclude-site-item';
            item.style.cssText = 'display: inline-block; background: #f0f0f0; padding: 3px 8px; border-radius: 12px; margin: 3px; position: relative;';
            item.innerHTML = `${cleanSite} <span class="remove-site" data-site="${cleanSite}" style="cursor: pointer; color: #e74c3c; margin-left: 5px;">&times;</span>`;
            container.appendChild(item);
            
            // Bind remove event
            item.querySelector('.remove-site').addEventListener('click', function(e) {
                e.stopPropagation();
                const siteToRemove = this.getAttribute('data-site');
                options.excludeSites = options.excludeSites.filter(s => s !== siteToRemove);
                this.parentElement.remove();
            });
            
            input.value = '';
        }
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        clearTimeout(hideTimeout);
        if (activeOverlay && document.body.contains(activeOverlay)) {
            document.body.removeChild(activeOverlay);
        }
    });
})();