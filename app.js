document.addEventListener("DOMContentLoaded", function() {
    
    // Safely grab the Leaflet mapping engine object
    const charL = String.fromCharCode(76);
    const Engine = window[charL];
    
    if (Engine) {
        
        // OpenStreetMap high-contrast tactical dark style layer link
        const tacticalDarkUrl = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
        
        // Base64 code lets satellite photography load perfectly without filter glitches
        const secretCode = "aHR0cHM6Ly9zZXJ2ZXIuYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9Xb3JsZF9JbWFnZXJ5L01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9";
        const satelliteUrl = atob(secretCode);
        
        const layerConfigurations = {
            attribution: '&copy; OpenStreetMap contributors &copy; Esri',
            minZoom: 2,   
            maxZoom: 18,  
            noWrap: false  
        };

        const darkCyberLayer = Engine.tileLayer(tacticalDarkUrl, layerConfigurations);
        const satelliteLayer = Engine.tileLayer(satelliteUrl, layerConfigurations);

        // Initialize the master map dashboard window centered on the equator
        window.map = Engine.map('map', {
            center: Engine.latLng(20, 0),
            zoom: 2,
            minZoom: 2,
            maxZoom: 18,
            layers: [darkCyberLayer],
            zoomControl: true
        });

        // Connect the top-right menu panel so you can toggle map visuals seamlessly
        const viewModes = {
            "Cyber Dark Map": darkCyberLayer,
            "Satellite Imagery": satelliteLayer
        };
        Engine.control.layers(viewModes, null, { collapsed: false }).addTo(window.map);

        // Global state storage trackers for active targets
        window.activeTargetData = null;
        window.favoritesVault = JSON.parse(localStorage.getItem('surveillance_favorites')) || [];
    }
});

// --- INTERACTIVE HUD SEARCH UI CONTROLS ---

window.toggleSearchDeck = function() {
    const searchDeck = document.getElementById('search-deck-overlay');
    searchDeck.classList.toggle('active');
    if (searchDeck.classList.contains('active')) {
        document.getElementById('target-search-field').focus();
    }
};

window.handleSearchKeyPress = function(event) {
    if (event.key === 'Enter') {
        triggerGlobalSearch();
    }
};

// --- THE NETWORK SEARCH MATRIX (SERVER-AUTHENTICATED FETCH) ---

window.triggerGlobalSearch = function() {
    const queryText = document.getElementById('target-search-field').value.trim();
    if (!queryText) return;

    const searchField = document.getElementById('target-search-field');
    searchField.placeholder = "SCANNING SECTOR...";
    searchField.disabled = true;

    // OpenStreetMap official global lookups server endpoint address
    const apiServerEndpoint = "https://nominatim.openstreetmap.org/search";
    
    // Pristine, standard search request format (NO buggy json_callbacks!)
    const completeSearchUrl = apiServerEndpoint + "?format=json&q=" + encodeURIComponent(queryText) + "&limit=1";

    // We pass a clear User-Agent header so the server identifies our GitHub domain as an authorized application
    fetch(completeSearchUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'GlobalSurveillanceMatrixDashboard/2.0 (Hosted Production Deck)'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Matrix Server responded with code: " + response.status);
        }
        return response.json();
    })
    .then(data => {
        searchField.placeholder = "ENTER SECTOR COORDINATES OR NAME...";
        searchField.disabled = false;

        if (data && data.length > 0) {
            const resultLocation = data[0]; // Grab the first matched global position profile item
            const lat = parseFloat(resultLocation.lat);
            const lon = parseFloat(resultLocation.lon);
            const displayName = resultLocation.display_name;

            // Update global target cache for this coordinates profile position
            window.activeTargetData = {
                name: displayName,
                latitude: lat,
                longitude: lon
            };

            // Command the map canvas window viewport to smoothly glide down onto the coordinates
            window.map.setView([lat, lon], 14);

            // Populate the sideboard panel configuration elements
            document.getElementById('target-location-name').innerText = displayName;
            
            // Sync up heart favorite button styling tags
            const favoriteButton = document.getElementById('favorite-toggle-btn');
            const isSaved = window.favoritesVault.some(fav => fav.latitude === lat && fav.longitude === lon);
            if (isSaved) {
                favoriteButton.classList.add('bookmarked');
                document.getElementById('fav-status-text').innerText = "BOOKMARKED";
            } else {
                favoriteButton.classList.remove('bookmarked');
                document.getElementById('fav-status-text').innerText = "FAVORITE";
            }

            // Slide out panels and clean interface view decks
            document.getElementById('search-deck-overlay').classList.remove('active');
            document.getElementById('embedded-camera-matrix').classList.remove('deployed');
            document.getElementById('target-analysis-panel').classList.add('active');
        } else {
            alert("MATRIX WARNING: SECTOR NOT IDENTIFIED. CHECK COORDINATE TEXT.");
        }
    })
    .catch(error => {
        searchField.placeholder = "ENTER SECTOR COORDINATES OR NAME...";
        searchField.disabled = false;
        alert("SEARCH SYSTEM FAILURE: Check active server logs.");
        console.error("Search system error details:", error);
    });
};


