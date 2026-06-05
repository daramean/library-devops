const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/book.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');

router.use(protect);

router.get ('/',          ctrl.getBooks);
router.get ('/export',    restrictTo('admin','librarian'), ctrl.exportBooks);
router.get ('/:id',       ctrl.getBook);
router.post('/',          restrictTo('admin','librarian'), upload.single('cover'), ctrl.createBook);
router.put ('/:id',       restrictTo('admin','librarian'), upload.single('cover'), ctrl.updateBook);
router.delete('/:id',     restrictTo('admin'),             ctrl.deleteBook);

module.exports = router;
