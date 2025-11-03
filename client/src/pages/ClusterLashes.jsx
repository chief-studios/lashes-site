import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import '../styles.css';

const ClusterLashes = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    product: '',
    timeSlot: '',
    description: ''
  });
  const bookingFormRef = useRef(null);
  const productsSectionRef = useRef(null);
  const [selectedGroup, setSelectedGroup] = useState(null); // 'classic' | 'hybrid' | 'volume' | null

  const handleSelectProduct = (productName) => {
    setFormData(prev => ({ ...prev, product: productName }));
    // Smooth scroll to the booking form
    if (bookingFormRef.current) {
      bookingFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking submitted:', { service: 'Cluster Lashes', ...formData });
    alert('Booking submitted successfully! We will contact you soon.');
    navigate('/');
  };

  return (
    <div className="service-page">
      <div className="service-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Services
        </button>
        
        <div className="page-header">
          <h1>Cluster Lashes</h1>
          <p className="page-description">
            Cluster lashes are gentle on the eyes, easy to remove, and last for one to two weeks. Perfect for special occasions or those who want a temporary lash enhancement.
          </p>
        </div>

        <div className="products-section" ref={productsSectionRef}>
          <h2>Available Styles</h2>
          {(() => {
            const clusterProducts = products.filter(p => (p.category || '').toLowerCase().includes('cluster'));
            const matches = (key) => (item) =>
              (item.name || '').toLowerCase().includes(key) || (item.description || '').toLowerCase().includes(key);
            const groups = {
              classic: clusterProducts.filter(matches('classic')),
              hybrid: clusterProducts.filter(matches('hybrid')),
              volume: clusterProducts.filter(matches('volume')),
            };

            const scrollToSection = () => {
              if (productsSectionRef.current) {
                productsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            };

            if (!selectedGroup) {
              const sections = [
                { key: 'classic', title: 'Classic', items: groups.classic },
                { key: 'volume', title: 'Volume', items: groups.volume },
                { key: 'hybrid', title: 'Hybrid', items: groups.hybrid },
              ];
              const placeholderFor = (key, items) => {
                if (key === 'hybrid') {
                  const preferred = items.find(p => (p.name || '').toLowerCase() === 'cluster hybrid');
                  return (preferred || items[0])?.image;
                }
                return items[0]?.image;
              };
              const selectGroup = (key) => {
                // Only change the view to show the group's products; do not scroll to form
                setSelectedGroup(key);
              };

              return (
                <div className="service-cards-container">
                  {sections.filter(s => s.items.length > 0).map(section => (
                    <div
                      key={section.key}
                      className="service-card"
                      onClick={() => { selectGroup(section.key); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectGroup(section.key); } }}
                    >
                      <div className="service-image">
                        <img src={placeholderFor(section.key, section.items)} alt={`${section.title} placeholder`} />
                      </div>
                      <div className="service-info">
                        <h3>{section.title}</h3>
                        <p className="service-details">{section.items.length} styles available</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            const mapKeyToTitle = { classic: 'Classic', hybrid: 'Hybrid', volume: 'Volume' };
            const items = groups[selectedGroup] || [];
            return (
              <>
                <button className="back-btn" onClick={() => { setSelectedGroup(null); scrollToSection(); }}>
                  ← Back to Categories
                </button>
                <h3 style={{color: '#fff', marginBottom: '1rem', marginTop: '0.5rem'}}>{mapKeyToTitle[selectedGroup]}</h3>
                <div className="products-grid">
                  {items.map(product => (
                    <div
                      key={product.id}
                      className="product-card"
                      onClick={() => handleSelectProduct(product.name)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectProduct(product.name); } }}
                    >
                      <div className="product-image">
                        <img src={product.image} alt={product.name} />
                      </div>
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p className="product-description">{product.description}</p>
                        <div className="product-details">
                          <span className="duration">{product.duration}</span>
                          <span className="price">₵{product.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {selectedGroup && (
        <div className="booking-section" ref={bookingFormRef}>
          <h2>Book Your Cluster Lashes</h2>
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="product">Selected Product</label>
              <input
                type="text"
                id="product"
                name="product"
                value={formData.product}
                onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                placeholder="Choose a product above or enter here"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="timeSlot">Preferred Time Slot *</label>
              <select
                id="timeSlot"
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a time slot</option>
                <option value="9:00 AM">9:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="1:00 PM">1:00 PM</option>
                <option value="2:00 PM">2:00 PM</option>
                <option value="3:00 PM">3:00 PM</option>
                <option value="4:00 PM">4:00 PM</option>
                <option value="5:00 PM">5:00 PM</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Additional Notes</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Any special requests or notes..."
              />
            </div>
            
            <button type="submit" className="submit-btn">
              Submit Booking
            </button>
          </form>
        </div>
        )}
      </div>
    </div>
  );
};

export default ClusterLashes;
