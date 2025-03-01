import React, { useState, useEffect } from 'react';
import './App.css'; // Ensure styles are applied

const ProfilePage = () => {
    const [profile, setProfile] = useState({ username: 'User', profile_picture: '', achievements: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/get_profile')
            .then(response => response.json())
            .then(data => {
                if (!data.error) {
                    setProfile(data);
                }
            });
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage('Please select an image file.');
            return;
        }
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('/upload_profile_picture', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (response.ok) {
            setMessage('Profile picture updated successfully.');
            setProfile({ ...profile, profile_picture: result.filename });
        } else {
            setMessage(result.error);
        }
    };

    return (
        <div className="ProfileContainer">
            <h2 className="ProfileTitle">{profile.username}'s Profile</h2>
            <div className="ProfilePictureContainer">
                <img
                    className="ProfilePicture"
                    src={profile.profile_picture ? `/profile_pics/${profile.profile_picture}` : preview || '/default-profile.png'}
                    alt="Profile"
                />
            </div>
            <div className="UploadContainer">
                <input type="file" accept="image/png, image/jpg, image/jpeg" onChange={handleFileChange} className="FileInput"/>
                <button className="ProfileUploadButton" onClick={handleUpload}>Upload Profile Picture</button>
            </div>
            {message && <p className="Message">{message}</p>}
            <div className="Achievements">
                <h3>Achievements</h3>
                <p>{profile.achievements || 'No achievements yet.'}</p>
            </div>
        </div>
    );
};

export default ProfilePage;
