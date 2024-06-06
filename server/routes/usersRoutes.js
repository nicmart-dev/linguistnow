const express = require('express');
const router = express.Router();

const usersController = require('../controllers/usersController');

// Route for getting all users
router.get('/', usersController.getAll);

// Route for getting a user by ID
router.get('/:id', usersController.getOne);

// Route for creating a new user
router.post('/', usersController.create);

// Route for updating a user by ID
router.put('/:id', usersController.update);

// Route for deleting a user by ID
router.delete('/:id', usersController.remove);

module.exports = router;
