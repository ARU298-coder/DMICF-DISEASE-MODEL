import React, { useState } from "react";
import axios from "axios";

const UserForm = ({ setUserVerified }) => {

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

      await axios.post("http://127.0.0.1:5000/save_user", formData);

      alert("Details Saved Successfully");

      setUserVerified(true);

    } catch (error) {

      alert("Error Saving Details");

    }
  };

  return (

    <div className="form-container">

      <h2>User Details</h2>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          name="name"
          placeholder="Enter Name"
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="age"
          placeholder="Enter Age"
          onChange={handleChange}
          required
        />

        <select
          name="gender"
          onChange={handleChange}
          required
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Others">Others</option>
        </select>

        <input
          type="text"
          name="contact"
          placeholder="Enter Contact Number"
          onChange={handleChange}
          required
        />

        <button type="submit">
          Continue
        </button>

      </form>

    </div>
  );
};

export default UserForm;
