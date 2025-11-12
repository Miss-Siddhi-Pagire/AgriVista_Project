import React from 'react';

const RestCropCards = ({ crops }) => {
  if(!crops || crops.length < 5) return <div>No crop data available</div>;
  return (
    <div className="row row-cols-1 row-cols-md-2 g-4">
      {[1,2,3,4].map(i=>(
        <div className="col" key={i}>
          <div className="card">
            <img src={crops[i].image} className="card-img-top" alt="crop img" style={{height:400, objectFit:"cover"}}/>
            <div className="card-body">
              <h2 className="card-title">{crops[i].name}</h2>
              <p className="card-text">{crops[i].description}.</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RestCropCards;
