import React, { useEffect } from 'react';

function ContactUs() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>ContactUs</div>
  );
}

export default ContactUs;