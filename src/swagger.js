import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MusicHub API",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:34" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"], 
};

export const swaggerSpec = swaggerJSDoc(options);
