import { Client, Databases, Query, ID, Permission, Role } from "node-appwrite";

/**
 * Auto Order Generator - Appwrite Function
 * 
 * This function runs on a schedule to automatically place orders for active subscriptions.
 * It processes subscriptions where nextOrderAt <= current time.
 * 
 * Environment Variables Required:
 * - APPWRITE_FUNCTION_API_ENDPOINT: Appwrite endpoint
 * - APPWRITE_FUNCTION_PROJECT_ID: Project ID
 * - APPWRITE_API_KEY: API key with permissions to read/write collections
 * - DATABASE_ID: Database ID
 * - SUBSCRIPTIONS_COLLECTION_ID: Subscriptions collection ID
 * - ORDERS_COLLECTION_ID: Orders collection ID
 * - PRODUCTS_COLLECTION_ID: Products collection ID
 * - USERS_COLLECTION_ID: Users collection ID
 */

// Initialize Appwrite client
const initClient = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  return new Databases(client);
};

// Configuration
const config = {
  databaseId: process.env.DATABASE_ID,
  subscriptionsCollectionId: process.env.SUBSCRIPTIONS_COLLECTION_ID,
  ordersCollectionId: process.env.ORDERS_COLLECTION_ID,
  productsCollectionId: process.env.PRODUCTS_COLLECTION_ID,
  usersCollectionId: process.env.USERS_COLLECTION_ID,
};

