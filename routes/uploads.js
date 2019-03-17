const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid/v4');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(23);
    
    let middlePath = file.fieldname;
    //! console.log(req.headers.path);
    cb(null, 'uploads/images/' + middlePath)
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + uuid() + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const uploadCategoryImage = multer({ storage: storage, fileFilter: fileFilter }).single('categories');
const uploadProductImage = multer({ storage: storage, fileFilter: fileFilter }).single('products');



router.put('/product-image', uploadProductImage, (req, res, next) => {
  
  if (!req.file) {
    return res.status(200).json({ message: '!לא סיפקת תמונה למוצר' });
  }
  
  
  if (req.body.oldImagePath) {
    clearImage('uploads/images/products/' + req.body.oldImagePath);
  }
  
  return res.status(201).json({ message: 'File stored.', filePath: req.file.filename });
})




router.put('/category-image', uploadCategoryImage, (req, res, next) => {
    console.log(req.body);
    
  if (!req.file) {
    return res.status(200).json({ message: '!לא סיפקת תמונה למוצר' });
  }
  
  
  if (req.body.oldImagePath) {
    clearImage('uploads/images/company-logos/' + req.body.oldImagePath);
  }
  
  return res.status(201).json({ message: 'File stored.', filePath: req.file.filename });
  
})

const clearImage = filePath => {
  fs.unlink(filePath, err => console.log(err));
}

module.exports= router;



