import Razorpay from 'razorpay';

export default async ({ req, res, log, error }) => {
  // 1. Validate environment variables
  const KEY_ID = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_SECRET_KEY;

  if (!KEY_ID || !KEY_SECRET) {
    error('Missing RAZORPAY_KEY_ID or RAZORPAY_SECRET_KEY environment variables');
    return res.json({ success: false, message: 'Server configuration error' }, 500);
  }

  // 2. Parse request body
  const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}` } = req.body;

  if (!amount) {
    return res.json({ success: false, message: 'Amount is required' }, 400);
  }

  try {
    // 3. Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    });

    // 4. Create Razorpay order
    // Note: Amount should be in the smallest currency unit (e.g. paise for INR)
    const options = {
      amount: Math.round(amount * 100), // convert rupees to paise
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    log(`Order created: ${order.id} for amount: ${amount}`);
    
    return res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    error(`Razorpay Error: ${err.message}`);
    return res.json({ success: false, message: 'Failed to create Razorpay order', details: err.message }, 500);
  }
};
