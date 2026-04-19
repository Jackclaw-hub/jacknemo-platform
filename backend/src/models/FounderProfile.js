const { Model, DataTypes } = require('sequelize');

class FounderProfile extends Model {}

FounderProfile.init({
  user_id: {
    type: DataTypes.UUID,
    references: {
      model: 'users', // 'users' refers to the User model
      key: 'id'
    }
  },
  company_name: DataTypes.STRING,
  stage: DataTypes.STRING,
  sector: DataTypes.STRING,
  city: DataTypes.STRING,
  geo: DataTypes.STRING,
  team_size: DataTypes.INTEGER,
  description: DataTypes.TEXT
}, {
  sequelize, // We need to pass the connection instance
  modelName: 'founderProfile'
});

module.exports = FounderProfile;