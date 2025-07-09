const express = require('express');
const app = express();

app.use(express.json());

// Xử lý request từ Dialogflow
app.post('/api', (req, res) => {
  // Lấy các thông tin quan trọng từ Dialogflow
  const intentName = req.body.queryResult.intent.displayName;
  const sessionInfo = req.body.sessionInfo || {};
  const sessionParams = sessionInfo.parameters || {};

  // Lấy giỏ hàng từ session, hoặc tạo giỏ hàng mới nếu chưa có
  let cart = sessionParams.cart || [];

  let responseText = ''; // Biến chứa câu trả lời cuối cùng

  // Bắt đầu sơ đồ logic xử lý theo từng Intent
  switch (intentName) {
    case 'Xem Menu - Chon Mon': {
      // Lấy món ăn khách vừa chọn
      const selectedItem = req.body.queryResult.parameters.mon_an;
      if (selectedItem) {
        cart.push(selectedItem); // Thêm món vào giỏ hàng
      }
      responseText = `Dạ, đã thêm "${selectedItem}" vào giỏ hàng. Anh/chị có muốn chọn thêm món nào khác không ạ?`;
      break;
    }

    case 'Mua Them': {
      // Lấy món ăn khách muốn thêm
      const additionalItem = req.body.queryResult.parameters.mon_an;
      if (additionalItem) {
        cart.push(additionalItem); // Thêm món vào giỏ hàng
      }
      responseText = `Đã thêm "${additionalItem}" vào giỏ hàng. Giỏ hàng của anh/chị hiện có: ${cart.join(', ')}. Anh/chị có muốn thanh toán hay tiếp tục chọn món ạ?`;
      break;
    }

    case 'Thanh Toan': {
      if (cart.length > 0) {
        const orderSummary = cart.join(', ');
        responseText = `Em xin xác nhận đơn hàng của anh/chị gồm có: ${orderSummary}. Em sẽ gửi thông tin đến quầy. Cảm ơn anh/chị đã đặt hàng tại FASTTASTE!`;
        cart = []; // Xóa giỏ hàng sau khi đã chốt đơn
      } else {
        responseText = 'Dạ, giỏ hàng của anh/chị đang trống ạ. Anh/chị có muốn xem thực đơn để chọn món không?';
      }
      break;
    }

    default: {
      responseText = `Webhook đã nhận được intent: ${intentName}`;
      break;
    }
  }

  // Tạo JSON trả về cho Dialogflow
  const responseJson = {
    fulfillmentMessages: [
      {
        text: {
          text: [responseText],
        },
      },
    ],
    // Quan trọng: Gửi lại giỏ hàng đã cập nhật cho Dialogflow
    sessionInfo: {
      parameters: {
        cart: cart,
      },
    },
  };

  res.status(200).send(responseJson);
});

module.exports = app;
