// Import thư viện express để tạo server
const express = require('express');
const app = express();

// Middleware để express có thể đọc được JSON từ request body
app.use(express.json());

// Đây là điểm cuối (endpoint) để nhận request từ Dialogflow
app.post('/api', (req, res) => {
  // === LƯỚI AN TOÀN BẮT ĐẦU ===
  // Bọc toàn bộ logic trong một khối try...catch.
  // Nếu có bất kỳ lỗi nào xảy ra, bot sẽ không bị im lặng.
  try {
    // Lấy ra tên của Intent mà Dialogflow vừa xác định được
    const intentName = req.body.queryResult.intent.displayName;

    // Lấy đường dẫn session một cách an toàn
    const sessionPath = (req.body.sessionInfo && req.body.sessionInfo.session) ? req.body.sessionInfo.session : '';

    // Lấy ra thông tin của phiên làm việc (session) để lưu trữ giỏ hàng
    const sessionInfo = req.body.sessionInfo || {};
    const sessionParams = sessionInfo.parameters || {};

    // Lấy giỏ hàng từ session. Nếu chưa có giỏ hàng (lần đầu vào), tạo một mảng rỗng.
    let cart = sessionParams.cart || [];

    // Mảng này sẽ chứa toàn bộ các tin nhắn gửi về (văn bản + nút bấm)
    let fulfillmentMessages = [];
    // Mảng này sẽ chứa các context cần gửi lại cho Dialogflow
    let outputContexts = [];

    // Bắt đầu sơ đồ logic xử lý cho từng Intent
    switch (intentName) {
      case 'Xem Menu - chonmon':
      case 'muathem': {
        let newItems = req.body.queryResult.parameters.mon_an || [];
        if (!Array.isArray(newItems)) {
          newItems = [newItems];
        }

        if (newItems.length > 0) {
          cart = cart.concat(newItems);
          const addedItemsText = newItems.join(', ');
          const responseText = `Đã thêm "${addedItemsText}" vào giỏ hàng. Giỏ hàng của bạn hiện có: ${cart.join(', ')}.`;

          // 1. Tạo tin nhắn văn bản
          const textMessage = {
            text: { text: [responseText] },
          };

          // 2. Tạo các nút bấm gợi ý
          const chipsMessage = {
            payload: {
              richContent: [
                [
                  {
                    type: 'chips',
                    options: [
                      { text: 'Xem Gà Lẻ' },
                      { text: 'Xem Món Ăn Kèm' },
                      { text: 'Xem Nước Uống & Kem' },
                      { text: 'Thanh toán' }
                    ]
                  }
                ]
              ]
            }
          };

          // 3. Thêm cả hai vào mảng phản hồi
          fulfillmentMessages.push(textMessage);
          fulfillmentMessages.push(chipsMessage);

          // 4. Tạo lại context để người dùng có thể chọn thêm
          if (sessionPath) {
            outputContexts.push({
              name: `${sessionPath}/contexts/dang-chon-mon`,
              lifespanCount: 5,
            });
          }

        } else {
          fulfillmentMessages.push({
            text: { text: ["Xin lỗi, tôi chưa rõ bạn muốn chọn món nào. Bạn có thể nói lại được không?"] }
          });
        }
        break;
      }

      case 'Thanh-toan': {
        if (cart.length > 0) {
          const orderSummary = cart.join(', ');
          const responseText = `Em xin xác nhận đơn hàng của anh/chị gồm có: ${orderSummary}. Em đã gửi thông tin đến quầy. Cảm ơn anh/chị đã đặt hàng tại FASTTASTE!`;
          cart = []; // Xóa giỏ hàng sau khi đã chốt đơn
          fulfillmentMessages.push({ text: { text: [responseText] } });
        } else {
          const responseText = 'Dạ, giỏ hàng của anh/chị đang trống ạ. Anh/chị có muốn xem thực đơn để chọn món không?';
          fulfillmentMessages.push({ text: { text: [responseText] } });
        }
        break;
      }

      default: {
        const responseText = `Webhook đang phát triển, đã nhận được intent: ${intentName}`;
        fulfillmentMessages.push({ text: { text: [responseText] } });
        break;
      }
    }

    // Tạo cấu trúc JSON để trả lời lại cho Dialogflow
    const responseJson = {
      fulfillmentMessages: fulfillmentMessages,
      outputContexts: outputContexts,
      sessionInfo: {
        parameters: {
          cart: cart,
        },
      },
    };

    // Gửi phản hồi về cho Dialogflow
    res.status(200).send(responseJson);

  } catch (error) {
    // === LƯỚI AN TOÀN HOẠT ĐỘNG ===
    // Nếu có lỗi, in lỗi ra console của Vercel để lập trình viên xem
    console.error('LỖI WEBHOOK:', error);
    // Và gửi một tin nhắn báo lỗi thân thiện cho người dùng
    const errorResponse = {
      fulfillmentMessages: [{
        text: { text: ['Oops! Có lỗi xảy ra ở phía đầu bếp. Vui lòng thử lại.'] }
      }]
    };
    res.status(200).send(errorResponse);
  }
});

// Xuất app để Vercel có thể sử dụng
module.exports = app;
