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
    const missvars = requiredEnvviable.filter((v) => !process.env[v])

    if(missvars.length > 0){
        throw new Error(
            `${missvars.join(" , ")} : is missing required variable in env file `
        )
    }
}

module.exports = validateEnv