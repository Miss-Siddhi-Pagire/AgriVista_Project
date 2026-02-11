import { useState, useEffect } from "react";
import { Image } from "lucide-react";

/**
 * PredictionImage Component
 * Fetches and displays a thumbnail from Wikipedia for a given query (Crop/Fertilizer name).
 * Falls back to a generic icon if no image is found or on error.
 */
const PredictionImage = ({ query, style }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Map technical terms to Wikipedia-friendly titles
    const aliases = {
        "19:19:19 NPK": "NPK fertilizer",
        "10:26:26 NPK": "NPK fertilizer",
        "12:32:16 NPK": "NPK fertilizer",
        "13:32:26 NPK": "NPK fertilizer",
        "20:20:20 NPK": "NPK fertilizer",
        "MOP": "Potassium chloride",
        "Muriate of Potash": "Potassium chloride",
        "DAP": "Diammonium phosphate",
        "SSP": "Superphosphate",
        "TSP": "Superphosphate",
        "Urea": "Urea",
        "Magnesium Sulphate": "Magnesium sulfate",
        "Ammonium Sulphate": "Ammonium sulfate",
        "Chilies": "Chili pepper",
        "Jute": "Jute",
        "Rice": "Rice",
        "Maize": "Maize",
        "Cotton": "Cotton",
        "Wheat": "Wheat",
    };

    useEffect(() => {
        if (!query) return;

        const fetchImage = async () => {
            try {
                setLoading(true);
                setError(false);

                // Use alias if available, otherwise use query directly
                const searchTerm = aliases[query] || query;

                // Wikipedia MediaWiki API
                const response = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
                        searchTerm
                    )}&prop=pageimages&format=json&pithumbsize=500&origin=*`
                );
                const data = await response.json();
                const pages = data.query.pages;
                const pageId = Object.keys(pages)[0];

                if (pageId && pages[pageId].thumbnail) {
                    setImageUrl(pages[pageId].thumbnail.source);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Error fetching image from Wikipedia:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchImage();
    }, [query]);

    // Styles
    const imgStyle = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "12px",
        ...style,
    };

    const placeholderStyle = {
        width: "100%",
        height: "100%",
        backgroundColor: "#DCEDC8", // Light green fallback
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#4A6317",
        ...style,
    };

    if (loading) {
        return (
            <div style={placeholderStyle}>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div style={placeholderStyle}>
                <Image size={48} opacity={0.5} />
            </div>
        );
    }

    return <img src={imageUrl} alt={query} style={imgStyle} />;
};

export default PredictionImage;
