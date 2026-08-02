import { useState } from "react";
import { ArrowLeft, UserPlus } from 'lucide-react';

const UserForm = ({ onLogin, onBack }) => {

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    contact: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const response = await fetch("http://127.0.0.1:8000/save_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save details");
      }

      onLogin(formData.name);

    } catch (error) {

      alert("Error Saving Details");

    }
  };

  return (

    <div className="app-container">
      <header>
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={18} />
            Back to Login
          </button>
        )}
        <h1>MediPredict AI</h1>
        <p>Create your profile to get started</p>
      </header>

      <div className="glass-panel">
        <div className="signup-form-header">
          <div className="signup-form-icon">
            <UserPlus size={28} />
          </div>
          <h2>Sign Up</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fill in your details below</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <input
            className="search-input"
            type="text"
            name="name"
            placeholder="Enter Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            className="search-input"
            type="number"
            name="age"
            placeholder="Enter Age"
            value={formData.age}
            onChange={handleChange}
            required
          />

          <select
            className="search-input"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Others">Others</option>
          </select>

          <input
            className="search-input"
            type="text"
            name="contact"
            placeholder="Enter Contact Number"
            value={formData.contact}
            onChange={handleChange}
            required
          />

          <button className="predict-btn" type="submit">
            <UserPlus size={20} />
            Create Account & Continue
          </button>

        </form>
      </div>
    </div>
  );
};

export default UserForm;
