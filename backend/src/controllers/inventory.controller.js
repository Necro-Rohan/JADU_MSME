const inventoryService = require("../services/inventory.service");
const logger = require("../utils/logger");

class InventoryController {
  async getExpiring(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const batches = await inventoryService.getExpiringBatches(days);
      res.json(batches);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  }

  async list(req, res) {
    try {
      const items = await inventoryService.getAllItems();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  }

  async categories(req, res) {
    try {
      const categories = await inventoryService.getAllCategories();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  }

  async create(req, res) {
    try {
      const item = await inventoryService.createItem(req.body);
      res.status(201).json(item);
    } catch (err) {
      logger.error("Create Item Error", err);
      res.status(500).json({ error: "Failed to create item" });
    }
  }

  async update(req, res) {
    try {
      const item = await inventoryService.updateItem(req.params.id, req.body);
      res.json(item);
    } catch (err) {
      logger.error("Update Item Error", err);
      res.status(500).json({ error: "Failed to update item" });
    }
  }

  async delete(req, res) {
    try {
      await inventoryService.deleteItem(req.params.id);
      res.json({ message: "Item deleted successfully" });
    } catch (err) {
      logger.error("Delete Item Error", err);
      res.status(500).json({ error: "Failed to delete item" });
    }
  }

  async adjustStock(req, res) {
    try {
      const result = await inventoryService.adjustStock(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      logger.error("Adjust Stock Error", err);
      res.status(500).json({ error: "Failed to adjust stock" });
    }
  }

  async importItems(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const count = await inventoryService.importFromCsv(req.file.path);
      res.json({ message: `Successfully imported ${count} items` });
    } catch (err) {
      logger.error("Import Error", err);
      res.status(500).json({ error: "Failed to import items" });
=======

  async adjustStock(req, res) {
    try {
      const { itemId, batchId, quantityChange, reason } = req.body;
      const prisma = require("../utils/prisma");
      
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update Batch
        const batch = await tx.inventoryBatch.findUnique({ where: { id: batchId } });
        if (!batch) throw new Error("Batch not found");

        const newQty = batch.quantity + parseInt(quantityChange);
        if (newQty < 0) throw new Error("Resulting quantity cannot be negative");

        await tx.inventoryBatch.update({
          where: { id: batchId },
          data: { quantity: newQty }
        });

        // 2. Create Transaction Log
        await tx.inventoryTransaction.create({
          data: {
            itemId,
            batchId,
            changeType: 'ADJUSTMENT',
            quantityChange: parseInt(quantityChange),
            referenceId: reason || 'MANUAL'
          }
        });

        return { newQty };
      });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error("Adjust Stock Error", error);
      res.status(400).json({ error: error.message });

    }
  }
}

module.exports = new InventoryController();
