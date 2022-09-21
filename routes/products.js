var express = require('express');
var router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const utils = require("../utils/common");
const util = require('util')

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'data/');
  },
  filename: function(req, file, cb) {
      cb(null, "products.json");
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


const fetchWarehouseData = async () => {
  let productsData = await utils.readDataFromFile("products"); 
  let inventoryData = await utils.readDataFromFile("inventory");

  if (productsData !== undefined && inventoryData !== undefined && productsData.products.length > 0 && inventoryData.inventory.length > 0) {
    return [productsData, inventoryData]
  }
  else {
    throw new Error('Data not found')
  }
}

/* Upload products data */
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
    res.json({ message: "Successfully uploaded products from file" }) 
  })	
});


/* Get products list */
router.get("/", function (req, res, next) {     
  fetchWarehouseData()
  .then((warehouseData) => {
    res.json(warehouseData[0]);
      console.log('Success: Fetched all products');
  })
  .catch((err) => {
    res.status(400).send({"Error": "Failed to get products list"})
    console.log('Error: ' + err)
  });  
});

/* Get available products with stock quantity */
router.get("/available", function (req, res, next) {  
  try {    
    fetchWarehouseData()
    .then((warehouseData) => {
      availableProducts = utils.getAvailableProducts(warehouseData);

      if (availableProducts.length > 0) {        
        res.json({availableProducts: [...availableProducts]});
        console.log('Success: Fetched all available products');
      }
      else{
        res.status(400).send({"Error": "All products are out of stock"})
        console.log('Error: All products are out of stock')
      }
    })              
  }
  catch (err) {
    res.status(400).send({"Error": "Failed to get available products"})
    console.log('Error: ' + err)
  }
});


/* Sell product. Can be extended to support multiple quantity sold.*/
router.put('/sell/:id', async (req, res) => {
  try {
      const productName = req.params.id;
      fetchWarehouseData()
      .then((warehouseData) => {
      updatedData = utils.sellProduct(warehouseData, productName);

      if (updatedData) {   
        let inventoryData = JSON.stringify({inventory : updatedData}, null, 2);

        //Update the inventory.json file
        fs.writeFileSync(path.join(__dirname, '../data/inventory.json'), inventoryData, function(err, result) {
          if(err) console.log('error', err);
        });

        res.json({ message: "Sold 1 quantity of product" + productName + ". Inventory is updated." })       
      }
      else{
        res.status(400).send({"Error": "All products are out of stock"})
        console.log('Error: All products are out of stock')
      }
    })      
  } catch (error) {
      res.status(400).json({ message: error.message})
  }
})


module.exports = router;
