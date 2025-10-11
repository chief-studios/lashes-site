import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ServiceCards.css';

const ServiceCards = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: 1,
      name: 'Lash Consultation',
      price: 120,
      image: 'https://images.unsplash.com/photo-1594736797933-d0c2b0b4b8b8?w=400&h=300&fit=crop&crop=center',
      route: '/lash-consultation'
    },
    {
      id: 2,
      name: 'Cluster Lashes',
      price: 110,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=300&fit=crop&crop=center',
      route: '/cluster-lashes'
    },
    {
      id: 3,
      name: 'Mink Lashes',
      price: 188,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
      route: '/mink-lashes'
    }
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <div className="service-cards-container">
      {services.map(service => (
        <div 
          key={service.id} 
          className="service-card"
          onClick={() => handleCardClick(service.route)}
        >
          <div className="service-image">
            <img src={service.image} alt={service.name} />
          </div>
          <div className="service-info">
            <h3>{service.name}</h3>
            <p className="service-price">GHS {service.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceCards;
