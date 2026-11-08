const requiredEnvviable = [
    'PORT',
    'MONGO_URI',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
];

const validateEnv = () => {
    const missingVars = requiredEnvviable.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVars.join(', ')}`,
        );
    }
};

module.exports = validateEnv;
