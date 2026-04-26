// swagger.js – OpenAPI 3.0 specification for Startup Radar backend
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Startup Radar API',
      version: '1.0.0',
      description: 'Auto‑generated API documentation for Startup Radar backend',
    },
    servers: [{ url: 'http://localhost:3001' }],
  },
  // Paths to the API files where annotations are used (we will generate manually below)
  apis: [],
};

const swaggerSpec = {
  openapi: '3.0.0',
  info: { title: 'Startup Radar API', version: '1.0.0', description: 'API documentation' },
  servers: [{ url: 'http://localhost:3001' }],
  paths: {
    '/api/auth/register': {
      post: { summary: 'Register a new user', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: {type:'string'}, password:{type:'string'} }, required:['email','password'] } } } }, responses: {201:{description:'Created'},400:{description:'Bad Request'} } }
    },
    '/api/auth/login': {
      post: { summary: 'Login and obtain JWT', requestBody: { required:true, content:{'application/json':{schema:{type:'object',properties:{email:{type:'string'},password:{type:'string'}},required:['email','password']}}}}, responses:{200:{description:'OK'},401:{description:'Unauthorized'} } }
    },
    '/api/messages': {
      get: { summary: 'Get all messages', responses:{200:{description:'OK'}} },
      post: { summary: 'Create a message', requestBody:{required:true,content:{'application/json':{schema:{type:'object'}}}}, responses:{201:{description:'Created'}} }
    },
    '/api/messages/unread': { get:{summary:'Get unread messages',responses:{200:{description:'OK'}}}},
    '/api/messages/thread': { get:{summary:'Get message thread',responses:{200:{description:'OK'}}}},
    '/api/messages/{id}/read': { patch:{summary:'Mark message as read',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{200:{description:'OK'}}}}
  }
};

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = { setupSwagger, swaggerSpec };
