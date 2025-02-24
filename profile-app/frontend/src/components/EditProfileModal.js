import React from "react";

const EditProfileModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold">Edit Profile</h2>
        <input type="text" placeholder="Enter new username" className="border p-2 mt-2 w-full" />
        <button className="bg-blue-500 text-white px-4 py-2 rounded mt-4" onClick={onClose}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfileModal;

