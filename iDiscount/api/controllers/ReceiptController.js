/**
 * ReceiptController
 *
 * @description :: Server-side logic for managing Receipts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDiscount() {
  return getRandomIntInclusive(5, 20);
}

module.exports = {
  // Create function
  create: function(req, res) {
    if (req.method == "POST") {
      console.log(req.body.Receipt)
      let cur_receipt = req.body.Receipt;

      cur_receipt.token = jwt.sign({ 
        discount: randomDiscount(),
        shop: '..... ToDo .....'
      }, 'temporarySecretKey');

      QRCode.draw(cur_receipt.token, (error,canvas) => {
        cur_receipt.QrCode = canvas.toDataURL();

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

