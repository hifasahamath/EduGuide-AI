const { db } = require('../config/firebaseConfig');
const dbService = require('../services/dbService');

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await dbService.authenticateUser(email, password);
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });

      const activityRef = db.collection('users').doc(user.id).collection('activity');
      await activityRef.add({
        type: 'login',
        description: 'Admin logged in',
        device: req.headers['user-agent']?.slice(0, 100) || 'Unknown',
        ip: req.ip || 'Unknown',
        timestamp: new Date()
      });

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone || '',
          profilePic: user.profilePic || '',
          schoolName: user.schoolName || '',
          address: user.address || '',
          age: user.age || '',
          language: user.language || 'English',
          twoFactorEnabled: user.twoFactorEnabled || false,
          aiSettings: user.aiSettings || { mode: 'Smart', fallbackEnabled: true, fallbackMessage: "Sorry, I couldn't clearly understand your question. Please contact our customer care agent at 0754864688 for further assistance." },
          notifications: user.notifications || { failedQueries: true, newUsers: true },
          contact: user.contact || { whatsapp: '', supportEmail: '' },
        }
      });
    } catch (error) {
      console.error('LOGIN ERROR FULL:', error);
      res.status(500).json({
        error: error.message,
        stack: error.stack
      });
    }
  },  // ✅ FIXED: was missing this closing brace + comma

  register: async (req, res) => {
    try {
      const { email, password, name, role, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const assignedRole = role === 'admin' ? 'admin' : 'student';

      const result = await dbService.registerUser({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        phone: phone || '',
        role: assignedRole,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });

      if (!result.success) return res.status(400).json({ error: result.error });

      if (result.id) {
        try {
          await db.collection('users').doc(result.id).collection('activity').add({
            type: 'registration', description: 'Account created', timestamp: new Date()
          });
        } catch { /* non-critical */ }
      }

      res.status(201).json({ message: 'Registration successful', userId: result.id });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await dbService.getUserProfile(id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      delete user.password;
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, profilePic, role } = req.body;
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (profilePic !== undefined) updateData.profilePic = profilePic;
      if (role !== undefined) updateData.role = role;
      updateData.updatedAt = new Date();

      await dbService.updateUserProfile(id, updateData);

      await db.collection('users').doc(id).collection('activity').add({
        type: 'profile_update', description: 'Profile information updated', timestamp: new Date()
      });

      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

      const userDoc = await db.collection('users').doc(id).get();
      if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
      const userData = userDoc.data();
      if (userData.password !== currentPassword) return res.status(401).json({ error: 'Current password is incorrect' });

      await db.collection('users').doc(id).update({ password: newPassword, updatedAt: new Date() });

      await db.collection('users').doc(id).collection('activity').add({
        type: 'password_change', description: 'Password changed', timestamp: new Date()
      });

      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to change password' });
    }
  },

  updateAiSettings: async (req, res) => {
    try {
      const { id } = req.params;
      const { mode, fallbackEnabled, fallbackMessage } = req.body;
      const aiSettings = { mode, fallbackEnabled, fallbackMessage, updatedAt: new Date() };
      await db.collection('users').doc(id).update({ aiSettings });

      await db.collection('users').doc(id).collection('activity').add({
        type: 'ai_settings', description: `AI mode set to ${mode}, fallback ${fallbackEnabled ? 'enabled' : 'disabled'}`, timestamp: new Date()
      });

      res.status(200).json({ message: 'AI settings saved' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save AI settings' });
    }
  },

  updateNotifications: async (req, res) => {
    try {
      const { id } = req.params;
      const { failedQueries, newUsers } = req.body;
      await db.collection('users').doc(id).update({ notifications: { failedQueries, newUsers } });
      res.status(200).json({ message: 'Notification preferences saved' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save notifications' });
    }
  },

  updateContact: async (req, res) => {
    try {
      const { id } = req.params;
      const { whatsapp, supportEmail } = req.body;
      await db.collection('users').doc(id).update({ contact: { whatsapp, supportEmail } });
      res.status(200).json({ message: 'Contact settings saved' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save contact settings' });
    }
  },

  getActivityLog: async (req, res) => {
    try {
      const { id } = req.params;
      const snapshot = await db.collection('users').doc(id).collection('activity').get();

      const logs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const ta = a.timestamp?._seconds || 0;
          const tb = b.timestamp?._seconds || 0;
          return tb - ta;
        })
        .slice(0, 30);

      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load activity log' });
    }
  },

  logActivity: async (req, res) => {
    try {
      const { id } = req.params;
      const { type, description } = req.body;
      await db.collection('users').doc(id).collection('activity').add({
        type, description, timestamp: new Date()
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to log activity' });
    }
  }
};

module.exports = authController;