export const getCategories = (products = []) => {
  const set = new Set();
  products.forEach((p) => p.category && set.add(p.category));
  return Array.from(set);
};
