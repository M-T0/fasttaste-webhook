// Import thư viện express để tạo server
const express = require('express');
const app = express();

// Middleware để express có thể đọc được JSON từ request body
app.use(express.json());

// Đây là điểm cuối (endpoint) để nhận request từ Dialogflow
app.post('/api', (req, res) => {
  try {
    const queryResult = req.body.queryResult;
    // Lấy tên Intent chính xác từ Dialogflow
    const intentName = queryResult.intent.displayName;
    const session = req.body.session;
    const parameters = queryResult.parameters;

    let cart = parameters.cart || [];
    let fulfillmentMessages = [];
    let outputContexts = [];

    // Đảm bảo tên trong 'case' khớp 100% với tên Intent trong Dialogflow
    switch (intentName) {
      case 'Xem Menu - chonmon':
      case 'muathem': {
        let newItems = parameters.mon_an || [];
        if (!Array.isArray(newItems)) { newItems = [newItems]; }

        if (newItems.length > 0) {
          cart = cart.concat(newItems);
          const addedItemsText = newItems.join(', ');
          const responseText = `Đã thêm "${addedItemsText}" vào giỏ hàng. Giỏ hàng của bạn hiện có: ${cart.join(', ')}.`;

          fulfillmentMessages.push({ text: { text: [responseText] } });
          fulfillmentMessages.push({
            payload: { richContent: [[{ type: 'chips', options: [{ text: 'Xem Gà Lẻ' }, { text: 'Xem Món Ăn Kèm' }, { text: 'Xem Nước Uống & Kem' }, { text: 'Thanh toán' }] }]] }
          });

          outputContexts.push({
            name: `${session}/contexts/dang-chon-mon`,
            lifespanCount: 5,
            parameters: { cart: cart }
          });
        } else {
          fulfillmentMessages.push({ text: { text: ["Xin lỗi, tôi chưa rõ bạn muốn chọn món nào."] } });
        }
        break;
      }

      case 'Thanh-toan': {
        if (cart.length > 0) {
          const orderSummary = cart.join(', ');
          const responseText = `Em xin xác nhận đơn hàng của anh/chị gồm có: ${orderSummary}. Anh/chị vui lòng chọn phương thức nhận hàng ạ:`;

          fulfillmentMessages.push({ text: { text: [responseText] } });
          fulfillmentMessages.push({
            payload: { richContent: [[{ type: 'chips', options: [{ text: 'Giao hàng tận nơi' }, { text: 'Đến lấy tại cửa hàng' }] }]] }
          });

          outputContexts.push({
            name: `${session}/contexts/choosing-delivery-method`,
            lifespanCount: 2,
            parameters: { cart: cart }
          });
        } else {
          fulfillmentMessages
