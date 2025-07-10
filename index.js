// === PHIÊN BẢN "RESET" - ĐƠN GIẢN VÀ ỔN ĐỊNH ===
const express = require('express');
const app = express();

// Middleware để express có thể đọc được JSON từ request body
app.use(express.json());

// Đây là điểm cuối (endpoint) để nhận request từ Dialogflow
app.post('/api', (req, res) => {
  // Luôn dùng try...catch để bắt mọi lỗi có thể xảy ra
  try {
    const queryResult = req.body.queryResult;
    const intentName = queryResult.intent.displayName;
    const session = req.body.session;
    const parameters = queryResult.parameters;

    // Lấy giỏ hàng từ context, nếu không có thì tạo mới
    let cart = parameters.cart || [];
    let fulfillmentMessages = [];
    let outputContexts = [];

    // === CHÚNG TA CHỈ XỬ LÝ DUY NHẤT INTENT 'muathem' ===
    if (intentName === 'muathem') {
      let newItems = parameters.mon_an || [];
      if (!Array.isArray(newItems)) { newItems = [newItems]; }

      if (newItems.length > 0) {
        // Thêm món mới vào giỏ hàng
        cart = cart.concat(newItems);
        const addedItemsText = newItems.join(', ');
        const responseText = `(TEST) Đã thêm "${addedItemsText}". Giỏ hàng hiện có: ${cart.join(', ')}.`;
        
        fulfillmentMessages.push({ text: { text: [responseText] } });
        
        // Gửi lại giỏ hàng đã cập nhật trong context
        outputContexts.push({
          name: `${session}/contexts/dang-chon-mon`,
          lifespanCount: 5,
          parameters: { cart: cart }
        });

      } else {
        fulfillmentMessages.push({ text: { text: ["(TEST) Xin lỗi, tôi không bắt được món ăn bạn vừa gọi."] } });
      }
    } else {
      // Nếu là bất kỳ intent nào khác, chỉ báo lại tên của nó để chúng ta biết nó đã được gọi
      fulfillmentMessages.push({ text: { text: [`(TEST) Đã nhận intent: ${intentName}. Chức năng này sẽ được thêm sau.`] } });
    }

    // Tạo và gửi phản hồi chuẩn cho Dialogflow ES
    const responseJson = {
      fulfillmentMessages: fulfillmentMessages,
      outputContexts: outputContexts,
    };
    res.status(200).send(responseJson);

  } catch (error) {
    // Nếu có bất kỳ lỗi nghiêm trọng nào, bot sẽ báo lại thay vì im lặng
    console.error('LỖI WEBHOOK NGHIÊM TRỌNG:', error);
    res.status(200).send({
      fulfillmentMessages: [{ text: { text: ['(TEST) Oops! "Đầu bếp" đã gặp lỗi nghiêm trọng. Vui lòng kiểm tra lại code.'] } }]
    });
  }
});

// Xuất app để Vercel có thể sử dụng
module.exports = app;
