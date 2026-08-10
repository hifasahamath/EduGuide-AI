const UserModel = require('../models/userModel');

exports.getAllUsers = async (req, res) => {
  try {
    const data = await UserModel.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const data = await UserModel.getById(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const data = await UserModel.update(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const data = await UserModel.block(req.params.id, req.body.blocked);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to block/unblock user' });
  }
};

exports.changeRole = async (req, res) => {
  try {
    const data = await UserModel.updateRole(req.params.id, req.body.role);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to change role' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await UserModel.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
