const getCropDetails = (cropName) => {
  const cropDetails = {
    rice: {
      name: "Rice",
      image: "https://images.unsplash.com/photo-1592997571659-0b21ff64313b?q=80&w=1770&auto=format&fit=crop",
      description: "Staple food grown in flooded fields, widely consumed worldwide."
    },
    maize: {
      name: "Maize",
      image: "https://plus.unsplash.com/premium_photo-1667047164703-15ffa198f8d4?q=80&w=1974&auto=format&fit=crop",
      description: "Versatile crop used in many foods, also known as corn."
    },
    jute: {
      name: "Jute",
      image: "https://plus.unsplash.com/premium_photo-1674624789813-aee3aaa976cb?q=80&w=1887&auto=format&fit=crop",
      description: "Fiber crop used for making bags, rugs, and other products."
    },
    cotton: {
      name: "Cotton",
      image: "https://images.unsplash.com/photo-1616431084308-0c125e65ad0d?q=80&w=1941&auto=format&fit=crop",
      description: "Soft fiber used to make clothing and textiles."
    },
    coconut: {
      name: "Coconut",
      image: "https://images.unsplash.com/photo-1581453883350-288b2c19bea8?q=80&w=1964&auto=format&fit=crop",
      description: "Tropical fruit with many uses including oil, milk, and fiber."
    },
    papaya: {
      name: "Papaya",
      image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=500&auto=format&fit=crop",
      description: "Tropical fruit with sweet, orange flesh, often eaten fresh."
    },
    orange: {
      name: "Orange",
      image: "https://images.unsplash.com/photo-1547514701-42782101795e?q=80&w=1887&auto=format&fit=crop",
      description: "Citrus fruit known for tangy flavor and high vitamin C content."
    },
    apple: {
      name: "Apple",
      image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?q=80&w=1770&auto=format&fit=crop",
      description: "Crisp, sweet fruit available in many varieties, enjoyed fresh or cooked."
    },
    muskmelon: {
      name: "Muskmelon",
      image: "https://blog-images-1.pharmeasy.in/blog/production/wp-content/uploads/2021/05/18150019/shutterstock_1376235665-1.jpg",
      description: "Sweet, juicy melon with orange flesh, refreshing in hot weather."
    },
    watermelon: {
      name: "Watermelon",
      image: "https://images.unsplash.com/photo-1563114773-84221bd62daa?q=80&w=1770&auto=format&fit=crop",
      description: "Large, juicy fruit with red flesh and black seeds, perfect for summer."
    },
    grapes: {
      name: "Grapes",
      image: "https://images.unsplash.com/photo-1625499940894-8796928bf9c4?q=80&w=1910&auto=format&fit=crop",
      description: "Small, sweet fruit grown in clusters, used for eating and making wine."
    },
    mango: {
      name: "Mango",
      image: "https://images.unsplash.com/photo-1582655299221-2b6bff351df0?q=80&w=1781&auto=format&fit=crop",
      description: "Tropical fruit with sweet, juicy flesh and a distinct aroma."
    },
    banana: {
      name: "Banana",
      image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=1915&auto=format&fit=crop",
      description: "Curved fruit with yellow skin and creamy flesh, rich in potassium."
    },
    pomegranate: {
      name: "Pomegranate",
      image: "https://images.unsplash.com/photo-1667885098658-7e34d751fded?q=80&w=1790&auto=format&fit=crop",
      description: "Red fruit with juicy seeds, known for antioxidant properties."
    },
    lentil: {
      name: "Lentil",
      image: "https://plus.unsplash.com/premium_photo-1671130295987-13d3b3b4e9dc?q=80&w=1887&auto=format&fit=crop",
      description: "Nutritious legume used in soups, stews, and salads for protein."
    },
    blackgram: {
      name: "Blackgram",
      image: "https://www.stylecraze.com/wp-content/uploads/2022/02/7-Benefits-Of-Including-Black-Gram-In-Your-Diet-Banner.jpg",
      description: "Type of bean used in Indian cooking and as a protein source."
    },
    mungbean: {
      name: "Mungbean",
      image: "https://post.medicalnewstoday.com/wp-content/uploads/sites/3/2020/02/324156_2200-800x1200.jpg",
      description: "Small, green legume used in Asian cooking and as a sprout."
    },
    mothbeans: {
      name: "Mothbeans",
      image: "https://nishamadhulika.com/imgpst/featured/moth-beans.jpg",
      description: "Drought-resistant legume grown in arid regions for food and fodder."
    },
    pigeonpeas: {
      name: "Pigeonpeas",
      image: "https://5.imimg.com/data5/SELLER/Default/2021/11/HW/CP/XB/10888193/pigeon-pea-seeds.jpg",
      description: "Nutritious legume used in soups, stews, and salads."
    },
    kidneybeans: {
      name: "Kidneybeans",
      image: "https://5.imimg.com/data5/SELLER/Default/2022/10/LK/FW/QH/71853916/image-a17ffd00-73ea-495a-bd90-f3b09829eabc-1024x1024-2x.webp",
      description: "Large, kidney-shaped bean used in soups, chili, and salads."
    },
    chickpea: {
      name: "Chickpea",
      image: "https://itsavegworldafterall.com/wp-content/uploads/2023/03/How-to-Cook-Chickpeas-FI.jpg",
      description: "Versatile legume used in hummus, curries, and salads."
    },
    coffee: {
      name: "Coffee",
      image: "https://plus.unsplash.com/premium_photo-1675435644687-562e8042b9db?q=80&w=1949&auto=format&fit=crop",
      description: "Brewed drink made from roasted coffee beans, popular worldwide."
    }
  };

  if (!cropName || typeof cropName !== "string") {
    return null;
  }

  // Normalize crop name (remove spaces, lowercase)
  const formattedCropName = cropName.trim().toLowerCase();

  return cropDetails[formattedCropName] || null;
};

export default getCropDetails;
