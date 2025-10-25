import React from 'react';
import { useNavigate } from 'react-router-dom';
import consultationImage from '../images/consultation.jpg';
import clusterLashesImage from '../images/cluster cluster lashes.jpg';
import minkImage from '../images/mink classic.jpg';
import '../styles/ServiceCards.css';

const ServiceCards = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: 1,
      name: 'Lash Consultation',
      details: 'Professional consultation to determine the best lash style for your eyes and lifestyle',
      image: consultationImage,
      route: '/lash-consultation',
      price: 'GHS 120',
      duration: '60 mins'
    },
    {
      id: 2,
      name: 'Cluster Lashes',
      details: 'Individual cluster lashes for a temporary, dramatic look that lasts 1-2 weeks',
      image: clusterLashesImage,
      route: '/cluster-lashes',
      price: 'From GHS 55',
      duration: '40-110 mins'
    },
    {
      id: 3,
      name: 'Mink Lashes',
      details: 'Premium mink lashes that last 3-6 weeks for a luxurious, long-lasting look',
      image: minkImage,
      route: '/mink-lashes',
      price: 'From GHS 115',
      duration: '90-150 mins'
    }
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <div className="service-cards-container">
      {services.map((service, index) => (
        <div 
          key={service.id} 
          className="service-card fade-in-up"
          style={{ animationDelay: `${index * 0.2}s` }}
          onClick={() => handleCardClick(service.route)}
        >
          <div className="service-image">
            <img src={service.image} alt={service.name} />
            <div className="service-overlay">
              <div className="service-price-badge">
                <span className="price">{service.price}</span>
                <span className="duration">{service.duration}</span>
              </div>
            </div>
          </div>
          <div className="service-info">
            <h3>{service.name}</h3>
            <p className="service-details">{service.details}</p>
            <div className="service-cta">
              <span className="learn-more">Learn More →</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceCards;
