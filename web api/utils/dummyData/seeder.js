const path = require("path");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
require("colors");

dotenv.config({ path: path.join(__dirname, "../../.env") });
const prisma = require("../../config/prismaClient");

// ─────────────────────────────────────────────────────────────
// 1. DESTROY DATA
// ─────────────────────────────────────────────────────────────
const destroyData = async () => {
  try {
    console.log("Cleaning database tables...".yellow);

    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.review.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.address.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.product.deleteMany();
    await prisma.subCategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.user.deleteMany();

    console.log("✅ All previous data wiped cleanly!".red.inverse);
    if (process.argv[2] === "-d") {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error destroying data:".red, error);
    if (process.argv[2] === "-d") {
      process.exit(1);
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// 2. INSERT NESTED SEED DATA
// ─────────────────────────────────────────────────────────────
const insertData = async () => {
  try {
    console.log("Starting nested database seeding (Category -> SubCategory -> Product)...".cyan.bold);

    // 1. Users
    const adminPassword = await bcrypt.hash("adminpassword123", 12);
    const managerPassword = await bcrypt.hash("managerpassword123", 12);
    const userPassword = await bcrypt.hash("userpassword123", 12);

    const adminUser = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@gmail.com",
        password: adminPassword,
        role: "admin",
      },
    });

    await prisma.user.create({
      data: {
        name: "Manager User",
        email: "manager@gmail.com",
        password: managerPassword,
        role: "manager",
      },
    });

    const standardUser = await prisma.user.create({
      data: {
        name: "Ahmed Saad",
        email: "ahmed@gmail.com",
        password: userPassword,
        role: "user",
      },
    });

    console.log("✅ Users seeded (Admin, Manager, User).".green);

    // 2. Categories
    const categoryDefs = [
      {
        name: "Electronics",
        slug: "electronics",
        image: "category-52dd5720-f260-4962-b1c8-a49ecbb986cf-1644261284325.jpeg",
      },
      {
        name: "Mobiles & Tablets",
        slug: "mobiles",
        image: "category-03b5fa15-7f8e-4895-a5d3-fa50574a698a-1784188980826.jpeg",
      },
      {
        name: "Laptops & Computers",
        slug: "laptops",
        image: "category-0741e208-2efd-4698-b87b-1600b4a894f2-1784201650538.jpeg",
      },
      {
        name: "Fashion & Bags",
        slug: "fashion",
        image: "category-12018647-87c8-4cb6-bced-32e358546cc7-1784200487405.jpeg",
      },
      {
        name: "Men Clothes",
        slug: "men-clothes",
        image: "category-73197627-cc2b-4b1e-90e0-d3d6b6b605a0-1784191677380.jpeg",
      },
      {
        name: "Jewelry & Luxury",
        slug: "jewelry",
        image: "category-75904b03-0f4e-428d-8277-1739b241060c-1645387694124.jpeg",
      },
      {
        name: "Gaming & Consoles",
        slug: "gaming",
        image: "category-854cf81e-a8cb-4007-a06a-18471e7758ab-1784201666057.jpeg",
      },
    ];

    const categoryMap = {};
    for (const cat of categoryDefs) {
      const created = await prisma.category.create({ data: cat });
      categoryMap[cat.slug] = created;
    }
    console.log(`✅ ${categoryDefs.length} Categories seeded.`.green);

    // 3. Subcategories (Nested strictly under Categories)
    const subCategoryDefs = [
      // Under Electronics
      {
        name: "Audio & Headphones",
        slug: "audio-headphones",
        description: "Studio monitors, noise-canceling headphones, and wireless earbuds",
        image: "subcategory-5fcfe697-f066-4be4-a4c5-21946d561ee3-1784190200096.jpeg",
        categorySlug: "electronics",
      },
      {
        name: "Storage & Drives",
        slug: "storage-drives",
        description: "High-speed portable SSDs, external hard drives, and flash storage",
        image: "subcategory-c8f2dcde-3178-4fb5-ada1-872d242dbeee-1784218514490.jpeg",
        categorySlug: "electronics",
      },
      // Under Mobiles & Tablets
      {
        name: "Smartphones",
        slug: "smartphones",
        description: "Latest 5G flagship smartphones with advanced AI and cameras",
        image: "subcategory-b275403b-1cb3-4dd8-8a39-65a710b1c5da-1784195549848.jpeg",
        categorySlug: "mobiles",
      },
      {
        name: "Mobile Accessories",
        slug: "mobile-accessories",
        description: "Fast wireless chargers, protective cases, and premium cables",
        image: "subcategory-167cd71c-70b9-4b44-8c85-ec4b1af247cb-1784206808841.jpeg",
        categorySlug: "mobiles",
      },
      // Under Laptops & Computers
      {
        name: "Ultrabooks & MacBooks",
        slug: "ultrabooks-macbooks",
        description: "Thin, lightweight productivity laptops with all-day battery life",
        image: "subcategory-fc9a36da-3b55-4257-9d64-c80778a8ac9d-1784072795370.jpeg",
        categorySlug: "laptops",
      },
      {
        name: "Workstation & Desktops",
        slug: "workstation-desktops",
        description: "High-performance workstations for creators and developers",
        image: "subcategory-c8f2dcde-3178-4fb5-ada1-872d242dbeee-1784218514490.jpeg",
        categorySlug: "laptops",
      },
      // Under Fashion & Bags
      {
        name: "Backpacks & Luggage",
        slug: "backpacks-luggage",
        description: "Durable travel backpacks, waterproof laptop bags, and luggage",
        image: "subcategory-167cd71c-70b9-4b44-8c85-ec4b1af247cb-1784206808841.jpeg",
        categorySlug: "fashion",
      },
      // Under Men Clothes
      {
        name: "Men T-Shirts & Tops",
        slug: "men-tshirts-tops",
        description: "Premium breathable cotton t-shirts, casual polos, and tees",
        image: "subcategory-b275403b-1cb3-4dd8-8a39-65a710b1c5da-1784195549848.jpeg",
        categorySlug: "men-clothes",
      },
      {
        name: "Men Jackets & Outerwear",
        slug: "men-jackets-outerwear",
        description: "Windproof winter jackets, thermal parkas, and outdoor coats",
        image: "subcategory-fc9a36da-3b55-4257-9d64-c80778a8ac9d-1784072795370.jpeg",
        categorySlug: "men-clothes",
      },
      // Under Jewelry & Luxury
      {
        name: "Fine Rings & Diamonds",
        slug: "fine-rings-diamonds",
        description: "Solid 18K gold diamond rings, micropave wedding bands",
        image: "subcategory-167cd71c-70b9-4b44-8c85-ec4b1af247cb-1784206808841.jpeg",
        categorySlug: "jewelry",
      },
      // Under Gaming & Consoles
      {
        name: "Gaming Gear & Peripherals",
        slug: "gaming-gear-peripherals",
        description: "Mechanical keyboards, ergonomic gaming mice, and pro headsets",
        image: "subcategory-c8f2dcde-3178-4fb5-ada1-872d242dbeee-1784218514490.jpeg",
        categorySlug: "gaming",
      },
    ];

    const subCategoryMap = {};
    for (const sub of subCategoryDefs) {
      const parentCategory = categoryMap[sub.categorySlug];
      if (parentCategory) {
        const created = await prisma.subCategory.create({
          data: {
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            image: sub.image,
            categoryId: parentCategory.id,
          },
        });
        subCategoryMap[sub.slug] = created;
      }
    }
    console.log(`✅ ${Object.keys(subCategoryMap).length} Subcategories nested under categories.`.green);

    // 4. Brands
    const brandDefs = [
      { name: "Apple", slug: "apple" },
      { name: "Samsung", slug: "samsung" },
      { name: "Sony", slug: "sony" },
      { name: "Nike", slug: "nike" },
      { name: "Western Digital", slug: "western-digital" },
      { name: "Dell", slug: "dell" },
      { name: "Tiffany & Co.", slug: "tiffany-co" },
      { name: "Razer", slug: "razer" },
    ];

    const brandMap = {};
    for (const b of brandDefs) {
      const created = await prisma.brand.create({ data: b });
      brandMap[b.slug] = created;
    }
    console.log(`✅ ${brandDefs.length} Brands seeded.`.green);

    // 5. Products (Each assigned to categoryId, subCategoryId, and brandId)
    const productCatalog = [
      // 1. Ultrabook / MacBook (Category: Laptops, SubCategory: Ultrabooks & MacBooks, Brand: Apple)
      {
        title: "Apple MacBook Air 13.6-Inch M2 Chip 256GB SSD",
        slug: "apple-macbook-air-13.6-inch-m2-chip",
        description: "The redesigned MacBook Air is more portable than ever and weighs just 2.7 pounds. Supercharged by the M2 chip, it offers up to 18 hours of battery life, a stunning 13.6-inch Liquid Retina display, 1080p FaceTime HD camera, and MagSafe 3 charging port.",
        quantity: 45,
        sold: 28,
        price: 49000,
        priceAfterDiscount: 46500,
        colors: ["Midnight", "Space Gray", "Silver", "Starlight"],
        imageCover: "product-4bbb11a3-a552-465a-a34a-c36e4ec40c0f-1642639330417-cover.jpeg",
        images: [
          "product-4bbb11a3-a552-465a-a34a-c36e4ec40c0f-1642639330417-cover.jpeg",
          "product-20c84e05-8460-4165-aacd-d466ae17f32d-1642639330496-1.jpeg",
          "product-17ab9954-1927-4778-a145-8c1a2ac1ecc3-1642639330496-2.jpeg",
          "product-7df4a297-d1bb-4cbb-8ec3-7e0c6ab74e6c-1642639330497-3.jpeg",
        ],
        categorySlug: "laptops",
        subCategorySlug: "ultrabooks-macbooks",
        brandSlug: "apple",
        ratingsAverage: 4.9,
        ratingsQuantity: 128,
      },
      // 2. Smartphone (Category: Mobiles, SubCategory: Smartphones, Brand: Apple)
      {
        title: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
        slug: "apple-iphone-15-pro-max-256gb",
        description: "Forged in aerospace-grade titanium design with textured matte-glass back. Groundbreaking A17 Pro chip brings console-quality gaming. 48MP Main camera with 5x optical zoom and customizable Action Button.",
        quantity: 50,
        sold: 62,
        price: 54000,
        priceAfterDiscount: 51500,
        colors: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
        imageCover: "product-80d46e2c-3c29-48fb-9f80-ab393adc1ad0-1784212441382-cover.jpeg",
        images: [
          "product-80d46e2c-3c29-48fb-9f80-ab393adc1ad0-1784212441382-cover.jpeg",
          "product-06cc1b9d-2fc3-49c9-8693-7e3fda61a02b-1784212441570-1.jpeg",
        ],
        categorySlug: "mobiles",
        subCategorySlug: "smartphones",
        brandSlug: "apple",
        ratingsAverage: 4.9,
        ratingsQuantity: 184,
      },
      // 3. Smartphone (Category: Mobiles, SubCategory: Smartphones, Brand: Samsung)
      {
        title: "Samsung Galaxy S24 Ultra 5G AI Smartphone 512GB",
        slug: "samsung-galaxy-s24-ultra-5g-ai",
        description: "Unleash new levels of creativity and productivity with Galaxy AI. 200MP camera system with Quad Telephoto zoom, built-in S Pen, Snapdragon 8 Gen 3 processor, and Corning Gorilla Armor titanium frame.",
        quantity: 35,
        sold: 41,
        price: 47000,
        priceAfterDiscount: 43900,
        colors: ["Titanium Black", "Titanium Gray", "Titanium Violet"],
        imageCover: "product-d29fe140-7814-4f5b-b896-15d30a9a9275-1784201974447-cover.jpeg",
        images: [
          "product-d29fe140-7814-4f5b-b896-15d30a9a9275-1784201974447-cover.jpeg",
          "product-d5c8138b-91b5-4d3a-907b-cc0cf006c96c-1784218547636-1.jpeg",
        ],
        categorySlug: "mobiles",
        subCategorySlug: "smartphones",
        brandSlug: "samsung",
        ratingsAverage: 4.8,
        ratingsQuantity: 142,
      },
      // 4. Audio (Category: Electronics, SubCategory: Audio & Headphones, Brand: Sony)
      {
        title: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
        slug: "sony-wh-1000xm5-wireless-noise-cancelling",
        description: "Two processors and eight microphones create unparalleled active noise cancellation. Crystal-clear hands-free calling with 4 beamforming mics and up to 30-hour battery life with quick charge capability.",
        quantity: 80,
        sold: 55,
        price: 16500,
        priceAfterDiscount: 14900,
        colors: ["Black", "Silver", "Midnight Blue"],
        imageCover: "product-7c4c8eb8-1281-4791-8a4d-2dc9a49a65fd-1784202392925-cover.jpeg",
        images: [
          "product-7c4c8eb8-1281-4791-8a4d-2dc9a49a65fd-1784202392925-cover.jpeg",
          "product-d5c8138b-91b5-4d3a-907b-cc0cf006c96c-1784218547636-1.jpeg",
        ],
        categorySlug: "electronics",
        subCategorySlug: "audio-headphones",
        brandSlug: "sony",
        ratingsAverage: 4.7,
        ratingsQuantity: 96,
      },
      // 5. Storage (Category: Electronics, SubCategory: Storage & Drives, Brand: Western Digital)
      {
        title: "WD 2TB Elements Portable High-Speed USB 3.0 Drive",
        slug: "wd-2tb-elements-portable-usb-3.0",
        description: "Universal compatibility with USB 3.0 and USB 2.0 devices. High-capacity storage in a compact, durable lightweight design engineered for shock tolerance and long-term reliability.",
        quantity: 110,
        sold: 76,
        price: 3300,
        priceAfterDiscount: 2950,
        colors: ["Matte Black"],
        imageCover: "product-24c17c86-dc20-4174-9814-3975cde6d66e-1784217441043-cover.jpeg",
        images: [
          "product-24c17c86-dc20-4174-9814-3975cde6d66e-1784217441043-cover.jpeg",
          "product-36b69006-a6b1-4455-9453-733654511b08-1784218559560-1.jpeg",
        ],
        categorySlug: "electronics",
        subCategorySlug: "storage-drives",
        brandSlug: "western-digital",
        ratingsAverage: 4.8,
        ratingsQuantity: 115,
      },
      // 6. Backpack (Category: Fashion, SubCategory: Backpacks & Luggage, Brand: Nike)
      {
        title: "Nike Elite Pro All-Weather Travel & Laptop Backpack",
        slug: "nike-elite-pro-all-weather-backpack",
        description: "Water-resistant coating with padded breathable mesh shoulder straps. Dedicated padded compartment fits up to 16-inch laptops with side water-bottle pockets and quick-access top storage.",
        quantity: 65,
        sold: 39,
        price: 3200,
        priceAfterDiscount: 2750,
        colors: ["Navy Blue", "Stealth Black", "Olive Drab"],
        imageCover: "product-01265bd1-f0f8-4b30-acf4-8c2f45f57500-1784197433464-cover.jpeg",
        images: [
          "product-01265bd1-f0f8-4b30-acf4-8c2f45f57500-1784197433464-cover.jpeg",
          "product-ca3f0f4b-f677-45a6-8b15-cdc62d0ef82d-1784197433573-1.jpeg",
          "product-10464b0c-2f83-4721-b087-266fde723fa7-1784197254436-2.jpeg",
        ],
        categorySlug: "fashion",
        subCategorySlug: "backpacks-luggage",
        brandSlug: "nike",
        ratingsAverage: 4.6,
        ratingsQuantity: 58,
      },
      // 7. Men T-Shirt (Category: Men Clothes, SubCategory: Men T-Shirts & Tops, Brand: Nike)
      {
        title: "Nike Dri-FIT Slim Premium Cotton Athletic T-Shirt",
        slug: "nike-dri-fit-slim-premium-cotton-tshirt",
        description: "Soft combed cotton blend engineered with moisture-wicking Dri-FIT technology. Tagless collar prevents chafing for maximum training or casual comfort all day long.",
        quantity: 140,
        sold: 95,
        price: 850,
        priceAfterDiscount: 699,
        colors: ["Black", "White", "Heather Gray"],
        imageCover: "product-05b7ea6d-f684-4302-9eca-1767f5ac1c67-1783946965994-cover.jpeg",
        images: [
          "product-05b7ea6d-f684-4302-9eca-1767f5ac1c67-1783946965994-cover.jpeg",
          "product-06882b5b-590d-42b5-b9cc-258ad099da20-1784196042123-cover.jpeg",
        ],
        categorySlug: "men-clothes",
        subCategorySlug: "men-tshirts-tops",
        brandSlug: "nike",
        ratingsAverage: 4.5,
        ratingsQuantity: 74,
      },
      // 8. Men Jacket (Category: Men Clothes, SubCategory: Men Jackets & Outerwear, Brand: Nike)
      {
        title: "Nike Storm-FIT All-Weather Windproof Puffer Jacket",
        slug: "nike-storm-fit-windproof-puffer-jacket",
        description: "Heavyweight weather protection equipped with Storm-FIT windproof and water-resistant shell. Features detachable hood, fleece-lined hand pockets, and ribbed storm cuffs.",
        quantity: 40,
        sold: 29,
        price: 3600,
        priceAfterDiscount: 3100,
        colors: ["Army Green", "Midnight Navy", "Black"],
        imageCover: "product-13938729-e73e-4886-9bea-33dd7bc75bef-1784214092341-cover.jpeg",
        images: [
          "product-13938729-e73e-4886-9bea-33dd7bc75bef-1784214092341-cover.jpeg",
          "product-24592dfa-5a1d-4e07-83ac-de2432f4d297-1784214092448-1.jpeg",
        ],
        categorySlug: "men-clothes",
        subCategorySlug: "men-jackets-outerwear",
        brandSlug: "nike",
        ratingsAverage: 4.7,
        ratingsQuantity: 62,
      },
      // 9. Fine Jewelry (Category: Jewelry, SubCategory: Fine Rings & Diamonds, Brand: Tiffany & Co.)
      {
        title: "Tiffany 18K Solid Gold Petite Micropave Diamond Ring",
        slug: "tiffany-18k-solid-gold-micropave-diamond-ring",
        description: "Handcrafted in certified 18-karat solid yellow gold with delicate micropave conflict-free natural diamonds. Designed for timeless bridal elegance or luxury layering.",
        quantity: 25,
        sold: 14,
        price: 18500,
        priceAfterDiscount: 16900,
        colors: ["Yellow Gold", "Rose Gold", "Platinum White"],
        imageCover: "product-6da327b2-dee5-4218-8058-9aa3608cda12-1784206735780-cover.jpeg",
        images: [
          "product-6da327b2-dee5-4218-8058-9aa3608cda12-1784206735780-cover.jpeg",
          "product-4dde60b8-1252-4267-b25c-245f68673c01-1784206748871-2.jpeg",
        ],
        categorySlug: "jewelry",
        subCategorySlug: "fine-rings-diamonds",
        brandSlug: "tiffany-co",
        ratingsAverage: 5.0,
        ratingsQuantity: 49,
      },
      // 10. Gaming Gear (Category: Gaming, SubCategory: Gaming Gear & Peripherals, Brand: Razer)
      {
        title: "Razer BlackWidow V4 Pro Mechanical RGB Gaming Keyboard",
        slug: "razer-blackwidow-v4-pro-keyboard",
        description: "Full-blown battlestation keyboard featuring Razer Green mechanical switches, magnetic plush wrist rest, dedicated macro keys, and Chroma RGB underglow lighting.",
        quantity: 55,
        sold: 38,
        price: 8900,
        priceAfterDiscount: 7990,
        colors: ["Classic Black"],
        imageCover: "product-7d021616-ac1d-45a8-ba97-578e8326e8e6-1784218547537-cover.jpeg",
        images: [
          "product-7d021616-ac1d-45a8-ba97-578e8326e8e6-1784218547537-cover.jpeg",
          "product-1f81ec3c-c0cd-4b74-a9fb-086630f12af2-1784218553534-cover.jpeg",
          "product-36f84863-7f29-48d1-b6fe-2551d36f37cd-1784218559448-cover.jpeg",
        ],
        categorySlug: "gaming",
        subCategorySlug: "gaming-gear-peripherals",
        brandSlug: "razer",
        ratingsAverage: 4.8,
        ratingsQuantity: 88,
      },
    ];

    const seededProducts = [];
    for (const p of productCatalog) {
      const cat = categoryMap[p.categorySlug];
      const sub = subCategoryMap[p.subCategorySlug];
      const brand = brandMap[p.brandSlug];

      const product = await prisma.product.create({
        data: {
          title: p.title,
          slug: p.slug,
          description: p.description,
          quantity: p.quantity,
          sold: p.sold,
          price: p.price,
          priceAfterDiscount: p.priceAfterDiscount,
          colors: p.colors,
          imageCover: p.imageCover,
          images: p.images,
          categoryId: cat ? cat.id : null,
          subCategoryId: sub ? sub.id : null,
          brandId: brand ? brand.id : null,
          ratingsAverage: p.ratingsAverage,
          ratingsQuantity: p.ratingsQuantity,
        },
      });
      seededProducts.push(product);
    }
    console.log(`✅ ${seededProducts.length} Products seeded with Category + SubCategory + Brand!`.green);

    // 6. Seed Sample Reviews for Products
    if (seededProducts.length > 0) {
      await prisma.review.create({
        data: {
          title: "Outstanding performance and build quality!",
          ratings: 5.0,
          userId: standardUser.id,
          productId: seededProducts[0].id,
        },
      });

      await prisma.review.create({
        data: {
          title: "Very fast shipping, authentic product and great price.",
          ratings: 5.0,
          userId: adminUser.id,
          productId: seededProducts[1].id,
        },
      });
      console.log("✅ Customer reviews seeded.".green);
    }

    // 7. Coupons
    await prisma.coupon.createMany({
      data: [
        { name: "DISCOUNT10", expire: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), discount: 10 },
        { name: "WELCOME20", expire: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), discount: 20 },
        { name: "OCEAN30", expire: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), discount: 30 },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Discount coupons seeded (DISCOUNT10, WELCOME20, OCEAN30).".green);

    console.log("\n🎉 Full database seed completed with nested hierarchy (Category -> SubCategory -> Product)!".green.bold);
    if (process.argv[2] === "-i") {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error seeding data:".red, error);
    if (process.argv[2] === "-i") {
      process.exit(1);
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// CLI RUNNER
// ─────────────────────────────────────────────────────────────
if (process.argv[2] === "-i") {
  insertData();
} else if (process.argv[2] === "-d") {
  destroyData();
} else if (process.argv[2] === "-r") {
  destroyData().then(() => insertData());
}

module.exports = { insertData, destroyData };