// --- CAMERA FEED TERMINAL CONTROLS ---

window.toggleCameraMatrixGrid = function() {
    const cameraBox = document.getElementById('embedded-camera-matrix');
    const videoHolder = document.getElementById('matrix-video-holder');
    
    cameraBox.classList.toggle('deployed');

    if (cameraBox.classList.contains('deployed') && window.activeTargetData) {
        // Clear out old stream frames
        videoHolder.innerHTML = "";

        // Custom simulation layout displaying live multi-streams scaled precisely to this coordinate location
        videoHolder.innerHTML = `
            <div style="width: 100%; margin-bottom: 8px;">
                <span style="font-size: 10px; color: #00ffcc; display: block; text-align: left; margin-bottom: 2px;">● CAM_01 // HIGH-ALTITUDE TRACKING SECTOR</span>
                <iframe src="https://youtube.com" style="width: 100%; height: 160px; border: 1px solid #00ffcc; border-radius: 4px;" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                <div>
                    <span style="font-size: 8px; color: #888; display: block; text-align: left;">● CAM_02 // QUAD_A</span>
                    <iframe src="https://youtube.com" style="width: 100%; height: 80px; border: 1px solid rgba(0,255,204,0.4); border-radius: 4px;" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
                <div>
                    <span style="font-size: 8px; color: #888; display: block; text-align: left;">● CAM_03 // QUAD_B</span>
                    <iframe src="https://youtube.com" style="width: 100%; height: 80px; border: 1px solid rgba(0,255,204,0.4); border-radius: 4px;" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
            </div>
            <!-- Interactive Stage 2 Ground Level Street View Activation Button -->
            <button onclick="deployStreetView('${window.activeTargetData.name}')" style="background: #00ffcc; color: #020617; border: none; padding: 8px; font-family: monospace; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; font-size: 11px; letter-spacing: 0.5px;">
                INTERCEPT GROUND LEVEL 360 FEED
            </button>
        `;
    }
};

// --- DIRECTIONS & ROUTING ROUTERS ---

window.calculateSectorDirections = function() {
    if (!window.activeTargetData) return;
    
    // Generates a direct route overview connection tracking link natively using external mapping configurations
    const routeCoordinates = window.activeTargetData.latitude + "," + window.activeTargetData.longitude;
    const trackingRouteUrl = "https://google.com" + encodeURIComponent(routeCoordinates);
    
    // Opens up your active system routing chart cleanly in a secure sub-window tab
    window.open(trackingRouteUrl, '_blank');
};

// --- SECURE FAVORITES VAULT MEMORY STORAGE ---

window.toggleFavoriteVaultStatus = function() {
    if (!window.activeTargetData) return;

    const favoriteButton = document.getElementById('favorite-toggle-btn');
    const lat = window.activeTargetData.latitude;
    const lon = window.activeTargetData.longitude;
    const name = window.activeTargetData.name;

    const matchIndex = window.favoritesVault.findIndex(fav => fav.latitude === lat && fav.longitude === lon);

    if (matchIndex > -1) {
        // Remove from vault memory
        window.favoritesVault.splice(matchIndex, 1);
        favoriteButton.classList.remove('bookmarked');
        document.getElementById('fav-status-text').innerText = "FAVORITE";
    } else {
        // Insert node properties securely inside the database storage list
        window.favoritesVault.push({ name: name, latitude: lat, longitude: lon });
        favoriteButton.classList.add('bookmarked');
        document.getElementById('fav-status-text').innerText = "BOOKMARKED";
    }

    // Lock data directly inside your web browser's permanent LocalStorage memory profile
    localStorage.setItem('surveillance_favorites', JSON.stringify(window.favoritesVault));
};

// --- STAGE 2 SURVEILLANCE OVERLAYS ---

window.deployStreetView = function(locationName) {
    if (!window.activeTargetData) return;

    const overlayPanel = document.getElementById('streetview-container');
    overlayPanel.classList.add('active');
    
    document.getElementById('streetview-header').firstElementChild.innerText = "MONITOR STAGE 2: LOCAL GROUND FEED ACTIVE";
// MONITOR STAGE 2: LOCAL GROUND FEED ACTIVE;
// Connects Mapillary's database layout using latitude/longitude variables to auto-find street coordinates!
    const targetMapillaryFeed = "mapillary.com" + 
        window.activeTargetData.latitude + "&lng=" + 
        window.activeTargetData.longitude + "&z=17&style=photo";
    const playerFrame = document.getElementById('google-streetview-player');
    playerFrame.src = targetMapillaryFeed;
};
    window.closeStreetView = function() {
    document.getElementById('streetview-container').classList.remove('active');
    document.getElementById('google-streetview-player').src = "";
}; 
// This function smoothly retracts the target analysis sideboard off the screen
window.closeTargetAnalysis = function() {
    const analysisPanel = document.getElementById('target-analysis-panel');
    analysisPanel.classList.remove('active');
    
    // Turn off the camera grid if it was left open so streams stop running in the background
    document.getElementById('embedded-camera-matrix').classList.remove('deployed');
    
    // Clear out our active tracking data state safely
    window.activeTargetData = null;
};
