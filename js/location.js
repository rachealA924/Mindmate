function requestLocation() {
    if ("geolocation" in navigator) {
        // This triggers the browser's "Allow/Block" popup
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                localStorage.setItem("user_lat", lat);
                localStorage.setItem("user_lon", lon);
                console.log("Location saved:", lat, lon);
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    alert("No worries! You can still use the AI, but we won't be able to show nearby clinics in Kigali.");
                }
            }
        );
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}