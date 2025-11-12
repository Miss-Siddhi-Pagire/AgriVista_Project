import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import axios from 'axios';
import api from '../api';

const languageName = Cookies.get("languageName");

const Ideal = ({ cropName, soilConditions }) => {
  const [adjustmentSuggestion, setAdjustmentSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buttonVisible, setButtonVisible] = useState(true);
  const { t } = useTranslation();

  const getSoilAdjustmentSuggestion = async () => {
    const instruction = (languageName === "Default" || languageName === "English") ? '' : ` Give instructions in ${languageName} Language only.`;
    const url = "https://chatgpt-42.p.rapidapi.com/chatgpt";
    const headers = {
      "Content-Type": "application/json",
      "x-rapidapi-key": api,
      "x-rapidapi-host": "chatgpt-42.p.rapidapi.com",
    };

    const conditionsText = `Nitrogen: ${soilConditions[0]}, Phosphorus: ${soilConditions[1]}, Potassium: ${soilConditions[2]}, Temperature: ${soilConditions[3]}°C, Humidity: ${soilConditions[4]}%, pH: ${soilConditions[5]}, Rainfall: ${soilConditions[6]} mm`;

    const payload = {
      messages: [
        {
          role: "user",
          content: `Given the following soil conditions for ${cropName}: ${conditionsText}. Suggest adjustments for optimal growth.${instruction}`,
        },
      ],
      web_access: false,
    };

    try {
      const response = await axios.post(url, payload, { headers });
      setAdjustmentSuggestion(response.data.result);
    } catch (error) {
      console.error(error);
      setError("Failed to fetch soil adjustment suggestion.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskSuggestion = () => {
    setLoading(true);
    setError(null);
    setButtonVisible(false);
    getSoilAdjustmentSuggestion();
  };

  useEffect(() => {
    setAdjustmentSuggestion('');
    setButtonVisible(true);
  }, [cropName, soilConditions]);

  const formatSuggestion = (suggestion) => suggestion.split(/\n/).map((line, idx) => <p key={idx}>{line}</p>);

  return (
    <div className="grow_container">
      <h3>{t("Ideal")}{t(cropName)}</h3>
      {buttonVisible && (
        <button onClick={handleAskSuggestion} style={styles.askButton}>
          <span style={{color:'black'}}>{t("Ask")}</span>
          <img src="ai.svg" alt="AI icon" style={{ width: 24, height: 24, marginLeft: -2 }} />
          <span style={{ marginLeft: 2, color:'black'}}>{t("Sugg")}</span>
        </button>
      )}
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {adjustmentSuggestion && formatSuggestion(adjustmentSuggestion)}
    </div>
  );
};

const styles = {
  askButton: {
    margin: '10px 0',
    padding: '8px 12px',
    fontSize: '16px',
    cursor: 'pointer',
    border: '1px solid black',
    backgroundColor: "#c7e8ff",
  },
};

export default Ideal;
