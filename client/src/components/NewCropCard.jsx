import React from "react";

const NewCropCard = ({ crop }) => {
  if (!crop) {
    return <div className="p-4 border rounded shadow bg-gray-100 text-gray-600">Crop data not available</div>;
  }

  return (
    <div className="p-4 border rounded shadow bg-white">
      <h2 className="text-lg font-bold text-green-700">{crop.name || "Unknown Crop"}</h2>
      <p className="text-gray-600">{crop.description || "No description available"}</p>
      {crop.image && <img src={crop.image} alt={crop.name || "Crop"} className="mt-2 rounded-md w-full h-40 object-cover" />}
    </div>
  );
};

export default NewCropCard;
