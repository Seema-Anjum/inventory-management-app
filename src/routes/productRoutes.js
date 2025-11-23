const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const productController = require("../controllers/productController");

router.get("/", productController.getProducts);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.get("/search", productController.searchProducts);
router.get("/:id/history", productController.getHistory);
router.get("/export", productController.exportCSV);
router.post("/import", upload.single("file"), productController.importCSV);

module.exports = router;
