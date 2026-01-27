import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MusicHub API",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:34" }],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"], 
};

export const swaggerSpec = swaggerJSDoc(options);
