var express = require('express');
var router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const utils = require("../utils/common");

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'data/');
  },
  filename: function(req, file, cb) {
      cb(null, "inventory.json");
  }
});

const fileUpload = multer({ 
  storage: storage,
  fileFilter: function(_req, file, cb){    
    if (path.extname(file.originalname).toLowerCase() !== '.json') {
      return cb(new Error('Only JSON files allowed'))
    }
    cb(null, true);
  }
}).single('file')

/* Upload Inventory. */
router.post("/upload", (req, res) => {
  
  fileUpload(req, res, (err) => {
    if (err){
      return res.status(400).send({"Error": err.message})
    }

    if (req.file === undefined) {      
      return res.status(400).send({"Error": "Input file is missing"})
    }

    console.log('Uploaded the file')
    const { filename: file } = req.file;  
    res.json({ message: "Successfully uploaded articles from file" }); 
    
  })	
});


/* Get inventory list. */
router.get("/", function (req, res, next) {  
  try {
    let invData = '';
    const read = fs.createReadStream(path.join(__dirname, "../data/inventory.json"));
    read.on("data", function (chunk) {
      invData += chunk;
    });
    read.on('error', function(err) {
      console.log("Error in createReadStream : " + err.message);
      return next(new Error('Cannot retrive data'))
    });
    read.on("end", function () {
      res.status(200).send(JSON.parse(invData));
    });    
  }
  catch (err) {
    res.status(400).send({"Error": err.message})
  }
});


module.exports = router;
