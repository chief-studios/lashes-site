import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const AdminLink = () => {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <button className="admin-link" onClick={handleAdminClick}>
      Admin
    </button>
  );
};

export default AdminLink;
