import React, { useEffect, useState } from "react";
import axios from "axios";

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/profile/1").then((res) => {
      setProfile(res.data);
    });
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4 border rounded-lg shadow-lg">
      {profile ? (
        <>
          <img src={profile.profile_photo || "https://via.placeholder.com/100"} alt="Profile" className="w-24 h-24 rounded-full mx-auto" />
          <h2 className="text-2xl text-center font-semibold mt-2">{profile.username}</h2>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Achievements:</h3>
            {profile.badges.length > 0 ? (
              <ul className="list-disc pl-4">
                {profile.badges.map((badge, index) => (
                  <li key={index}>{badge}</li>
                ))}
              </ul>
            ) : (
              <p>No achievements yet.</p>
            )}
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Edit Profile</button>
        </>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default Profile;

