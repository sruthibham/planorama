import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SettingsPage = () => {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('theme') || 'light');
    const [textSize, setTextSize] = useState(localStorage.getItem('textSize') || 'medium');

    useEffect(() => {
        document.body.setAttribute('data-theme', darkMode ? 'dark' : selectedTheme);
        document.body.setAttribute('data-text-size', textSize);
        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('theme', selectedTheme);
        localStorage.setItem('textSize', textSize);
    }, [darkMode, selectedTheme, textSize]);

    const saveSettings = async () => {
        try {
            await axios.post(`http://127.0.0.1:5000/update_settings/1`, {
                dark_mode: darkMode,
                theme: selectedTheme,
                text_size: textSize,
            });
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error updating settings:", error);
        }
    };

    return (
        <div className="SettingsContainer">
            <h2>Settings</h2>

            {/* Back Button */}
            <button className="BackButton" onClick={() => navigate(-1)}>← Back</button>

            {/* Dark Mode Toggle */}
            <div className="SettingsOption">
                <label>Dark Mode</label>
                <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </div>

            {/* Theme Selection */}
            <div className="SettingsOption">
                <label>App Theme</label>
                <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
                    <option value="light">Light</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                </select>
            </div>

            {/* Text Preferences */}
            <div className="SettingsOption">
                <label>Text Size</label>
                <select value={textSize} onChange={(e) => setTextSize(e.target.value)}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                </select>
            </div>

            {/* Save Settings */}
            <button className="SettingsSaveButton" onClick={saveSettings}>Save Settings</button>
        </div>
    );
};

export default SettingsPage;
