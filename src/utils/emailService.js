import emailjs from "@emailjs/browser";
import conf from "../conf/conf.js";

let _initialized = false;

/**
 * Lazily initialise EmailJS once with the public key.
 * Safe to call multiple times — only runs once.
 */
const init = () => {
  if (_initialized) return;
  emailjs.init({ publicKey: conf.emailjsPublicKey });
  _initialized = true;
};

/**
 * Send an order-confirmation email to the customer AND
 * an admin-alert email to the store inbox.
 *
 * @param {object} orderData
 * @param {string} orderData.orderId        - e.g. "AB12CD34"
 * @param {string} orderData.customerName   - e.g. "Ravi Sharma"
 * @param {string} orderData.customerEmail  - customer's email address
 * @param {string} orderData.amount         - formatted, e.g. "₹450.00"
 * @param {string} orderData.paymentMode    - "COD" | "Card" | "UPI"
 * @param {string} orderData.deliveryDate   - e.g. "21-04-2026"
 * @param {string} orderData.itemsList      - human-readable items string
 * @param {string} orderData.shippingAddress - formatted address string
 */
export const sendOrderEmail = async ({
  orderId,
  customerName,
  customerEmail,
  amount,
  paymentMode,
  deliveryDate,
  itemsList,
  shippingAddress,
}) => {
  try {
    init();

    const templateParams = {
      order_id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      amount,
      payment_mode: paymentMode,
      delivery_date: deliveryDate,
      items_list: itemsList,
      shipping_address: shippingAddress,
      // EmailJS will send to "to_email" defined in the template
      to_email: customerEmail,
      // Also notifies admin — handled by Reply-To / CC in the EmailJS template
      admin_email: "truesoilorganic@gmail.com",
    };

    await emailjs.send(
      conf.emailjsServiceId,
      conf.emailjsOrderTemplateId,
      templateParams
    );

    console.log("✅ Order confirmation email sent via Gmail");
  } catch (err) {
    // Fire-and-forget — never block the order flow
    console.error("❌ EmailJS order email failed:", err);
  }
};

/**
 * Send a contact-form enquiry email to the store inbox.
 *
 * @param {object} formData
 * @param {string} formData.name
 * @param {string} formData.email
 * @param {string} formData.phone
 * @param {string} formData.subject
 * @param {string} formData.message
 */
export const sendContactEmail = async ({
  name,
  email,
  phone,
  subject,
  message,
}) => {
  try {
    init();

    const templateParams = {
      from_name: name,
      from_email: email,
      phone: phone || "Not provided",
      subject,
      message,
      to_email: "truesoilorganic@gmail.com",
    };

    await emailjs.send(
      conf.emailjsServiceId,
      conf.emailjsContactTemplateId,
      templateParams
    );

    console.log("✅ Contact form email sent via Gmail");
  } catch (err) {
    console.error("❌ EmailJS contact email failed:", err);
    throw err; // re-throw so ContactUs can show the right state
  }
};
