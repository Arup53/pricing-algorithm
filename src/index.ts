import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

async function getAllProducts() {
  const products = await prisma.product.findMany();

  return products;
}

async function updateProductPrices() {
  try {
    // Fake products data
    const products = await getAllProducts();

    // Fake sales rate per product ID (some have 0 to simulate fallback)
    const productSalesRate: Record<number, number> = {
      1: 5.2,
      2: 0,
      3: 2.7,
    };

    // Fallback average sales per category
    const categorySalesRate: Record<string, number> = {
      Snacks: 4.0,
      Drinks: 3.5,
      Bakery: 3.0,
    };
    // Mocked settings
    const settings = {
      alpha: 0.4,
      beta: 0.3,
      gamma: 0.3,
      max_shelf_life: 30,
      max_sales_rate: 10,
      max_shelf_time: 30,
      min_price_ratio: 0.5,
    };

    for (const product of products) {
      const { id, originalPrice, expiryDate, dateAdded, category } = product;

      const daysToExpiry = Math.ceil(
        (+new Date(expiryDate) - +new Date()) / (1000 * 60 * 60 * 24)
      );

      const shelfTime = Math.ceil(
        (+new Date() - +new Date(dateAdded)) / (1000 * 60 * 60 * 24)
      );

      let salesRate = productSalesRate[id];
      if (!salesRate || salesRate === 0) {
        salesRate = categorySalesRate[category] || 0;
      }

      const {
        alpha,
        beta,
        gamma,
        max_shelf_life,
        max_sales_rate,
        max_shelf_time,
        min_price_ratio,
      } = settings;

      const expiryFactor = 1 - daysToExpiry / max_shelf_life;
      const demandFactor = 1 - salesRate / max_sales_rate;
      const shelfTimeFactor = shelfTime / max_shelf_time;
      const discount =
        alpha * expiryFactor + beta * demandFactor + gamma * shelfTimeFactor;

      let newPrice = originalPrice * (1 - discount);
      const minPrice = originalPrice * min_price_ratio;
      newPrice = Math.max(newPrice, minPrice);

      const updatePrice = await prisma.product.update({
        data: {
          originalPrice: newPrice,
        },
        where: {
          id: id,
        },
      });
      console.log(updatePrice);
      console.log(`Product ${id} (${category}):`);
      console.log(`  Original Price: ₹${originalPrice}`);
      console.log(`  Days to Expiry: ${daysToExpiry}`);
      console.log(`  Shelf Time: ${shelfTime} days`);
      console.log(`  Sales Rate: ${salesRate}`);
      console.log(`  New Price: ₹${newPrice.toFixed(2)}\n`);
    }

    console.log("Price simulation completed.");
  } catch (error) {
    console.error("Error simulating product price update:", error);
  }
}

// Run immediately (or you can still schedule it)
updateProductPrices();

async function postData(price: any, expiraryDate: any, category: any) {
  const newUser = await prisma.product.create({
    data: {
      originalPrice: price,
      expiryDate: expiraryDate,
      category: category,
    },
  });

  console.log(newUser);
}

// postData(200, "2025-05-18T00:00:00.000Z", "Snacks");
// postData(150, "2025-05-25T00:00:00.000Z", "Snacks");
