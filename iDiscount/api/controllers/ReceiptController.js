/**
 * ReceiptController
 *
 * @description :: Server-side logic for managing Receipts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const shops = [
  {
    name: "shop_1",
    uuid: "e031cced-1ce9-42c6-a936-83c78157d268",
    major: "4128",
    minor: "4129"
  },
  {
    name: "shop_2",
    uuid: "e031cced-1ce9-42c6-a936-83c78157d268",
    major: "21845",
    minor: "4369"
  }
];

const SECRET_KEY = 'temporarySecretKey';

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDiscount() {
  return getRandomIntInclusive(5, 20);
}

function randomShop() {
  return shops[getRandomIntInclusive(0, shops.length - 1)].name; 
}

module.exports = {
  // Create function
  create: function(req, res) {
    if (req.method == "POST") {

      let cur_receipt = req.body.Receipt;

      cur_receipt.token = jwt.sign({ 
        discount: randomDiscount(),
        origin_shop: randomShop(),
        target_shop: randomShop()
      }, SECRET_KEY);

      QRCode.draw(cur_receipt.token, (error,canvas) => {
        cur_receipt.QrCode = canvas.toDataURL();

        cur_receipt.activated = false;
        cur_receipt.redeemed = false;

        Receipt.create(cur_receipt).exec( function(err, model) {
          return res.send("Successfully Created!");
        });
      });
      
    }
    else {
      return res.view('receipt/create');
    }
  },
  // json function
  json: function(req, res) {
    Receipt.find().exec( function(err, receipts) {
      return res.json(receipts);
    });
  },
  // index function
  index: function(req, res) {
    Receipt.find().exec( function(err, receipts) {
      return res.view('receipt/index', {'receipts': receipts});
    });
  },
};

