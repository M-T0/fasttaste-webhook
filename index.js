// Import thư viện express để tạo server
const express = require('express');
const app = express();

// Middleware để express có thể đọc được JSON từ request body
app.use(express.json());

// Đây là điểm cuối (endpoint) để nhận request từ Dialogflow
app.post('/api', (req, res) => {
  // Lấy ra tên của Intent mà Dialogflow vừa xác định được
  const intentName = req.body.queryResult.intent.displayName;

  // Lấy ra thông tin của phiên làm việc (session) để lưu trữ giỏ hàng
  // Nếu không có sessionInfo, tạo một object rỗng để tránh lỗi
  const sessionInfo = req.body.sessionInfo || {};
  const sessionParams = sessionInfo.parameters || {};

  // Lấy giỏ hàng từ session. Nếu chưa có giỏ hàng (lần đầu vào), tạo một mảng rỗng.
  let cart = sessionParams.cart || [];

  // Biến này sẽ chứa câu trả lời cuối cùng của bot
  let responseText = '';

  // Bắt đầu sơ đồ logic xử lý cho từng Intent
  // QUAN TRỌNG: Tên trong 'case' phải khớp 100% với tên Intent trong Dialogflow
  switch (intentName) {
    // Trường hợp người dùng chọn món hoặc thêm món
    // Gộp 2 intent 'Xem Menu - chonmon' và 'muathem' vào cùng một xử lý
    case 'Xem Menu - chonmon': // Tên này có thể bạn cần đổi lại cho khớp
    case 'muathem': {
      // Lấy danh sách món ăn từ parameter 'mon_an'
      let newItems = req.body.queryResult.parameters.mon_an || [];

      // Đảm bảo newItems luôn là một mảng để xử lý cho gọn
      if (!Array.isArray(newItems)) {
        newItems = [newItems];
      }

      if (newItems.length > 0) {
        // Thêm các món mới vào giỏ hàng
        cart = cart.concat(newItems);
        
        // Tạo câu trả lời thông minh
        const addedItemsText = newItems.join(', '); // Ví dụ: "combo 1, gà rán"
        responseText = `Đã thêm "${addedItemsText}" vào giỏ hàng. Giỏ hàng của bạn hiện có: ${cart.join(', ')}. Bạn muốn chọn thêm, xem lại giỏ hàng hay thanh toán ạ?`;
      } else {
        responseText = "Xin lỗi, tôi chưa rõ bạn muốn chọn món nào. Bạn có thể nói lại được không?";
      }
      break;
    }

    // Trường hợp người dùng muốn thanh toán
    case 'Thanh-toan': { // Sửa lại tên cho khớp với Dialogflow
      if (cart.length > 0) {
        const orderSummary = cart.join(', ');
        responseText = `Em xin xác nhận đơn hàng của anh/chị gồm có: ${orderSummary}. Em đã gửi thông tin đến quầy. Cảm ơn anh/chị đã đặt hàng tại FASTTASTE!`;
        cart = []; // Xóa giỏ hàng sau khi đã chốt đơn
      } else {
        responseText = 'Dạ, giỏ hàng của anh/chị đang trống ạ. Anh/chị có muốn xem thực đơn để chọn món không?';
      }
      break;
    }

    // Trường hợp mặc định, nếu không khớp với các case trên
    default: {
      responseText = `Webhook đang phát triển, đã nhận được intent: ${intentName}`;
      break;
    }
  }

  // Tạo cấu trúc JSON để trả lời lại cho Dialogflow
  const responseJson = {
    fulfillmentMessages: [
      {
        text: {
          text: [responseText], // Câu trả lời của bot
        },
      },
    ],
    // QUAN TRỌNG: Gửi lại giỏ hàng đã được cập nhật cho Dialogflow
    // để nó lưu lại cho các lượt nói chuyện tiếp theo.
    sessionInfo: {
      parameters: {
        cart: cart,
      },
    },
  };

  // Gửi phản hồi về cho Dialogflow
  res.status(200).send(responseJson);
});

// Xuất app để Vercel có thể sử dụng
module.exports = app;
