const express = require('express');
const User = require('../models/User');
const { authenticate, authorize, checkResourceAccess } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

async function countActiveAdmins(excludeUserId) {
  const q = { role: 'admin', isActive: true };
  if (excludeUserId) {
    q._id = { $ne: excludeUserId };
  }
  return User.countDocuments(q);
}

// @route   GET /api/users
// @desc    Get all users (admin, trainer, or student for own data)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    const query = {};
    
    // Role-based filtering
    if (req.user.role === 'student') {
      // Students can only see themselves
      query._id = req.user._id;
    } else if (req.user.role === 'trainer') {
      // Trainers can see students and other trainers, but not admins
      if (role && role !== 'admin') {
        query.role = role;
      }
    } else if (req.user.role === 'admin') {
      // Admins can see everyone
      if (role) {
        query.role = role;
      }
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('enrolledCourses', 'title code');

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, checkResourceAccess('user'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('enrolledCourses', 'title code instructor')
      .populate('enrolledCourses.instructor', 'firstName lastName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', authenticate, checkResourceAccess('user'), validateUserUpdate, async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, address, role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields based on user role
    if (req.user.role === 'admin') {
      const targetRole = role !== undefined ? role : user.role;
      const targetActive = isActive !== undefined ? isActive : user.isActive;

      if (user.role === 'admin' && targetRole !== 'admin') {
        const otherAdmins = await countActiveAdmins(user._id);
        if (otherAdmins < 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot change role: at least one active administrator must remain.'
          });
        }
      }

      if (user.role === 'admin' && targetActive === false) {
        const otherAdmins = await countActiveAdmins(user._id);
        if (otherAdmins < 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot deactivate the last active administrator.'
          });
        }
      }

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone !== undefined) user.phone = phone;
      if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
      if (address) user.address = address;
      if (role !== undefined) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
    } else {
      // Users can only update their own profile (excluding role and isActive)
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone !== undefined) user.phone = phone;
      if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
      if (address) user.address = address;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    if (user.role === 'admin') {
      const otherAdmins = await countActiveAdmins(user._id);
      if (otherAdmins < 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last administrator account.'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// @route   POST /api/users/:id/deactivate
// @desc    Deactivate user (admin only)
// @access  Private (Admin)
router.post('/:id/deactivate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating user'
    });
  }
});

// @route   POST /api/users/:id/activate
// @desc    Activate user (admin only)
// @access  Private (Admin)
router.post('/:id/activate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User activated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating user'
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview (admin only)
// @access  Private (Admin)
router.get('/stats/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users (admin only)
// @access  Private (Admin)
router.get('/search', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
      .select('firstName lastName email role')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

module.exports = router;