// Helper: Calculate next order date based on interval
const calculateNextOrderDate = (interval) => {
  const now = new Date();
  const next = new Date(now);
  
  if (interval === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else if (interval === "weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    // Default to monthly if interval is unknown
    next.setMonth(next.getMonth() + 1);
  }
  
  return next.toISOString();
};

// Helper: Format date as dd-mm-yyyy
const formatDdMmYyyy = (date) => {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// Helper: Calculate delivery date (7 days from now)
const calculateDeliveryDate = () => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  return formatDdMmYyyy(deliveryDate);
};


/**
 * Fetch product details
 */
const getProduct = async (databases, productId) => {
  try {
    const product = await databases.getDocument(
      config.databaseId,
      config.productsCollectionId,
      productId
    );
    return product;
  } catch (error) {
    console.error(`Failed to fetch product ${productId}:`, error.message);
    return null;
  }
};

/**
 * Create an order from a subscription with retry logic
 */
const createOrderFromSubscription = async (databases, subscription, logger, retryCount = 0) => {
  const maxRetries = 3;
  
  try {
    // Extract IDs from relationship attributes (handle both string and object)
    const userId = typeof subscription.user_id === 'object' && subscription.user_id?.$id 
      ? subscription.user_id.$id 
      : subscription.user_id;
    
    const productId = typeof subscription.product_id === 'object' && subscription.product_id?.$id
      ? subscription.product_id.$id
      : subscription.product_id;

    // Fetch product details
    const product = await getProduct(databases, productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Parse packaging size from subscription (contains sizeLabel and price_cents)
    let packagingSize;
    try {
      packagingSize = JSON.parse(subscription.packaging_size);
    } catch (e) {
      throw new Error(`Invalid packaging_size format in subscription ${subscription.$id}`);
    }

    // Parse shipping address
    let shippingAddress;
    try {
      shippingAddress = typeof subscription.shippingAddress === "string" 
        ? JSON.parse(subscription.shippingAddress)
        : subscription.shippingAddress;
    } catch (e) {
      throw new Error(`Invalid shippingAddress format in subscription ${subscription.$id}`);
    }

    // Build order item using stored price from subscription
    const unitCents = packagingSize.price_cents || 0;
    const quantity = subscription.quantity || 1;
    const itemTotalCents = unitCents * quantity;

    const orderItem = {
      slug: productId,
      name: product.name || "Unknown Product",
      packaging_size: {
        sizeLabel: packagingSize.sizeLabel || null,
        price_cents: unitCents,
      },
      qty: quantity,
      discount: 0, // No discount for auto-orders, using stored price
      price_cents: unitCents,
      item_total_cents: itemTotalCents,
      categories: product.categories || null,
      batch: null, // Auto-orders don't use batch
    };

    const itemsPayload = {
      items: [orderItem],
      summary: {
        total_items: quantity,
        subtotal_cents: itemTotalCents,
        currency: "INR",
      },
    };

    // Create the order
    const orderId = ID.unique();
    const order = await databases.createDocument(
      config.databaseId,
      config.ordersCollectionId,
      orderId,
      {
        orderNumber: orderId,
        userId: userId,
        items: JSON.stringify(itemsPayload),
        shippingAddress: JSON.stringify(shippingAddress),
        total_cents: itemTotalCents,
        paymentStatus: "Pending",
        fulfillmentSattus: "pending",
        paymentMode: "COD",
      },
      [Permission.read(Role.user(userId))]
    );

    logger(`✓ Order created successfully: ${order.$id} for subscription ${subscription.$id}`);
    return order;
  } catch (error) {
    logger(`✗ Failed to create order for subscription ${subscription.$id} (attempt ${retryCount + 1}/${maxRetries}): ${error.message}`);
    
    // Retry logic
    if (retryCount < maxRetries - 1) {
      logger(`  Retrying... (attempt ${retryCount + 2}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      return createOrderFromSubscription(databases, subscription, logger, retryCount + 1);
    }
    
    // All retries failed
    throw error;
  }
};

/**
 * Update subscription after successful order placement
 */
const updateSubscriptionAfterOrder = async (databases, subscriptionId, orderId, interval, logger) => {
  try {
    const nextOrderAt = calculateNextOrderDate(interval);
    
    await databases.updateDocument(
      config.databaseId,
      config.subscriptionsCollectionId,
      subscriptionId,
      {
        nextOrderAt,
        lastOrderId: orderId,
      }
    );
    
    logger(`✓ Updated subscription ${subscriptionId}: nextOrderAt = ${nextOrderAt}, lastOrderId = ${orderId}`);
  } catch (error) {
    logger(`✗ Failed to update subscription ${subscriptionId}: ${error.message}`);
    throw error;
  }
};

/**
 * Pause subscription after multiple failures
 */
const pauseSubscription = async (databases, subscriptionId, logger) => {
  try {
    await databases.updateDocument(
      config.databaseId,
      config.subscriptionsCollectionId,
      subscriptionId,
      {
        status: "paused",
      }
    );
    
    logger(`⚠ Paused subscription ${subscriptionId} due to repeated failures`);
  } catch (error) {
    logger(`✗ Failed to pause subscription ${subscriptionId}: ${error.message}`);
  }
};

/**
 * Process all due subscriptions
 */
const processSubscriptions = async (databases, logger) => {
  const now = new Date();
  const nowISO = now.toISOString();
  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  
  try {
    logger(`🔍 Current time: ${nowISO}`);
    logger(`🔍 Querying subscriptions with status="active" and nextOrderAt <= ${nowISO}`);
    
    // Query for active subscriptions where nextOrderAt <= now
    const subscriptions = await databases.listDocuments(
      config.databaseId,
      config.subscriptionsCollectionId,
      [
        Query.equal("status", "active"),
        Query.lessThanEqual("nextOrderAt", nowISO),
        Query.limit(100), // Process max 100 subscriptions per run
      ]
    );

    logger(`\n📦 Found ${subscriptions.documents.length} subscriptions due for auto-order`);
    
    // Debug: Show all subscriptions if none found
    if (subscriptions.documents.length === 0) {
      logger(`\n⚠️ No subscriptions matched. Fetching all active subscriptions for debugging...`);
      const allActive = await databases.listDocuments(
        config.databaseId,
        config.subscriptionsCollectionId,
        [Query.equal("status", "active"), Query.limit(10)]
      );
      logger(`   Total active subscriptions: ${allActive.documents.length}`);
      if (allActive.documents.length > 0) {
        logger(`   Sample subscription dates:`);
        allActive.documents.forEach((sub, idx) => {
          logger(`   [${idx + 1}] ID: ${sub.$id}, nextOrderAt: ${sub.nextOrderAt}, status: ${sub.status}`);
        });
      }
    }
    logger('');

    for (const subscription of subscriptions.documents) {
      processedCount++;
      logger(`\n[${processedCount}/${subscriptions.documents.length}] Processing subscription ${subscription.$id}...`);
      
      try {
        // Create order with retry logic (up to 3 attempts)
        const order = await createOrderFromSubscription(databases, subscription, logger);
        
        // Update subscription with new nextOrderAt and lastOrderId
        await updateSubscriptionAfterOrder(databases, subscription.$id, order.$id, subscription.interval, logger);
        
        successCount++;
      } catch (err) {
        // All retries failed - pause the subscription
        logger(`✗ All retries failed for subscription ${subscription.$id}. Pausing subscription.`);
        await pauseSubscription(databases, subscription.$id, logger);
        failedCount++;
      }
    }

    return {
      processed: processedCount,
      successful: successCount,
      failed: failedCount,
    };
  } catch (err) {
    logger(`Error fetching subscriptions: ${err.message}`);
    throw err;
  }
};

/**
 * Main execution function
 */
export default async ({ req, res, log, error }) => {
  const startTime = Date.now();
  
  log(`\n${"=".repeat(60)}`);
  log("🤖 Auto Order Generator - Starting execution");
  log(`⏰ Time: ${new Date().toISOString()}`);
  log(`${"=".repeat(60)}\n`);

  try {
    // Validate environment variables
    const requiredEnvVars = [
      "DATABASE_ID",
      "SUBSCRIPTIONS_COLLECTION_ID",
      "ORDERS_COLLECTION_ID",
      "PRODUCTS_COLLECTION_ID",
      "USERS_COLLECTION_ID",
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
    }

    // Initialize Appwrite client
    const databases = initClient();
    
    // Process subscriptions
    const results = await processSubscriptions(databases, log);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log(`\n${"=".repeat(60)}`);
    log("✅ Auto Order Generator - Completed successfully");
    log(`📊 Results:`);
    log(`   - Processed: ${results.processed}`);
    log(`   - Successful: ${results.successful}`);
    log(`   - Failed (Paused): ${results.failed}`);
    log(`⏱️  Duration: ${duration}s`);
    log(`${"=".repeat(60)}\n`);

    return res.json({
      success: true,
      message: "Auto orders processed successfully",
      results,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    error(`\n${"=".repeat(60)}`);
    error("❌ Auto Order Generator - Failed");
    error(`Error: ${err.message}`);
    error(`⏱️  Duration: ${duration}s`);
    error(`${"=".repeat(60)}\n`);

    return res.json({
      success: false,
      error: err.message,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    }, 500);
  }
};
