const { FounderProfile } = require('../models');
const { Op } = require('sequelize');

const upsertProfile = async (userId, data) => {
  const founderProfile = await FounderProfile.findOne({ where: { user_id: userId } });
  if (founderProfile) {
    await founderProfile.update(data);
    return founderProfile;
  } else {
    return FounderProfile.create({ user_id: userId, ...data });
  }
};

const getProfile = async (userId) => {
  return FounderProfile.findOne({ where: { user_id: userId } });
};

module.exports = { upsertProfile, getProfile };