let counter = 0;
const date = new Date();

const generateOrderNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  counter = (counter + 1) % 9999;
  return `ORD-${dateStr}-${String(counter).padStart(4, '0')}`;
};

module.exports = generateOrderNumber;
