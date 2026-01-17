const parseEnvNumber = (value, fallback) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const baseConfig = {
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};

module.exports = {
  development: {
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'tech_challenge_blog',
    host: process.env.DB_HOST || 'localhost',
    port: parseEnvNumber(process.env.DB_PORT, 5432),
    dialect: 'postgres',
    ...baseConfig,
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: process.env.DATABASE_URL
    ? {
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
        ...baseConfig,
      }
    : {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: parseEnvNumber(process.env.DB_PORT, 5432),
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
        ...baseConfig,
      },
};
