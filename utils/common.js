const fs = require("fs");
const path = require("path");

function readDataFromFile(filename){
    return new Promise((resolve, reject) => {
        let fileData = '';
        const read = fs.createReadStream(path.join(__dirname, "../data/"+filename+".json"));
        read.on("data", function (chunk) {
            fileData += chunk;
        });
        read.on('error', error => reject(new Error('Cannot read data')));
        read.on("end", () => resolve(JSON.parse(fileData)));
    });
}

function getAvailableProducts(warehouseData) {
    let productsData = warehouseData[0].products;
    let inventoryData = warehouseData[1].inventory;

    let availableProducts = [];
    
    for (const product of productsData) {        
        let qty = [];        

        for (const article of product.contain_articles) {
            let foundArticle = inventoryData.find(o => o.art_id == article.art_id);
            qty.push(Math.floor(foundArticle.stock/article.amount_of));
        }
        let stock = Math.min(...qty);
        if (stock > 0) {            
            availableProducts.push({"name" : product.name, "stock" : stock });
        }
    } 
    
    return availableProducts;
}

function sellProduct(warehouseData, productName) {
    let productsData = warehouseData[0].products;
    let inventoryData = warehouseData[1].inventory;

    let updatedData = inventoryData;
    let availableProducts = getAvailableProducts(warehouseData);
    
    let productStock = availableProducts.find(o => o.name.toLowerCase() == productName.toLowerCase());
    
    let product = productsData.find(o => o.name.toLowerCase() === productName.toLowerCase());
    if (product && productStock && productStock.stock > 0) {
        let newInventory = [];
        for (let article of product.contain_articles) {            
            inventoryData.map((inventory) => {
                if (inventory.art_id === article.art_id) {  
                    if (parseInt(inventory.stock) >= parseInt(article.amount_of)) {            
                        let newQty = parseInt(inventory.stock) - parseInt(article.amount_of);
                        inventory.stock = newQty;
                    
                        newInventory.push(
                        {
                            "art_id": inventory.art_id,
                            "name": inventory.name,
                            "stock": newQty.toString()
                        }); 
                    }
                }
            });
        }
        const newInventoryByArtId = newInventory.reduce((inv, article) => {
            inv[article.art_id] = article;
            return inv;
          }, {});

        updatedData = inventoryData.map((article) => 
            newInventoryByArtId[article.art_id] ? newInventoryByArtId[article.art_id] : article);             
                  
           
    }   
    return updatedData;
}

module.exports = { readDataFromFile, getAvailableProducts, sellProduct }
