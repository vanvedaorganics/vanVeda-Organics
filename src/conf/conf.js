const conf = {
    appwriteUrl: String(import.meta.env.VITE_APPWRITE_ENDPOINT),
    appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteProjectName: String(import.meta.env.VITE_APPWRITE_PROJECT_NAME),
    appwriteDatabaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    appwriteProductsCollection: String(import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID),
    appwriteCategoriesCollection: String(import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID),
    appwriteUsersCollection: String(import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID),
    appwriteCartsCollection: String(import.meta.env.VITE_APPWRITE_CARTS_COLLECTION_ID),
    appwriteOrdersCollection: String(import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID),
    appwriteBucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
}

export default conf;