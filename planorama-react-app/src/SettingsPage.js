import React, { useState, useEffect } from 'react';
import { useGlobal } from "./GlobalContext";
import './SettingsPage.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SettingsPage = () => {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('theme') || 'light');
    const [textSize, setTextSize] = useState(localStorage.getItem('textSize') || 'medium');
    const [textFont, setTextFont] = useState(localStorage.getItem('textFont') || 'Arial');
    const [textSpacing, setTextSpacing] = useState(localStorage.getItem('textSpacing') || 'None'); 
    const [notificationsEnabled, setNotificationsEnabled] = useState(
        localStorage.getItem('notificationsEnabled') === null || localStorage.getItem('notificationsEnabled') === 'true'
    );
    const [errMsg, setErrMsg] = useState("");
    const { setUser } = useGlobal();
    const { user } = useGlobal();
    const [showInputField, setShowInputField] = useState(false);
    const [password, setPassword] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("appearance");

    useEffect(() => {
        document.body.setAttribute('data-theme', selectedTheme); 
        document.body.setAttribute('data-text-size', textSize);
        document.body.setAttribute('data-text-font', textFont);
        document.body.setAttribute('data-text-spacing', textSpacing);
        document.body.setAttribute('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('theme', selectedTheme);
        localStorage.setItem('textSize', textSize);
        localStorage.setItem('textFont', textFont);
        localStorage.setItem('textSpacing', textSpacing);
        localStorage.setItem('notificationsEnabled', notificationsEnabled);

        if (user !== "Guest") {
            setLoggedIn(true);
        } else {
            setLoggedIn(false);
        }
    }, [darkMode, selectedTheme, textSize, textFont, textSpacing, notificationsEnabled, user]);

    const saveSettings = async () => {
        try {
            await axios.post(`http://127.0.0.1:5000/update_settings/1`, {
                dark_mode: darkMode,
                theme: selectedTheme,
                text_size: textSize,
                text_font: textFont,
                text_spacing: textSpacing,
                notifications_enabled: notificationsEnabled
            });
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error updating settings:", error);
        }
    };

    const delAccount = () => {
        axios.post("http://127.0.0.1:5000/deleteuser", { username: user, password: password })
        .then(response => {
            setErrMsg(response.data.msg)
            if (response.data.success) {
                setUser("Guest");
            }
        });
    };

    const openPassword = () => {
        setShowInputField(!showInputField);
    };

    const renderRightColumn = () => {
        const SectionClass = darkMode ? "Section dark-mode" : "Section";

        switch (selectedCategory) {
            case "appearance":
                return (
                    <div className={SectionClass}>
                        <h3>Appearance</h3>
                        <div className="SettingsOption">
                            <label>Dark Mode</label>
                            <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                        </div>
                        <div className="SettingsOption">
                            <label>App Theme</label>
                            <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
                                <option value="light">Blue</option>
                                <option value="red">Red</option>
                                <option value="green">Green</option>
                            </select>
                        </div>
                    </div>
                );
            case "textPreferences":
                return (
                    <div className={SectionClass}>
                        <h3>Text Preferences</h3>
                        <div className="SettingsOption">
                            <label>Text Size</label>
                            <select value={textSize} onChange={(e) => setTextSize(e.target.value)}>
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                        <div className="SettingsOption">
                            <label>Text Font</label>
                            <select value={textFont} onChange={(e) => setTextFont(e.target.value)}>
                                <option value="Arial">Arial</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Verdana">Verdana</option>
                            </select>
                        </div>
                        <div className="SettingsOption">
                            <label>Text Spacing</label>
                            <select value={textSpacing} onChange={(e) => setTextSpacing(e.target.value)}>
                                <option value="Compact">Compact</option>
                                <option value="None">None</option>
                                <option value="Wide">Wide</option>
                            </select>
                        </div>
                    </div>
                );
            case "language":
                return (
                    <div className={SectionClass}>
                        <h3>Language & Time</h3>
                        <div className="SettingsOption">
                            <label>Start Week on Monday</label>
                            <input type="checkbox" />
                        </div>
                        <div className="SettingsOption">
                            <label>Timezone</label>
                            <select>
                                <option value="GMT-5">GMT-5 (Indianapolis)</option>
                            </select>
                        </div>
                    </div>
                );
            case "notifications":
                return (
                    <div className={SectionClass}>
                        <h3>Notifications</h3>
                        <div className="SettingsOption">
                            <label>Enable Notifications</label>
                            <input
                                type="checkbox"
                                checked={notificationsEnabled}
                                onChange={() => setNotificationsEnabled(prev => !prev)}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const ContainerClass = darkMode ? "Container dark-mode" : "Container";

    return (
        <div className={ContainerClass}>
            <h2>Settings</h2>
            <div className="SettingsContent">
                <div className="Sidebar">
                    <ul>
                        <li onClick={() => setSelectedCategory("appearance")}>Appearance</li>
                        <li onClick={() => setSelectedCategory("textPreferences")}>Text Preferences</li>
                        <li onClick={() => setSelectedCategory("language")}>Language & Time</li>
                        <li onClick={() => setSelectedCategory("notifications")}>Notifications</li>
                    </ul>
                </div>
                <div className="MainContent">
                    {renderRightColumn()}
                    <button className="SettingsSaveButton" onClick={saveSettings}>Save Settings</button>
                    {loggedIn && (
                        <div className="DeleteAccountSection">
                            <button className="SettingsSaveButton" onClick={openPassword}>Delete Account</button>
                            {showInputField && (
                                <div className="PasswordInputSection">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button className="SettingsSaveButton" onClick={delAccount}>Confirm</button>
                                </div>
                            )}
                        </div>
                    )}
                    <p>{errMsg}</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
