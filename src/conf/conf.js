const conf = {
    appwriteUrl: String(import.meta.env.VITE_APPWRITE_ENDPOINT),
    appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteProjectName: String(import.meta.env.VITE_APPWRITE_PROJECT_NAME),
}

export default conf;